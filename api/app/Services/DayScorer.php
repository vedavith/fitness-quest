<?php

namespace App\Services;

use App\Domain\DayInput;
use App\Domain\Plan;
use App\Domain\XpRules;
use App\Models\DayLog;
use App\Models\Profile;

/**
 * Calculates a day's XP on the server from what was logged (US-502, US-805).
 * Clients can show their own estimate, but only this result is stored.
 */
class DayScorer
{
    public function score(Profile $profile, DayLog $log): void
    {
        $date = $profile->dateFor($log->plan_day);
        $exercises = Plan::strengthExercises($date);
        $sets = $log->sets ?? [];

        // US-206: an exercise is complete when all its planned sets are done.
        $exercisesDone = count(array_filter(
            $exercises,
            fn (string $id) => count(array_filter($sets[$id] ?? [], fn ($s) => ! empty($s['done'])))
                >= Plan::SETS_PER_EXERCISE,
        ));

        $planTarget = XpRules::stepTargetForWeek(Plan::weekFor($log->plan_day));
        // US-702: a recovery day may lower the target, never raise it.
        $stepTarget = $log->recovery_step_target !== null
            ? min($planTarget, (int) $log->recovery_step_target)
            : $planTarget;

        $xp = XpRules::dailyXp(new DayInput(
            exercisesTotal: count($exercises),
            exercisesDone: $exercisesDone,
            workoutDone: $log->workout_done,
            stoppedForSafety: $log->stopped_for_safety,
            steps: $log->steps,
            stepTarget: $stepTarget,
            mainMealsOnPlan: count(array_intersect(array_unique($log->meals ?? []), Plan::MAIN_MEALS)),
            sleepHours: $log->sleep_hours,
            finished: $log->isFinished(),
        ));

        $log->xp_workout = $xp['workout'];
        $log->xp_steps = $xp['steps'];
        $log->xp_meals = $xp['meals'];
        $log->xp_sleep = $xp['sleep'];
        $log->xp_bonus = $xp['bonus'];
        $log->xp_total = $xp['total'];
        $log->xp_streak = $this->streakBonusFor($log);
    }

    /** Streak length ending on this day, counting back over consecutive streak days. */
    public function streakLength(DayLog $log): int
    {
        if (! XpRules::isStreakDay($log->isFinished(), $log->xp_total)) {
            return 0;
        }

        $earlier = DayLog::where('user_id', $log->user_id)
            ->where('plan_day', '<', $log->plan_day)
            ->orderByDesc('plan_day')
            ->get(['plan_day', 'finished_at', 'xp_total']);

        $length = 1;
        $expected = $log->plan_day - 1;
        foreach ($earlier as $day) {
            if ($day->plan_day !== $expected || ! XpRules::isStreakDay($day->isFinished(), $day->xp_total)) {
                break;
            }
            $length++;
            $expected--;
        }

        return $length;
    }

    private function streakBonusFor(DayLog $log): int
    {
        return XpRules::streakBonus($this->streakLength($log));
    }
}
