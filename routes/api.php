<?php

use App\Http\Controllers\GoogleBusinessController;
use Illuminate\Support\Facades\Route;

// Return user auth status
Route::get('/user/status', [GoogleBusinessController::class, 'status']);
// Return Auth URL for frontend redirect
Route::get('/auth/url', [GoogleBusinessController::class, 'getAuthUrl']);
// Handle OAuth Callback (can be web route too)
Route::get('/auth/callback', [GoogleBusinessController::class, 'handleCallback']);
Route::post('/logout', [GoogleBusinessController::class, 'logout']);

// Google Business Profile routes
Route::get('/gbp/locations', [GoogleBusinessController::class, 'getLocations']);
Route::get('/gbp/reviews', [GoogleBusinessController::class, 'getReviews']);
Route::post('/gbp/reviews/reply', [GoogleBusinessController::class, 'replyToReview']);
Route::delete('/gbp/reviews/reply', [GoogleBusinessController::class, 'deleteReply']);
Route::post('/reviews/ai-reply', [GoogleBusinessController::class, 'generateAiReply']);
Route::post('/gbp/reviews/ai-reply', [GoogleBusinessController::class, 'generateAiReply']);

Route::get('/gbp/posts', [GoogleBusinessController::class, 'getPosts']);
Route::post('/posts/ai-generate', [GoogleBusinessController::class, 'generateAiPost']);
Route::post('/posts/ai-post', [GoogleBusinessController::class, 'generateAiPost']);
Route::post('/gbp/posts/ai-post', [GoogleBusinessController::class, 'generateAiPost']);
Route::get('/gbp/services', [GoogleBusinessController::class, 'getServices']);

// Add other endpoints as needed
