<?php

use Illuminate\Support\Facades\Route;
use nplesa\InfinityGrid\Http\Controllers\GridController;

Route::prefix('infinitygrid')
    ->name('infinitygrid.')
    ->group(function () {
        Route::get('/data', [GridController::class, 'index'])->name('data');
    });