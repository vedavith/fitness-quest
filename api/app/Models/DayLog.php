<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DayLog extends Model
{
    /** Fields the client may write. XP columns are server-only (US-805). */
    public const CLIENT_FIELDS = [
        'sets', 'workout_done', 'stopped_for_safety', 'steps', 'recovery_step_target',
        'meals', 'off_plan_meals', 'lunch_choice', 'sleep_hours', 'energy_rating', 'recovery_rating',
    ];

    protected $fillable = [...self::CLIENT_FIELDS, 'plan_day', 'client_updated_at'];

    protected $attributes = [
        'workout_done' => false,
        'stopped_for_safety' => false,
        'steps' => 0,
        'sleep_hours' => 0,
    ];

    protected function casts(): array
    {
        return [
            'sets' => 'array',
            'meals' => 'array',
            'off_plan_meals' => 'array',
            'workout_done' => 'boolean',
            'stopped_for_safety' => 'boolean',
            'sleep_hours' => 'float',
            'finished_at' => 'immutable_datetime',
            'client_updated_at' => 'immutable_datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isFinished(): bool
    {
        return $this->finished_at !== null;
    }

    public function xpBreakdown(): array
    {
        return [
            'workout' => $this->xp_workout,
            'steps' => $this->xp_steps,
            'meals' => $this->xp_meals,
            'sleep' => $this->xp_sleep,
            'bonus' => $this->xp_bonus,
            'streak' => $this->xp_streak,
            'total' => $this->xp_total + $this->xp_streak,
        ];
    }
}
