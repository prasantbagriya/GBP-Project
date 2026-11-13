<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatAgentController;
use App\Http\Controllers\ChatFlowController;
use App\Http\Controllers\ChatWidgetController;
use App\Http\Controllers\FacebookPageController;
use App\Http\Controllers\GoogleBusinessController;
use App\Http\Controllers\TeamController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

// Public Homepage Landing (Complies with Google OAuth Verification: No login barrier, links to Privacy Policy & Terms)
Route::get('/', function (Request $request) {
    if ($request->has('reset_otp') || $request->has('otp')) {
        return redirect('/login?'.$request->getQueryString());
    }

    return view('landing');
})->name('landing');

// Staff Portal / Dashboard UI
Route::get('/dashboard', function () {
    return view('dashboard');
})->name('dashboard');
Route::get('/login', function () {
    return view('dashboard');
})->name('login');
Route::get('/reset-password', function () {
    return view('dashboard');
})->name('reset-password');
Route::get('/app', function () {
    return view('dashboard');
})->name('app');

// Google Search Console HTML File Verification Route
Route::get('/google{token}.html', function ($token) {
    return response("google-site-verification: google{$token}.html", 200)
        ->header('Content-Type', 'text/html');
})->where('token', '[a-zA-Z0-9_-]+');

// Legal and Compliance Pages (Required by Google and Meta)
Route::view('/privacy-policy', 'legal.privacy')->name('legal.privacy');
Route::view('/privacy', 'legal.privacy')->name('legal.privacy.alias');
Route::view('/terms-of-service', 'legal.terms')->name('legal.terms');
Route::view('/terms', 'legal.terms')->name('legal.terms.alias');
Route::view('/data-deletion', 'legal.data_deletion')->name('legal.data_deletion');

// Server DB Setup Route (Runs migrations & seeders via code on the server - Super Admin Only)
Route::match(['get', 'post'], '/api/admin/setup-db', function (Request $request) {
    /** @var User|null $currentUser */
    $currentUser = Auth::user();
    if (! $currentUser || ! $currentUser->isAdmin()) {
        return response()->json(['error' => 'Forbidden. Super Admin session required.'], 403);
    }

    $expectedKey = config('app.admin_setup_key') ?: env('ADMIN_SETUP_KEY', 'PrinceEduHub@2026Setup');
    if ($request->input('key', $request->query('key')) !== $expectedKey) {
        return response()->json(['error' => 'Unauthorized key.'], 403);
    }

    try {
        if (! Schema::hasColumn('users', 'role')) {
            DB::statement("ALTER TABLE `users` ADD `role` VARCHAR(255) NOT NULL DEFAULT 'member' AFTER `email`");
        }
        if (! Schema::hasColumn('users', 'status')) {
            DB::statement("ALTER TABLE `users` ADD `status` VARCHAR(255) NOT NULL DEFAULT 'active' AFTER `role`");
        }
        if (! Schema::hasColumn('users', 'phone')) {
            DB::statement('ALTER TABLE `users` ADD `phone` VARCHAR(255) NULL AFTER `email`');
        }
        if (! Schema::hasColumn('users', 'assigned_wing')) {
            DB::statement('ALTER TABLE `users` ADD `assigned_wing` VARCHAR(255) NULL AFTER `phone`');
        }
        if (! Schema::hasColumn('users', 'last_login_at')) {
            DB::statement('ALTER TABLE `users` ADD `last_login_at` TIMESTAMP NULL AFTER `remember_token`');
        }
    } catch (Throwable $e) {
    }

    try {
        Artisan::call('migrate', ['--force' => true]);
        $migrateOutput = Artisan::output();
    } catch (Throwable $e) {
        $migrateOutput = 'Migrate warning: '.$e->getMessage();
    }

    Artisan::call('db:seed', [
        '--class' => 'Database\\Seeders\\ReviewTeamSeeder',
        '--force' => true,
    ]);
    $teamSeedOutput = Artisan::output();

    Artisan::call('db:seed', [
        '--class' => 'Database\\Seeders\\GbpSqlSyncSeeder',
        '--force' => true,
    ]);
    $syncSeedOutput = Artisan::output();

    return response()->json([
        'success' => true,
        'message' => 'Database tables created and seeded successfully on server!',
        'migrate' => $migrateOutput,
        'team_seeder' => $teamSeedOutput,
        'sync_seeder' => $syncSeedOutput,
    ]);
});

// Panel Authentication (Email & Password)
Route::get('/copy-otp', function (Request $request) {
    $otp = htmlspecialchars((string) $request->query('otp', ''));
    $identifier = htmlspecialchars((string) $request->query('identifier', ''));
    $targetUrl = url('/?reset_otp='.$otp.'&identifier='.urlencode($identifier));

    return response('<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Copied - Prince Edu Hub</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; color: #1e293b; }
        .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px 24px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06); }
        .icon { font-size: 42px; margin-bottom: 12px; }
        .title { font-size: 19px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .otp { font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2563eb; background: #eff6ff; border: 1.5px dashed #93c5fd; padding: 10px 18px; border-radius: 12px; margin: 16px 0; display: inline-block; }
        .sub { font-size: 13px; color: #64748b; margin-bottom: 20px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13.5px; padding: 10px 24px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">✅</div>
        <div class="title">OTP Copied Successfully!</div>
        <div class="otp">'.$otp.'</div>
        <div class="sub">Redirecting to Prince Edu Hub login portal...</div>
        <a href="'.$targetUrl.'" class="btn">Proceed to Reset Password &rarr;</a>
    </div>
    <script>
        try { navigator.clipboard.writeText("'.$otp.'"); } catch(e) {}
        setTimeout(function() { window.location.href = "'.$targetUrl.'"; }, 1000);
    </script>
</body>
</html>')->header('Content-Type', 'text/html');
});

Route::post('/api/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::get('/api/auth/me', [AuthController::class, 'me']);
Route::post('/api/auth/logout', [AuthController::class, 'logout']);
Route::post('/api/auth/forgot-password/send-otp', [AuthController::class, 'forgotPasswordSendOtp'])->middleware('throttle:4,1');
Route::post('/api/auth/forgot-password/verify-reset', [AuthController::class, 'forgotPasswordVerifyAndReset'])->middleware('throttle:6,1');

// Team Management (Protected by Auth)
Route::middleware('auth')->prefix('api/team')->group(function () {
    Route::get('/members', [TeamController::class, 'index']);
    Route::post('/members', [TeamController::class, 'store']);
    Route::put('/members/{id}', [TeamController::class, 'update']);
    Route::delete('/members/{id}', [TeamController::class, 'destroy']);
});

// User & Auth endpoints aliases used by React frontend (Google OAuth)
Route::get('/api/user/status', [GoogleBusinessController::class, 'status']);
Route::post('/api/logout', [GoogleBusinessController::class, 'logout']);
Route::post('/api/reviews/ai-reply', [GoogleBusinessController::class, 'generateAiReply'])->middleware('throttle:30,1');
Route::post('/api/reviews/auto-reply-new', [GoogleBusinessController::class, 'autoReplyNewReviews'])->middleware('throttle:15,1');
Route::match(['get', 'post'], '/api/reviews/ai-sentiment', [GoogleBusinessController::class, 'getAiSentiment'])->middleware('throttle:30,1');
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
    Route::match(['post', 'delete'], '/reviews/cached', [GoogleBusinessController::class, 'deleteCachedReview']);
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
    Route::match(['get', 'post'], '/review-targets', [GoogleBusinessController::class, 'handleReviewTargets']);
    Route::match(['get', 'post'], '/clear-cache', [GoogleBusinessController::class, 'clearServerCache']);
    Route::get('/widget/reviews', [GoogleBusinessController::class, 'getWidgetReviews']);
});

// Public Website Widget Routes (Embeddable on any official website)
Route::get('/widget/preview', [GoogleBusinessController::class, 'renderWidgetPreview'])->name('widget.preview');
Route::get('/api/widget/reviews', [GoogleBusinessController::class, 'getWidgetReviews'])->name('widget.reviews');

// OAuth Callback Route
Route::match(['get', 'post'], '/auth/callback', [GoogleBusinessController::class, 'handleCallback']);
Route::match(['get', 'post'], '/api/auth/callback', [GoogleBusinessController::class, 'handleCallback']);

// Facebook Page OAuth Callback (Public - Meta Redirect Target)
Route::match(['get', 'post'], '/api/fb/callback', [FacebookPageController::class, 'handleCallback']);

// Facebook Page Management Routes (Protected by Auth)
Route::middleware('auth')->prefix('api/fb')->group(function () {
    Route::get('/status', [FacebookPageController::class, 'status']);
    Route::get('/auth-url', [FacebookPageController::class, 'getAuthUrl']);
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
    Route::post('/init', [ChatWidgetController::class, 'init'])->middleware('throttle:30,1');
    Route::post('/message', [ChatWidgetController::class, 'sendMessage'])->middleware('throttle:60,1');
    Route::get('/sync', [ChatWidgetController::class, 'sync'])->middleware('throttle:60,1');
    Route::post('/feedback', [ChatWidgetController::class, 'feedback'])->middleware('throttle:15,1');
});

// Embed Script and Standalone Widget Preview
Route::get('/embed/chat.js', [ChatWidgetController::class, 'embedScript'])->name('chat.embed');
Route::get('/chat/preview', [ChatWidgetController::class, 'renderPreview'])->name('chat.preview');

// Admin & Live Agent Management Endpoints (Protected by Auth)
Route::middleware('auth')->prefix('api/chat/admin')->group(function () {
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
