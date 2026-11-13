<?php

namespace App\Http\Controllers;

use App\Models\FacebookPage;
use App\Services\FacebookApiService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FacebookPageController extends Controller
{
    public function __construct(
        protected FacebookApiService $fbApi
    ) {}

    /**
     * Get system connection status & list of connected Facebook Pages.
     */
    public function status(): JsonResponse
    {
        $pages = FacebookPage::query()
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'configured' => $this->fbApi->isConfigured(),
            'app_id' => config('services.facebook.app_id') ?: env('FACEBOOK_APP_ID'),
            'pages_count' => $pages->count(),
            'pages' => $pages,
            'has_pages' => $pages->isNotEmpty(),
        ]);
    }

    /**
     * Get Facebook OAuth authorization redirect URL.
     */
    public function getAuthUrl(): JsonResponse
    {
        if (! $this->fbApi->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'Facebook App ID or Secret is not configured in .env file.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'url' => $this->fbApi->getAuthUrl(),
        ]);
    }

    /**
     * Handle OAuth Callback from Facebook.
     */
    public function handleCallback(Request $request): RedirectResponse
    {
        $code = $request->query('code');
        $error = $request->query('error_description') ?: $request->query('error');

        if ($error || empty($code)) {
            Log::warning('Facebook OAuth callback error: '.($error ?: 'No code provided'));

            return redirect('/?tab=facebook&status=error&message='.urlencode($error ?: 'Authorization was cancelled.'));
        }

        try {
            // 1. Exchange code for user token
            $tokenData = $this->fbApi->exchangeCodeForUserToken($code);
            $userToken = $tokenData['access_token'];

            // 2. Retrieve managed accounts (pages)
            $accounts = $this->fbApi->getUserAccounts($userToken);

            if (empty($accounts)) {
                return redirect('/?tab=facebook&status=warning&message='.urlencode('No managed Facebook Pages found for this account.'));
            }

            // 3. Save or update each page in database with permanent Page Token
            $userId = Auth::id();
            $connectedCount = 0;

            foreach ($accounts as $acc) {
                if (empty($acc['id']) || empty($acc['access_token'])) {
                    continue;
                }

                FacebookPage::updateOrCreate(
                    ['page_id' => $acc['id']],
                    [
                        'user_id' => $userId,
                        'name' => $acc['name'] ?? 'Facebook Page',
                        'category' => $acc['category'] ?? null,
                        'access_token' => $acc['access_token'],
                        'avatar_url' => $acc['picture']['data']['url'] ?? null,
                        'cover_url' => $acc['cover']['source'] ?? null,
                        'followers_count' => (int) ($acc['followers_count'] ?? 0),
                        'likes_count' => (int) ($acc['fan_count'] ?? 0),
                        'phone' => $acc['phone'] ?? null,
                        'email' => is_array($acc['emails'] ?? null) ? ($acc['emails'][0] ?? null) : null,
                        'website' => $acc['website'] ?? null,
                        'about' => $acc['about'] ?? null,
                        'hours_json' => ! empty($acc['hours']) ? $acc['hours'] : null,
                        'is_active' => true,
                    ]
                );
                $connectedCount++;
            }

            return redirect("/?tab=facebook&status=connected&count={$connectedCount}");
        } catch (Exception $e) {
            Log::error('Facebook OAuth processing failed: '.$e->getMessage());

            return redirect('/?tab=facebook&status=error&message='.urlencode($e->getMessage()));
        }
    }

    /**
     * Connect a Facebook Page directly via manual Page Access Token (ideal for development or testing).
     */
    public function connectManualToken(Request $request): JsonResponse
    {
        if (! Auth::user()?->isAdmin()) {
            return response()->json(['error' => 'Unauthorized. Only Admins can connect Facebook pages.'], 403);
        }

        $validated = $request->validate([
            'access_token' => ['required', 'string'],
            'page_id' => ['nullable', 'string'],
        ]);

        $token = trim($validated['access_token']);
        $pageId = trim($validated['page_id'] ?? 'me');

        try {
            // Verify token and fetch page details
            $details = $this->fbApi->getPageDetails($pageId, $token);

            if (empty($details['id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid Facebook Token or unable to resolve Page ID.',
                ], 422);
            }

            $page = FacebookPage::updateOrCreate(
                ['page_id' => $details['id']],
                [
                    'user_id' => Auth::id(),
                    'name' => $details['name'] ?? 'Facebook Page',
                    'category' => $details['category'] ?? null,
                    'access_token' => $token,
                    'avatar_url' => $details['picture']['data']['url'] ?? null,
                    'cover_url' => $details['cover']['source'] ?? null,
                    'followers_count' => (int) ($details['followers_count'] ?? 0),
                    'likes_count' => (int) ($details['fan_count'] ?? 0),
                    'phone' => $details['phone'] ?? null,
                    'email' => is_array($details['emails'] ?? null) ? ($details['emails'][0] ?? null) : null,
                    'website' => $details['website'] ?? null,
                    'about' => $details['about'] ?? ($details['description'] ?? null),
                    'hours_json' => ! empty($details['hours']) ? $details['hours'] : null,
                    'is_active' => true,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => "Successfully connected \"{$page->name}\"!",
                'page' => $page,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to connect page: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Disconnect a Facebook Page from the system.
     */
    public function disconnectPage(int $id): JsonResponse
    {
        if (! Auth::user()?->isAdmin()) {
            return response()->json(['error' => 'Unauthorized. Only Admins can disconnect Facebook pages.'], 403);
        }

        $page = FacebookPage::findOrFail($id);
        $name = $page->name;
        $page->delete();

        return response()->json([
            'success' => true,
            'message' => "Disconnected \"{$name}\" successfully.",
        ]);
    }

    /**
     * Get real-time details and update local cache for a specific page.
     */
    public function getPageDetails(int $id): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);

        try {
            $live = $this->fbApi->getPageDetails($page->page_id, $page->access_token);

            $page->update([
                'name' => $live['name'] ?? $page->name,
                'avatar_url' => $live['picture']['data']['url'] ?? $page->avatar_url,
                'cover_url' => $live['cover']['source'] ?? $page->cover_url,
                'followers_count' => (int) ($live['followers_count'] ?? $page->followers_count),
                'likes_count' => (int) ($live['fan_count'] ?? $page->likes_count),
                'phone' => $live['phone'] ?? $page->phone,
                'email' => is_array($live['emails'] ?? null) ? ($live['emails'][0] ?? $page->email) : $page->email,
                'website' => $live['website'] ?? $page->website,
                'about' => $live['about'] ?? ($live['description'] ?? $page->about),
                'hours_json' => ! empty($live['hours']) ? $live['hours'] : $page->hours_json,
            ]);
        } catch (Exception $e) {
            Log::warning("Could not refresh live page details for {$page->page_id}: ".$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'page' => $page->fresh(),
        ]);
    }

    /**
     * Update page settings (About, Phone, Website, Email, Hours).
     */
    public function updatePageDetails(Request $request, int $id): JsonResponse
    {
        if (! Auth::user()?->isAdmin()) {
            return response()->json(['error' => 'Unauthorized. Only Admins can modify Facebook page information.'], 403);
        }

        $page = FacebookPage::findOrFail($id);

        $validated = $request->validate([
            'about' => ['nullable', 'string', 'max:1000'],
            'description' => ['nullable', 'string', 'max:50000'],
            'phone' => ['nullable', 'string', 'max:50'],
            'website' => ['nullable', 'string', 'max:500'],
            'hours' => ['nullable', 'array'],
        ]);

        try {
            // Update on Meta Graph API
            $this->fbApi->updatePageDetails($page->page_id, $page->access_token, $validated);

            // Update local database
            $page->update([
                'about' => $validated['about'] ?? ($validated['description'] ?? $page->about),
                'phone' => $validated['phone'] ?? $page->phone,
                'website' => $validated['website'] ?? $page->website,
                'hours_json' => $validated['hours'] ?? $page->hours_json,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Facebook Page information updated successfully!',
                'page' => $page->fresh(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update page info on Facebook: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get posts for a specific Facebook Page.
     */
    public function getPosts(Request $request, int $id): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);
        $limit = min((int) $request->query('limit', 25), 50);
        $after = $request->query('after');

        try {
            $data = $this->fbApi->getPagePosts($page->page_id, $page->access_token, $limit, $after);

            return response()->json([
                'success' => true,
                'posts' => $data['data'] ?? [],
                'paging' => $data['paging'] ?? null,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch posts: '.$e->getMessage(),
                'posts' => [],
            ], 422);
        }
    }

    /**
     * Create and publish (or schedule) a new post.
     */
    public function createPost(Request $request, int $id): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);

        $validated = $request->validate([
            'message' => ['nullable', 'string'],
            'link' => ['nullable', 'url'],
            'photo' => ['nullable', 'image', 'max:15360'], // 15MB max
            'photo_url' => ['nullable', 'url'],
            'published' => ['nullable', 'boolean'],
            'scheduled_publish_time' => ['nullable', 'integer'],
        ]);

        if (empty($validated['message']) && empty($validated['photo']) && empty($validated['photo_url']) && empty($validated['link'])) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide at least a message, a photo, or a link to post.',
            ], 422);
        }

        try {
            $postData = [
                'message' => $validated['message'] ?? '',
                'link' => $validated['link'] ?? null,
                'published' => (bool) ($validated['published'] ?? true),
                'scheduled_publish_time' => $validated['scheduled_publish_time'] ?? null,
            ];

            // If an image was uploaded, store temporarily to send to Meta API
            $tempFilePath = null;
            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $tempName = 'fb_upload_'.uniqid().'.'.$file->getClientOriginalExtension();
                $tempPath = storage_path('app/temp');
                if (! File::isDirectory($tempPath)) {
                    File::makeDirectory($tempPath, 0755, true);
                }
                $file->move($tempPath, $tempName);
                $tempFilePath = "{$tempPath}/{$tempName}";
                $postData['photo_file'] = $tempFilePath;
            } elseif (! empty($validated['photo_url'])) {
                $postData['photo_url'] = $validated['photo_url'];
            }

            $result = $this->fbApi->createPost($page->page_id, $page->access_token, $postData);

            // Clean up temporary image
            if ($tempFilePath && File::exists($tempFilePath)) {
                @unlink($tempFilePath);
            }

            return response()->json([
                'success' => true,
                'message' => empty($postData['published']) ? 'Post scheduled successfully!' : 'Post published to Facebook successfully!',
                'result' => $result,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to publish post: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Edit message of an existing post.
     */
    public function updatePost(Request $request, int $id, string $postId): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);

        $validated = $request->validate([
            'message' => ['required', 'string'],
        ]);

        try {
            $this->fbApi->updatePost($postId, $page->access_token, $validated['message']);

            return response()->json([
                'success' => true,
                'message' => 'Post updated successfully!',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update post: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete a post from Facebook.
     */
    public function deletePost(int $id, string $postId): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);

        try {
            $this->fbApi->deletePost($postId, $page->access_token);

            return response()->json([
                'success' => true,
                'message' => 'Post deleted successfully from Facebook.',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete post: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get comments for a post.
     */
    public function getComments(Request $request, int $id, string $postId): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);

        try {
            $comments = $this->fbApi->getPostComments($postId, $page->access_token);

            return response()->json([
                'success' => true,
                'comments' => $comments,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch comments: '.$e->getMessage(),
                'comments' => [],
            ], 422);
        }
    }

    /**
     * Reply to a comment.
     */
    public function replyComment(Request $request, int $id, string $commentId): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);

        $validated = $request->validate([
            'message' => ['required', 'string'],
        ]);

        try {
            $result = $this->fbApi->replyToComment($commentId, $page->access_token, $validated['message']);

            return response()->json([
                'success' => true,
                'message' => 'Reply posted successfully!',
                'result' => $result,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to post reply: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Hide or unhide a comment (moderation).
     */
    public function hideComment(Request $request, int $id, string $commentId): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);
        $hide = $request->boolean('is_hidden', true);

        try {
            $this->fbApi->hideComment($commentId, $page->access_token, $hide);

            return response()->json([
                'success' => true,
                'message' => $hide ? 'Comment hidden successfully.' : 'Comment unhidden.',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to change comment visibility: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete a comment.
     */
    public function deleteComment(int $id, string $commentId): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);

        try {
            $this->fbApi->deleteComment($commentId, $page->access_token);

            return response()->json([
                'success' => true,
                'message' => 'Comment deleted successfully.',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete comment: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Like a comment.
     */
    public function likeComment(int $id, string $commentId): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);

        try {
            $this->fbApi->likeComment($commentId, $page->access_token);

            return response()->json([
                'success' => true,
                'message' => 'Comment liked!',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to like comment: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Generate AI reply for a Facebook comment using Gemini or smart Hinglish/English fallback.
     */
    public function generateAiCommentReply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'comment' => ['required', 'string'],
            'userName' => ['nullable', 'string'],
            'tone' => ['nullable', 'string'],
            'businessName' => ['nullable', 'string'],
        ]);

        $comment = trim($validated['comment']);
        $userName = trim($validated['userName'] ?? '');
        $tone = $validated['tone'] ?? 'Warm & Courteous';
        $businessName = trim($validated['businessName'] ?? 'our organization');

        // Check language
        $isHindi = preg_match('/[\x{0900}-\x{097F}]/u', $comment) || preg_match('/\b(bahut|achha|badiya|dhanyawad|accha|shandar|shukriya|namaste|sir|kripya)\b/i', $comment);

        $apiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        $modelsToTry = array_values(array_filter(array_unique([
            'gemini-3.1-flash-lite',
            'gemini-3.6-flash',
            config('services.gemini.model') ?: env('GEMINI_MODEL') ?: 'gemini-3.1-flash-lite',
            'gemini-2.5-flash',
        ])));

        if (! empty($apiKey)) {
            $prompt = "You are the social media manager for '{$businessName}'. Write a short, engaging, polite reply to the following Facebook comment.\n"
                ."User Name: {$userName}\n"
                ."User Comment: \"{$comment}\"\n"
                ."Tone: {$tone}\n"
                .'Language: '.($isHindi ? 'Natural Hindi / Hinglish' : 'English')."\n"
                .'Guidelines: Keep it to 1-2 friendly sentences. Do not include quotes, hashtags, or meta commentary.';

            foreach ($modelsToTry as $model) {
                try {
                    $response = Http::timeout(8)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                        'generationConfig' => [
                            'temperature' => 0.8,
                            'maxOutputTokens' => 300,
                        ],
                    ]);

                    if ($response->successful()) {
                        $aiText = trim(trim($response->json('candidates.0.content.parts.0.text', '')), "\"'` \t\n\r");
                        if (! empty($aiText)) {
                            return response()->json([
                                'success' => true,
                                'reply' => $aiText,
                                'ai_powered' => true,
                            ]);
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning("Gemini AI comment reply failed for model {$model}: ".$e->getMessage());
                }
            }
        }

        // Smart fallback pool
        $cleanUser = (! empty($userName) && strtolower($userName) !== 'facebook user') ? $userName : '';
        if ($isHindi) {
            $fallbacks = [
                ($cleanUser ? "Namaste {$cleanUser}! " : 'Namaste! ').'Aapke is pyare feedback aur support ke liye bahut bahut dhanyawad. Hamare saath bane rahein!',
                ($cleanUser ? "Shukriya {$cleanUser} ji! " : 'Shukriya! ').'Aapke vichar hamare liye anmol hain. Kisi bhi madad ya jankari ke liye humse sampark karein.',
                ($cleanUser ? "Hello {$cleanUser}! " : 'Hello! ').'Hamare page ke saath judne aur support karne ke liye tahe dil se aabhar.',
            ];
        } else {
            $fallbacks = [
                ($cleanUser ? "Thank you {$cleanUser}! " : 'Thank you! ').'We really appreciate your support and positive feedback. Stay tuned for more updates!',
                ($cleanUser ? "Hi {$cleanUser}, " : 'Hi there! ')."Thanks for reaching out! We're thrilled to have you as part of our community.",
                ($cleanUser ? "Thanks for your comment, {$cleanUser}! " : 'Thanks for your comment! ').'Feel free to message us if you need any assistance.',
            ];
        }

        $chosen = $fallbacks[array_rand($fallbacks)];

        return response()->json([
            'success' => true,
            'reply' => $chosen,
            'ai_powered' => false,
            'fallback' => true,
        ]);
    }

    /**
     * Generate engaging Facebook post copy using Gemini AI.
     */
    public function generateAiPost(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => ['required', 'string'],
            'tone' => ['nullable', 'string'],
            'businessName' => ['nullable', 'string'],
            'language' => ['nullable', 'string'],
        ]);

        $topic = trim($validated['topic']);
        $tone = $validated['tone'] ?? 'Engaging & Professional';
        $businessName = trim($validated['businessName'] ?? 'our business');
        $lang = $validated['language'] ?? 'English & Hinglish';

        $apiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        $model = config('services.gemini.model') ?: env('GEMINI_MODEL') ?: 'gemini-2.5-flash';

        if (! empty($apiKey)) {
            $prompt = "You are a professional social media marketing copywriter. Create a viral, high-converting Facebook post for '{$businessName}'.\n"
                ."Topic / Objective: {$topic}\n"
                ."Tone: {$tone}\n"
                ."Language: {$lang}\n"
                ."Guidelines:\n"
                ."1. Catchy headline hook with relevant emojis.\n"
                ."2. Compelling body paragraphs (2-3 concise paragraphs max).\n"
                ."3. Clear Call to Action (CTA) asking readers to comment, visit, or call.\n"
                ."4. Include 3-5 relevant hashtags at the end.\n"
                .'5. Do not include markdown meta wrappers or quotes.';

            try {
                $response = Http::timeout(10)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.85,
                        'maxOutputTokens' => 800,
                    ],
                ]);

                if ($response->successful()) {
                    $postCopy = trim(trim($response->json('candidates.0.content.parts.0.text', '')), "\"'` \t\n\r");
                    if (! empty($postCopy)) {
                        return response()->json([
                            'success' => true,
                            'post_text' => $postCopy,
                        ]);
                    }
                }
            } catch (Exception $e) {
                Log::warning('Gemini AI Facebook post generation failed: '.$e->getMessage());
            }
        }

        // Fallback post template
        $fallback = "🌟 Big Announcement from {$businessName}! 🌟\n\n"
            ."We are thrilled to share this with our wonderful community: {$topic}.\n\n"
            ."👉 Contact us today or drop a comment below to learn more!\n\n"
            ."#{$businessName} #Update #Community #Excellence";

        return response()->json([
            'success' => true,
            'post_text' => $fallback,
            'fallback' => true,
        ]);
    }

    /**
     * Get Messenger conversations for a page.
     */
    public function getConversations(Request $request, int $id): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);

        try {
            $conversations = $this->fbApi->getPageConversations($page->page_id, $page->access_token);

            return response()->json([
                'success' => true,
                'conversations' => $conversations,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch conversations: '.$e->getMessage(),
                'conversations' => [],
            ], 422);
        }
    }

    /**
     * Get messages in a Messenger conversation.
     */
    public function getMessages(Request $request, int $id, string $conversationId): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);

        try {
            $messages = $this->fbApi->getConversationMessages($conversationId, $page->access_token);

            return response()->json([
                'success' => true,
                'messages' => $messages,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch messages: '.$e->getMessage(),
                'messages' => [],
            ], 422);
        }
    }

    /**
     * Send a direct Messenger reply.
     */
    public function sendMessage(Request $request, int $id): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);

        $validated = $request->validate([
            'recipient_id' => ['required', 'string'],
            'text' => ['required', 'string'],
        ]);

        try {
            $result = $this->fbApi->sendMessage($page->page_id, $page->access_token, $validated['recipient_id'], $validated['text']);

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully!',
                'result' => $result,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send message: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get page performance insights.
     */
    public function getInsights(Request $request, int $id): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);
        $period = $request->query('period', 'day');

        try {
            $insights = $this->fbApi->getPageInsights($page->page_id, $page->access_token, $period);

            return response()->json([
                'success' => true,
                'insights' => $insights,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve insights: '.$e->getMessage(),
                'insights' => [],
            ], 422);
        }
    }

    /**
     * Get AI automation rules for a page.
     */
    public function getRules(int $id): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);

        $defaultRules = [
            'auto_reply_enabled' => false,
            'tone' => 'Warm & Courteous',
            'language_matching' => true,
            'anti_toxicity_guard' => true,
            'auto_hide_spam' => true,
            'contact_phone' => $page->phone ?: '',
            'custom_instructions' => '',
        ];

        return response()->json([
            'success' => true,
            'enabled' => (bool) $page->auto_reply_enabled,
            'rules' => array_merge($defaultRules, (array) ($page->auto_reply_rules ?? [])),
        ]);
    }

    /**
     * Update AI automation rules for a page.
     */
    public function updateRules(Request $request, int $id): JsonResponse
    {
        $page = FacebookPage::findOrFail($id);

        $validated = $request->validate([
            'auto_reply_enabled' => ['required', 'boolean'],
            'tone' => ['nullable', 'string'],
            'language_matching' => ['nullable', 'boolean'],
            'anti_toxicity_guard' => ['nullable', 'boolean'],
            'auto_hide_spam' => ['nullable', 'boolean'],
            'contact_phone' => ['nullable', 'string'],
            'custom_instructions' => ['nullable', 'string'],
        ]);

        $page->update([
            'auto_reply_enabled' => $validated['auto_reply_enabled'],
            'auto_reply_rules' => $validated,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Facebook AI rules saved successfully!',
            'rules' => $validated,
        ]);
    }
}
