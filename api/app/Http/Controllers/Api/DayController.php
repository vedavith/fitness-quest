<?php

namespace App\Http\Controllers\Api;

use App\Domain\Plan;
use App\Domain\XpRules;
use App\Http\Controllers\Controller;
use App\Models\DayLog;
use App\Models\Profile;
use App\Services\DayScorer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DayController extends Controller
{
    public function __construct(private DayScorer $scorer)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $request->user()->profile ?? abort(409, 'Set a start date first.');

        return response()->json(
            $request->user()->dayLogs()->orderBy('plan_day')->get()->map($this->present(...)),
        );
    }

    public function show(Request $request, int $day): JsonResponse
    {
        $profile = $this->profile($request, $day);
        $log = $request->user()->dayLogs()->firstOrNew(['plan_day' => $day]);
        if (! $log->exists) {
            $this->scorer->score($profile, $log);
        }

        return response()->json($this->present($log));
    }

    /**
     * Upsert a day's log from a client (US-804). Keyed on plan day, so retrying a
     * sync never duplicates; an older client edit than the stored one is ignored.
     */
    public function update(Request $request, int $day): JsonResponse
    {
        $profile = $this->profile($request, $day);
        $data = $request->validate([
            'sets' => ['sometimes', 'nullable', 'array'],
            'sets.*' => ['array', 'max:10'],
            'sets.*.*.done' => ['boolean'],
            'sets.*.*.weight' => ['nullable', 'numeric', 'between:0,500'],
            'sets.*.*.reps' => ['nullable', 'integer', 'between:0,100'],
            'workout_done' => ['sometimes', 'boolean'],
            'stopped_for_safety' => ['sometimes', 'boolean'],
            'steps' => ['sometimes', 'integer', 'between:0,200000'],
            'recovery_step_target' => ['sometimes', 'nullable', 'integer', 'between:0,20000'],
            'meals' => ['sometimes', 'nullable', 'array'],
            'meals.*' => ['string', 'in:'.implode(',', Plan::MAIN_MEALS)],
            'off_plan_meals' => ['sometimes', 'nullable', 'array'],
            'off_plan_meals.*' => ['string', 'in:'.implode(',', Plan::MAIN_MEALS)],
            'lunch_choice' => ['sometimes', 'nullable', 'string', 'max:50'],
            'sleep_hours' => ['sometimes', 'numeric', 'between:0,24'],
            'energy_rating' => ['sometimes', 'nullable', 'integer', 'between:1,5'],
            'recovery_rating' => ['sometimes', 'nullable', 'integer', 'between:1,5'],
            'client_updated_at' => ['sometimes', 'date'],
        ]);

        return DB::transaction(function () use ($request, $profile, $day, $data) {
            $log = $request->user()->dayLogs()->lockForUpdate()->firstOrNew(['plan_day' => $day]);

            if ($log->exists && $profile->now()->greaterThan($profile->deadlineFor($day))) {
                return response()->json(['message' => 'This day is closed.', 'day' => $this->present($log)], 423);
            }

            $clientTime = isset($data['client_updated_at']) ? Carbon::parse($data['client_updated_at']) : null;
            if ($clientTime && $log->client_updated_at && $clientTime->lessThan($log->client_updated_at)) {
                return response()->json([...$this->present($log), 'stale' => true]);
            }

            $log->fill($data);
            $this->scorer->score($profile, $log);
            $log->save();

            return response()->json($this->present($log));
        });
    }

    /**
     * US-501/US-505/US-805: close the day and award its XP exactly once, even if
     * Finish Day is tapped on two devices.
     */
    public function finish(Request $request, int $day): JsonResponse
    {
        $profile = $this->profile($request, $day);

        if ($day > $profile->todayPlanDay()) {
            return response()->json(['message' => 'You can only finish today or an earlier day.'], 422);
        }

        return DB::transaction(function () use ($request, $profile, $day) {
            $log = $request->user()->dayLogs()->lockForUpdate()->firstOrNew(['plan_day' => $day]);
            $before = $this->totalXp($profile);

            if ($log->isFinished()) {
                return response()->json($this->finishPayload($profile, $log, $before, $before, true));
            }
            if ($profile->now()->greaterThan($profile->deadlineFor($day))) {
                return response()->json(['message' => 'This day is closed.'], 423);
            }

            $log->finished_at = now();
            $this->scorer->score($profile, $log);
            $log->save();

            return response()->json($this->finishPayload($profile, $log, $before, $this->totalXp($profile), false));
        });
    }

    public function summary(Request $request): JsonResponse
    {
        $profile = $request->user()->profile ?? abort(409, 'Set a start date first.');
        $total = $this->totalXp($profile);
        $latest = $request->user()->dayLogs()->whereNotNull('finished_at')->orderByDesc('plan_day')->first();

        return response()->json([
            'total_xp' => $total,
            'level' => XpRules::levelFor($total),
            'current_streak' => $latest ? $this->scorer->streakLength($latest) : 0,
            'today_plan_day' => $profile->todayPlanDay(),
        ]);
    }

    /**
     * Finished days count at once; unfinished days count, without the bonus,
     * once their deadline has passed (US-507). Check-ins always count.
     */
    private function totalXp(Profile $profile): int
    {
        $user = $profile->user;
        $closedThrough = $profile->todayPlanDay() - ($profile->now()->hour >= 12 ? 1 : 2);

        $days = (int) $user->dayLogs()
            ->where(fn ($q) => $q->whereNotNull('finished_at')->orWhere('plan_day', '<=', $closedThrough))
            ->sum(DB::raw('xp_total + xp_streak'));

        return $days + (int) $user->checkIns()->sum('xp');
    }

    private function finishPayload(Profile $profile, DayLog $log, int $before, int $after, bool $already): array
    {
        $levelBefore = XpRules::levelFor($before);
        $levelAfter = XpRules::levelFor($after);

        return [
            'day' => $this->present($log),
            'already_finished' => $already,
            'total_xp' => $after,
            'level' => $levelAfter,
            'leveled_up' => $levelAfter['level'] > $levelBefore['level'],
            'streak' => $this->scorer->streakLength($log),
        ];
    }

    private function profile(Request $request, int $day): Profile
    {
        abort_unless($day >= 1 && $day <= XpRules::PLAN_DAYS, 404, 'Plan days run from 1 to 90.');

        return $request->user()->profile ?? abort(409, 'Set a start date first.');
    }

    private function present(DayLog $log): array
    {
        return [
            'plan_day' => $log->plan_day,
            ...collect($log->only(DayLog::CLIENT_FIELDS))->all(),
            'finished_at' => $log->finished_at?->toIso8601String(),
            'client_updated_at' => $log->client_updated_at?->toIso8601String(),
            'xp' => $log->xpBreakdown(),
        ];
    }
}
