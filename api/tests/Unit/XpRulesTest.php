<?php

namespace Tests\Unit;

use App\Domain\DayInput;
use App\Domain\XpRules;
use PHPUnit\Framework\TestCase;

class XpRulesTest extends TestCase
{
    public function test_perfect_finished_day_earns_120(): void
    {
        $xp = XpRules::dailyXp(new DayInput(
            exercisesTotal: 4, exercisesDone: 4, steps: 5200, stepTarget: 5000,
            mainMealsOnPlan: 5, sleepHours: 7.5, finished: true,
        ));

        $this->assertSame(120, $xp['total']);
        $this->assertSame(20, $xp['bonus']);
    }

    public function test_bonus_requires_finish_day_tap(): void
    {
        $xp = XpRules::dailyXp(new DayInput(
            exercisesTotal: 4, exercisesDone: 4, steps: 5000, stepTarget: 5000,
            mainMealsOnPlan: 5, sleepHours: 8,
        ));

        $this->assertSame(100, $xp['total']);
    }

    public function test_half_the_exercises_earns_20(): void
    {
        $xp = XpRules::dailyXp(new DayInput(exercisesTotal: 4, exercisesDone: 2));
        $this->assertSame(20, $xp['workout']);
    }

    public function test_sunday_rest_check_in_earns_40(): void
    {
        $xp = XpRules::dailyXp(new DayInput(workoutDone: true));
        $this->assertSame(40, $xp['workout']);
    }

    public function test_safety_stop_still_awards_workout_xp(): void
    {
        $xp = XpRules::dailyXp(new DayInput(exercisesTotal: 4, exercisesDone: 1, stoppedForSafety: true));
        $this->assertSame(40, $xp['workout']);
    }

    public function test_extra_steps_and_meals_are_capped(): void
    {
        $xp = XpRules::dailyXp(new DayInput(steps: 30000, stepTarget: 5000, mainMealsOnPlan: 9));
        $this->assertSame(20, $xp['steps']);
        $this->assertSame(25, $xp['meals']);
    }

    public function test_short_sleep_earns_nothing(): void
    {
        $this->assertSame(0, XpRules::dailyXp(new DayInput(sleepHours: 6.9))['sleep']);
    }

    public function test_levels(): void
    {
        $this->assertSame('Restarter', XpRules::levelFor(0)['name']);
        $this->assertSame('Walker', XpRules::levelFor(500)['name']);
        $this->assertSame(1500, XpRules::levelFor(999)['next']);
        $this->assertSame('90-Day Finisher', XpRules::levelFor(11880)['name']);
        $this->assertNull(XpRules::levelFor(11880)['next']);
    }

    public function test_streaks(): void
    {
        $this->assertTrue(XpRules::isStreakDay(true, 60));
        $this->assertFalse(XpRules::isStreakDay(true, 59));
        $this->assertFalse(XpRules::isStreakDay(false, 120));
        $this->assertSame(50, XpRules::streakBonus(14));
        $this->assertSame(0, XpRules::streakBonus(6));
    }

    public function test_step_targets_build_weekly(): void
    {
        $this->assertSame([5000, 6000, 7000, 8000, 8000], array_map(
            XpRules::stepTargetForWeek(...), [1, 2, 3, 4, 12],
        ));
    }
}
