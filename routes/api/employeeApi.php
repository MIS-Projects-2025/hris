<?php

use App\Http\Controllers\Api\EmployeeController;
use App\Http\Middleware\ApiAuthMiddleware;
use Illuminate\Support\Facades\Route;

Route::middleware([ApiAuthMiddleware::class, 'throttle:api-reads'])->group(function () {
    Route::prefix('employees')->group(function () {
        Route::get('/active', [EmployeeController::class, 'getActiveEmployeeList']);
        Route::get('/operation-director', [EmployeeController::class, 'getOperationDirector']);
        Route::get('/direct-reports/{empId}', [EmployeeController::class, 'getDirectReports']);
        Route::post('/bulk', [EmployeeController::class, 'bulk']);
        Route::get('/{employid}',       [EmployeeController::class, 'show'])->whereNumber('employid');
        Route::get('/{employid}/auth',  [EmployeeController::class, 'auth'])->whereNumber('employid');
        Route::get('/{employid}/work',  [EmployeeController::class, 'work'])->whereNumber('employid');
        Route::post('/names/bulk', [EmployeeController::class, 'bulkNames']);
    });
});
