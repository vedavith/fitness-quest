<?php

namespace App\Http\Controllers\Api;

use App\Domain\Plan;
use App\Domain\XpRules;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** US-601 weekly weigh-in and US-602 fortnightly waist check. XP is for logging, whatever the result. */
class CheckInController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json($request->user()->checkIns()->orderBy('type')->orderBy('period')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:weight,waist'],
            'value' => ['required', 'numeric', 'between:10,300'],
        ]);
        $profile = $request->user()->profile ?? abort(409, 'Set a start date first.');

        $day = $profile->todayPlanDay();
        abort_unless($day >= 1 && $day <= XpRules::PLAN_DAYS, 422, 'The plan is not running today.');

        $week = Plan::weekFor($day);
        $period = $data['type'] === 'weight' ? $week : intdiv($week - 1, 2) + 1;

        // Re-logging in the same period corrects the value without awarding XP twice.
        $checkIn = $request->user()->checkIns()->updateOrCreate(
            ['type' => $data['type'], 'period' => $period],
            [
                'value' => $data['value'],
                'xp' => $data['type'] === 'weight' ? XpRules::WEIGHT_CHECKIN : XpRules::WAIST_CHECKIN,
            ],
        );

        return response()->json($checkIn, $checkIn->wasRecentlyCreated ? 201 : 200);
    }
}
