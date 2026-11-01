<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Weekly weigh-ins (US-601) and fortnightly waist checks (US-602).
        Schema::create('check_ins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');                 // weight | waist
            $table->unsignedTinyInteger('period');  // plan week for weight, fortnight for waist
            $table->decimal('value', 5, 1);
            $table->unsignedTinyInteger('xp');
            $table->timestamps();

            $table->unique(['user_id', 'type', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('check_ins');
    }
};
