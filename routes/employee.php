<?php

use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\EmployeeChangeRequestController;
use App\Http\Controllers\EmployeeController;
use Illuminate\Support\Facades\Route;

$app_name = env('APP_NAME', '');

Route::prefix($app_name)->group(function () {
    Route::get('/employees', [EmployeeController::class, 'index'])
        ->name('employees.index');

    Route::get('/employees/{employid}', [EmployeeController::class, 'show'])
        ->name('employees.show');

    Route::get('/employees/{employid}/history', [EmployeeController::class, 'history'])
        ->name('employees.history');

    Route::patch('/employees/{employid}/admin-update', [EmployeeController::class, 'adminUpdate'])
        ->name('employees.admin-update');

    Route::post('/employees/{employid}/admin-family-add', [EmployeeController::class, 'adminFamilyAdd'])
        ->name('employees.admin-family-add');

    Route::delete('/employees/{employid}/admin-family/{rowId}', [EmployeeController::class, 'adminFamilyDelete'])
        ->name('employees.admin-family-delete');

    // ── File serving — web stack so session/cookie auth works in browser ─────
    Route::get('/attachments/{id}', [AttachmentController::class, 'view'])
        ->middleware('throttle:api-reads')
        ->name('attachments.view');


    // ── HR Table Page (Inertia) ───────────────────────────────────────────────
    Route::get('/change-requests', [EmployeeChangeRequestController::class, 'index'])
        ->name('change-requests.index');

    // ── Employee Submit ───────────────────────────────────────────────────────
    Route::post('/change-requests', [EmployeeChangeRequestController::class, 'store'])
        ->middleware('throttle:cr-submit')
        ->name('change-requests.store');

    // ── HR Approve / Reject ───────────────────────────────────────────────────
    Route::post('/change-requests/{id}/approve', [EmployeeChangeRequestController::class, 'approve'])
        ->middleware('throttle:cr-review')
        ->name('change-requests.approve');

    Route::post('/change-requests/{id}/reject', [EmployeeChangeRequestController::class, 'reject'])
        ->middleware('throttle:cr-review')
        ->name('change-requests.reject');

    // ── HR Bulk Actions ───────────────────────────────────────────────────────
    Route::post('/change-requests/bulk-approve', [EmployeeChangeRequestController::class, 'bulkApprove'])
        ->middleware('throttle:cr-review')
        ->name('change-requests.bulk-approve');

    Route::post('/change-requests/bulk-reject', [EmployeeChangeRequestController::class, 'bulkReject'])
        ->middleware('throttle:cr-review')
        ->name('change-requests.bulk-reject');

    // ── Attachments ───────────────────────────────────────────────────────────
    Route::get('/change-requests/attachments', [EmployeeChangeRequestController::class, 'listAttachments'])
        ->name('change-requests.attachments.index');

    Route::post('/change-requests/attachments', [EmployeeChangeRequestController::class, 'uploadAttachment'])
        ->middleware('throttle:cr-upload')
        ->name('change-requests.attachments.store');
});
