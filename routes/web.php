<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\AdminController;

Route::view('/', 'welcome')->name('home');
Route::view('/{any}', 'welcome')->where('any', '.*');

Route::prefix('api/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
});

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard/transactions', [DashboardController::class, 'transactions']);
    Route::get('/dashboard/wallet', [DashboardController::class, 'wallet']);

    Route::get('/company/profile', [CompanyController::class, 'show']);
    Route::post('/company/profile', [CompanyController::class, 'store']);
    Route::patch('/company/profile', [CompanyController::class, 'update']);

    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/profiles/pending', [AdminController::class, 'pendingProfiles']);
        Route::patch('/profiles/{id}/approve', [AdminController::class, 'approveProfile']);
        Route::patch('/profiles/{id}/reject', [AdminController::class, 'rejectProfile']);
        Route::get('/transactions', [AdminController::class, 'allTransactions']);
        Route::get('/statistics', [AdminController::class, 'statistics']);
    });
});
