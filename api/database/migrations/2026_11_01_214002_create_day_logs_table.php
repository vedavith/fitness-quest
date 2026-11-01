<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per user per plan day, so sync upserts can never duplicate (US-804).
        Schema::create('day_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('plan_day');

            // What the user logged.
            $table->json('sets')->nullable();                // {exerciseId: [{done, weight, reps}]}
            $table->boolean('workout_done')->default(false); // recovery/cardio/rest check-in
            $table->boolean('stopped_for_safety')->default(false);
            $table->unsignedInteger('steps')->default(0);
            $table->unsignedInteger('recovery_step_target')->nullable(); // US-702
            $table->json('meals')->nullable();               // main meal keys eaten on plan
            $table->json('off_plan_meals')->nullable();      // US-406
            $table->string('lunch_choice')->nullable();
            $table->decimal('sleep_hours', 3, 1)->default(0);
            $table->unsignedTinyInteger('energy_rating')->nullable();
            $table->unsignedTinyInteger('recovery_rating')->nullable();

            // Server-calculated XP (US-805).
            $table->unsignedTinyInteger('xp_workout')->default(0);
            $table->unsignedTinyInteger('xp_steps')->default(0);
            $table->unsignedTinyInteger('xp_meals')->default(0);
            $table->unsignedTinyInteger('xp_sleep')->default(0);
            $table->unsignedTinyInteger('xp_bonus')->default(0);
            $table->unsignedTinyInteger('xp_total')->default(0);
            $table->unsignedTinyInteger('xp_streak')->default(0);

            $table->timestamp('finished_at')->nullable();
            $table->timestamp('client_updated_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'plan_day']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('day_logs');
    }
};
