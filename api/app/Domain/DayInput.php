<?php

namespace App\Domain;

/** Everything XpRules needs to score a single plan day. */
final class DayInput
{
    public function __construct(
        public readonly int $exercisesTotal = 0,
        public readonly int $exercisesDone = 0,
        public readonly bool $workoutDone = false,
        public readonly bool $stoppedForSafety = false,
        public readonly int $steps = 0,
        public readonly int $stepTarget = 5000,
        public readonly int $mainMealsOnPlan = 0,
        public readonly float $sleepHours = 0.0,
        public readonly bool $finished = false,
    ) {
    }
}
