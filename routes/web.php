<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GoogleBusinessController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;

// Dashboard UI
Route::get('/', function () {
    return view('dashboard');
});

// Panel Authentication (Email & Password)
Route::post('/api/auth/login', [AuthController::class, 'login']);
Route::get('/api/auth/me', [AuthController::class, 'me']);
Route::post('/api/auth/logout', [AuthController::class, 'logout']);

// Team Management
Route::get('/api/team/members', [TeamController::class, 'index']);
Route::post('/api/team/members', [TeamController::class, 'store']);
Route::put('/api/team/members/{id}', [TeamController::class, 'update']);
Route::delete('/api/team/members/{id}', [TeamController::class, 'destroy']);

// User & Auth endpoints aliases used by React frontend (Google OAuth)
Route::get('/api/user/status', [GoogleBusinessController::class, 'status']);
Route::post('/api/logout', [GoogleBusinessController::class, 'logout']);
Route::post('/api/reviews/ai-reply', [GoogleBusinessController::class, 'generateAiReply']);
Route::post('/api/reviews/auto-reply-new', [GoogleBusinessController::class, 'autoReplyNewReviews']);
Route::match(['get', 'post'], '/api/reviews/ai-sentiment', [GoogleBusinessController::class, 'getAiSentiment']);
Route::post('/api/sync/sheets', [GoogleBusinessController::class, 'syncSheets']);
Route::match(['get', 'post'], '/api/sync/sheets/info', [GoogleBusinessController::class, 'getSheetInfo']);
Route::post('/api/sync/sheets/create', [GoogleBusinessController::class, 'createOrLinkSheet']);
Route::get('/api/settings/ai', [GoogleBusinessController::class, 'getAiSettings']);
Route::post('/api/settings/ai', [GoogleBusinessController::class, 'updateAiSettings']);
Route::get('/api/settings/ai-rules', [GoogleBusinessController::class, 'getAiRules']);
Route::post('/api/settings/ai-rules', [GoogleBusinessController::class, 'updateAiRules']);

// Google Business Profile API Routes
Route::prefix('api/gbp')->group(function () {
    Route::get('/auth-url', [GoogleBusinessController::class, 'getAuthUrl']);
    Route::post('/exchange-code', [GoogleBusinessController::class, 'exchangeCode']);
    Route::get('/status', [GoogleBusinessController::class, 'status']);
    Route::post('/logout', [GoogleBusinessController::class, 'logout']);
    Route::get('/locations', [GoogleBusinessController::class, 'getLocations']);
    Route::get('/reviews', [GoogleBusinessController::class, 'getReviews']);
    Route::match(['post', 'put'], '/reviews/reply', [GoogleBusinessController::class, 'replyToReview']);
    Route::post('/reviews/auto-reply-new', [GoogleBusinessController::class, 'autoReplyNewReviews']);
    Route::post('/reviews/ai-reply', [GoogleBusinessController::class, 'generateAiReply']);
    Route::delete('/reviews/reply', [GoogleBusinessController::class, 'deleteReply']);
    Route::get('/posts', [GoogleBusinessController::class, 'getPosts']);
    Route::post('/posts', [GoogleBusinessController::class, 'createPost']);
    Route::match(['post', 'put', 'patch'], '/posts/update', [GoogleBusinessController::class, 'updatePost']);
    Route::match(['post', 'delete'], '/posts/delete', [GoogleBusinessController::class, 'deletePost']);
    Route::post('/posts/upload-image', [GoogleBusinessController::class, 'uploadPostImage']);
    Route::post('/posts/extract-link', [GoogleBusinessController::class, 'extractPostFromLink']);
    Route::post('/posts/ai-post', [GoogleBusinessController::class, 'generateAiPost']);
    Route::get('/services', [GoogleBusinessController::class, 'getServices']);
    Route::post('/services', [GoogleBusinessController::class, 'createService']);
    Route::delete('/services/{id}', [GoogleBusinessController::class, 'deleteService']);
    Route::get('/hours', [GoogleBusinessController::class, 'getHours']);
    Route::post('/hours', [GoogleBusinessController::class, 'updateHours']);
    Route::match(['get', 'post'], '/review-link', [GoogleBusinessController::class, 'getReviewLink']);
    Route::post('/sync/sheets', [GoogleBusinessController::class, 'syncSheets']);
    Route::match(['get', 'post'], '/sync/sheets/info', [GoogleBusinessController::class, 'getSheetInfo']);
    Route::post('/sync/sheets/create', [GoogleBusinessController::class, 'createOrLinkSheet']);
    Route::get('/multi-profile-report', [GoogleBusinessController::class, 'getMultiProfileReport']);
    Route::post('/multi-profile-snapshot', [GoogleBusinessController::class, 'saveProfileSnapshot']);
    Route::get('/widget/reviews', [GoogleBusinessController::class, 'getWidgetReviews']);
});

// Public Website Widget Routes (Embeddable on any official website)
Route::get('/widget/preview', [GoogleBusinessController::class, 'renderWidgetPreview'])->name('widget.preview');
Route::get('/api/widget/reviews', [GoogleBusinessController::class, 'getWidgetReviews'])->name('widget.reviews');

// OAuth Callback Route
Route::match(['get', 'post'], '/auth/callback', [GoogleBusinessController::class, 'handleCallback']);
Route::match(['get', 'post'], '/api/auth/callback', [GoogleBusinessController::class, 'handleCallback']);
