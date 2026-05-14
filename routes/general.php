<?php

use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\General\AdminController;
use App\Http\Controllers\General\ExportController;
use App\Http\Controllers\General\ImportController;
use App\Http\Controllers\General\LookupController;
use App\Http\Controllers\General\ProfileController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

  Route::middleware(AdminMiddleware::class)->group(function () {

    Route::get("/admin", [AdminController::class, 'index'])->name('admin');
    Route::get("/new-admin", [AdminController::class, 'index_addAdmin'])->name('index_addAdmin');
    Route::post("/add-admin", [AdminController::class, 'addAdmin'])->name('addAdmin');
    Route::post("/remove-admin", [AdminController::class, 'removeAdmin'])->name('removeAdmin');
    Route::patch("/change-admin-role", [AdminController::class, 'changeAdminRole'])->name('changeAdminRole');

    Route::get('/lookups',               [LookupController::class, 'index'])->name('lookups.index');
    Route::post('/lookups/{type}',       [LookupController::class, 'store'])->name('lookups.store');
    Route::patch('/lookups/{type}/{id}', [LookupController::class, 'update'])->name('lookups.update');
    Route::delete('/lookups/{type}/{id}',[LookupController::class, 'destroy'])->name('lookups.destroy');

    Route::get('/export',          [ExportController::class, 'index'])->name('export.index');
    Route::post('/export/download',[ExportController::class, 'download'])->name('export.download');
  });

  Route::get("/", [DashboardController::class, 'index'])->name('dashboard');
  Route::get("/profile", [ProfileController::class, 'index'])->name('profile.index');
  Route::post("/change-password", [ProfileController::class, 'changePassword'])->name('changePassword');
});
