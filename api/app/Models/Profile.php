<?php

namespace App\Models;

use App\Domain\Plan;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    protected $fillable = [
        'start_date', 'timezone', 'start_weight_kg', 'waist_in', 'height_cm', 'age',
        'goal_weight_kg', 'long_goal_weight_kg',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'immutable_date',
            'start_weight_kg' => 'float',
            'waist_in' => 'float',
            'goal_weight_kg' => 'float',
            'long_goal_weight_kg' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** The plan start as midnight in the user's own timezone. */
    public function start(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->start_date->toDateString(), $this->timezone);
    }

    public function now(): CarbonImmutable
    {
        return CarbonImmutable::now($this->timezone);
    }

    /** Today's plan day (may be < 1 before the start or > 90 after the end). */
    public function todayPlanDay(): int
    {
        return (int) $this->start()->diffInDays($this->now()->startOfDay(), false) + 1;
    }

    public function dateFor(int $planDay): CarbonImmutable
    {
        return Plan::dateFor($this->start(), $planDay);
    }

    public function deadlineFor(int $planDay): CarbonImmutable
    {
        return Plan::deadlineFor($this->start(), $planDay);
    }
}
