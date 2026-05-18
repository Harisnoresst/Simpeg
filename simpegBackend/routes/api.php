<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// Rute Publik
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rute Terproteksi
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile/details', [AuthController::class, 'profileDetails']);
    Route::get('/dashboard', [AuthController::class, 'dashboard']);
    Route::get('/profile/details', [AuthController::class, 'profileDetails']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/avatar', [AuthController::class, 'updateAvatar']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);
    Route::post('/attendance', [AuthController::class, 'storeAttendance']);
    Route::get('/leave-requests', [AuthController::class, 'getLeaveRequests']);
    Route::post('/leave-requests', [AuthController::class, 'storeLeaveRequest']);
    Route::get('/attendance/history', [AuthController::class, 'attendanceHistory']);
    Route::get('/admin/dashboard', [AuthController::class, 'adminDashboard']);
    Route::get('/admin/gurus', [AuthController::class, 'getGurus']);
    Route::post('/admin/gurus', [AuthController::class, 'storeGuru']);
    Route::put('/admin/gurus/{id}', [AuthController::class, 'updateGuru']);
    Route::delete('/admin/gurus/{id}', [AuthController::class, 'deleteGuru']);
    Route::get('/admin/attendances', [AuthController::class, 'getAttendances']);
    Route::get('/admin/validations', [AuthController::class, 'getValidations']);
    Route::put('/admin/validations/{id}', [AuthController::class, 'updateValidation']);
    Route::get('/admin/laporan', [AuthController::class, 'adminLaporan']);
    Route::get('/admin/settings', [AuthController::class, 'getSettings']);
    Route::post('/admin/settings', [AuthController::class, 'updateSettings']);
    Route::get('/settings', [AuthController::class, 'getSettings']);
    Route::get('/admin/leave-requests', [AuthController::class, 'getAdminLeaveRequests']);
    Route::put('/admin/leave-requests/{id}', [AuthController::class, 'updateAdminLeaveRequest']);
    Route::get('/admin/users', [AuthController::class, 'getUsers']);
    Route::post('/admin/users', [AuthController::class, 'storeUser']);
    Route::put('/admin/users/{id}', [AuthController::class, 'updateUser']);
    Route::delete('/admin/users/{id}', [AuthController::class, 'deleteUser']);
    Route::get('/admin/profile', [AuthController::class, 'getAdminProfile']);
    Route::put('/admin/profile', [AuthController::class, 'updateAdminProfile']);
    Route::post('/admin/update-avatar', [AuthController::class, 'updateAvatar']);
    Route::get('/notifications', [AuthController::class, 'getNotifications']);
    Route::post('/notifications/mark-read', [AuthController::class, 'markNotificationsRead']);
});

