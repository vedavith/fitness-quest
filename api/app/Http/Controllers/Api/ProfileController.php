<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** US-101 starting details and US-102 start date. */
class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->profile;

        return $profile
            ? response()->json($this->present($profile))
            : response()->json(['message' => 'No profile yet.'], 404);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => ['required', 'date_format:Y-m-d'],
            'timezone' => ['sometimes', 'timezone:all'],
            'start_weight_kg' => ['sometimes', 'numeric', 'between:30,300'],
            'waist_in' => ['sometimes', 'numeric', 'between:15,80'],
            'height_cm' => ['sometimes', 'integer', 'between:100,250'],
            'age' => ['sometimes', 'integer', 'between:13,120'],
            'goal_weight_kg' => ['sometimes', 'numeric', 'between:30,300'],
            'long_goal_weight_kg' => ['sometimes', 'numeric', 'between:30,300'],
        ]);

        $profile = $request->user()->profile()->updateOrCreate([], $data);

        return response()->json($this->present($profile->refresh()));
    }

    private function present(Profile $profile): array
    {
        return [
            ...$profile->only([
                'timezone', 'start_weight_kg', 'waist_in', 'height_cm', 'age',
                'goal_weight_kg', 'long_goal_weight_kg',
            ]),
            'start_date' => $profile->start_date->toDateString(),
            'today_plan_day' => $profile->todayPlanDay(),
        ];
    }
}
