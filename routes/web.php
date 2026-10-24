<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatAgentController;
use App\Http\Controllers\ChatFlowController;
use App\Http\Controllers\ChatWidgetController;
use App\Http\Controllers\FacebookPageController;
use App\Http\Controllers\GoogleBusinessController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;

// Dashboard UI
Route::get('/', function () {
    return view('dashboard');
});

// Legal and Compliance Pages (Required by Meta/Facebook and Google)
Route::view('/privacy-policy', 'legal.privacy')->name('legal.privacy');
Route::view('/terms-of-service', 'legal.terms')->name('legal.terms');
Route::view('/data-deletion', 'legal.data_deletion')->name('legal.data_deletion');

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
    Route::match(['get', 'post'], '/clear-cache', [GoogleBusinessController::class, 'clearServerCache']);
    Route::get('/widget/reviews', [GoogleBusinessController::class, 'getWidgetReviews']);
});

// Public Website Widget Routes (Embeddable on any official website)
Route::get('/widget/preview', [GoogleBusinessController::class, 'renderWidgetPreview'])->name('widget.preview');
Route::get('/api/widget/reviews', [GoogleBusinessController::class, 'getWidgetReviews'])->name('widget.reviews');

// OAuth Callback Route
Route::match(['get', 'post'], '/auth/callback', [GoogleBusinessController::class, 'handleCallback']);
Route::match(['get', 'post'], '/api/auth/callback', [GoogleBusinessController::class, 'handleCallback']);

// Facebook Page Management Routes
Route::prefix('api/fb')->group(function () {
    Route::get('/status', [FacebookPageController::class, 'status']);
    Route::get('/auth-url', [FacebookPageController::class, 'getAuthUrl']);
    Route::match(['get', 'post'], '/callback', [FacebookPageController::class, 'handleCallback']);
    Route::post('/manual-token', [FacebookPageController::class, 'connectManualToken']);
    Route::delete('/pages/{id}', [FacebookPageController::class, 'disconnectPage']);
    Route::get('/pages/{id}', [FacebookPageController::class, 'getPageDetails']);
    Route::post('/pages/{id}', [FacebookPageController::class, 'updatePageDetails']);
    Route::get('/pages/{id}/posts', [FacebookPageController::class, 'getPosts']);
    Route::post('/pages/{id}/posts', [FacebookPageController::class, 'createPost']);
    Route::put('/pages/{id}/posts/{postId}', [FacebookPageController::class, 'updatePost']);
    Route::delete('/pages/{id}/posts/{postId}', [FacebookPageController::class, 'deletePost']);
    Route::get('/pages/{id}/posts/{postId}/comments', [FacebookPageController::class, 'getComments']);
    Route::post('/pages/{id}/comments/{commentId}/reply', [FacebookPageController::class, 'replyComment']);
    Route::post('/pages/{id}/comments/{commentId}/hide', [FacebookPageController::class, 'hideComment']);
    Route::delete('/pages/{id}/comments/{commentId}', [FacebookPageController::class, 'deleteComment']);
    Route::post('/pages/{id}/comments/{commentId}/like', [FacebookPageController::class, 'likeComment']);
    Route::post('/comment/ai-reply', [FacebookPageController::class, 'generateAiCommentReply']);
    Route::post('/posts/ai-post', [FacebookPageController::class, 'generateAiPost']);
    Route::get('/pages/{id}/conversations', [FacebookPageController::class, 'getConversations']);
    Route::get('/pages/{id}/conversations/{conversationId}/messages', [FacebookPageController::class, 'getMessages']);
    Route::post('/pages/{id}/messages', [FacebookPageController::class, 'sendMessage']);
    Route::get('/pages/{id}/insights', [FacebookPageController::class, 'getInsights']);
    Route::get('/pages/{id}/rules', [FacebookPageController::class, 'getRules']);
    Route::post('/pages/{id}/rules', [FacebookPageController::class, 'updateRules']);
});

// ==========================================
// Live Website Chatbot & Support Widget Routes
// ==========================================

// Public Visitor Endpoints (Used by widget embed script & iframe)
Route::prefix('api/chat/public')->group(function () {
    Route::post('/init', [ChatWidgetController::class, 'init']);
    Route::post('/message', [ChatWidgetController::class, 'sendMessage']);
    Route::get('/sync', [ChatWidgetController::class, 'sync']);
    Route::post('/feedback', [ChatWidgetController::class, 'feedback']);
});

// Embed Script and Standalone Widget Preview
Route::get('/embed/chat.js', [ChatWidgetController::class, 'embedScript'])->name('chat.embed');
Route::get('/chat/preview', [ChatWidgetController::class, 'renderPreview'])->name('chat.preview');

// Admin & Live Agent Management Endpoints
Route::prefix('api/chat/admin')->group(function () {
    Route::get('/conversations', [ChatAgentController::class, 'getConversations']);
    Route::get('/conversations/{uuid}', [ChatAgentController::class, 'getConversationDetails']);
    Route::post('/conversations/{uuid}/messages', [ChatAgentController::class, 'sendMessage']);
    Route::post('/conversations/{uuid}/assign', [ChatAgentController::class, 'assignAgent']);
    Route::post('/conversations/{uuid}/status', [ChatAgentController::class, 'updateStatus']);
    Route::post('/conversations/{uuid}/ai-reply', [ChatAgentController::class, 'generateAiReply']);
    Route::get('/canned-responses', [ChatAgentController::class, 'getCannedResponses']);
    Route::post('/canned-responses', [ChatAgentController::class, 'saveCannedResponse']);
    Route::delete('/canned-responses/{id}', [ChatAgentController::class, 'deleteCannedResponse']);
    Route::get('/stream', [ChatAgentController::class, 'streamEvents']);

    // Visual Flow Builder & Widget Settings
    Route::get('/flows', [ChatFlowController::class, 'getFlows']);
    Route::post('/flows', [ChatFlowController::class, 'saveFlow']);
    Route::get('/flows/templates', [ChatFlowController::class, 'getTemplates']);
    Route::get('/widget/settings', [ChatFlowController::class, 'getWidgetSettings']);
    Route::post('/widget/settings', [ChatFlowController::class, 'updateWidgetSettings']);
    Route::get('/analytics', [ChatFlowController::class, 'getAnalytics']);
});
