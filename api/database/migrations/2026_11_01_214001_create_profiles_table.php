<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // US-101 starting details and US-102 start date.
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->string('timezone')->default('UTC');
            $table->decimal('start_weight_kg', 5, 1)->default(106);
            $table->decimal('waist_in', 4, 1)->default(40);
            $table->unsignedSmallInteger('height_cm')->default(171);
            $table->unsignedTinyInteger('age')->default(30);
            $table->decimal('goal_weight_kg', 5, 1)->default(96);
            $table->decimal('long_goal_weight_kg', 5, 1)->default(90);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
