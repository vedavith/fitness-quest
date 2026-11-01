<?php

namespace App\Domain;

/**
 * Pure XP, level and streak rules from the "Gamification and XP rules"
 * section of docs/user-stories.md. The server is the source of truth for XP
 * (US-805); the app mirrors these rules only for instant feedback.
 */
final class XpRules
{
    public const WORKOUT_FULL = 40;
    public const WORKOUT_HALF = 20;
    public const STEPS = 20;
    public const XP_PER_MEAL = 5;
    public const MAIN_MEALS = 5;
    public const SLEEP = 15;
    public const SLEEP_MIN_HOURS = 7.0;
    public const FINISH_BONUS = 20;
    public const DAILY_MAX = 120;

    public const WEIGHT_CHECKIN = 30;
    public const WAIST_CHECKIN = 20;
    public const STREAK_BONUS = 50;
    public const STREAK_BONUS_EVERY = 7;
    public const STREAK_DAY_MIN_XP = 60;

    public const PLAN_DAYS = 90;

    /** Level number => [name, minimum total XP]. */
    public const LEVELS = [
        1 => ['Restarter', 0],
        2 => ['Walker', 500],
        3 => ['Regular', 1500],
        4 => ['Builder', 3000],
        5 => ['Strong', 5000],
        6 => ['Steady', 7000],
        7 => ['Unstoppable', 9000],
        8 => ['90-Day Finisher', 11000],
    ];

    /**
     * XP for one day's log. Extra steps, extra sessions and weight lost earn
     * nothing beyond the plan (US-703).
     *
     * @return array{workout:int, steps:int, meals:int, sleep:int, bonus:int, total:int}
     */
    public static function dailyXp(DayLog $day): array
    {
        $workout = match (true) {
            $day->stoppedForSafety => self::WORKOUT_FULL, // US-701
            $day->exercisesTotal <= 0 => $day->workoutDone ? self::WORKOUT_FULL : 0, // rest/recovery check-in
            $day->exercisesDone >= $day->exercisesTotal => self::WORKOUT_FULL,
            $day->exercisesDone * 2 >= $day->exercisesTotal => self::WORKOUT_HALF,
            default => 0,
        };

        $steps = $day->steps >= $day->stepTarget && $day->stepTarget > 0 ? self::STEPS : 0;
        $mealsLogged = max(0, min(self::MAIN_MEALS, $day->mainMealsOnPlan));
        $meals = $mealsLogged * self::XP_PER_MEAL;
        $sleep = $day->sleepHours >= self::SLEEP_MIN_HOURS ? self::SLEEP : 0;

        $allComplete = $workout === self::WORKOUT_FULL
            && $steps === self::STEPS
            && $mealsLogged === self::MAIN_MEALS
            && $sleep === self::SLEEP;
        $bonus = $allComplete && $day->finished ? self::FINISH_BONUS : 0;

        $total = min(self::DAILY_MAX, $workout + $steps + $meals + $sleep + $bonus);

        return compact('workout', 'steps', 'meals', 'sleep', 'bonus', 'total');
    }

    /** @return array{level:int, name:string, min:int, next:?int} */
    public static function levelFor(int $totalXp): array
    {
        $current = 1;
        foreach (self::LEVELS as $level => [, $min]) {
            if ($totalXp >= $min) {
                $current = $level;
            }
        }
        $next = self::LEVELS[$current + 1][1] ?? null;

        return [
            'level' => $current,
            'name' => self::LEVELS[$current][0],
            'min' => self::LEVELS[$current][1],
            'next' => $next,
        ];
    }

    public static function isStreakDay(bool $finished, int $dayXp): bool
    {
        return $finished && $dayXp >= self::STREAK_DAY_MIN_XP;
    }

    /** Streak bonus earned on the day the streak reaches $streakLength. */
    public static function streakBonus(int $streakLength): int
    {
        return $streakLength > 0 && $streakLength % self::STREAK_BONUS_EVERY === 0
            ? self::STREAK_BONUS
            : 0;
    }

    /** US-301: 5k, 6k, 7k, then 8k from week 4. */
    public static function stepTargetForWeek(int $week): int
    {
        return match (true) {
            $week <= 1 => 5000,
            $week === 2 => 6000,
            $week === 3 => 7000,
            default => 8000,
        };
    }
}
