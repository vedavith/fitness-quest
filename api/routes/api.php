<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CheckInController;
use App\Http\Controllers\Api\DayController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    Route::get('/summary', [DayController::class, 'summary']);
    Route::get('/days', [DayController::class, 'index']);
    Route::get('/days/{day}', [DayController::class, 'show'])->whereNumber('day');
    Route::put('/days/{day}', [DayController::class, 'update'])->whereNumber('day');
    Route::post('/days/{day}/finish', [DayController::class, 'finish'])->whereNumber('day');

    Route::get('/check-ins', [CheckInController::class, 'index']);
    Route::post('/check-ins', [CheckInController::class, 'store']);
});
