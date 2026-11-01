<?php

namespace App\Domain;

use Carbon\CarbonImmutable;

/**
 * The 90-day plan calendar. Mirrors app/src/plan.ts — keep the two in step.
 */
final class Plan
{
    public const SETS_PER_EXERCISE = 2;

    /** Strength exercises by ISO weekday (1 = Mon). Other days are scored by a check-in. */
    public const STRENGTH = [
        1 => ['chestPress', 'inclineDbPress', 'pecDeck', 'tricepsPushdown'],
        2 => ['latPulldown', 'seatedRow', 'facePulls', 'dbCurls'],
        3 => ['legPress', 'legCurl', 'legExtension', 'gluteBridges', 'plank'],
        5 => ['chestPress', 'latPulldown', 'legPress', 'shoulderPress', 'cableRow'],
    ];

    /** Keys of the 5 main meals that earn XP. The 5:30 AM banana is optional and earns none. */
    public const MAIN_MEALS = ['breakfast', 'fruit', 'lunch', 'snack', 'dinner'];

    public static function dateFor(CarbonImmutable $start, int $planDay): CarbonImmutable
    {
        return $start->startOfDay()->addDays($planDay - 1);
    }

    public static function weekFor(int $planDay): int
    {
        return intdiv($planDay - 1, 7) + 1;
    }

    /** @return list<string> */
    public static function strengthExercises(CarbonImmutable $date): array
    {
        return self::STRENGTH[$date->dayOfWeekIso] ?? [];
    }

    /**
     * Last moment a day can be finished or corrected: 12:00 PM the next day (US-507, US-508).
     */
    public static function deadlineFor(CarbonImmutable $start, int $planDay): CarbonImmutable
    {
        return self::dateFor($start, $planDay)->addDay()->setTime(12, 0);
    }
}
