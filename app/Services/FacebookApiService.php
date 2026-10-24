<?php

namespace App\Services;

use Exception;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FacebookApiService
{
    protected string $appId;

    protected string $appSecret;

    protected string $redirectUri;

    protected string $graphVersion;

    protected string $baseUrl;

    protected ?string $configId = null;

    public function __construct(
        ?string $appId = null,
        ?string $appSecret = null,
        ?string $redirectUri = null,
        ?string $graphVersion = null,
        ?string $configId = null
    ) {
        $this->appId = $appId ?: (config('services.facebook.app_id') ?: (string) env('FACEBOOK_APP_ID', ''));
        $this->appSecret = $appSecret ?: (config('services.facebook.app_secret') ?: (string) env('FACEBOOK_APP_SECRET', ''));
        $this->configId = $configId ?: (config('services.facebook.config_id') ?: (string) env('FACEBOOK_CONFIG_ID', '1435321504697339'));
        $defaultHost = (! app()->runningInConsole() && request()) ? request()->root() : rtrim(config('app.url', 'http://localhost:8000'), '/');
        $configuredUri = config('services.facebook.redirect_uri') ?: env('FACEBOOK_REDIRECT_URI');

        if (! app()->runningInConsole() && request() && in_array(request()->getHost(), ['localhost', '127.0.0.1'])) {
            $this->redirectUri = $redirectUri ?: "{$defaultHost}/api/fb/callback";
        } else {
            $this->redirectUri = $redirectUri ?: ($configuredUri ?: "{$defaultHost}/api/fb/callback");
        }

        $this->graphVersion = $graphVersion ?: (config('services.facebook.graph_version') ?: (string) env('FACEBOOK_GRAPH_VERSION', 'v21.0'));
        $this->baseUrl = "https://graph.facebook.com/{$this->graphVersion}";
    }

    /**
     * Check if Facebook App ID and App Secret are configured.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->appId) && ! empty($this->appSecret);
    }

    /**
     * Generate Facebook OAuth authorization URL.
     */
    public function getAuthUrl(string $state = ''): string
    {
        $scopes = [
            'public_profile',
            'email',
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts',
            'pages_manage_engagement',
        ];

        $params = http_build_query([
            'client_id' => $this->appId,
            'redirect_uri' => $this->redirectUri,
            'state' => $state ?: csrf_token(),
            'scope' => implode(',', $scopes),
            'response_type' => 'code',
            'auth_type' => 'rerequest',
        ]);

        return "https://www.facebook.com/{$this->graphVersion}/dialog/oauth?{$params}";
    }

    /**
     * Exchange short-lived auth code for long-lived user access token.
     *
     * @return array{access_token: string, expires_in?: int}
     *
     * @throws Exception
     */
    public function exchangeCodeForUserToken(string $code): array
    {
        // 1. Exchange code for short-lived token
        $response = Http::get("{$this->baseUrl}/oauth/access_token", [
            'client_id' => $this->appId,
            'client_secret' => $this->appSecret,
            'redirect_uri' => $this->redirectUri,
            'code' => $code,
        ]);

        if (! $response->successful()) {
            $this->logError('exchangeCodeForUserToken failed', $response);
            throw new Exception($response->json('error.message', 'Failed to exchange authorization code for token.'));
        }

        $shortLivedToken = $response->json('access_token');

        // 2. Exchange short-lived token for long-lived (60 days) token
        $longLivedResponse = Http::get("{$this->baseUrl}/oauth/access_token", [
            'grant_type' => 'fb_exchange_token',
            'client_id' => $this->appId,
            'client_secret' => $this->appSecret,
            'fb_exchange_token' => $shortLivedToken,
        ]);

        if ($longLivedResponse->successful() && $longLivedResponse->json('access_token')) {
            return [
                'access_token' => $longLivedResponse->json('access_token'),
                'expires_in' => $longLivedResponse->json('expires_in', 5184000),
            ];
        }

        return [
            'access_token' => $shortLivedToken,
            'expires_in' => $response->json('expires_in', 7200),
        ];
    }

    /**
     * Retrieve all managed Facebook Pages with permanent Page Access Tokens.
     *
     * @return array<int, array<string, mixed>>
     *
     * @throws Exception
     */
    public function getUserAccounts(string $userAccessToken): array
    {
        $fields = 'id,name,category,access_token,tasks,picture{url},cover,fan_count,followers_count,phone,emails,website,about,hours,link';
        $response = Http::get("{$this->baseUrl}/me/accounts", [
            'access_token' => $userAccessToken,
            'fields' => $fields,
            'limit' => 100,
        ]);

        if (! $response->successful()) {
            // Fallback to essential page fields if some optional fields are restricted
            $fallbackFields = 'id,name,category,access_token,tasks,picture{url},fan_count,followers_count,link';
            $fallbackResponse = Http::get("{$this->baseUrl}/me/accounts", [
                'access_token' => $userAccessToken,
                'fields' => $fallbackFields,
                'limit' => 100,
            ]);

            if ($fallbackResponse->successful()) {
                return $fallbackResponse->json('data', []);
            }

            $this->logError('getUserAccounts failed', $response);
            throw new Exception($response->json('error.message', 'Failed to retrieve Facebook Pages.'));
        }

        return $response->json('data', []);
    }

    /**
     * Retrieve complete details of a specific Facebook Page.
     *
     * @return array<string, mixed>
     *
     * @throws Exception
     */
    public function getPageDetails(string $pageId, string $pageAccessToken): array
    {
        // Fetch rich page fields; omit deprecated fields like single_line_address in Graph API v21.0
        $fields = 'id,name,about,description,category,phone,emails,website,hours,cover,picture{url},fan_count,followers_count,link';
        $response = Http::get("{$this->baseUrl}/{$pageId}", [
            'access_token' => $pageAccessToken,
            'fields' => $fields,
        ]);

        if (! $response->successful()) {
            // Resilient fallback for pages with restricted or missing optional fields
            $fallbackFields = 'id,name,category,link,picture{url}';
            $fallbackResponse = Http::get("{$this->baseUrl}/{$pageId}", [
                'access_token' => $pageAccessToken,
                'fields' => $fallbackFields,
            ]);

            if ($fallbackResponse->successful()) {
                return $fallbackResponse->json();
            }

            $this->logError("getPageDetails failed for page {$pageId}", $response);
            throw new Exception($response->json('error.message', 'Failed to fetch page details.'));
        }

        return $response->json();
    }

    /**
     * Update page profile fields (about, description, phone, emails, website, hours).
     *
     * @param  array<string, mixed>  $fields
     * @return array<string, mixed>
     *
     * @throws Exception
     */
    public function updatePageDetails(string $pageId, string $pageAccessToken, array $fields): array
    {
        $payload = array_filter($fields, fn ($v) => ! is_null($v));

        if (isset($payload['hours']) && is_array($payload['hours'])) {
            $payload['hours'] = json_encode($payload['hours']);
        }

        $response = Http::asForm()->post("{$this->baseUrl}/{$pageId}", array_merge($payload, [
            'access_token' => $pageAccessToken,
        ]));

        if (! $response->successful()) {
            $this->logError("updatePageDetails failed for page {$pageId}", $response);
            throw new Exception($response->json('error.message', 'Failed to update page information.'));
        }

        return $response->json();
    }

    /**
     * Retrieve feed of posts published on the page.
     *
     * @return array{data: array<int, array<string, mixed>>, paging?: array<string, mixed>}
     *
     * @throws Exception
     */
    public function getPagePosts(string $pageId, string $pageAccessToken, int $limit = 25, ?string $after = null): array
    {
        $fields = 'id,message,created_time,full_picture,permalink_url,shares,status_type,is_published,scheduled_publish_time,likes.summary(true),comments.summary(true)';

        $params = [
            'access_token' => $pageAccessToken,
            'fields' => $fields,
            'limit' => $limit,
        ];

        if ($after) {
            $params['after'] = $after;
        }

        $response = Http::get("{$this->baseUrl}/{$pageId}/posts", $params);

        if (! $response->successful()) {
            $this->logError("getPagePosts failed for page {$pageId}", $response);
            throw new Exception($response->json('error.message', 'Failed to retrieve page posts.'));
        }

        return $response->json();
    }

    /**
     * Create and publish (or schedule) a new post.
     *
     * @param  array{
     *     message?: string,
     *     link?: string,
     *     photo_url?: string,
     *     photo_file?: string,
     *     published?: bool,
     *     scheduled_publish_time?: int
     * }  $data
     * @return array<string, mixed>
     *
     * @throws Exception
     */
    public function createPost(string $pageId, string $pageAccessToken, array $data): array
    {
        $published = $data['published'] ?? true;
        $scheduledTime = $data['scheduled_publish_time'] ?? null;

        // Photo Post
        if (! empty($data['photo_url']) || ! empty($data['photo_file'])) {
            $photoPayload = [
                'access_token' => $pageAccessToken,
                'caption' => $data['message'] ?? '',
                'published' => $published ? 'true' : 'false',
            ];

            if (! $published && $scheduledTime) {
                $photoPayload['scheduled_publish_time'] = (int) $scheduledTime;
            }

            if (! empty($data['photo_url'])) {
                $photoPayload['url'] = $data['photo_url'];
                $response = Http::asForm()->post("{$this->baseUrl}/{$pageId}/photos", $photoPayload);
            } else {
                // Attach local file
                $filePath = $data['photo_file'];
                $response = Http::attach(
                    'source',
                    file_get_contents($filePath),
                    basename($filePath)
                )->post("{$this->baseUrl}/{$pageId}/photos", $photoPayload);
            }

            if (! $response->successful()) {
                $this->logError("createPost (photo) failed for page {$pageId}", $response);
                throw new Exception($response->json('error.message', 'Failed to create photo post.'));
            }

            return $response->json();
        }

        // Standard Text / Link Post
        $feedPayload = [
            'access_token' => $pageAccessToken,
            'message' => $data['message'] ?? '',
            'published' => $published ? 'true' : 'false',
        ];

        if (! empty($data['link'])) {
            $feedPayload['link'] = $data['link'];
        }

        if (! $published && $scheduledTime) {
            $feedPayload['scheduled_publish_time'] = (int) $scheduledTime;
        }

        $response = Http::asForm()->post("{$this->baseUrl}/{$pageId}/feed", $feedPayload);

        if (! $response->successful()) {
            $this->logError("createPost (feed) failed for page {$pageId}", $response);
            throw new Exception($response->json('error.message', 'Failed to publish post.'));
        }

        return $response->json();
    }

    /**
     * Edit message of an existing post.
     *
     * @return array<string, mixed>
     *
     * @throws Exception
     */
    public function updatePost(string $postId, string $pageAccessToken, string $message): array
    {
        $response = Http::asForm()->post("{$this->baseUrl}/{$postId}", [
            'access_token' => $pageAccessToken,
            'message' => $message,
        ]);

        if (! $response->successful()) {
            $this->logError("updatePost failed for post {$postId}", $response);
            throw new Exception($response->json('error.message', 'Failed to update post.'));
        }

        return $response->json();
    }

    /**
     * Delete a post from the page.
     *
     * @throws Exception
     */
    public function deletePost(string $postId, string $pageAccessToken): bool
    {
        $response = Http::delete("{$this->baseUrl}/{$postId}", [
            'access_token' => $pageAccessToken,
        ]);

        if (! $response->successful()) {
            $this->logError("deletePost failed for post {$postId}", $response);
            throw new Exception($response->json('error.message', 'Failed to delete post.'));
        }

        return (bool) $response->json('success', true);
    }

    /**
     * Retrieve comments for a specific post.
     *
     * @return array<int, array<string, mixed>>
     *
     * @throws Exception
     */
    public function getPostComments(string $postId, string $pageAccessToken, int $limit = 50): array
    {
        $fields = 'id,from{id,name,picture},message,created_time,like_count,comment_count,attachment,is_hidden,comments{id,from{id,name,picture},message,created_time,like_count}';

        $response = Http::get("{$this->baseUrl}/{$postId}/comments", [
            'access_token' => $pageAccessToken,
            'fields' => $fields,
            'limit' => $limit,
            'order' => 'reverse_chronological',
        ]);

        if (! $response->successful()) {
            $this->logError("getPostComments failed for post {$postId}", $response);
            throw new Exception($response->json('error.message', 'Failed to fetch post comments.'));
        }

        return $response->json('data', []);
    }

    /**
     * Reply to a comment on a post.
     *
     * @return array<string, mixed>
     *
     * @throws Exception
     */
    public function replyToComment(string $commentId, string $pageAccessToken, string $message): array
    {
        $response = Http::asForm()->post("{$this->baseUrl}/{$commentId}/comments", [
            'access_token' => $pageAccessToken,
            'message' => $message,
        ]);

        if (! $response->successful()) {
            $this->logError("replyToComment failed for comment {$commentId}", $response);
            throw new Exception($response->json('error.message', 'Failed to reply to comment.'));
        }

        return $response->json();
    }

    /**
     * Hide or unhide a comment (for moderation of spam/abuse).
     *
     * @throws Exception
     */
    public function hideComment(string $commentId, string $pageAccessToken, bool $hide = true): bool
    {
        $response = Http::asForm()->post("{$this->baseUrl}/{$commentId}", [
            'access_token' => $pageAccessToken,
            'is_hidden' => $hide ? 'true' : 'false',
        ]);

        if (! $response->successful()) {
            $this->logError("hideComment failed for comment {$commentId}", $response);
            throw new Exception($response->json('error.message', 'Failed to change comment visibility.'));
        }

        return (bool) $response->json('success', true);
    }

    /**
     * Delete a comment permanently.
     *
     * @throws Exception
     */
    public function deleteComment(string $commentId, string $pageAccessToken): bool
    {
        $response = Http::delete("{$this->baseUrl}/{$commentId}", [
            'access_token' => $pageAccessToken,
        ]);

        if (! $response->successful()) {
            $this->logError("deleteComment failed for comment {$commentId}", $response);
            throw new Exception($response->json('error.message', 'Failed to delete comment.'));
        }

        return (bool) $response->json('success', true);
    }

    /**
     * Like a comment as the page.
     *
     * @throws Exception
     */
    public function likeComment(string $commentId, string $pageAccessToken): bool
    {
        $response = Http::asForm()->post("{$this->baseUrl}/{$commentId}/likes", [
            'access_token' => $pageAccessToken,
        ]);

        if (! $response->successful()) {
            $this->logError("likeComment failed for comment {$commentId}", $response);
            throw new Exception($response->json('error.message', 'Failed to like comment.'));
        }

        return (bool) $response->json('success', true);
    }

    /**
     * Retrieve list of Messenger conversations for the page.
     *
     * @return array<int, array<string, mixed>>
     *
     * @throws Exception
     */
    public function getPageConversations(string $pageId, string $pageAccessToken, int $limit = 20): array
    {
        $fields = 'id,updated_time,snippet,unread_count,senders{id,name,email}';

        $response = Http::get("{$this->baseUrl}/{$pageId}/conversations", [
            'access_token' => $pageAccessToken,
            'fields' => $fields,
            'limit' => $limit,
        ]);

        if (! $response->successful()) {
            $this->logError("getPageConversations failed for page {$pageId}", $response);
            throw new Exception($response->json('error.message', 'Failed to retrieve Messenger conversations.'));
        }

        return $response->json('data', []);
    }

    /**
     * Retrieve messages within a Messenger conversation thread.
     *
     * @return array<int, array<string, mixed>>
     *
     * @throws Exception
     */
    public function getConversationMessages(string $conversationId, string $pageAccessToken, int $limit = 40): array
    {
        $fields = 'id,created_time,from{id,name,email},to{data},message,attachments{mime_type,name,size,image_data}';

        $response = Http::get("{$this->baseUrl}/{$conversationId}/messages", [
            'access_token' => $pageAccessToken,
            'fields' => $fields,
            'limit' => $limit,
        ]);

        if (! $response->successful()) {
            $this->logError("getConversationMessages failed for conversation {$conversationId}", $response);
            throw new Exception($response->json('error.message', 'Failed to retrieve thread messages.'));
        }

        return $response->json('data', []);
    }

    /**
     * Send a direct message to a user via Facebook Messenger.
     *
     * @return array<string, mixed>
     *
     * @throws Exception
     */
    public function sendMessage(string $pageId, string $pageAccessToken, string $recipientId, string $text): array
    {
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post("{$this->baseUrl}/{$pageId}/messages?access_token={$pageAccessToken}", [
            'recipient' => ['id' => $recipientId],
            'message' => ['text' => $text],
        ]);

        if (! $response->successful()) {
            $this->logError("sendMessage failed for page {$pageId} to recipient {$recipientId}", $response);
            throw new Exception($response->json('error.message', 'Failed to send direct message.'));
        }

        return $response->json();
    }

    /**
     * Retrieve basic insights / metrics for the page.
     *
     * @return array<int, array<string, mixed>>
     *
     * @throws Exception
     */
    public function getPageInsights(string $pageId, string $pageAccessToken, string $period = 'day'): array
    {
        $metrics = 'page_impressions,page_post_engagements,page_fans,page_views_total';

        $response = Http::get("{$this->baseUrl}/{$pageId}/insights", [
            'access_token' => $pageAccessToken,
            'metric' => $metrics,
            'period' => $period,
        ]);

        if (! $response->successful()) {
            $this->logError("getPageInsights failed for page {$pageId}", $response);

            return [];
        }

        return $response->json('data', []);
    }

    /**
     * Centralized error logger.
     */
    protected function logError(string $context, Response $response): void
    {
        Log::warning("FacebookApiService [{$context}]: HTTP {$response->status()} - {$response->body()}");
    }
}
