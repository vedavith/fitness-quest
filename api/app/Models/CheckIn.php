<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CheckIn extends Model
{
    protected $fillable = ['type', 'period', 'value', 'xp'];

    protected function casts(): array
    {
        return ['value' => 'float'];
    }
}
