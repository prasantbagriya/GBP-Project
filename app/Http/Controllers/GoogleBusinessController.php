<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Google\Client;
use Google\Service\Oauth2;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;

class GoogleBusinessController extends Controller
{
    protected Client $client;

    public function __construct()
    {
        $this->client = new Client;
        $clientId = config('services.google.client_id') ?: env('GOOGLE_CLIENT_ID');
        $clientSecret = config('services.google.client_secret') ?: env('GOOGLE_CLIENT_SECRET');
        $this->client->setClientId($clientId);
        $this->client->setClientSecret($clientSecret);
        $redirectUri = config('services.google.redirect_uri') ?: (env('GOOGLE_REDIRECT_URI') ?: rtrim(config('app.url') ?: env('APP_URL', 'http://localhost:8000'), '/').'/auth/callback');
        $this->client->setRedirectUri($redirectUri);
        $this->client->addScope([
            'https://www.googleapis.com/auth/business.manage',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/spreadsheets',
        ]);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    /**
     * Store Google OAuth token permanently (in Session, persistent Cache, and storage file).
     */
    protected function storePersistentToken(array $token): void
    {
        Session::put('google_token', $token);
        Session::save();

        try {
            Cache::forever('gbp_persistent_google_token', $token);
        } catch (\Throwable $e) {
            Log::warning('Failed to write gbp_persistent_google_token to cache: '.$e->getMessage());
        }

        try {
            $dir = storage_path('app');
            if (! is_dir($dir)) {
                @mkdir($dir, 0755, true);
            }
            file_put_contents(storage_path('app/google_token.json'), json_encode($token, JSON_PRETTY_PRINT));
        } catch (\Throwable $e) {
            Log::warning('Failed to write persistent google_token.json: '.$e->getMessage());
        }
    }

    /**
     * Retrieve the stored Google OAuth token from Session, Cache, or persistent storage file.
     */
    public function getPersistentToken(): ?array
    {
        // 1. Check Session
        if (Session::has('google_token')) {
            $token = Session::get('google_token');
            if (is_array($token) && ! empty($token['access_token'])) {
                return $token;
            }
        }

        // 2. Check Cache
        try {
            $cachedToken = Cache::get('gbp_persistent_google_token');
            if (is_array($cachedToken) && ! empty($cachedToken['access_token'])) {
                Session::put('google_token', $cachedToken);
                Session::save();

                return $cachedToken;
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to read gbp_persistent_google_token from cache: '.$e->getMessage());
        }

        // 3. Check persistent storage file on disk
        $filePath = storage_path('app/google_token.json');
        if (file_exists($filePath)) {
            try {
                $content = file_get_contents($filePath);
                $fileToken = json_decode($content, true);
                if (is_array($fileToken) && ! empty($fileToken['access_token'])) {
                    Session::put('google_token', $fileToken);
                    Session::save();
                    try {
                        Cache::forever('gbp_persistent_google_token', $fileToken);
                    } catch (\Throwable $e) {
                        Log::debug('Fallback: failed to cache gbp_persistent_google_token: '.$e->getMessage());
                    }

                    return $fileToken;
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to read persistent google_token.json: '.$e->getMessage());
            }
        }

        return null;
    }

    /**
     * Save GBP non-review data persistently to Cache and server disk.
     */
    public function saveServerData(string $key, $data): void
    {
        try {
            Cache::forever($key, $data);
        } catch (\Throwable $e) {
            Log::warning("Failed to save {$key} to cache: ".$e->getMessage());
        }

        try {
            $dir = storage_path('app/gbp_data');
            if (! is_dir($dir)) {
                @mkdir($dir, 0755, true);
            }
            file_put_contents($dir.'/'.md5($key).'.json', json_encode($data, JSON_PRETTY_PRINT));
        } catch (\Throwable $e) {
            Log::warning("Failed to save {$key} to server disk: ".$e->getMessage());
        }
    }

    /**
     * Retrieve GBP non-review data from persistent Cache or server disk.
     */
    public function getServerData(string $key)
    {
        try {
            $cached = Cache::get($key);
            if ($cached !== null) {
                return $cached;
            }
        } catch (\Throwable $e) {
            Log::warning("Failed to read {$key} from cache: ".$e->getMessage());
        }

        $filePath = storage_path('app/gbp_data/'.md5($key).'.json');
        if (file_exists($filePath)) {
            try {
                $content = file_get_contents($filePath);
                $data = json_decode($content, true);
                if ($data !== null) {
                    try {
                        Cache::forever($key, $data);
                    } catch (\Throwable $e) {
                        Log::debug("Fallback: failed to set cache for {$key}: ".$e->getMessage());
                    }

                    return $data;
                }
            } catch (\Throwable $e) {
                Log::warning("Failed to read {$key} from server disk: ".$e->getMessage());
            }
        }

        return null;
    }

    /**
     * Clear persistent server data for a key.
     */
    public function clearServerData(string $key): void
    {
        try {
            Cache::forget($key);
        } catch (\Throwable $e) {
            Log::debug("Fallback: failed to forget cache for {$key}: ".$e->getMessage());
        }
        $filePath = storage_path('app/gbp_data/'.md5($key).'.json');
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }

    /**
     * Get a valid Google access token, automatically refreshing using refresh_token if expired.
     */
    protected function getValidAccessToken(): ?string
    {
        $token = $this->getPersistentToken();
        if (! $token || empty($token['access_token'])) {
            return null;
        }

        try {
            $this->client->setAccessToken($token);

            if ($this->client->isAccessTokenExpired()) {
                $refreshToken = $token['refresh_token'] ?? $this->client->getRefreshToken();
                if ($refreshToken) {
                    $newToken = $this->client->fetchAccessTokenWithRefreshToken($refreshToken);
                    if (! isset($newToken['error'])) {
                        if (! isset($newToken['refresh_token'])) {
                            $newToken['refresh_token'] = $refreshToken;
                        }
                        if (isset($token['user_email'])) {
                            $newToken['user_email'] = $token['user_email'];
                        }
                        $this->storePersistentToken($newToken);
                        $token = $newToken;
                    }
                }
            }

            return $this->client->getAccessToken()['access_token'] ?? $token['access_token'];
        } catch (\Throwable $e) {
            Log::warning('Google token refresh failed: '.$e->getMessage());

            return $token['access_token'] ?? null;
        }
    }

    /**
     * Resolve v4 resource name: accounts/{accountId}/locations/{locationId}
     */
    protected function resolveLocationV4Name(?string $locationName): ?string
    {
        if (empty($locationName)) {
            return null;
        }

        // 1. If already a full v4 resource name: accounts/{accountId}/locations/{locationId}
        if (str_starts_with($locationName, 'accounts/') && str_contains($locationName, '/locations/')) {
            return $locationName;
        }

        // 2. Check Session map
        $map = Session::get('location_v4_map', []);
        if (isset($map[$locationName]) && ! empty($map[$locationName])) {
            return $map[$locationName];
        }

        // 3. Check persistent server-side cached locations
        try {
            $token = $this->getPersistentToken() ?? [];
            $accountKey = 'gbp_locations_'.md5($token['user_email'] ?? 'default');
            $cachedLocs = $this->getServerData($accountKey);
            if (is_array($cachedLocs)) {
                foreach ($cachedLocs as $cloc) {
                    if ((($cloc['name'] ?? '') === $locationName || ($cloc['id'] ?? '') === $locationName) && ! empty($cloc['v4Name'])) {
                        $map[$locationName] = $cloc['v4Name'];
                        Session::put('location_v4_map', $map);
                        Session::save();

                        return $cloc['v4Name'];
                    }
                }
            }
        } catch (\Throwable $e) {
        }

        // 4. Fallback: Query Google API accounts and find matching location across accounts
        $accessToken = $this->getValidAccessToken();
        if ($accessToken) {
            try {
                $res = Http::withToken($accessToken)
                    ->get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts');
                $accounts = $res->json('accounts', []);
                foreach ($accounts as $account) {
                    $accName = $account['name'];
                    $locRes = Http::withToken($accessToken)
                        ->get("https://mybusinessbusinessinformation.googleapis.com/v1/{$accName}/locations", [
                            'readMask' => 'name',
                            'pageSize' => 100,
                        ]);
                    if ($locRes->successful()) {
                        foreach ($locRes->json('locations', []) as $l) {
                            if (($l['name'] ?? '') === $locationName) {
                                $v4Name = "{$accName}/{$locationName}";
                                $map[$locationName] = $v4Name;
                                Session::put('location_v4_map', $map);
                                Session::save();

                                return $v4Name;
                            }
                        }
                    }
                }

                if (! empty($accounts)) {
                    $firstAccount = $accounts[0]['name'];
                    $v4Name = "{$firstAccount}/{$locationName}";
                    $map[$locationName] = $v4Name;
                    Session::put('location_v4_map', $map);
                    Session::save();

                    return $v4Name;
                }
            } catch (\Throwable $e) {
                Log::warning('resolveLocationV4Name failed to query Google: '.$e->getMessage());
            }
        }

        return $locationName;
    }

    /**
     * Resolve v1 resource name: locations/{locationId}
     */
    protected function resolveLocationV1Name(?string $locationName): ?string
    {
        if (empty($locationName)) {
            return null;
        }

        if (str_starts_with($locationName, 'accounts/') && str_contains($locationName, '/locations/')) {
            $parts = explode('/locations/', $locationName);

            return 'locations/'.($parts[1] ?? '');
        }

        return $locationName;
    }

    public function getAuthUrl()
    {
        try {
            if (! $this->client->getClientId()) {
                return response()->json(['error' => 'Google Client ID is not configured in .env'], 500);
            }

            return response()->json(['url' => $this->client->createAuthUrl()]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function handleCallback(Request $request)
    {
        if ($request->has('code')) {
            $token = $this->client->fetchAccessTokenWithAuthCode($request->code);
            if (isset($token['access_token'])) {
                try {
                    $oauth2 = new Oauth2($this->client);
                    $userInfo = $oauth2->userinfo->get();
                    if ($userInfo && $userInfo->email) {
                        $token['user_email'] = $userInfo->email;
                    }
                } catch (\Throwable $ex) {
                }
            }

            $this->storePersistentToken($token);

            return response(
                "<html><body><script>
                    if (window.opener) {
                        window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                        window.close();
                    } else {
                        window.location.href = '/';
                    }
                </script><p>Authentication successful. You can close this window.</p></body></html>"
            );
        }

        return response('Failed', 400);
    }

    public function exchangeCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        try {
            $this->client->setRedirectUri('postmessage');
            $token = $this->client->fetchAccessTokenWithAuthCode($request->code);

            if (isset($token['error'])) {
                return response()->json([
                    'error' => $token['error_description'] ?? $token['error'],
                ], 400);
            }

            if (isset($token['access_token'])) {
                try {
                    $oauth2 = new Oauth2($this->client);
                    $userInfo = $oauth2->userinfo->get();
                    if ($userInfo && $userInfo->email) {
                        $token['user_email'] = $userInfo->email;
                    }
                } catch (\Throwable $ex) {
                }
            }

            $this->storePersistentToken($token);

            return response()->json([
                'success' => true,
                'userEmail' => $token['user_email'] ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function status()
    {
        $accessToken = $this->getValidAccessToken();
        $isAuthenticated = ! empty($accessToken);
        $userEmail = null;

        if ($isAuthenticated) {
            $token = $this->getPersistentToken();
            $userEmail = $token['user_email'] ?? null;
        }

        $googleClientId = config('services.google.client_id') ?: env('GOOGLE_CLIENT_ID');

        return response()->json([
            'isAuthenticated' => $isAuthenticated,
            'userEmail' => $userEmail,
            'hasGoogleCredentials' => ! empty($googleClientId),
            'clientId' => $googleClientId,
        ]);
    }

    public function logout()
    {
        Session::forget('google_token');
        Session::forget('location_v4_map');
        Session::forget('store_hours');
        try {
            Cache::forget('gbp_persistent_google_token');
        } catch (\Throwable $e) {
            Log::warning('Failed to remove gbp_persistent_google_token from cache on logout: '.$e->getMessage());
        }

        $filePath = storage_path('app/google_token.json');
        if (file_exists($filePath)) {
            @unlink($filePath);
        }

        Session::save();

        return response()->json(['success' => true]);
    }

    /**
     * Get locations from server cache or Google Business Information API
     */
    public function getLocations(?Request $request = null)
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json([
                'locations' => [],
                'authenticated' => false,
                'message' => 'Not authenticated with Google. Please connect your Google account.',
            ]);
        }

        $token = $this->getPersistentToken() ?? [];
        $accountKey = 'gbp_locations_'.md5($token['user_email'] ?? 'default');
        $forceRefresh = $request ? $request->boolean('refresh', false) : false;

        // Serve persistently cached data from server unless user explicitly requests refresh
        if (! $forceRefresh) {
            $cached = $this->getServerData($accountKey);
            if (is_array($cached) && ! empty($cached)) {
                $v4Map = Session::get('location_v4_map', []);
                foreach ($cached as $loc) {
                    if (! empty($loc['name']) && ! empty($loc['v4Name'])) {
                        $v4Map[$loc['name']] = $loc['v4Name'];
                    }
                }
                Session::put('location_v4_map', $v4Map);
                Session::save();

                return response()->json([
                    'locations' => $cached,
                    'cached' => true,
                ]);
            }
        }

        try {
            $accountsRes = Http::timeout(15)->connectTimeout(5)->withToken($accessToken)
                ->get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts');

            if ($accountsRes->failed()) {
                Log::warning('Google accounts fetch failed: '.$accountsRes->body());

                return response()->json([
                    'locations' => [],
                    'error' => $accountsRes->json('error.message', 'Failed to fetch accounts from Google'),
                ], $accountsRes->status());
            }

            $accounts = $accountsRes->json('accounts', []);
            $allLocations = [];
            $v4Map = Session::get('location_v4_map', []);

            foreach ($accounts as $account) {
                $accountName = $account['name'];
                $locRes = Http::timeout(15)->connectTimeout(5)->withToken($accessToken)
                    ->get("https://mybusinessbusinessinformation.googleapis.com/v1/{$accountName}/locations", [
                        'readMask' => 'name,title,storeCode,categories,storefrontAddress,phoneNumbers,regularHours,websiteUri,metadata,serviceItems',
                        'pageSize' => 100,
                    ]);

                if ($locRes->successful()) {
                    $locations = $locRes->json('locations', []);
                    foreach ($locations as $loc) {
                        $locName = $loc['name']; // e.g. locations/12345
                        $v4Name = "{$accountName}/{$locName}"; // accounts/987/locations/12345
                        $v4Map[$locName] = $v4Name;

                        // Build clean formatted address
                        $sf = $loc['storefrontAddress'] ?? [];
                        $addrLines = implode(', ', array_filter($sf['addressLines'] ?? []));
                        $locality = $sf['locality'] ?? '';
                        $adminArea = $sf['administrativeArea'] ?? '';
                        $postalCode = $sf['postalCode'] ?? '';
                        $addressParts = array_filter([$addrLines, $locality, $adminArea, $postalCode]);
                        $formattedAddress = implode(', ', $addressParts);

                        $allLocations[] = [
                            'name' => $locName,
                            'v4Name' => $v4Name,
                            'title' => $loc['title'] ?? 'Google Business Profile',
                            'storeCode' => $loc['storeCode'] ?? null,
                            'address' => $formattedAddress ?: ($addrLines ?: null),
                            'storefrontAddress' => $sf,
                            'primaryCategory' => $loc['categories']['primaryCategory']['displayName'] ?? null,
                            'categories' => $loc['categories'] ?? null,
                            'phone' => $loc['phoneNumbers']['primaryPhone'] ?? null,
                            'phoneNumbers' => $loc['phoneNumbers'] ?? null,
                            'regularHours' => $loc['regularHours'] ?? null,
                            'websiteUri' => $loc['websiteUri'] ?? null,
                            'metadata' => $loc['metadata'] ?? null,
                        ];
                    }
                }
            }

            Session::put('location_v4_map', $v4Map);
            Session::save();

            // Save non-review location data on server permanently
            $this->saveServerData($accountKey, $allLocations);

            return response()->json([
                'locations' => $allLocations,
                'cached' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching Google locations: '.$e->getMessage());

            return response()->json(['locations' => [], 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get live customer reviews directly from Google Business Profile API v4
     */
    public function getReviews(Request $request)
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json([
                'reviews' => [],
                'authenticated' => false,
                'message' => 'Not authenticated with Google.',
            ]);
        }

        $locationParam = $request->query('locationName');
        $v4Name = $this->resolveLocationV4Name($locationParam);

        if (! $v4Name) {
            return response()->json(['reviews' => []]);
        }

        $forceRefresh = $request->boolean('refresh', false);
        $locKey = 'gbp_reviews_'.md5($locationParam);

        // Serve cached reviews immediately (<50ms) unless user explicitly requests refresh
        if (! $forceRefresh) {
            $cached = $this->getServerData($locKey) ?? ($v4Name ? $this->getServerData('gbp_reviews_'.md5($v4Name)) : null);
            if (is_array($cached) && ! empty($cached['reviews'])) {
                return response()->json([
                    'reviews' => $cached['reviews'],
                    'averageRating' => $cached['averageRating'] ?? null,
                    'totalReviewCount' => $cached['totalReviewCount'] ?? count($cached['reviews']),
                    'cached' => true,
                    'allTime' => true,
                ]);
            }
        }

        try {
            $cached = $this->getServerData($locKey) ?? ($v4Name ? $this->getServerData('gbp_reviews_'.md5($v4Name)) : null);
            $existingReviews = (is_array($cached) && ! empty($cached['reviews'])) ? $cached['reviews'] : [];

            $allRawReviews = [];
            $pageToken = null;
            $googleTotalCount = null;
            $googleAvgRating = null;
            // On refresh with existing reviews, 2 pages (100 reviews) is plenty to get fresh reviews in <1s
            $maxPages = empty($existingReviews) ? 5 : 2;
            $page = 0;

            do {
                $params = ['pageSize' => 50];
                if ($pageToken) {
                    $params['pageToken'] = $pageToken;
                }

                $response = Http::timeout(12)->connectTimeout(5)->withToken($accessToken)
                    ->get("https://mybusiness.googleapis.com/v4/{$v4Name}/reviews", $params);

                if (! $response->successful()) {
                    if ($page === 0) {
                        Log::warning('Google reviews API response: '.$response->body());

                        return response()->json([
                            'reviews' => [],
                            'error' => $response->json('error.message', 'Could not load reviews from Google'),
                        ]);
                    }
                    break;
                }

                $pageReviews = $response->json('reviews', []);
                if (! empty($pageReviews)) {
                    $allRawReviews = array_merge($allRawReviews, $pageReviews);
                }

                if ($googleTotalCount === null && $response->json('totalReviewCount') !== null) {
                    $googleTotalCount = (int) $response->json('totalReviewCount');
                }
                if ($googleAvgRating === null && $response->json('averageRating') !== null) {
                    $googleAvgRating = (float) $response->json('averageRating');
                }

                $pageToken = $response->json('nextPageToken');
                $page++;
            } while (! empty($pageToken) && $page < $maxPages);

            $reviews = [];
            foreach ($allRawReviews as $r) {
                $reviewId = $r['reviewId'] ?? (basename($r['name'] ?? ''));
                $reviews[] = [
                    'reviewId' => $reviewId,
                    'name' => $r['name'] ?? "{$v4Name}/reviews/{$reviewId}",
                    'reviewer' => [
                        'displayName' => $r['reviewer']['displayName'] ?? 'Google User',
                        'profilePhotoUrl' => $r['reviewer']['profilePhotoUrl'] ?? null,
                    ],
                    'starRating' => $r['starRating'] ?? 'FIVE',
                    'comment' => $r['comment'] ?? '',
                    'createTime' => $r['createTime'] ?? now()->toIso8601String(),
                    'updateTime' => $r['updateTime'] ?? null,
                    'reviewReply' => ! empty($r['reviewReply']) ? [
                        'comment' => $r['reviewReply']['comment'] ?? '',
                        'updateTime' => $r['reviewReply']['updateTime'] ?? now()->toIso8601String(),
                    ] : null,
                ];
            }

            // Merge with existing reviews so historical records are not discarded
            if (! empty($existingReviews)) {
                $existingById = [];
                foreach ($existingReviews as $ex) {
                    if (! empty($ex['reviewId'])) {
                        $existingById[$ex['reviewId']] = $ex;
                    }
                }
                $merged = $reviews;
                foreach ($merged as $m) {
                    unset($existingById[$m['reviewId']]);
                }
                $reviews = array_merge($merged, array_values($existingById));
            }

            $cachePayload = [
                'reviews' => $reviews,
                'averageRating' => $googleAvgRating ?? ($cached['averageRating'] ?? null),
                'totalReviewCount' => $googleTotalCount ?? ($cached['totalReviewCount'] ?? count($reviews)),
                'savedAt' => now()->toIso8601String(),
            ];
            $this->saveServerData($locKey, $cachePayload);
            if (! empty($v4Name)) {
                $this->saveServerData('gbp_reviews_'.md5($v4Name), $cachePayload);
            }

            return response()->json([
                'reviews' => $reviews,
                'averageRating' => $cachePayload['averageRating'],
                'totalReviewCount' => $cachePayload['totalReviewCount'],
                'allTime' => true,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching Google reviews: '.$e->getMessage());

            return response()->json(['reviews' => [], 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Publish a review reply directly to Google Business Profile and update server cache
     */
    public function publishReviewReplyDirect(
        string $reviewName,
        string $comment,
        ?string $locationParam = null,
        ?string $reviewId = null,
        ?string $accessToken = null
    ): array {
        $token = $accessToken ?: $this->getValidAccessToken();
        if (! $token) {
            return ['success' => false, 'error' => 'Not authenticated with Google'];
        }

        $cleanReviewName = ltrim($reviewName, '/');
        if (! str_starts_with($cleanReviewName, 'accounts/')) {
            if ($locationParam) {
                $v4Location = $this->resolveLocationV4Name($locationParam);
                if ($v4Location) {
                    if (! str_contains($cleanReviewName, '/')) {
                        $cleanReviewName = "{$v4Location}/reviews/{$cleanReviewName}";
                    } elseif (str_starts_with($cleanReviewName, 'locations/')) {
                        $parts = explode('/reviews/', $cleanReviewName, 2);
                        if (isset($parts[1])) {
                            $cleanReviewName = "{$v4Location}/reviews/{$parts[1]}";
                        }
                    }
                }
            }
        }

        Log::info('Attempting to reply to review', ['reviewName' => $cleanReviewName]);

        try {
            $response = Http::timeout(15)->connectTimeout(5)->withToken($token)
                ->put("https://mybusiness.googleapis.com/v4/{$cleanReviewName}/reply", [
                    'comment' => $comment,
                ]);

            if ($response->successful()) {
                $reviewReply = $response->json();
                $actualReviewId = $reviewId ?: basename($cleanReviewName);
                $this->updateCachedReviewReply($locationParam, $actualReviewId, $reviewReply);

                return [
                    'success' => true,
                    'reviewReply' => $reviewReply,
                ];
            }

            Log::warning('Reply to review failed', [
                'reviewName' => $cleanReviewName,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => false,
                'status' => $response->status(),
                'error' => $response->json('error.message', 'Failed to publish reply to Google'),
            ];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Post a reply to a Google review live on Google Business Profile
     */
    public function replyToReview(Request $request)
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json(['error' => 'Not authenticated with Google'], 401);
        }

        $reviewName = ltrim((string) ($request->input('reviewName') ?: $request->input('name') ?: $request->input('reviewId') ?: ''), '/');
        $comment = trim((string) $request->input('comment', ''));
        $reviewId = (string) ($request->input('reviewId') ?: '');
        $locationParam = $request->input('locationName');

        if (! $reviewName || ! $comment) {
            return response()->json(['error' => 'Review name and comment are required'], 422);
        }

        $result = $this->publishReviewReplyDirect($reviewName, $comment, $locationParam, $reviewId, $accessToken);

        if (! empty($result['success'])) {
            return response()->json([
                'success' => true,
                'reviewReply' => $result['reviewReply'] ?? [],
            ]);
        }

        $statusCode = $result['status'] ?? 500;
        if (($result['error'] ?? '') === 'Not authenticated with Google') {
            $statusCode = 401;
        }

        return response()->json([
            'error' => $result['error'] ?? 'Failed to publish reply to Google',
        ], $statusCode);
    }

    /**
     * Update a specific review's reply data in the server-side cache so
     * subsequent cached fetches reflect the reply without a full Google refresh.
     */
    protected function updateCachedReviewReply(?string $locationParam, string $reviewId, array $reviewReply): void
    {
        if (empty($locationParam) || empty($reviewId)) {
            return;
        }

        $keys = [
            'gbp_reviews_'.md5($locationParam),
        ];

        // Also try v4 name key
        $v4Name = $this->resolveLocationV4Name($locationParam);
        if ($v4Name && $v4Name !== $locationParam) {
            $keys[] = 'gbp_reviews_'.md5($v4Name);
        }

        foreach ($keys as $locKey) {
            try {
                $cached = $this->getServerData($locKey);
                if (is_array($cached) && ! empty($cached['reviews'])) {
                    $reviews = $cached['reviews'];
                    $updated = false;
                    foreach ($reviews as &$review) {
                        if (($review['reviewId'] ?? '') === $reviewId) {
                            if (empty($reviewReply) || empty($reviewReply['comment'])) {
                                $review['reviewReply'] = null;
                            } else {
                                $review['reviewReply'] = [
                                    'comment' => $reviewReply['comment'] ?? '',
                                    'updateTime' => $reviewReply['updateTime'] ?? now()->toIso8601String(),
                                ];
                            }
                            $updated = true;
                            break;
                        }
                    }
                    unset($review);

                    if ($updated) {
                        $cached['reviews'] = $reviews;
                        $this->saveServerData($locKey, $cached);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Failed to update cached review reply for key {$locKey}: ".$e->getMessage());
            }
        }
    }

    /**
     * Delete a reply from a review live on Google Business Profile
     */
    public function deleteReply(Request $request)
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }

        $reviewName = ltrim((string) ($request->input('reviewName') ?: ''), '/');
        if (! $reviewName) {
            return response()->json(['error' => 'Review name is required'], 422);
        }

        // Reconstruct full v4 path if needed
        if (! str_starts_with($reviewName, 'accounts/')) {
            $locationParam = $request->input('locationName');
            if ($locationParam) {
                $v4Location = $this->resolveLocationV4Name($locationParam);
                if ($v4Location) {
                    if (! str_contains($reviewName, '/')) {
                        $reviewName = "{$v4Location}/reviews/{$reviewName}";
                    } elseif (str_starts_with($reviewName, 'locations/')) {
                        $parts = explode('/reviews/', $reviewName, 2);
                        if (isset($parts[1])) {
                            $reviewName = "{$v4Location}/reviews/{$parts[1]}";
                        }
                    }
                }
            }
        }

        try {
            $response = Http::timeout(15)->connectTimeout(5)->withToken($accessToken)
                ->delete("https://mybusiness.googleapis.com/v4/{$reviewName}/reply");

            if ($response->successful()) {
                $locationParam = $request->input('locationName');
                $reviewId = (string) ($request->input('reviewId') ?: basename($reviewName));
                $this->updateCachedReviewReply($locationParam, $reviewId, []);
            }

            return response()->json(['success' => $response->successful()]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Core helper to generate AI reply text for a review based on rules
     */
    public function generateAiReplyText(
        array $reviewData,
        array $rules,
        string $businessName = 'our business',
        bool $enforceRules = true
    ): array {
        $comment = trim((string) ($reviewData['comment'] ?? ''));
        $reviewerName = trim((string) ($reviewData['reviewerName'] ?? 'Valued Customer'));
        $starRating = $reviewData['starRating'] ?? 'FIVE';
        $tone = $reviewData['tone'] ?? ($rules['tone'] ?? 'Warm & Courteous');
        $customInstructions = $reviewData['customInstructions'] ?? ($rules['customInstructions'] ?? '');
        $starNumber = $this->ratingStringToNumber($starRating);

        // Check star condition if enforcing auto-reply rules
        if ($enforceRules && $starNumber < ($rules['minStarRating'] ?? 1)) {
            return [
                'eligible' => false,
                'skipped' => true,
                'reply' => '',
                'reason' => "Rating {$starNumber}★ is below configured minimum threshold ({$rules['minStarRating']}★). Requires manual approval.",
            ];
        }

        // Check empty comment rule
        if ($enforceRules && empty($comment) && ! ($rules['replyToEmptyReviews'] ?? true)) {
            return [
                'eligible' => false,
                'skipped' => true,
                'reply' => '',
                'reason' => 'Configured to skip ratings without written comments.',
            ];
        }

        // Safe fallback text if AI is disabled or fails
        $isPositive = $starNumber >= 4;
        $fallback = $isPositive
            ? "Thank you so much {$reviewerName}! We truly appreciate your positive feedback and 5-star rating for {$businessName}. Your support inspires our entire team."
            : "Dear {$reviewerName}, thank you for bringing this to our attention. At {$businessName}, we are fully committed to continuous improvement. ".(
                ! empty($rules['contactPhone']) ? "Please connect with us directly at {$rules['contactPhone']} so we can address your concerns." : 'Please reach out to our management team directly so we can resolve this.'
            );

        // If Gemini AI is disabled globally AND rules are enforced
        if ($enforceRules && ! $this->isGeminiAiEnabled()) {
            return [
                'eligible' => true,
                'skipped' => false,
                'reply' => $fallback,
                'aiDisabled' => true,
                'fallback' => true,
                'starNumber' => $starNumber,
            ];
        }

        // Construct high-converting, non-toxic, personalized prompt
        $instructions = [
            "You are the official representative and owner of \"{$businessName}\".",
            'Write an authentic, polite, and hyper-personalized reply to this Google Business Profile review.',
            '',
            '--- REVIEW DETAILS ---',
            'Reviewer Name: '.($reviewerName ?: 'Valued Customer'),
            "Rating: {$starRating} ({$starNumber} out of 5 stars)",
            'Customer Comment: '.(! empty($comment) ? "\"{$comment}\"" : '(Rating only, no written text)'),
            '',
            '--- CORE RULES & VOICE ---',
            "1. TONE OF VOICE: {$tone}.",
            '2. ZERO TOXICITY GUARANTEE: Never be defensive, sarcastic, argumentative, or dismissive, even if the review is hostile, angry, or unfair. Strictly de-escalate with dignity and sincere respect.',
        ];

        if (! empty($rules['languageMatching'])) {
            $instructions[] = '3. LANGUAGE MATCHING: If the customer review contains Hindi or Hinglish, reply warmly in polite Hindi/Hinglish. If in English, reply in natural, polished English.';
        }

        if (! empty($rules['referenceSpecificExperience']) && ! empty($comment)) {
            $instructions[] = '4. HYPER-PERSONALIZATION: Explicitly mention and appreciate the specific topics, faculty, facilities, or experiences mentioned in the review. Avoid robotic or cookie-cutter templates.';
        }

        if (! empty($rules['includeReviewerName']) && ! empty($reviewerName) && strtolower($reviewerName) !== 'a google user') {
            $instructions[] = "5. GREETING: Begin with a warm, natural personal greeting like \"Dear {$reviewerName},\" or \"Hello {$reviewerName},\".";
        }

        if ($starNumber <= 3) {
            $contactSnippet = trim((! empty($rules['contactPhone']) ? "phone: {$rules['contactPhone']} " : '').(! empty($rules['contactEmail']) ? "email: {$rules['contactEmail']}" : ''));
            if ($contactSnippet) {
                $instructions[] = "6. OFFLINE RESOLUTION: Kindly invite the reviewer to contact our management team directly at {$contactSnippet} for swift resolution.";
            }
        }

        if (! empty($customInstructions)) {
            $instructions[] = "7. BUSINESS GUIDELINES: {$customInstructions}";
        }

        $instructions[] = '8. LENGTH: Keep reply concise, warm, and impactful (2 to 3 sentences maximum). Return ONLY the final reply text without quotes or meta commentary.';

        $prompt = implode("\n", $instructions);

        $apiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        $primaryModel = config('services.gemini.model', 'gemini-flash-lite-latest');
        if ($primaryModel === 'gemini-2.5-flash' || $primaryModel === 'gemini-2.5-flash-lite') {
            $primaryModel = 'gemini-flash-lite-latest';
        }
        $configuredModel = $rules['model'] ?? null;
        if ($configuredModel === 'gemini-2.5-flash' || $configuredModel === 'gemini-2.5-flash-lite') {
            $configuredModel = 'gemini-flash-lite-latest';
        }

        $modelsToTry = array_values(array_filter(
            array_unique([
                'gemini-flash-lite-latest',
                $configuredModel ?: $primaryModel,
                $primaryModel,
                'gemini-3.5-flash-lite',
                'gemini-flash-latest',
            ]),
            fn ($m) => ! empty($m) && $m !== 'gemini-2.5-flash' && $m !== 'gemini-2.5-flash-lite'
        ));

        if (! empty($apiKey)) {
            foreach ($modelsToTry as $model) {
                try {
                    $response = Http::timeout(12)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                    ]);

                    if ($response->successful()) {
                        $replyText = $response->json('candidates.0.content.parts.0.text');
                        if (! empty($replyText)) {
                            $cleanReply = trim(trim($replyText), "\"'` \t\n\r\0\x0B");

                            return [
                                'eligible' => true,
                                'skipped' => false,
                                'reply' => $cleanReply,
                                'aiPowered' => true,
                                'model' => $model,
                                'starNumber' => $starNumber,
                            ];
                        }
                    } else {
                        Log::warning("Gemini AI reply model {$model} returned {$response->status()}: ".substr($response->body(), 0, 150));
                    }
                } catch (\Exception $e) {
                    Log::warning("Gemini AI reply model {$model} exception: ".$e->getMessage());
                }
            }
        }

        return [
            'eligible' => true,
            'skipped' => false,
            'reply' => $fallback,
            'fallback' => true,
            'starNumber' => $starNumber,
        ];
    }

    /**
     * Resolve business title for a location name
     */
    public function getLocationTitle(?string $locationParam): string
    {
        if (empty($locationParam)) {
            return 'our business';
        }

        $token = $this->getPersistentToken() ?? [];
        $accountKey = 'gbp_locations_'.md5($token['user_email'] ?? 'default');
        $locations = $this->getServerData($accountKey);

        if (is_array($locations)) {
            foreach ($locations as $loc) {
                if (($loc['name'] ?? null) === $locationParam || ($loc['v4Name'] ?? null) === $locationParam) {
                    return $loc['title'] ?? 'our business';
                }
            }
        }

        return 'our business';
    }

    /**
     * Generate an AI reply using Google Gemini API
     */
    public function generateAiReply(Request $request)
    {
        $locationParam = $request->input('locationName') ?: $request->input('locationKey');
        $rules = $this->getAiRulesArray($locationParam ?: null);

        $comment = trim((string) $request->input('comment', ''));
        $reviewerName = trim((string) $request->input('reviewerName', 'valued customer'));
        $starRating = $request->input('starRating', 'FIVE');
        $tone = $request->input('tone', $rules['tone'] ?? 'Warm & Courteous');
        $businessName = $request->input('businessName', $this->getLocationTitle($locationParam) ?: 'our business');
        $customInstructions = $request->input('customInstructions', $rules['customInstructions'] ?? '');
        $enforceRules = $request->boolean('enforceRules', true);

        $result = $this->generateAiReplyText([
            'comment' => $comment,
            'reviewerName' => $reviewerName,
            'starRating' => $starRating,
            'tone' => $tone,
            'customInstructions' => $customInstructions,
        ], $rules, $businessName, $enforceRules);

        if (! empty($result['skipped'])) {
            return response()->json([
                'success' => false,
                'eligible' => false,
                'reply' => '',
                'skipped' => true,
                'reason' => $result['reason'] ?? 'Skipped by rule',
            ]);
        }

        return response()->json([
            'success' => true,
            'eligible' => true,
            'reply' => $result['reply'] ?? '',
            'aiPowered' => $result['aiPowered'] ?? false,
            'fallback' => $result['fallback'] ?? false,
            'aiDisabled' => $result['aiDisabled'] ?? false,
            'model' => $result['model'] ?? null,
            'starNumber' => $result['starNumber'] ?? null,
        ]);
    }

    /**
     * Auto-reply to new incoming reviews for a specific Google Business Profile
     * using that profile's individual AI automation rules and settings.
     */
    public function autoReplyForProfile(string $locationName, bool $force = false, int $limit = 20): array
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return [
                'success' => false,
                'authenticated' => false,
                'message' => 'Not authenticated with Google. Please reconnect your Google account.',
                'locationName' => $locationName,
                'repliedCount' => 0,
                'skippedCount' => 0,
                'totalPending' => 0,
                'replies' => [],
                'skipped' => [],
            ];
        }

        // 1. Resolve Per-Profile Rules
        $rules = $this->getAiRulesArray($locationName);
        $isProfileEnabled = ! empty($rules['enabled']);

        if (! $isProfileEnabled && ! $force) {
            return [
                'success' => false,
                'enabled' => false,
                'locationName' => $locationName,
                'message' => 'AI auto-reply is currently disabled for this profile. Enable it in Profile AI Rules.',
                'repliedCount' => 0,
                'skippedCount' => 0,
                'totalPending' => 0,
                'replies' => [],
                'skipped' => [],
            ];
        }

        // 2. Fetch Latest Reviews for this Profile
        $v4Name = $this->resolveLocationV4Name($locationName);
        $reviews = [];
        $locKey = 'gbp_reviews_'.md5($locationName);
        $cachedData = $this->getServerData($locKey) ?? ($v4Name ? $this->getServerData('gbp_reviews_'.md5($v4Name)) : null);

        // Try live fetch from Google API to catch brand new reviews
        if ($v4Name) {
            try {
                $response = Http::timeout(12)->connectTimeout(5)->withToken($accessToken)
                    ->get("https://mybusiness.googleapis.com/v4/{$v4Name}/reviews", ['pageSize' => 50]);

                if ($response->successful()) {
                    $rawPageReviews = $response->json('reviews', []);
                    $formattedReviews = [];
                    foreach ($rawPageReviews as $r) {
                        $reviewId = $r['reviewId'] ?? (basename($r['name'] ?? ''));
                        $formattedReviews[] = [
                            'reviewId' => $reviewId,
                            'name' => $r['name'] ?? "{$v4Name}/reviews/{$reviewId}",
                            'reviewer' => [
                                'displayName' => $r['reviewer']['displayName'] ?? 'Google User',
                                'profilePhotoUrl' => $r['reviewer']['profilePhotoUrl'] ?? null,
                            ],
                            'starRating' => $r['starRating'] ?? 'FIVE',
                            'comment' => $r['comment'] ?? '',
                            'createTime' => $r['createTime'] ?? now()->toIso8601String(),
                            'updateTime' => $r['updateTime'] ?? null,
                            'reviewReply' => ! empty($r['reviewReply']) ? [
                                'comment' => $r['reviewReply']['comment'] ?? '',
                                'updateTime' => $r['reviewReply']['updateTime'] ?? now()->toIso8601String(),
                            ] : null,
                        ];
                    }

                    // Merge with cached reviews
                    $existingReviews = (is_array($cachedData) && ! empty($cachedData['reviews'])) ? $cachedData['reviews'] : [];
                    $existingById = [];
                    foreach ($existingReviews as $ex) {
                        if (! empty($ex['reviewId'])) {
                            $existingById[$ex['reviewId']] = $ex;
                        }
                    }
                    foreach ($formattedReviews as $fr) {
                        unset($existingById[$fr['reviewId']]);
                    }
                    $reviews = array_merge($formattedReviews, array_values($existingById));

                    // Update server cache
                    $cachePayload = [
                        'reviews' => $reviews,
                        'averageRating' => (float) $response->json('averageRating', $cachedData['averageRating'] ?? 5.0),
                        'totalReviewCount' => (int) $response->json('totalReviewCount', count($reviews)),
                        'savedAt' => now()->toIso8601String(),
                    ];
                    $this->saveServerData($locKey, $cachePayload);
                    $this->saveServerData('gbp_reviews_'.md5($v4Name), $cachePayload);
                } else {
                    $reviews = $cachedData['reviews'] ?? [];
                }
            } catch (\Throwable $e) {
                Log::warning("autoReplyForProfile live fetch failed for {$locationName}: ".$e->getMessage());
                $reviews = $cachedData['reviews'] ?? [];
            }
        } else {
            $reviews = $cachedData['reviews'] ?? [];
        }

        // 3. Filter for Pending Reviews (no owner reply yet)
        $pendingReviews = array_filter($reviews, fn ($r) => empty($r['reviewReply']));
        $totalPending = count($pendingReviews);

        if ($totalPending === 0) {
            return [
                'success' => true,
                'enabled' => true,
                'locationName' => $locationName,
                'message' => 'No pending reviews waiting for replies on this profile.',
                'totalPending' => 0,
                'repliedCount' => 0,
                'skippedCount' => 0,
                'replies' => [],
                'skipped' => [],
            ];
        }

        $businessName = $this->getLocationTitle($locationName) ?: 'our business';
        $minStarRating = (int) ($rules['minStarRating'] ?? 1);
        $replyToEmpty = (bool) ($rules['replyToEmptyReviews'] ?? true);
        $delaySec = max(1, min((int) ($rules['delayBetweenRepliesSeconds'] ?? 3), 10));

        $replied = [];
        $skipped = [];
        $processedCount = 0;

        foreach ($pendingReviews as $rev) {
            if ($processedCount >= $limit) {
                break;
            }

            $reviewId = $rev['reviewId'] ?? '';
            $reviewName = $rev['name'] ?? '';
            $reviewerName = $rev['reviewer']['displayName'] ?? 'Valued Customer';
            $starRating = $rev['starRating'] ?? 'FIVE';
            $starNumber = $this->ratingStringToNumber($starRating);
            $comment = trim((string) ($rev['comment'] ?? ''));

            // Check star rating threshold rule
            if ($starNumber < $minStarRating) {
                $skipped[] = [
                    'reviewId' => $reviewId,
                    'reviewerName' => $reviewerName,
                    'starRating' => $starNumber,
                    'reason' => "Rating {$starNumber}★ is below this profile's minimum threshold ({$minStarRating}★).",
                ];

                continue;
            }

            // Check empty comment rule
            if (empty($comment) && ! $replyToEmpty) {
                $skipped[] = [
                    'reviewId' => $reviewId,
                    'reviewerName' => $reviewerName,
                    'starRating' => $starNumber,
                    'reason' => 'Configured to skip empty reviews without written text on this profile.',
                ];

                continue;
            }

            // Generate AI reply text using profile's rules
            $generationResult = $this->generateAiReplyText([
                'comment' => $comment,
                'reviewerName' => $reviewerName,
                'starRating' => $starRating,
            ], $rules, $businessName, true);

            $replyText = $generationResult['reply'] ?? '';
            if (empty($replyText)) {
                $skipped[] = [
                    'reviewId' => $reviewId,
                    'reviewerName' => $reviewerName,
                    'starRating' => $starNumber,
                    'reason' => 'Failed to generate response text.',
                ];

                continue;
            }

            // Publish reply to Google Business Profile API
            $publishResult = $this->publishReviewReplyDirect($reviewName, $replyText, $locationName, $reviewId, $accessToken);

            if (! empty($publishResult['success'])) {
                $replied[] = [
                    'reviewId' => $reviewId,
                    'reviewerName' => $reviewerName,
                    'starRating' => $starNumber,
                    'reply' => $replyText,
                    'aiPowered' => $generationResult['aiPowered'] ?? false,
                    'updateTime' => $publishResult['reviewReply']['updateTime'] ?? now()->toIso8601String(),
                ];
                $processedCount++;

                // If more reviews remain, pause briefly to protect API quotas
                if ($processedCount < $limit && $delaySec > 0) {
                    sleep(min($delaySec, 2));
                }
            } else {
                $skipped[] = [
                    'reviewId' => $reviewId,
                    'reviewerName' => $reviewerName,
                    'starRating' => $starNumber,
                    'reason' => $publishResult['error'] ?? 'Google API error publishing reply.',
                ];
            }
        }

        return [
            'success' => true,
            'enabled' => true,
            'locationName' => $locationName,
            'businessTitle' => $businessName,
            'totalPending' => $totalPending,
            'repliedCount' => count($replied),
            'skippedCount' => count($skipped),
            'replies' => $replied,
            'skipped' => $skipped,
            'message' => count($replied) > 0
                ? 'Successfully auto-replied to '.count($replied)." new review(s) for {$businessName}."
                : (count($skipped) > 0
                    ? "Pending reviews did not meet this profile's auto-reply criteria."
                    : 'No reviews needed replying.'),
        ];
    }

    /**
     * API: Auto-reply to new incoming reviews for a specific Google Business Profile.
     */
    public function autoReplyNewReviews(Request $request)
    {
        $locationName = $request->input('locationName');
        if (empty($locationName)) {
            return response()->json([
                'success' => false,
                'message' => 'locationName is required to auto-reply to new reviews.',
            ], 422);
        }

        $force = $request->boolean('force', false);
        $limit = max(1, min((int) $request->input('limit', 20), 50));

        $result = $this->autoReplyForProfile($locationName, $force, $limit);

        return response()->json($result);
    }

    /**
     * Get live local posts from server cache or Google Business Profile
     */
    public function getPosts(Request $request)
    {
        $locationParam = $request->query('locationName');
        if (! $locationParam) {
            return response()->json(['posts' => []]);
        }

        $v1Name = $this->resolveLocationV1Name($locationParam);
        $locKey = 'gbp_posts_'.md5($v1Name ?: $locationParam);
        $forceRefresh = $request->boolean('refresh', false);
        $pageSize = (int) $request->query('pageSize', 6);
        if ($pageSize <= 0 || $pageSize > 50) {
            $pageSize = 6;
        }
        $pageToken = $request->query('pageToken');

        // Serve persistently cached data from server unless user explicitly requests refresh or pagination
        if (! $forceRefresh && empty($pageToken)) {
            $cached = $this->getServerData($locKey);
            if (is_array($cached)) {
                $cachedPosts = isset($cached['posts']) ? $cached['posts'] : $cached;
                $cachedNextPageToken = $cached['nextPageToken'] ?? null;

                return response()->json([
                    'posts' => array_slice($cachedPosts, 0, $pageSize),
                    'nextPageToken' => $cachedNextPageToken,
                    'cached' => true,
                    'allTime' => true,
                ]);
            }
        }

        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json(['posts' => []]);
        }

        $v4Name = $this->resolveLocationV4Name($locationParam);
        if (! $v4Name) {
            return response()->json(['posts' => []]);
        }

        try {
            $params = ['pageSize' => $pageSize];
            if (! empty($pageToken)) {
                $params['pageToken'] = $pageToken;
            }

            // Single fast API call to Google for only the requested 6 posts (No blocking multi-page loop!)
            $response = Http::timeout(12)->connectTimeout(5)->withToken($accessToken)
                ->get("https://mybusiness.googleapis.com/v4/{$v4Name}/localPosts", $params);

            if (! $response->successful()) {
                Log::warning('Google localPosts fetch returned: '.$response->body());

                return response()->json(['posts' => []]);
            }

            $pagePosts = $response->json('localPosts', []);
            $nextPageToken = $response->json('nextPageToken');

            $posts = [];
            foreach ($pagePosts as $p) {
                $mediaUrl = null;
                $mediaFormat = 'PHOTO';
                if (! empty($p['media'])) {
                    $firstMedia = $p['media'][0];
                    $mediaUrl = $firstMedia['googleUrl'] ?? ($firstMedia['sourceUrl'] ?? null);
                    $mediaFormat = $firstMedia['mediaFormat'] ?? (preg_match('/\.(mp4|mov|webm|avi|m4v|3gp|mkv|wmv)(\?.*)?$/i', (string) $mediaUrl) ? 'VIDEO' : 'PHOTO');
                }

                $posts[] = [
                    'id' => $p['name'],
                    'locationName' => $locationParam,
                    'topicType' => $p['topicType'] ?? 'STANDARD',
                    'summary' => $p['summary'] ?? '',
                    'createTime' => $p['createTime'] ?? now()->toIso8601String(),
                    'mediaUrl' => $mediaUrl,
                    'mediaFormat' => $mediaFormat,
                    'callToAction' => $p['callToAction'] ?? null,
                    'offer' => $p['offer'] ?? null,
                    'event' => $p['event'] ?? null,
                ];
            }

            // Save first page on server permanently
            if (empty($pageToken)) {
                $this->saveServerData($locKey, [
                    'posts' => $posts,
                    'nextPageToken' => $nextPageToken,
                    'savedAt' => now()->toIso8601String(),
                ]);
            }

            return response()->json([
                'posts' => $posts,
                'nextPageToken' => $nextPageToken,
                'cached' => false,
                'allTime' => true,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching Google posts: '.$e->getMessage());

            return response()->json(['posts' => [], 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create and publish a local post live on Google Business Profile
     */
    public function createPost(Request $request)
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json(['error' => 'Not authenticated with Google'], 401);
        }

        $locationParam = $request->input('locationName');
        $v4Name = $this->resolveLocationV4Name($locationParam);
        if (! $v4Name) {
            return response()->json(['error' => 'Invalid location specified'], 400);
        }

        $summary = $request->input('summary');
        $topicType = $request->input('topicType', 'STANDARD');
        $callToAction = $request->input('callToAction');
        $mediaUrl = $request->input('mediaUrl');
        $offer = $request->input('offer');

        $payload = [
            'languageCode' => 'en-US',
            'summary' => $summary,
            'topicType' => $topicType,
        ];

        if (! empty($callToAction) && ! empty($callToAction['actionType']) && $callToAction['actionType'] !== 'NONE') {
            $ctaType = strtoupper(trim($callToAction['actionType']));
            if ($ctaType === 'CALL') {
                // Google My Business LocalPost API: 'CALL' MUST NOT specify a url parameter
                $payload['callToAction'] = [
                    'actionType' => 'CALL',
                ];
            } elseif (! empty($callToAction['url'])) {
                $ctaUrl = trim($callToAction['url']);
                if (filter_var($ctaUrl, FILTER_VALIDATE_URL)) {
                    $payload['callToAction'] = [
                        'actionType' => $ctaType,
                        'url' => $ctaUrl,
                    ];
                }
            }
        }

        if (! empty($mediaUrl)) {
            $mediaUrl = trim($mediaUrl);
            // Ensure HTTPS URL for Google crawlers
            $mediaUrl = preg_replace('/^http:\/\//i', 'https://', $mediaUrl);

            // Google LocalPosts API does NOT support WebP images (causes 500 Internal error).
            // Auto-convert any local WebP uploads to JPEG format:
            if (preg_match('/\/uploads\/posts\/([a-zA-Z0-9_\-]+\.webp)/i', $mediaUrl, $webpMatch)) {
                $webpFilename = $webpMatch[1];
                $webpPath = public_path('uploads/posts/'.$webpFilename);
                $jpgFilename = preg_replace('/\.webp$/i', '.jpg', $webpFilename);
                $jpgPath = public_path('uploads/posts/'.$jpgFilename);

                if (file_exists($webpPath)) {
                    if (! file_exists($jpgPath)) {
                        $this->convertAndSaveAsJpg($webpPath, $jpgPath, 1600, 92);
                    }
                    if (file_exists($jpgPath)) {
                        $mediaUrl = str_replace($webpFilename, $jpgFilename, $mediaUrl);
                    }
                }
            }

            $isExtensionVideo = preg_match('/\.(mp4|mov|webm|avi|m4v|3gp|mkv|wmv)(\?.*)?$/i', $mediaUrl);
            $mediaFormat = ($request->input('mediaFormat') === 'VIDEO' || $isExtensionVideo) ? 'VIDEO' : 'PHOTO';
            $payload['media'] = [
                [
                    'mediaFormat' => $mediaFormat,
                    'sourceUrl' => $mediaUrl,
                ],
            ];
        }

        if ($topicType === 'OFFER' && ! empty($offer)) {
            $payload['offer'] = array_filter([
                'couponCode' => $offer['couponCode'] ?? null,
                'termsConditions' => $offer['terms'] ?? null,
            ]);
        }

        $event = $request->input('event');
        if ($topicType === 'EVENT') {
            if (! empty($event) && is_array($event) && ! empty($event['title'])) {
                $payload['event'] = $event;
            } else {
                $today = now();
                $nextWeek = now()->addDays(7);
                $payload['event'] = [
                    'title' => mb_substr(trim(preg_replace('/\s+/', ' ', (string) $summary)), 0, 50) ?: 'Special Event',
                    'schedule' => [
                        'startDate' => [
                            'year' => (int) $today->format('Y'),
                            'month' => (int) $today->format('n'),
                            'day' => (int) $today->format('j'),
                        ],
                        'endDate' => [
                            'year' => (int) $nextWeek->format('Y'),
                            'month' => (int) $nextWeek->format('n'),
                            'day' => (int) $nextWeek->format('j'),
                        ],
                    ],
                ];
            }
        }

        try {
            $response = Http::timeout(15)->connectTimeout(5)->withToken($accessToken)
                ->post("https://mybusiness.googleapis.com/v4/{$v4Name}/localPosts", $payload);

            if ($response->successful()) {
                $p = $response->json();
                $newPost = [
                    'id' => $p['name'] ?? ('post-'.uniqid()),
                    'locationName' => $locationParam,
                    'topicType' => $p['topicType'] ?? $topicType,
                    'summary' => $p['summary'] ?? $summary,
                    'mediaUrl' => $mediaUrl,
                    'callToAction' => $payload['callToAction'] ?? null,
                    'offer' => $payload['offer'] ?? null,
                    'createTime' => $p['createTime'] ?? now()->toIso8601String(),
                ];

                // Update server cache with new post
                $v1Name = $this->resolveLocationV1Name($locationParam);
                $locKey = 'gbp_posts_'.md5($v1Name ?: $locationParam);
                $cached = $this->getServerData($locKey);
                if (is_array($cached)) {
                    if (isset($cached['posts']) && is_array($cached['posts'])) {
                        array_unshift($cached['posts'], $newPost);
                    } else {
                        array_unshift($cached, $newPost);
                    }
                    $this->saveServerData($locKey, $cached);
                }

                return response()->json([
                    'success' => true,
                    'post' => $newPost,
                ]);
            }

            $errorMsg = $response->json('error.message', 'Failed to publish post to Google Business Profile');
            Log::error("Google LocalPost publish failed ({$response->status()}): {$response->body()}", [
                'location' => $v4Name,
                'payload' => $payload,
            ]);

            return response()->json([
                'error' => $errorMsg,
            ], $response->status());
        } catch (\Exception $e) {
            Log::error('Exception in createPost: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update an existing post live on Google Business Profile
     */
    public function updatePost(Request $request, $id = null)
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json(['error' => 'Not authenticated with Google'], 401);
        }

        $postId = $id ?: ($request->input('postId') ?: $request->input('id'));
        $locationParam = $request->input('locationName');
        $summary = $request->input('summary');
        $topicType = $request->input('topicType', 'STANDARD');
        $callToAction = $request->input('callToAction');
        $mediaUrl = $request->input('mediaUrl');
        $offer = $request->input('offer');

        if (! $postId) {
            return response()->json(['error' => 'Post ID is required'], 400);
        }

        $payload = [
            'summary' => $summary,
            'topicType' => $topicType,
        ];

        $updateMaskFields = ['summary'];

        if (! empty($callToAction) && ! empty($callToAction['actionType']) && $callToAction['actionType'] !== 'NONE') {
            $ctaType = strtoupper(trim($callToAction['actionType']));
            if ($ctaType === 'CALL') {
                // Google My Business LocalPost API: 'CALL' MUST NOT specify a url parameter
                $payload['callToAction'] = [
                    'actionType' => 'CALL',
                ];
                $updateMaskFields[] = 'callToAction';
            } elseif (! empty($callToAction['url'])) {
                $ctaUrl = trim($callToAction['url']);
                if (filter_var($ctaUrl, FILTER_VALIDATE_URL)) {
                    $payload['callToAction'] = [
                        'actionType' => $ctaType,
                        'url' => $ctaUrl,
                    ];
                    $updateMaskFields[] = 'callToAction';
                }
            }
        }

        if (! empty($mediaUrl)) {
            $mediaUrl = trim($mediaUrl);
            $mediaUrl = preg_replace('/^http:\/\//i', 'https://', $mediaUrl);

            // Google LocalPosts API does NOT support WebP images (causes 500 Internal error).
            // Auto-convert any local WebP uploads to JPEG format:
            if (preg_match('/\/uploads\/posts\/([a-zA-Z0-9_\-]+\.webp)/i', $mediaUrl, $webpMatch)) {
                $webpFilename = $webpMatch[1];
                $webpPath = public_path('uploads/posts/'.$webpFilename);
                $jpgFilename = preg_replace('/\.webp$/i', '.jpg', $webpFilename);
                $jpgPath = public_path('uploads/posts/'.$jpgFilename);

                if (file_exists($webpPath)) {
                    if (! file_exists($jpgPath)) {
                        $this->convertAndSaveAsJpg($webpPath, $jpgPath, 1600, 92);
                    }
                    if (file_exists($jpgPath)) {
                        $mediaUrl = str_replace($webpFilename, $jpgFilename, $mediaUrl);
                    }
                }
            }

            $isExtensionVideo = preg_match('/\.(mp4|mov|webm|avi|m4v|3gp|mkv|wmv)(\?.*)?$/i', $mediaUrl);
            $mediaFormat = ($request->input('mediaFormat') === 'VIDEO' || $isExtensionVideo) ? 'VIDEO' : 'PHOTO';
            $payload['media'] = [
                [
                    'mediaFormat' => $mediaFormat,
                    'sourceUrl' => $mediaUrl,
                ],
            ];
            $updateMaskFields[] = 'media';
        }

        if ($topicType === 'OFFER' && ! empty($offer)) {
            $payload['offer'] = array_filter([
                'couponCode' => $offer['couponCode'] ?? null,
                'termsConditions' => $offer['terms'] ?? null,
            ]);
            $updateMaskFields[] = 'offer';
        }

        $event = $request->input('event');
        if ($topicType === 'EVENT') {
            if (! empty($event) && is_array($event) && ! empty($event['title'])) {
                $payload['event'] = $event;
                $updateMaskFields[] = 'event';
            } else {
                $today = now();
                $nextWeek = now()->addDays(7);
                $payload['event'] = [
                    'title' => mb_substr(trim(preg_replace('/\s+/', ' ', (string) $summary)), 0, 50) ?: 'Special Event',
                    'schedule' => [
                        'startDate' => [
                            'year' => (int) $today->format('Y'),
                            'month' => (int) $today->format('n'),
                            'day' => (int) $today->format('j'),
                        ],
                        'endDate' => [
                            'year' => (int) $nextWeek->format('Y'),
                            'month' => (int) $nextWeek->format('n'),
                            'day' => (int) $nextWeek->format('j'),
                        ],
                    ],
                ];
                $updateMaskFields[] = 'event';
            }
        }

        try {
            if (str_contains($postId, 'localPosts/')) {
                $mask = implode(',', $updateMaskFields);
                $response = Http::timeout(15)->connectTimeout(5)->withToken($accessToken)
                    ->patch("https://mybusiness.googleapis.com/v4/{$postId}?updateMask={$mask}", $payload);

                if (! $response->successful()) {
                    Log::warning("Google patch localPost returned: {$response->status()} - {$response->body()}");
                }
            }

            // Update server cache
            if ($locationParam) {
                $v1Name = $this->resolveLocationV1Name($locationParam);
                $locKey = 'gbp_posts_'.md5($v1Name ?: $locationParam);
                $cached = $this->getServerData($locKey);
                if (is_array($cached)) {
                    $targetPosts = &$cached;
                    if (isset($cached['posts']) && is_array($cached['posts'])) {
                        $targetPosts = &$cached['posts'];
                    }
                    foreach ($targetPosts as &$p) {
                        if (($p['id'] ?? '') === $postId) {
                            $p['summary'] = $summary;
                            $p['topicType'] = $topicType;
                            if (isset($payload['callToAction'])) {
                                $p['callToAction'] = $payload['callToAction'];
                            }
                            if (isset($payload['media'])) {
                                $p['mediaUrl'] = $mediaUrl;
                            }
                            if (isset($payload['offer'])) {
                                $p['offer'] = $payload['offer'];
                            }
                            break;
                        }
                    }
                    $this->saveServerData($locKey, $cached);
                }
            }

            return response()->json([
                'success' => true,
                'post' => [
                    'id' => $postId,
                    'locationName' => $locationParam,
                    'summary' => $summary,
                    'topicType' => $topicType,
                    'mediaUrl' => $mediaUrl,
                    'callToAction' => $payload['callToAction'] ?? null,
                    'offer' => $payload['offer'] ?? null,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating Google post: '.$e->getMessage());

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a post live from Google Business Profile
     */
    public function deletePost(Request $request, $id = null)
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json(['error' => 'Not authenticated with Google'], 401);
        }

        $postId = $id ?: ($request->input('postId') ?: $request->input('id'));
        $locationParam = $request->input('locationName') ?: $request->query('locationName');

        if (! $postId) {
            return response()->json(['error' => 'Post ID is required'], 400);
        }

        try {
            // If this is an actual Google resource name (e.g. accounts/.../localPosts/...)
            if (str_contains($postId, 'localPosts/')) {
                $delRes = Http::timeout(15)->connectTimeout(5)->withToken($accessToken)
                    ->delete("https://mybusiness.googleapis.com/v4/{$postId}");

                if (! $delRes->successful() && $delRes->status() !== 404) {
                    Log::warning("Google delete post returned: {$delRes->status()} - {$delRes->body()}");
                }
            }

            // Update server cache by removing post
            if ($locationParam) {
                $v1Name = $this->resolveLocationV1Name($locationParam);
                $locKey = 'gbp_posts_'.md5($v1Name ?: $locationParam);
                $cached = $this->getServerData($locKey);
                if (is_array($cached)) {
                    if (isset($cached['posts']) && is_array($cached['posts'])) {
                        $cached['posts'] = array_values(array_filter($cached['posts'], fn ($p) => ($p['id'] ?? '') !== $postId));
                    } else {
                        $cached = array_values(array_filter($cached, fn ($p) => ($p['id'] ?? '') !== $postId));
                    }
                    $this->saveServerData($locKey, $cached);
                }
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Error deleting Google post: '.$e->getMessage());

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Convert an image file to standard high-quality JPEG format for Google Business Profile LocalPosts.
     * Google My Business LocalPosts API STRICTLY requires JPEG (.jpg) or PNG (.png) with a minimum
     * resolution of 400x300. WebP format is NOT supported by Google LocalPosts and causes HTTP 500
     * "Internal error encountered."
     */
    protected function convertAndSaveAsJpg(string $sourcePath, string $destinationPath, int $maxDim = 1600, int $quality = 92): bool
    {
        if (! function_exists('imagejpeg') || ! function_exists('imagecreatetruecolor')) {
            return false;
        }

        $imageInfo = @getimagesize($sourcePath);
        if (! $imageInfo) {
            return false;
        }

        $mime = $imageInfo['mime'] ?? '';
        $srcImg = null;

        switch ($mime) {
            case 'image/jpeg':
            case 'image/jpg':
            case 'image/pjpeg':
                if (function_exists('imagecreatefromjpeg')) {
                    $srcImg = @imagecreatefromjpeg($sourcePath);
                }
                break;
            case 'image/png':
            case 'image/x-png':
                if (function_exists('imagecreatefrompng')) {
                    $srcImg = @imagecreatefrompng($sourcePath);
                }
                break;
            case 'image/webp':
                if (function_exists('imagecreatefromwebp')) {
                    $srcImg = @imagecreatefromwebp($sourcePath);
                }
                break;
            case 'image/gif':
                if (function_exists('imagecreatefromgif')) {
                    $srcImg = @imagecreatefromgif($sourcePath);
                }
                break;
            case 'image/bmp':
            case 'image/x-ms-bmp':
            case 'image/x-windows-bmp':
                if (function_exists('imagecreatefrombmp')) {
                    $srcImg = @imagecreatefrombmp($sourcePath);
                }
                break;
            case 'image/avif':
                if (function_exists('imagecreatefromavif')) {
                    $srcImg = @imagecreatefromavif($sourcePath);
                }
                break;
        }

        if (! $srcImg) {
            return false;
        }

        if (in_array($mime, ['image/jpeg', 'image/jpg']) && function_exists('exif_read_data')) {
            $exif = @exif_read_data($sourcePath);
            if (! empty($exif['Orientation']) && function_exists('imagerotate')) {
                switch ($exif['Orientation']) {
                    case 3:
                        $rotated = @imagerotate($srcImg, 180, 0);
                        if ($rotated) {
                            imagedestroy($srcImg);
                            $srcImg = $rotated;
                        }
                        break;
                    case 6:
                        $rotated = @imagerotate($srcImg, -90, 0);
                        if ($rotated) {
                            imagedestroy($srcImg);
                            $srcImg = $rotated;
                        }
                        break;
                    case 8:
                        $rotated = @imagerotate($srcImg, 90, 0);
                        if ($rotated) {
                            imagedestroy($srcImg);
                            $srcImg = $rotated;
                        }
                        break;
                }
            }
        }

        $origWidth = imagesx($srcImg);
        $origHeight = imagesy($srcImg);

        if ($origWidth <= 0 || $origHeight <= 0) {
            imagedestroy($srcImg);

            return false;
        }

        // Google LocalPost requirements: Minimum 400x300 pixels
        $minWidth = 720;
        $minHeight = 540;

        if ($origWidth < 400 || $origHeight < 300) {
            $scale = max($minWidth / max(1, $origWidth), $minHeight / max(1, $origHeight));
            $targetWidth = (int) max(400, round($origWidth * $scale));
            $targetHeight = (int) max(300, round($origHeight * $scale));
        } elseif ($origWidth > $maxDim || $origHeight > $maxDim) {
            if ($origWidth > $origHeight) {
                $targetHeight = (int) max(1, round(($origHeight * $maxDim) / $origWidth));
                $targetWidth = $maxDim;
            } else {
                $targetWidth = (int) max(1, round(($origWidth * $maxDim) / $origHeight));
                $targetHeight = $maxDim;
            }
        } else {
            $targetWidth = $origWidth;
            $targetHeight = $origHeight;
        }

        $destImg = imagecreatetruecolor($targetWidth, $targetHeight);

        // Fill with solid white background so transparency in PNG/WebP translates cleanly
        $whiteBg = imagecolorallocate($destImg, 255, 255, 255);
        imagefilledrectangle($destImg, 0, 0, $targetWidth, $targetHeight, $whiteBg);

        imagecopyresampled($destImg, $srcImg, 0, 0, 0, 0, $targetWidth, $targetHeight, $origWidth, $origHeight);

        $saved = @imagejpeg($destImg, $destinationPath, $quality);

        imagedestroy($srcImg);
        imagedestroy($destImg);

        return $saved && file_exists($destinationPath) && filesize($destinationPath) > 0;
    }

    /**
     * Backward-compatible alias for convertAndSaveAsJpg
     */
    protected function convertAndSaveAsWebp(string $sourcePath, string $destinationPath, int $maxDim = 1600, int $quality = 92): bool
    {
        // Save as JPG to guarantee Google My Business compatibility
        $jpgPath = preg_replace('/\.webp$/i', '.jpg', $destinationPath);

        return $this->convertAndSaveAsJpg($sourcePath, $jpgPath, $maxDim, $quality);
    }

    /**
     * Automatically delete uploaded photos and videos older than 24 hours
     * to keep server disk space minimal, as Google already caches and hosts
     * published post media on Google's own CDN (lh3.googleusercontent.com).
     */
    protected function cleanOldUploads(int $hours = 24): void
    {
        try {
            $dir = public_path('uploads/posts');
            if (! File::exists($dir)) {
                return;
            }

            $expireTime = time() - ($hours * 3600);
            foreach (File::files($dir) as $file) {
                if ($file->getFilename() === '.gitignore') {
                    continue;
                }

                if ($file->getMTime() < $expireTime) {
                    @unlink($file->getRealPath());
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Failed auto-cleaning old uploads: '.$e->getMessage());
        }
    }

    /**
     * Validate that a URL is a valid public HTTP/HTTPS URL and not an internal/private IP (SSRF protection).
     */
    protected function isSafePublicUrl(string $url): bool
    {
        if (! filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $parsed = parse_url($url);
        $scheme = strtolower($parsed['scheme'] ?? '');
        if (! in_array($scheme, ['http', 'https'], true)) {
            return false;
        }

        $host = strtolower($parsed['host'] ?? '');
        if (empty($host) || $host === 'localhost' || str_ends_with($host, '.local') || str_ends_with($host, '.internal')) {
            return false;
        }

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $ips = [$host];
        } else {
            $ips = [];
            $records = @dns_get_record($host, DNS_A + DNS_AAAA);
            if (! empty($records)) {
                foreach ($records as $r) {
                    if (! empty($r['ip'])) {
                        $ips[] = $r['ip'];
                    }
                    if (! empty($r['ipv6'])) {
                        $ips[] = $r['ipv6'];
                    }
                }
            } else {
                $resolved = @gethostbyname($host);
                if ($resolved && $resolved !== $host) {
                    $ips[] = $resolved;
                }
            }
        }

        if (empty($ips)) {
            return false;
        }

        foreach ($ips as $ip) {
            if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return false;
            }
            if (str_starts_with($ip, '127.') || str_starts_with($ip, '169.254.') || str_starts_with($ip, '0.') || $ip === '::1') {
                return false;
            }
        }

        return true;
    }

    /**
     * Upload, optimize, and store any post image or video for Google Business Profile.
     * Supports multipart file upload or Base64 payload, auto-optimizing images to WebP/JPG.
     */
    public function uploadPostImage(Request $request)
    {
        try {
            $dir = public_path('uploads/posts');
            if (! File::exists($dir)) {
                File::makeDirectory($dir, 0755, true, true);
            }

            // Auto-delete media older than 24 hours to prevent disk space usage
            $this->cleanOldUploads(24);

            $rawTempPath = null;
            $originalExtension = 'webp';
            $tempFile = null;

            $allowedVideoExtensions = ['mp4', 'mov', 'webm', 'm4v'];
            $allowedVideoMimes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
            $allowedImageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif'];
            $allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/x-png', 'image/webp', 'image/gif', 'image/bmp', 'image/x-ms-bmp', 'image/x-windows-bmp', 'image/avif'];

            $file = $request->file('image') ?: ($request->file('video') ?: $request->file('media'));
            if ($file) {
                if (! $file->isValid()) {
                    return response()->json([
                        'error' => 'Uploaded file error: '.$file->getErrorMessage(),
                    ], 400);
                }
                $rawTempPath = $file->getRealPath();
                $originalExtension = strtolower($file->getClientOriginalExtension() ?: '');
                $mime = strtolower((string) $file->getMimeType());

                $isVideo = str_starts_with($mime, 'video/') || in_array($originalExtension, $allowedVideoExtensions, true);

                if ($isVideo) {
                    if (! in_array($originalExtension, $allowedVideoExtensions, true) || ! in_array($mime, $allowedVideoMimes, true)) {
                        return response()->json(['error' => 'Unsupported video format. Allowed formats: MP4, MOV, WEBM, M4V.'], 422);
                    }

                    $ext = $originalExtension;
                    $finalFilename = 'video_'.uniqid().'_'.time().'.'.$ext;
                    $file->move($dir, $finalFilename);

                    $url = url('uploads/posts/'.$finalFilename);

                    return response()->json([
                        'success' => true,
                        'url' => $url,
                        'filename' => $finalFilename,
                        'mediaFormat' => 'VIDEO',
                    ]);
                }

                // Verify image format and integrity
                if (! in_array($originalExtension, $allowedImageExtensions, true) || ! in_array($mime, $allowedImageMimes, true)) {
                    return response()->json(['error' => 'Unsupported image format. Allowed formats: JPG, JPEG, PNG, WEBP, GIF, BMP, AVIF.'], 422);
                }

                $imgCheck = @getimagesize($rawTempPath);
                if (! $imgCheck) {
                    return response()->json(['error' => 'Uploaded file is not a valid or readable image.'], 422);
                }

                $originalExtension = $originalExtension ?: 'jpg';
            } elseif ($request->filled('image_base64') || ($request->filled('image') && is_string($request->input('image')) && str_starts_with($request->input('image'), 'data:image/'))) {
                $base64String = (string) ($request->input('image_base64') ?: $request->input('image'));
                if (preg_match('/^data:image\/([a-zA-Z0-9\+\-\.]+);base64,/', $base64String, $matches)) {
                    $originalExtension = strtolower($matches[1]);
                    if ($originalExtension === 'jpeg') {
                        $originalExtension = 'jpg';
                    }
                    $base64Data = substr($base64String, strpos($base64String, ',') + 1);
                } else {
                    $base64Data = $base64String;
                }

                if (! in_array($originalExtension, $allowedImageExtensions, true)) {
                    return response()->json(['error' => 'Invalid image base64 format.'], 422);
                }

                $decoded = base64_decode($base64Data);
                if ($decoded === false || empty($decoded)) {
                    return response()->json(['error' => 'Invalid image base64 data'], 400);
                }

                $tempFile = tempnam(sys_get_temp_dir(), 'post_img_');
                file_put_contents($tempFile, $decoded);

                $imgCheck = @getimagesize($tempFile);
                if (! $imgCheck) {
                    @unlink($tempFile);

                    return response()->json(['error' => 'Decoded base64 is not a valid image.'], 422);
                }

                $rawTempPath = $tempFile;
            } else {
                if (! empty($_FILES['image']['error']) && $_FILES['image']['error'] === UPLOAD_ERR_INI_SIZE) {
                    return response()->json([
                        'error' => 'File exceeds server upload size limit. Please pick a smaller file or compressed video.',
                    ], 413);
                }

                return response()->json([
                    'error' => 'No image or video file was received by the server.',
                ], 400);
            }

            $uniqueId = 'post_'.uniqid().'_'.time();
            $jpgFilename = $uniqueId.'.jpg';
            $jpgPath = $dir.DIRECTORY_SEPARATOR.$jpgFilename;

            $converted = $this->convertAndSaveAsJpg($rawTempPath, $jpgPath, 1600, 92);

            if ($converted) {
                $finalFilename = $jpgFilename;
            } else {
                // Ensure only strictly whitelisted image extension is used
                $safeExt = in_array($originalExtension, ['png', 'gif', 'bmp', 'avif'], true) ? $originalExtension : 'jpg';
                $finalFilename = $uniqueId.'.'.$safeExt;
                $finalPath = $dir.DIRECTORY_SEPARATOR.$finalFilename;
                copy($rawTempPath, $finalPath);
            }

            if ($tempFile && file_exists($tempFile)) {
                @unlink($tempFile);
            }

            $baseUrl = rtrim(config('app.url') ?: url('/'), '/');
            $baseUrl = preg_replace('/^http:\/\//i', 'https://', $baseUrl);
            $url = $baseUrl.'/uploads/posts/'.$finalFilename;

            return response()->json([
                'success' => true,
                'url' => $url,
                'filename' => $finalFilename,
                'mediaFormat' => 'PHOTO',
            ]);
        } catch (\Throwable $e) {
            Log::error('Error in uploadPostImage: '.$e->getMessage()."\n".$e->getTraceAsString());

            return response()->json([
                'error' => 'Server error uploading image: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Decodes Facebook Comet/Relay escaped JSON strings without stripping unicode sequences.
     */
    protected function decodeFacebookJsonString(string $raw): string
    {
        // 1. Normalize escaped backslashes (\\n, \\uXXXX, etc.)
        if (str_contains($raw, '\\\\')) {
            $raw = str_replace('\\\\', '\\', $raw);
        }

        // 2. Remove escaped double quote backslashes
        $raw = str_replace('\"', '"', $raw);

        // 3. Attempt json_decode with wrapped quotes
        $json = '"'.str_replace('"', '\"', $raw).'"';
        $decoded = json_decode($json);
        if (is_string($decoded) && ! empty($decoded)) {
            return trim($decoded);
        }

        // 4. Fallback: manual unicode decoding (\uXXXX)
        $clean = preg_replace_callback('/\\\\u([0-9a-fA-F]{4})/', function ($m) {
            return mb_chr(hexdec($m[1]), 'UTF-8');
        }, $raw);

        return trim(str_replace(['\n', '\r', '\t'], ["\n", "\r", "\t"], $clean));
    }

    /**
     * Extract post caption/summary and photo/video from a Facebook/social post URL or raw embed.
     * Optionally downloads external images to local storage as standard JPEG to avoid hotlink/expiry issues.
     */
    public function extractPostFromLink(Request $request)
    {
        $raw = trim((string) $request->input('content', ''));
        if (empty($raw)) {
            return response()->json(['error' => 'No URL or content provided'], 400);
        }

        $businessName = $request->input('businessName', 'Our Business');
        $fallbackFbPage = trim((string) $request->input('fbPageUrl', ''));
        $extractedPhotoUrl = null;
        $extractedCaption = null;
        $mediaFormat = 'PHOTO';

        // 1. Extract any non-URL, non-HTML user-pasted text candidate
        $pastedTextCandidate = null;
        $rawWithoutHtml = strip_tags($raw);
        $rawWithoutUrls = preg_replace('/https?:\/\/[^\s"\'<>]+/i', '', $rawWithoutHtml);
        $rawWithoutUrls = trim(preg_replace('/\s+/', ' ', $rawWithoutUrls));
        if (! empty($rawWithoutUrls) && mb_strlen($rawWithoutUrls) >= 20) {
            $pastedTextCandidate = $rawWithoutUrls;
        }

        // 2. Direct Image URL in pasted content (e.g. scontent fbcdn, lookaside, or direct image extension)
        if (preg_match('/(https?:\/\/[^\s"\'<>]+(?:\.(?:jpg|jpeg|png|webp|avif|gif)|fbcdn\.net[^\s"\'<>]*|fbsbx\.com[^\s"\'<>]*|googleusercontent\.com[^\s"\'<>]*))/i', $raw, $directImgMatch)) {
            $extractedPhotoUrl = html_entity_decode(htmlspecialchars_decode($directImgMatch[1], ENT_QUOTES), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $rawWithoutImg = trim(str_replace($directImgMatch[0], '', $raw));
            if (! empty($rawWithoutImg) && ! preg_match('/^https?:\/\//i', $rawWithoutImg)) {
                $extractedCaption = $rawWithoutImg;
            }
        }

        // 3. HTML <img> tag in raw pasted content
        if (empty($extractedPhotoUrl) && preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $raw, $imgTagMatch)) {
            $extractedPhotoUrl = html_entity_decode(htmlspecialchars_decode($imgTagMatch[1], ENT_QUOTES), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $rawWithoutImg = trim(preg_replace('/<img[^>]+>/i', '', $raw));
            if (! empty($rawWithoutImg)) {
                $extractedCaption = strip_tags($rawWithoutImg);
            }
        }

        // 4. Extract target URL (handling iframe embed codes like plugins/post.php?href=...)
        $targetUrl = null;
        if (preg_match('/plugins\/(?:post|video|page)\.php\?[^"\'\s]*href=([^&"\'\s]+)/i', $raw, $embedM)) {
            $targetUrl = urldecode($embedM[1]);
        } elseif (preg_match('/(https?:\/\/[^\s"\'<>]+)/i', $raw, $urlMatch)) {
            $targetUrl = $urlMatch[1];
        }

        if (! empty($targetUrl)) {
            $targetUrl = str_replace(['\u0026', '&amp;'], '&', $targetUrl);
            $targetUrl = stripslashes($targetUrl);

            // If it's a direct video link
            if (preg_match('/\.(mp4|mov|webm|avi|m4v)(\?.*)?$/i', $targetUrl)) {
                $extractedPhotoUrl = $targetUrl;
                $mediaFormat = 'VIDEO';
            }
            // If it's a direct image link
            elseif (empty($extractedPhotoUrl) && preg_match('/\.(jpg|jpeg|png|webp|gif|bmp|avif)(\?.*)?$/i', $targetUrl)) {
                $extractedPhotoUrl = $targetUrl;
            } else {
                // Prepare URLs to attempt fetching metadata
                $urlsToAttempt = [$targetUrl];

                $isFacebook = (bool) preg_match('/(?:facebook\.com|fb\.watch)/i', $targetUrl);

                if ($isFacebook) {
                    // Facebook Embed Plugin renders full unminified post text without login redirect
                    $urlsToAttempt[] = 'https://www.facebook.com/plugins/post.php?href='.urlencode($targetUrl);

                    // Mobile web endpoint: m.facebook.com often has full post DOM
                    if (str_contains($targetUrl, 'facebook.com')) {
                        $mobileUrl = preg_replace('/^(https?:\/\/(?:www\.)?)facebook\.com/i', 'https://m.facebook.com', $targetUrl);
                        if ($mobileUrl !== $targetUrl && ! in_array($mobileUrl, $urlsToAttempt, true)) {
                            $urlsToAttempt[] = $mobileUrl;
                        }
                    }

                    // Extract page slug fallback
                    if (preg_match('/facebook\.com\/([a-zA-Z0-9\._-]+)(?:\/posts|\/photos|\/videos|\/reel|\/share)?/i', $targetUrl, $fbSlugMatch)) {
                        $slug = $fbSlugMatch[1];
                        if (! in_array(strtolower($slug), ['plugins', 'watch', 'share', 'v17.0', 'v18.0', 'dialog', 'login'], true)) {
                            $pageUrl = "https://www.facebook.com/{$slug}";
                            if (! in_array($pageUrl, $urlsToAttempt, true)) {
                                $urlsToAttempt[] = $pageUrl;
                            }
                        }
                    }
                }

                // Also add fallbackFbPage if provided and not yet in list
                if (! empty($fallbackFbPage) && ! in_array($fallbackFbPage, $urlsToAttempt, true)) {
                    $urlsToAttempt[] = $fallbackFbPage;
                }

                // Crawl user agents
                $userAgents = [
                    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.html)',
                    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    'Twitterbot/1.0',
                    'WhatsApp/2.21.12.21 A',
                ];

                $fullCaptionCandidates = [];
                $truncatedCaptionCandidates = [];

                foreach ($urlsToAttempt as $fetchUrl) {
                    if (! $this->isSafePublicUrl($fetchUrl)) {
                        continue;
                    }

                    foreach ($userAgents as $ua) {
                        try {
                            $response = Http::withHeaders([
                                'User-Agent' => $ua,
                                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                'Accept-Language' => 'en-US,en;q=0.9,hi;q=0.8',
                            ])->timeout(8)->get($fetchUrl);

                            if ($response->successful()) {
                                $html = $response->body();

                                // Extract og:image or twitter:image
                                if (empty($extractedPhotoUrl)) {
                                    if (preg_match('/<meta[^>]+(?:property|name)=["\'](?:og:image|og:image:secure_url|twitter:image|twitter:image:src)["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $imgM)) {
                                        $candidateImg = html_entity_decode(htmlspecialchars_decode($imgM[1], ENT_QUOTES), ENT_QUOTES | ENT_HTML5, 'UTF-8');
                                        if (! str_contains($candidateImg, 'static.xx.fbcdn.net') && ! str_contains($candidateImg, 'rsrc.php')) {
                                            $extractedPhotoUrl = $candidateImg;
                                        }
                                    }
                                }

                                // Search for high-res CDN images in HTML body if og:image wasn't found
                                if (empty($extractedPhotoUrl)) {
                                    if (preg_match('/(https?:\/\/[^"\'\s<>\\\\]*(?:scontent|fbcdn|fbsbx)[^"\'\s<>\\\\]*\.(?:jpg|jpeg|png|webp|avif)[^"\'\s<>\\\\]*)/i', $html, $fbcdnM)) {
                                        $cand = stripslashes(str_replace('\/', '/', $fbcdnM[1]));
                                        $candidateImg = html_entity_decode(htmlspecialchars_decode($cand, ENT_QUOTES), ENT_QUOTES | ENT_HTML5, 'UTF-8');
                                        if (! str_contains($candidateImg, 'static.xx.fbcdn.net') && ! str_contains($candidateImg, 'rsrc.php')) {
                                            $extractedPhotoUrl = $candidateImg;
                                        }
                                    }
                                }

                                // Extract caption / description:
                                // 1. Facebook Comet/Relay JSON payloads (matching unescaped and escaped quotes)
                                $decodedHtml = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                                $jsonPattern = '/(?:\\\\{0,4}"message\\\\{0,4}"\s*:\s*\{\s*\\\\{0,4}"text\\\\{0,4}"|\\\\{0,4}"story\\\\{0,4}"\s*:\s*\{\s*\\\\{0,4}"text\\\\{0,4}"|\\\\{0,4}"post_message\\\\{0,4}"\s*:\s*\{\s*\\\\{0,4}"text\\\\{0,4}"|\\\\{0,4}"articleBody\\\\{0,4}"|\\\\{0,4}"text\\\\{0,4}")\s*:\s*\\\\{0,4}"((?:(?>[^"\\\\]+)|\\\\.)*)\\\\{0,4}"/iu';

                                if (preg_match_all($jsonPattern, $decodedHtml, $fbMsgMatches)) {
                                    foreach ($fbMsgMatches[1] as $rawMsg) {
                                        $candidateMsg = $this->decodeFacebookJsonString($rawMsg);
                                        if (! empty($candidateMsg) && mb_strlen($candidateMsg) >= 25) {
                                            if (! preg_match('/^(?:Log In|Create New Account|See more of|require\(|window\.|javascript:)/i', $candidateMsg)) {
                                                if (! str_contains($candidateMsg, '{"') && ! str_contains($candidateMsg, '"}')) {
                                                    $isTruncated = (bool) preg_match('/(?:\.\.\.|…|\bSee [Mm]ore)\s*$/u', $candidateMsg);
                                                    if ($isTruncated) {
                                                        $truncatedCaptionCandidates[] = $candidateMsg;
                                                    } else {
                                                        $fullCaptionCandidates[] = $candidateMsg;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                // 2. Extract text from embed DOM markup (<div class="_5pbx userContent"> etc.)
                                if (preg_match('/<div[^>]*class=["\'][^"\']*(?:userContent|_5pbx)[^"\']*["\'][^>]*>(.*?)<\/div>/is', $html, $domM)) {
                                    $domText = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>'], ["\n", "\n", "\n", "\n\n"], $domM[1]));
                                    $domText = html_entity_decode($domText, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                                    $domText = trim($domText);
                                    if (mb_strlen($domText) >= 20) {
                                        $fullCaptionCandidates[] = $domText;
                                    }
                                }

                                // 3. Meta og:description / twitter:description
                                if (preg_match('/<meta[^>]+(?:property|name)=["\'](?:og:description|twitter:description|description)["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $descM)) {
                                    $candDesc = html_entity_decode(htmlspecialchars_decode($descM[1], ENT_QUOTES), ENT_QUOTES | ENT_HTML5, 'UTF-8');
                                    $candDesc = trim($candDesc);
                                    if (! preg_match('/Log in|Log into Facebook|Create new account/i', $candDesc) && mb_strlen($candDesc) >= 15) {
                                        $isTruncated = (bool) preg_match('/(?:\.\.\.|…|\bSee [Mm]ore)\s*$/u', $candDesc);
                                        if ($isTruncated) {
                                            $truncatedCaptionCandidates[] = $candDesc;
                                        } else {
                                            $fullCaptionCandidates[] = $candDesc;
                                        }
                                    }
                                }

                                // Break only if we have BOTH photo URL AND an untruncated full caption
                                if (! empty($extractedPhotoUrl) && ! empty($fullCaptionCandidates)) {
                                    break 2;
                                }
                            }
                        } catch (\Throwable $e) {
                            Log::warning('Link extraction attempt error for '.$fetchUrl.': '.$e->getMessage());
                        }
                    }
                }

                // Choose best candidate
                if (! empty($fullCaptionCandidates)) {
                    usort($fullCaptionCandidates, fn ($a, $b) => mb_strlen($b) <=> mb_strlen($a));
                    $extractedCaption = $fullCaptionCandidates[0];
                } elseif (! empty($truncatedCaptionCandidates)) {
                    usort($truncatedCaptionCandidates, fn ($a, $b) => mb_strlen($b) <=> mb_strlen($a));
                    $extractedCaption = $truncatedCaptionCandidates[0];
                }
            }
        }

        // If user provided a longer or complete text candidate in their input, prefer it!
        if (! empty($pastedTextCandidate)) {
            if (empty($extractedCaption) || (mb_strlen($pastedTextCandidate) > mb_strlen($extractedCaption))) {
                $extractedCaption = $pastedTextCandidate;
            }
        }

        // 4. Clean & normalize caption (preserving paragraphs and unicode)
        if (! empty($extractedCaption)) {
            $extractedCaption = preg_replace('/\d+[\d,]*\s*(?:followers|following|likes|talking about this|were here)[^.]*\.?\s*/iu', '', $extractedCaption);
            $extractedCaption = preg_replace('/\s*(?:\.\.\.|…)\s*(?:See more|See More)\s*$/iu', '', $extractedCaption);
            $extractedCaption = preg_replace('/\s+(?:See more|See More)\s*$/iu', '', $extractedCaption);
            $extractedCaption = strip_tags($extractedCaption);
            $lines = explode("\n", str_replace(["\r\n", "\r"], "\n", $extractedCaption));
            $cleanedLines = array_map(function ($line) {
                return trim(preg_replace('/[ \t]+/', ' ', $line));
            }, $lines);
            $extractedCaption = trim(preg_replace("/\n{3,}/", "\n\n", implode("\n", $cleanedLines)));
        }

        // Fallback caption from user-pasted text if description not found (excluding the URL itself)
        if (empty($extractedCaption)) {
            $cleanedRaw = $raw;
            if (! empty($targetUrl)) {
                $cleanedRaw = str_replace($targetUrl, '', $cleanedRaw);
            }
            if (! empty($extractedPhotoUrl)) {
                $cleanedRaw = str_replace($extractedPhotoUrl, '', $cleanedRaw);
            }
            $cleanedRaw = strip_tags($cleanedRaw);
            $cleanedRaw = trim(preg_replace('/\s+/', ' ', $cleanedRaw));
            if (! empty($cleanedRaw) && ! str_starts_with($cleanedRaw, 'http')) {
                $extractedCaption = $cleanedRaw;
            } else {
                $extractedCaption = "Important updates & latest announcement from {$businessName}. Connect with us for full details!";
            }
        }

        // 5. Download and store image locally as standard JPEG for Google Business Profile
        if (! empty($extractedPhotoUrl) && $mediaFormat === 'PHOTO' && str_starts_with($extractedPhotoUrl, 'http')) {
            $downloadUrl = html_entity_decode($extractedPhotoUrl, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            if ($this->isSafePublicUrl($downloadUrl)) {
                try {
                    $imgResponse = Http::withHeaders([
                        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept' => 'image/*',
                    ])->timeout(10)->get($downloadUrl);

                    if ($imgResponse->successful() && ! empty($imgResponse->body())) {
                        $dir = public_path('uploads/posts');
                        if (! File::exists($dir)) {
                            File::makeDirectory($dir, 0755, true, true);
                        }

                        $tempFile = tempnam(sys_get_temp_dir(), 'ext_img_');
                        file_put_contents($tempFile, $imgResponse->body());

                        $uniqueId = 'post_'.uniqid().'_'.time();
                        $jpgFilename = $uniqueId.'.jpg';
                        $jpgPath = $dir.DIRECTORY_SEPARATOR.$jpgFilename;

                        $converted = $this->convertAndSaveAsJpg($tempFile, $jpgPath, 1600, 92);
                        @unlink($tempFile);

                        if ($converted) {
                            $baseUrl = rtrim(config('app.url') ?: url('/'), '/');
                            $baseUrl = preg_replace('/^http:\/\//i', 'https://', $baseUrl);
                            $extractedPhotoUrl = $baseUrl.'/uploads/posts/'.$jpgFilename;
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning('Failed downloading extracted image: '.$e->getMessage());
                }
            }
        }

        // 6. If aiRewrite requested, convert caption to high-performing Google Business Post
        $rewrittenCaption = null;
        if ($request->boolean('aiRewrite') && ! empty($extractedCaption)) {
            $aiReq = new Request([
                'businessName' => $businessName,
                'existingText' => $extractedCaption,
                'mediaUrl' => $extractedPhotoUrl ?: '',
            ]);
            $aiRes = $this->generateAiPost($aiReq);
            $aiData = $aiRes->getData(true);
            $rewrittenCaption = $aiData['content'] ?? null;
        }

        return response()->json([
            'success' => true,
            'caption' => $extractedCaption ?: '',
            'rewrittenCaption' => $rewrittenCaption,
            'mediaUrl' => $extractedPhotoUrl ?: '',
            'mediaFormat' => $mediaFormat,
        ]);
    }

    /**
     * Algorithmic Google Business Profile post formatter fallback
     */
    protected function formatGbpPostFallback(string $text, string $businessName, string $topicType = 'STANDARD'): string
    {
        $cleaned = trim($text);
        // Remove URLs
        $cleaned = preg_replace('/https?:\/\/[^\s]+/i', '', $cleaned);
        // Remove hashtags
        $cleaned = preg_replace('/#[\w\x{0900}-\x{097F}]+/u', '', $cleaned);
        // Remove Facebook clutter
        $cleaned = preg_replace('/\d+[\d,]*\s*(?:followers|following|likes|talking about this|were here)[^.]*\.?/iu', '', $cleaned);
        $cleaned = preg_replace('/\s*(?:\.\.\.|…)\s*(?:See more|See More)\s*$/iu', '', $cleaned);
        // Normalize paragraphs
        $lines = explode("\n", str_replace(["\r\n", "\r"], "\n", $cleaned));
        $normalizedLines = array_map(fn ($l) => trim(preg_replace('/[ \t]+/', ' ', $l)), $lines);
        $cleaned = trim(preg_replace("/\n{3,}/", "\n\n", implode("\n", $normalizedLines)));

        $isHindi = (bool) preg_match('/[\x{0900}-\x{097F}]/u', $cleaned);

        if (empty($cleaned)) {
            return $isHindi
                ? "📢 {$businessName} की ओर से विशेष अपडेट! ✨\n\nहमारे संस्थान में छात्रों के उज्ज्वल भविष्य के लिए उच्च गुणवत्तापूर्ण शिक्षण एवं मार्गदर्शन उपलब्ध है।\n\n• अनुभवी एवं समर्पित फैकल्टी द्वारा व्यक्तिगत मार्गदर्शन\n• आधुनिक शिक्षण सुविधाएं एवं नियमित टेस्ट सीरीज\n\n📞 अधिक जानकारी एवं प्रवेश हेतु आज ही हमारे कैंपस में संपर्क करें!"
                : "📢 Latest Update from {$businessName} ✨\n\nWe are committed to delivering the highest quality education and dedicated mentorship for every student.\n\n• Expert faculty guidance & concept-focused preparation\n• Comprehensive study materials & regular assessment tests\n\n📞 Get in touch with us today or visit our campus for more details!";
        }

        $isAdmission = (bool) preg_match('/admission|batch|class|enrol|seat|session|registration|प्रवेश|बैच|सीट/iu', $cleaned);
        $isResult = (bool) preg_match('/result|rank|score|topper|achieve|congrat|winner|celebrat|परिणाम|रैंक|सफलता/iu', $cleaned);
        $isOffer = $topicType === 'OFFER' || preg_match('/discount|offer|fee|scholarship|concession|छूट|ऑफर|छात्रवृत्ति/iu', $cleaned);

        if ($isHindi) {
            if ($isResult) {
                $header = "🏆 शानदार उपलब्धि एवं गर्व का क्षण | {$businessName} 🌟";
                $bullet1 = '• विद्यार्थियों की कड़ी मेहनत एवं समर्पित शिक्षकों का उत्कृष्ट मार्गदर्शन';
                $bullet2 = '• सर्वश्रेष्ठ परिणाम और निरंतर शीर्ष रैंक का गौरवशाली इतिहास';
                $cta = '📞 अधिक जानकारी के लिए आज ही हमारे कैंपस में संपर्क करें!';
            } elseif ($isAdmission) {
                $header = "📢 नए बैचेस एवं एडमिशन प्रारंभ | {$businessName} 🎓";
                $bullet1 = '• अनुभवी फैकल्टी द्वारा व्यक्तिगत मार्गदर्शन एवं डाउट सॉल्विंग';
                $bullet2 = '• अद्यतन स्टडी मटेरियल एवं गुणवत्तापूर्ण अध्ययन का माहौल';
                $cta = '📞 सीटें सीमित हैं! आज ही हमारे कैंपस में विजिट करें या तुरंत कॉल करें!';
            } elseif ($isOffer) {
                $header = "🎉 विशेष अपडेट एवं आकर्षक अवसर | {$businessName} ✨";
                $bullet1 = '• सीमित समय के लिए विशेष लाभ एवं छात्रवृत्ति के अवसर';
                $bullet2 = '• शीर्ष गुणवत्तापूर्ण शिक्षा अब और भी सुलभ';
                $cta = '📞 ऑफर की विस्तृत जानकारी के लिए आज ही संपर्क करें!';
            } else {
                $header = "📢 {$businessName} की ओर से ताज़ा अपडेट ✨";
                $bullet1 = '• गुणवत्तापूर्ण शिक्षा एवं विद्यार्थी-प्रथम मार्गदर्शन';
                $bullet2 = '• परिणाम-उन्मुख तैयारी एवं निरंतर अकादमिक सहयोग';
                $cta = '📞 अधिक जानकारी के लिए आज ही हमारे कैंपस पर पधारें!';
            }
        } else {
            if ($isResult) {
                $header = "🏆 Proud Milestone & Celebration | {$businessName} 🌟";
                $bullet1 = '• Proven academic excellence and consistent top rankers';
                $bullet2 = '• Dedicated mentorship and conceptual mastery for every student';
                $cta = '📞 Visit our campus or call our team today for more information!';
            } elseif ($isAdmission) {
                $header = "📢 New Batches & Admissions Open | {$businessName} 🎓";
                $bullet1 = '• Expert faculty guidance, regular mock tests & doubt sessions';
                $bullet2 = '• Comprehensive study resources in a disciplined learning environment';
                $cta = '📞 Limited seats available! Visit our campus or call today to enroll!';
            } elseif ($isOffer) {
                $header = "🎉 Exclusive Update & Special Opportunity | {$businessName} ✨";
                $bullet1 = '• Special benefits and scholarship guidance available';
                $bullet2 = '• Top-tier academic programs designed for your success';
                $cta = '📞 Call us now or visit our center to claim this opportunity!';
            } else {
                $header = "📢 Official Announcement from {$businessName} ✨";
                $bullet1 = '• Student-centric guidance and experienced academic mentorship';
                $bullet2 = '• Strong foundation building and regular performance tracking';
                $cta = '📞 Get in touch with us today or visit our campus for details!';
            }
        }

        $lines = [];
        $lines[] = $header;
        $lines[] = '';
        $lines[] = $cleaned;
        $lines[] = '';
        $lines[] = $isHindi ? '✨ मुख्य विशेषताएं:' : '✨ Key Highlights:';
        $lines[] = $bullet1;
        $lines[] = $bullet2;
        $lines[] = '';
        $lines[] = $cta;

        return implode("\n", $lines);
    }

    /**
     * Generate or Rewrite an AI post draft using Google Gemini API
     */
    public function generateAiPost(Request $request)
    {
        $topicType = $request->input('topicType', 'STANDARD');
        $businessName = $request->input('businessName', 'Our Business');
        $promptTopic = $request->input('promptTopic', 'Special Update');
        $existingText = trim((string) $request->input('existingText', ''));
        $mediaUrl = trim((string) $request->input('mediaUrl', ''));

        // If Gemini AI is disabled by the user, return structured GBP fallback directly
        if (! $this->isGeminiAiEnabled()) {
            return response()->json([
                'content' => $this->formatGbpPostFallback($existingText, $businessName, $topicType),
                'aiDisabled' => true,
            ]);
        }

        $isHindi = (bool) preg_match('/[\x{0900}-\x{097F}]/u', $existingText);
        $langInstruction = $isHindi
            ? 'LANGUAGE: The provided text is in Hindi/Hinglish. You MUST write the rewritten post in fluent, appealing Hindi/Hinglish with attractive emojis!'
            : 'LANGUAGE: Write the post in fluent, professional, and engaging English with attractive emojis.';

        if (! empty($existingText)) {
            $prompt = "You are an expert social media strategist for Google Business Profile (GBP).\n"
                ."TASK: Rewrite the following announcement into a high-converting, attractive Google Business Profile post for \"{$businessName}\".\n"
                ."Input Details: \"{$existingText}\"\n\n"
                ."{$langInstruction}\n"
                ."Requirements:\n"
                ."- Start with an eye-catching headline with emojis (e.g. 📢, 🎓, 🌟, 🏆, ✨).\n"
                ."- Clearly summarize the key announcement, news, achievement, or offer in 2-3 engaging, motivating sentences based specifically on the input details.\n"
                ."- Add 2-3 concise bullet points highlighting key features, dates, batches, or achievements.\n"
                ."- End with a clear call to action to visit the campus or call for details.\n"
                ."- Do not use hashtags (#).\n"
                .'- Return ONLY the post text ready to publish on Google.';
        } else {
            $prompt = "Write an engaging, high-converting Google Business Profile post for \"{$businessName}\". Type: {$topicType}. Topic: {$promptTopic}. {$langInstruction} Keep it 2-3 sentences with attractive emojis, 2 key bullet points, and a clear call to action. Return ONLY the ready post text without hashtags.";
        }

        $apiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        // Prioritize fast, high-quota models
        $modelsToTry = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];

        if (! empty($apiKey)) {
            foreach ($modelsToTry as $model) {
                try {
                    $response = Http::timeout(7)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                        'contents' => [['parts' => [['text' => $prompt]]]],
                    ]);

                    if ($response->successful()) {
                        $replyText = $response->json('candidates.0.content.parts.0.text');
                        if (! empty($replyText)) {
                            return response()->json([
                                'content' => trim($replyText),
                                'aiPowered' => true,
                                'model' => $model,
                            ]);
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning("Gemini model {$model} error: ".$e->getMessage());
                }
            }
        }

        return response()->json([
            'content' => $this->formatGbpPostFallback($existingText, $businessName, $topicType),
            'fallback' => true,
        ]);
    }

    /**
     * Get services from server cache or Google Business Information API
     */
    public function getServices(Request $request)
    {
        $locationParam = $request->query('locationName');
        if (! $locationParam) {
            return response()->json(['services' => []]);
        }

        $v1Name = $this->resolveLocationV1Name($locationParam);
        $locKey = 'gbp_services_'.md5($v1Name ?: $locationParam);
        $forceRefresh = $request->boolean('refresh', false);

        // Serve persistently cached services from server unless user explicitly requests refresh
        if (! $forceRefresh) {
            $cached = $this->getServerData($locKey);
            if (is_array($cached)) {
                return response()->json([
                    'services' => $cached,
                    'cached' => true,
                ]);
            }
        }

        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json(['services' => []]);
        }

        $v1Name = $this->resolveLocationV1Name($locationParam);
        if (! $v1Name) {
            return response()->json(['services' => []]);
        }

        try {
            $response = Http::withToken($accessToken)
                ->get("https://mybusinessbusinessinformation.googleapis.com/v1/{$v1Name}", [
                    'readMask' => 'serviceItems',
                ]);

            if ($response->successful()) {
                $rawItems = $response->json('serviceItems', []);
                $services = [];

                foreach ($rawItems as $idx => $item) {
                    $freeForm = $item['freeFormServiceItem'] ?? [];
                    $structured = $item['structuredServiceItem'] ?? [];
                    $label = $freeForm['label']['displayName'] ?? ($structured['serviceTypeId'] ?? 'Service');
                    $description = $freeForm['label']['description'] ?? '';
                    $category = $freeForm['category'] ?? 'General';
                    $priceUnits = $item['price']['units'] ?? null;

                    $services[] = [
                        'id' => (string) ($idx + 1),
                        'locationName' => $locationParam,
                        'category' => $category,
                        'name' => $label,
                        'price' => $priceUnits ? (float) $priceUnits : 0,
                        'priceType' => $priceUnits !== null ? 'FIXED' : 'FREE',
                        'currency' => $item['price']['currencyCode'] ?? 'INR',
                        'description' => $description,
                        'enabled' => true,
                    ];
                }

                // Save non-review services data on server permanently
                $this->saveServerData($locKey, $services);

                return response()->json([
                    'services' => $services,
                    'cached' => false,
                ]);
            }

            return response()->json(['services' => []]);
        } catch (\Exception $e) {
            Log::error('Error fetching Google services: '.$e->getMessage());

            return response()->json(['services' => [], 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Add a service live on Google Business Information API
     */
    public function createService(Request $request)
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json(['error' => 'Not authenticated with Google'], 401);
        }

        $locationParam = $request->input('locationName');
        $v1Name = $this->resolveLocationV1Name($locationParam);
        if (! $v1Name) {
            return response()->json(['error' => 'Invalid location specified'], 400);
        }

        $name = $request->input('name');
        $category = $request->input('category', 'General');
        $price = $request->input('price', 0);
        $priceType = $request->input('priceType', 'FIXED');
        $description = $request->input('description', '');

        try {
            // Read current serviceItems
            $getRes = Http::withToken($accessToken)
                ->get("https://mybusinessbusinessinformation.googleapis.com/v1/{$v1Name}", [
                    'readMask' => 'serviceItems',
                ]);
            $currentItems = $getRes->json('serviceItems', []);

            $newItem = [
                'freeFormServiceItem' => [
                    'category' => $category,
                    'label' => [
                        'displayName' => $name,
                        'description' => $description,
                    ],
                ],
            ];

            if ($priceType !== 'FREE' && (float) $price > 0) {
                $newItem['price'] = [
                    'currencyCode' => 'INR',
                    'units' => (string) intval($price),
                ];
            }

            $currentItems[] = $newItem;

            // Patch updated serviceItems to Google
            $patchRes = Http::withToken($accessToken)
                ->patch("https://mybusinessbusinessinformation.googleapis.com/v1/{$v1Name}?updateMask=serviceItems", [
                    'serviceItems' => $currentItems,
                ]);

            if ($patchRes->successful()) {
                $newService = [
                    'id' => (string) count($currentItems),
                    'locationName' => $locationParam,
                    'category' => $category,
                    'name' => $name,
                    'price' => (float) $price,
                    'priceType' => $priceType,
                    'currency' => 'INR',
                    'description' => $description,
                    'enabled' => true,
                ];

                // Update server cache with new service
                $v1Name = $this->resolveLocationV1Name($locationParam);
                $locKey = 'gbp_services_'.md5($v1Name ?: $locationParam);
                $cached = $this->getServerData($locKey);
                if (is_array($cached)) {
                    $cached[] = $newService;
                    $this->saveServerData($locKey, $cached);
                }

                return response()->json([
                    'success' => true,
                    'service' => $newService,
                ]);
            }

            return response()->json([
                'error' => $patchRes->json('error.message', 'Failed to save service on Google Business Profile'),
            ], $patchRes->status());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a service live from Google Business Information API
     */
    public function deleteService(Request $request, $id)
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json(['error' => 'Not authenticated with Google'], 401);
        }

        $locationParam = $request->input('locationName') ?: $request->query('locationName');
        $v1Name = $this->resolveLocationV1Name($locationParam);
        if (! $v1Name) {
            return response()->json(['success' => true]);
        }

        try {
            $getRes = Http::withToken($accessToken)
                ->get("https://mybusinessbusinessinformation.googleapis.com/v1/{$v1Name}", [
                    'readMask' => 'serviceItems',
                ]);
            $currentItems = $getRes->json('serviceItems', []);

            $locKey = 'gbp_services_'.md5($v1Name ?: $locationParam);
            $cached = $this->getServerData($locKey);
            $targetService = null;
            if (is_array($cached)) {
                foreach ($cached as $s) {
                    if (($s['id'] ?? '') == $id) {
                        $targetService = $s;
                        break;
                    }
                }
            }

            $idxToRemove = null;
            if ($targetService) {
                foreach ($currentItems as $idx => $item) {
                    $freeForm = $item['freeFormServiceItem'] ?? [];
                    $structured = $item['structuredServiceItem'] ?? [];
                    $label = $freeForm['label']['displayName'] ?? ($structured['serviceTypeId'] ?? '');
                    $category = $freeForm['category'] ?? 'General';
                    if ($label === ($targetService['name'] ?? '') && $category === ($targetService['category'] ?? 'General')) {
                        $idxToRemove = $idx;
                        break;
                    }
                }
            }

            if ($idxToRemove === null && is_numeric($id) && isset($currentItems[((int) $id) - 1])) {
                $idxToRemove = ((int) $id) - 1;
            }

            if ($idxToRemove !== null && isset($currentItems[$idxToRemove])) {
                array_splice($currentItems, $idxToRemove, 1);

                $patchRes = Http::withToken($accessToken)
                    ->patch("https://mybusinessbusinessinformation.googleapis.com/v1/{$v1Name}?updateMask=serviceItems", [
                        'serviceItems' => $currentItems,
                    ]);

                if ($patchRes->successful()) {
                    // Update server cache after deletion
                    if (is_array($cached)) {
                        $cached = array_values(array_filter($cached, fn ($s) => ($s['id'] ?? '') != $id));
                        foreach ($cached as $cIdx => &$cSvc) {
                            $cSvc['id'] = (string) ($cIdx + 1);
                        }
                        unset($cSvc);
                        $this->saveServerData($locKey, $cached);
                    }

                    return response()->json(['success' => true]);
                }
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Export reviews / report live into Google Sheets using Google Sheets API v4
     */
    public function syncSheets(Request $request)
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json(['error' => 'Not authenticated with Google. Please log in first.'], 401);
        }

        $spreadsheetId = $request->input('spreadsheetId');
        $data = $request->input('data', []);
        $sheetTitle = $request->input('sheetTitle', 'Sheet1');

        if (! $spreadsheetId) {
            return response()->json(['error' => 'Spreadsheet ID is required.'], 422);
        }

        if (empty($data)) {
            return response()->json(['error' => 'No rows provided to export.'], 422);
        }

        try {
            $quotedTitle = "'".str_replace("'", "''", $sheetTitle)."'";
            $range = rawurlencode($quotedTitle.'!A1:append');
            $response = Http::timeout(15)->connectTimeout(5)->withToken($accessToken)
                ->post("https://sheets.googleapis.com/v4/spreadsheets/{$spreadsheetId}/values/{$range}?valueInputOption=USER_ENTERED", [
                    'values' => $data,
                ]);

            if ($response->successful()) {
                $updates = $response->json('updates', []);

                return response()->json([
                    'success' => true,
                    'range' => $updates['updatedRange'] ?? "{$sheetTitle}!A1",
                    'updatedRows' => $updates['updatedRows'] ?? count($data),
                ]);
            }

            // If the custom sheet title wasn't found, attempt appending to default Sheet1
            if ($sheetTitle !== 'Sheet1') {
                $retryRes = Http::timeout(15)->connectTimeout(5)->withToken($accessToken)
                    ->post("https://sheets.googleapis.com/v4/spreadsheets/{$spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED", [
                        'values' => $data,
                    ]);

                if ($retryRes->successful()) {
                    return response()->json([
                        'success' => true,
                        'range' => $retryRes->json('updates.updatedRange', 'Sheet1!A1'),
                        'updatedRows' => $retryRes->json('updates.updatedRows', count($data)),
                    ]);
                }
            }

            return response()->json([
                'error' => $response->json('error.message', 'Google Sheets rejected write request. Check spreadsheet permissions.'),
            ], $response->status());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Retrieve or link an existing Google Sheet for the current location.
     */
    public function getSheetInfo(Request $request)
    {
        $locationParam = $request->input('locationName', $request->query('locationName', 'default'));
        $v1Name = $this->resolveLocationV1Name($locationParam);
        $key = 'gbp_linked_sheet_'.md5((string) ($v1Name ?: $locationParam));

        // If user wants to disconnect or reset
        if ($request->boolean('disconnect')) {
            $this->clearServerData($key);

            return response()->json(['success' => true, 'sheet' => null]);
        }

        // If manual spreadsheetId provided to link
        $manualId = $request->input('spreadsheetId');
        if (! empty($manualId)) {
            $cleanId = trim($manualId);
            if (preg_match('#/d/([a-zA-Z0-9-_]+)#', $cleanId, $matches)) {
                $cleanId = $matches[1];
            }
            $sheetData = [
                'spreadsheetId' => $cleanId,
                'spreadsheetUrl' => "https://docs.google.com/spreadsheets/d/{$cleanId}/edit",
                'title' => $request->input('title', 'Linked Google Sheet'),
                'updated_at' => now()->toIso8601String(),
            ];
            $this->saveServerData($key, $sheetData);

            return response()->json(['success' => true, 'sheet' => $sheetData]);
        }

        $cached = $this->getServerData($key);

        return response()->json(['success' => true, 'sheet' => $cached ?: null]);
    }

    /**
     * Create a brand new Google Sheet in user's Google Drive and permanently link it.
     */
    public function createOrLinkSheet(Request $request)
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json(['error' => 'Not authenticated with Google. Please log in first.'], 401);
        }

        $locationParam = $request->input('locationName', 'default');
        $locationTitle = $request->input('locationTitle', 'Google Business Profile');
        $v1Name = $this->resolveLocationV1Name($locationParam);
        $key = 'gbp_linked_sheet_'.md5((string) ($v1Name ?: $locationParam));

        // If not forcing a new sheet, check if one already exists
        $forceNew = $request->boolean('force_new', false);
        if (! $forceNew) {
            $cached = $this->getServerData($key);
            if (! empty($cached['spreadsheetId'])) {
                return response()->json([
                    'success' => true,
                    'sheet' => $cached,
                    'isNew' => false,
                    'message' => 'Using already connected Google Sheet',
                ]);
            }
        }

        $cleanTitle = trim((string) preg_replace('/[^a-zA-Z0-9_\-\s]/', '', (string) $locationTitle));
        $sheetTitle = 'GBP Live Sync - '.($cleanTitle ?: 'Business Reviews');

        try {
            $response = Http::timeout(15)->connectTimeout(5)->withToken($accessToken)
                ->post('https://sheets.googleapis.com/v4/spreadsheets', [
                    'properties' => [
                        'title' => $sheetTitle,
                    ],
                    'sheets' => [
                        [
                            'properties' => [
                                'title' => 'Reviews_Log',
                                'gridProperties' => [
                                    'rowCount' => 1000,
                                    'columnCount' => 20,
                                ],
                            ],
                        ],
                        [
                            'properties' => [
                                'title' => 'GBP_Analytics_Report',
                                'gridProperties' => [
                                    'rowCount' => 1000,
                                    'columnCount' => 20,
                                ],
                            ],
                        ],
                    ],
                ]);

            if ($response->successful()) {
                $spreadsheetId = $response->json('spreadsheetId');
                $spreadsheetUrl = $response->json('spreadsheetUrl') ?: "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/edit";

                $sheetData = [
                    'spreadsheetId' => $spreadsheetId,
                    'spreadsheetUrl' => $spreadsheetUrl,
                    'title' => $sheetTitle,
                    'created_at' => now()->toIso8601String(),
                ];

                $this->saveServerData($key, $sheetData);

                return response()->json([
                    'success' => true,
                    'sheet' => $sheetData,
                    'isNew' => true,
                    'message' => 'New Google Sheet created and linked successfully!',
                ]);
            }

            return response()->json([
                'error' => $response->json('error.message', 'Google Sheets rejected creation request. Check Google account permissions.'),
            ], $response->status());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get store hours from server cache or Google Business Information API
     */
    public function getHours(Request $request)
    {
        $daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $defaultSchedule = array_map(function ($day) {
            return ['day' => $day, 'open' => '09:00', 'close' => '18:00', 'closed' => false];
        }, $daysOfWeek);

        $locationParam = $request->query('locationName');
        if (! $locationParam) {
            return response()->json(['hours' => $defaultSchedule]);
        }

        $v1Name = $this->resolveLocationV1Name($locationParam);
        $locKey = 'gbp_hours_'.md5($v1Name ?: $locationParam);
        $forceRefresh = $request->boolean('refresh', false);

        // Serve persistently cached hours from server unless user explicitly requests refresh
        if (! $forceRefresh) {
            $cached = $this->getServerData($locKey);
            if (is_array($cached)) {
                return response()->json([
                    'hours' => $cached,
                    'cached' => true,
                ]);
            }
        }

        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json(['hours' => $defaultSchedule]);
        }

        $v1Name = $this->resolveLocationV1Name($locationParam);

        if ($v1Name) {
            try {
                $response = Http::withToken($accessToken)
                    ->get("https://mybusinessbusinessinformation.googleapis.com/v1/{$v1Name}", [
                        'readMask' => 'regularHours',
                    ]);

                if ($response->successful()) {
                    $periods = $response->json('regularHours.periods', []);
                    if (! empty($periods)) {
                        $periodMap = [];
                        foreach ($periods as $p) {
                            $day = ucfirst(strtolower($p['openDay'] ?? ''));
                            $openTime = sprintf('%02d:%02d', $p['openTime']['hours'] ?? 9, $p['openTime']['minutes'] ?? 0);
                            $closeTime = sprintf('%02d:%02d', $p['closeTime']['hours'] ?? 18, $p['closeTime']['minutes'] ?? 0);
                            $periodMap[$day] = [
                                'open' => $openTime,
                                'close' => $closeTime,
                            ];
                        }

                        $mappedHours = [];
                        foreach ($daysOfWeek as $d) {
                            if (isset($periodMap[$d])) {
                                $mappedHours[] = [
                                    'day' => $d,
                                    'open' => $periodMap[$d]['open'],
                                    'close' => $periodMap[$d]['close'],
                                    'closed' => false,
                                ];
                            } else {
                                $mappedHours[] = [
                                    'day' => $d,
                                    'open' => '09:00',
                                    'close' => '18:00',
                                    'closed' => true,
                                ];
                            }
                        }

                        // Save non-review hours data on server permanently
                        $this->saveServerData($locKey, $mappedHours);

                        return response()->json([
                            'hours' => $mappedHours,
                            'cached' => false,
                        ]);
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Error fetching regularHours from Google: '.$e->getMessage());
            }
        }

        return response()->json(['hours' => $defaultSchedule]);
    }

    /**
     * Save store hours live to Google Business Information API
     */
    public function updateHours(Request $request)
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json(['error' => 'Not authenticated with Google'], 401);
        }

        $hours = $request->input('hours');
        if (! is_array($hours)) {
            return response()->json(['error' => 'Invalid hours format'], 400);
        }

        $locationParam = $request->input('locationName') ?: $request->query('locationName');
        $v1Name = $this->resolveLocationV1Name($locationParam);

        if (! $v1Name) {
            return response()->json(['error' => 'Location name is required to update Google hours'], 400);
        }

        try {
            $periods = [];
            foreach ($hours as $h) {
                if (empty($h['closed']) && ! empty($h['open']) && ! empty($h['close'])) {
                    $openParts = explode(':', $h['open']);
                    $closeParts = explode(':', $h['close']);
                    $periods[] = [
                        'openDay' => strtoupper($h['day']),
                        'openTime' => [
                            'hours' => (int) ($openParts[0] ?? 9),
                            'minutes' => (int) ($openParts[1] ?? 0),
                        ],
                        'closeDay' => strtoupper($h['day']),
                        'closeTime' => [
                            'hours' => (int) ($closeParts[0] ?? 18),
                            'minutes' => (int) ($closeParts[1] ?? 0),
                        ],
                    ];
                }
            }

            $response = Http::withToken($accessToken)
                ->patch("https://mybusinessbusinessinformation.googleapis.com/v1/{$v1Name}?updateMask=regularHours", [
                    'regularHours' => [
                        'periods' => $periods,
                    ],
                ]);

            if ($response->successful()) {
                // Save updated hours to server cache
                $v1Name = $this->resolveLocationV1Name($locationParam);
                $locKey = 'gbp_hours_'.md5($v1Name ?: $locationParam);
                $this->saveServerData($locKey, $hours);
                if ($locationParam && $locationParam !== $v1Name) {
                    $this->saveServerData('gbp_hours_'.md5($locationParam), $hours);
                }

                return response()->json(['success' => true, 'hours' => $hours]);
            }

            return response()->json([
                'error' => $response->json('error.message', 'Google failed to update store hours'),
            ], $response->status());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Generate live review link for Google Maps listing
     */
    public function getReviewLink(Request $request)
    {
        $businessName = $request->input('businessName', $request->query('businessName', 'Our Business'));
        $placeId = $request->input('placeId', $request->query('placeId'));
        $locationParam = $request->input('locationName', $request->query('locationName'));
        $customReviewUrl = $request->input('customReviewUrl', $request->query('customReviewUrl'));

        $v1Name = $this->resolveLocationV1Name($locationParam);
        $cacheKey = 'custom_review_url_'.md5((string) ($v1Name ?: ($locationParam ?: $businessName)));
        $cacheLinkKey = 'gbp_review_link_'.md5((string) ($v1Name ?: ($locationParam ?: $businessName)));
        $forceRefresh = $request->boolean('refresh', false);

        // Reset custom URL if requested
        if ($request->boolean('reset') || $customReviewUrl === 'reset') {
            session()->forget($cacheKey);
            $this->clearServerData($cacheLinkKey);
            $customReviewUrl = null;
        } elseif (! empty($customReviewUrl)) {
            session([$cacheKey => trim($customReviewUrl)]);
        }

        $savedCustom = session($cacheKey);

        // If not force refresh, return server cached review link
        if (! $forceRefresh && empty($savedCustom) && ! $request->boolean('reset')) {
            $cachedLink = $this->getServerData($cacheLinkKey);
            if (is_array($cachedLink) && ! empty($cachedLink['reviewUrl'])) {
                return response()->json($cachedLink);
            }
        }

        $reviewUrl = $savedCustom ?: null;

        $placeUrl = null;
        $writeReviewUrl = null;
        $mapsSearchUrl = null;

        // If locationName is present, check metadata from Google
        if ($locationParam && ! $savedCustom) {
            $accessToken = $this->getValidAccessToken();
            $v1Name = $this->resolveLocationV1Name($locationParam);
            if ($accessToken && $v1Name) {
                try {
                    $res = Http::withToken($accessToken)
                        ->get("https://mybusinessbusinessinformation.googleapis.com/v1/{$v1Name}", [
                            'readMask' => 'metadata',
                        ]);
                    if ($res->successful()) {
                        $meta = $res->json('metadata', []);
                        if (! empty($meta['newReviewUri'])) {
                            $reviewUrl = $meta['newReviewUri'];
                        }
                        if (! empty($meta['placeId'])) {
                            $placeId = $meta['placeId'];
                        }
                        if (! empty($meta['mapsUri']) && ! $reviewUrl) {
                            $reviewUrl = $meta['mapsUri'];
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning('Error fetching metadata in getReviewLink: '.$e->getMessage());
                }
            }
        }

        if ($placeId) {
            $placeUrl = "https://www.google.com/maps/place/?q=place_id:{$placeId}";
            $writeReviewUrl = "https://search.google.com/local/writereview?placeid={$placeId}";
            $mapsSearchUrl = 'https://www.google.com/maps/search/?api=1&query='.urlencode($businessName).'&query_place_id='.$placeId;
        }

        if (! $reviewUrl) {
            if ($writeReviewUrl) {
                $reviewUrl = $writeReviewUrl;
            } elseif ($placeUrl) {
                $reviewUrl = $placeUrl;
            } else {
                $reviewUrl = 'https://www.google.com/maps/search/?api=1&query='.urlencode($businessName);
            }
        }

        $whatsappMessage = rawurlencode(
            "नमस्ते! {$businessName} में पधारने के लिए आपका बहुत-बहुत धन्यवाद 🙏\n\nहमारी सेवाएं और आपका अनुभव कैसा रहा? कृपया 1 मिनट निकालकर Google पर अपना 5-स्टार रिव्यू और अनुभव जरूर साझा करें:\n{$reviewUrl}\n\nआपका बहुमूल्य फीडबैक हमारी पूरी टीम के लिए बहुत महत्वपूर्ण है! ✨"
        );

        $linkResponse = [
            'reviewUrl' => $reviewUrl,
            'placeUrl' => $placeUrl,
            'writeReviewUrl' => $writeReviewUrl,
            'mapsSearchUrl' => $mapsSearchUrl,
            'whatsappUrl' => "https://wa.me/?text={$whatsappMessage}",
            'qrCodeData' => $reviewUrl,
            'placeId' => $placeId,
            'businessName' => $businessName,
            'isCustom' => ! empty($savedCustom),
        ];

        // Save review link to server cache
        $this->saveServerData($cacheLinkKey, $linkResponse);

        return response()->json($linkResponse);
    }

    /**
     * Analyze customer sentiment using Gemini AI or calculate from actual reviews
     */
    public function getAiSentiment(Request $request)
    {
        $locationName = $request->input('locationName') ?: $request->query('locationName');
        $v1Name = $this->resolveLocationV1Name($locationName);
        $sentimentKey = $locationName ? 'gbp_sentiment_'.md5($v1Name ?: $locationName) : null;
        $forceRefresh = $request->boolean('refresh', false);

        // 1. Serve persistently cached sentiment under any matching location key
        if (! $forceRefresh) {
            $cached = null;
            if ($sentimentKey) {
                $cached = $this->getServerData($sentimentKey);
            }
            if (empty($cached) && $locationName) {
                $cached = $this->getServerData('gbp_sentiment_'.md5($locationName));
            }
            if (empty($cached) && $v1Name) {
                $cached = $this->getServerData('gbp_sentiment_'.md5($v1Name));
            }

            if (is_array($cached) && ! empty($cached) && ! empty($cached['hasSentiment'])) {
                $cached['cached'] = true;
                $cached['hasSentiment'] = true;

                return response()->json($cached);
            }

            // If GET request and no cached sentiment, return placeholder without auto-generating
            if ($request->isMethod('GET')) {
                return response()->json([
                    'hasSentiment' => false,
                    'overallSentiment' => 'NEUTRAL',
                    'positiveScore' => 0,
                    'neutralScore' => 0,
                    'negativeScore' => 0,
                    'topPraises' => [],
                    'topComplaints' => [],
                    'actionRecommendation' => 'Click "Generate Sentiment Analysis" to analyze customer reviews.',
                ]);
            }
        }

        $reviews = $request->input('reviews', []);
        if (empty($reviews) && $locationName) {
            $cachedReviews = $this->getServerData('gbp_reviews_'.md5($locationName));
            if (empty($cachedReviews) && $v1Name) {
                $cachedReviews = $this->getServerData('gbp_reviews_'.md5($v1Name));
            }
            if (! empty($cachedReviews['reviews']) && is_array($cachedReviews['reviews'])) {
                $reviews = $cachedReviews['reviews'];
            }
        }

        if (empty($reviews)) {
            return response()->json([
                'hasSentiment' => false,
                'overallSentiment' => 'NEUTRAL',
                'positiveScore' => 0,
                'neutralScore' => 0,
                'negativeScore' => 0,
                'topPraises' => ['No reviews recorded yet'],
                'topComplaints' => ['No reviews recorded yet'],
                'actionRecommendation' => 'Encourage recent customers to leave reviews via WhatsApp or QR code.',
            ]);
        }

        // Format actual customer reviews
        $reviewTexts = collect($reviews)->take(15)->map(function ($r) {
            $star = $r['starRating'] ?? '5';
            $comment = $r['comment'] ?? '(Rating only)';

            return "[{$star}] \"{$comment}\"";
        })->implode("\n");

        $apiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        $primaryModel = config('services.gemini.model', 'gemini-flash-lite-latest');
        if ($primaryModel === 'gemini-2.5-flash' || $primaryModel === 'gemini-2.5-flash-lite') {
            $primaryModel = 'gemini-flash-lite-latest';
        }
        $modelsToTry = array_values(array_filter(
            array_unique([$primaryModel, 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-flash-latest']),
            fn ($m) => ! empty($m) && $m !== 'gemini-2.5-flash' && $m !== 'gemini-2.5-flash-lite'
        ));

        if (! empty($apiKey) && $this->isGeminiAiEnabled()) {
            $prompt = "Analyze these actual Google Business Profile reviews for a local business:\n{$reviewTexts}\n\n".
                "Provide a concise JSON analysis with:\n".
                "1. \"overallSentiment\": \"POSITIVE\" | \"NEUTRAL\" | \"ATTENTION_REQUIRED\"\n".
                "2. \"positiveScore\": integer percentage (0-100)\n".
                "3. \"neutralScore\": integer percentage (0-100)\n".
                "4. \"negativeScore\": integer percentage (0-100)\n".
                "5. \"topPraises\": array of 3 short bullet strings\n".
                "6. \"topComplaints\": array of 2 short bullet strings\n".
                "7. \"actionRecommendation\": 1 concrete sentence for the business owner to improve their rating this week.\n\n".
                'Return ONLY valid JSON.';

            foreach ($modelsToTry as $model) {
                try {
                    $response = Http::timeout(15)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                    ]);

                    if ($response->successful()) {
                        $jsonText = $response->json('candidates.0.content.parts.0.text');
                        if ($jsonText) {
                            if (preg_match('/\{[\s\S]*\}/', $jsonText, $jsonMatches)) {
                                $cleanJson = $jsonMatches[0];
                            } else {
                                $cleanJson = preg_replace('/```json|```/', '', $jsonText);
                            }
                            $parsed = json_decode(trim($cleanJson), true);
                            if ($parsed && isset($parsed['positiveScore'])) {
                                $parsed['hasSentiment'] = true;
                                $parsed['model'] = $model;
                                $parsed['generatedAt'] = now()->toIso8601String();
                                $parsed['cached'] = false;
                                if ($sentimentKey) {
                                    $this->saveServerData($sentimentKey, $parsed);
                                }
                                if ($locationName) {
                                    $this->saveServerData('gbp_sentiment_'.md5($locationName), $parsed);
                                }
                                if ($v1Name) {
                                    $this->saveServerData('gbp_sentiment_'.md5($v1Name), $parsed);
                                }

                                return response()->json($parsed);
                            }
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning("Gemini sentiment analysis model {$model} error: ".$e->getMessage());
                }
            }
        }

        // Real statistical fallback calculated purely from the actual reviews
        $total = count($reviews);
        $posCount = 0;
        $neuCount = 0;
        $negCount = 0;

        foreach ($reviews as $r) {
            $star = $r['starRating'] ?? 'FIVE';
            if ($star === 'FIVE' || $star === 'FOUR' || $star === '5' || $star === '4') {
                $posCount++;
            } elseif ($star === 'THREE' || $star === '3') {
                $neuCount++;
            } else {
                $negCount++;
            }
        }

        $posScore = $total > 0 ? (int) round(($posCount / $total) * 100) : 0;
        $neuScore = $total > 0 ? (int) round(($neuCount / $total) * 100) : 0;
        $negScore = $total > 0 ? (int) round(($negCount / $total) * 100) : 0;

        $overall = $posScore >= 70 ? 'POSITIVE' : ($negScore >= 30 ? 'ATTENTION_REQUIRED' : 'NEUTRAL');

        $result = [
            'hasSentiment' => true,
            'generatedAt' => now()->toIso8601String(),
            'overallSentiment' => $overall,
            'positiveScore' => $posScore,
            'neutralScore' => $neuScore,
            'negativeScore' => $negScore,
            'topPraises' => [
                'Overall positive customer feedback',
                "{$posCount} high-rated reviews recorded",
                'Good ongoing customer satisfaction',
            ],
            'topComplaints' => $negCount > 0 ? [
                "{$negCount} reviews rated 3 stars or below requiring follow-up",
                'Ensure timely replies to any unresolved customer issues',
            ] : [
                'No negative complaints detected in current reviews',
                'Continue maintaining high service quality',
            ],
            'actionRecommendation' => $negCount > 0
                ? 'Respond directly to customers who left low ratings to address their feedback.'
                : 'Maintain prompt replies to all reviews to improve local Google search rankings.',
            'aiDisabled' => ! $this->isGeminiAiEnabled(),
            'cached' => false,
        ];

        if ($sentimentKey) {
            $this->saveServerData($sentimentKey, $result);
        }
        if ($locationName) {
            $this->saveServerData('gbp_sentiment_'.md5($locationName), $result);
        }
        if ($v1Name) {
            $this->saveServerData('gbp_sentiment_'.md5($v1Name), $result);
        }

        return response()->json($result);
    }

    /**
     * Check if Gemini AI features are enabled by user setting
     */
    public function isGeminiAiEnabled(): bool
    {
        try {
            return (bool) Cache::get('gemini_ai_enabled', true);
        } catch (\Throwable $e) {
            return true;
        }
    }

    /**
     * Get current Gemini AI feature settings & status
     */
    public function getAiSettings()
    {
        $enabled = $this->isGeminiAiEnabled();
        $apiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        $model = config('services.gemini.model', 'gemini-flash-lite-latest');
        if ($model === 'gemini-2.5-flash' || $model === 'gemini-2.5-flash-lite') {
            $model = 'gemini-flash-lite-latest';
        }

        return response()->json([
            'enabled' => $enabled,
            'hasKey' => ! empty($apiKey),
            'model' => $model,
        ]);
    }

    /**
     * Enable or disable Gemini AI features
     */
    public function updateAiSettings(Request $request)
    {
        $enabled = $request->boolean('enabled');
        try {
            Cache::forever('gemini_ai_enabled', $enabled);
        } catch (\Throwable $e) {
            Log::warning('Failed to save gemini_ai_enabled to cache: '.$e->getMessage());
        }

        $rules = $this->getAiRulesArray();
        $rules['enabled'] = $enabled;
        try {
            Cache::forever('gemini_ai_rules', $rules);
        } catch (\Throwable $e) {
            Log::warning('Failed to save gemini_ai_rules to cache: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'enabled' => $enabled,
            'message' => $enabled ? 'Google Gemini AI enabled' : 'Google Gemini AI disabled',
        ]);
    }

    /**
     * Helper to convert rating string to integer
     */
    public function ratingStringToNumber(string $starRating): int
    {
        return match (strtoupper($starRating)) {
            'ONE', '1' => 1,
            'TWO', '2' => 2,
            'THREE', '3' => 3,
            'FOUR', '4' => 4,
            default => 5,
        };
    }

    /**
     * Default AI Automation Rules
     */
    public function getDefaultAiRules(): array
    {
        return [
            'enabled' => true,
            'minStarRating' => 1,
            'replyToEmptyReviews' => true,
            'maxRepliesPerMinute' => 10,
            'delayBetweenRepliesSeconds' => 3,
            'tone' => 'Warm & Courteous',
            'antiToxicityGuard' => true,
            'languageMatching' => true,
            'includeReviewerName' => true,
            'referenceSpecificExperience' => true,
            'contactPhone' => '',
            'contactEmail' => '',
            'customInstructions' => 'Always maintain maximum respect and highlight our dedication to excellence and student success.',
            'model' => 'gemini-flash-lite-latest',
        ];
    }

    /**
     * Get array of merged AI automation rules.
     * If a $locationKey is provided, location-specific rules override the global rules.
     */
    public function getAiRulesArray(?string $locationKey = null): array
    {
        $defaults = $this->getDefaultAiRules();
        $saved = [];
        try {
            $saved = Cache::get('gemini_ai_rules', []);
        } catch (\Throwable $e) {
            $saved = [];
        }
        if (! is_array($saved)) {
            $saved = [];
        }

        $isLocationSpecific = ! empty($locationKey);
        $hasLocationRules = false;

        // Merge location-specific rules on top of global rules
        if ($isLocationSpecific) {
            $candidates = [$locationKey];
            $v1Name = $this->resolveLocationV1Name($locationKey);
            if ($v1Name && ! in_array($v1Name, $candidates)) {
                $candidates[] = $v1Name;
            }
            $v4Name = $this->resolveLocationV4Name($locationKey);
            if ($v4Name && ! in_array($v4Name, $candidates)) {
                $candidates[] = $v4Name;
            }

            foreach ($candidates as $cand) {
                $locCacheKey = 'gemini_ai_rules_loc_'.md5($cand);
                try {
                    $locSaved = Cache::get($locCacheKey);
                    if (is_array($locSaved) && ! empty($locSaved)) {
                        $saved = array_merge($saved, $locSaved);
                        $hasLocationRules = true;
                        break;
                    }
                } catch (\Throwable $e) {
                    // fall through to global rules
                }
            }

            // If this profile hasn't had its rules saved yet, default enabled to false
            // so individual profiles are never auto-replied collectively without explicit activation
            if (! $hasLocationRules) {
                $saved['enabled'] = false;
            }
        }

        if (isset($saved['model']) && in_array($saved['model'], ['gemini-2.5-flash', 'gemini-2.5-flash-lite'])) {
            $saved['model'] = 'gemini-flash-lite-latest';
        }

        try {
            $globalEnabled = Cache::get('gemini_ai_enabled');
        } catch (\Throwable $e) {
            $globalEnabled = null;
        }
        if ($globalEnabled !== null && ! $isLocationSpecific) {
            // Only apply global enabled toggle when NOT location-specific
            $saved['enabled'] = (bool) $globalEnabled;
        }

        return array_merge($defaults, $saved);
    }

    /**
     * API: Get current AI automation rules & status.
     * Pass ?locationName=... to get location-specific rules.
     */
    public function getAiRules(Request $request)
    {
        $locationName = $request->query('locationName');
        $rules = $this->getAiRulesArray($locationName ?: null);
        $apiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');

        return response()->json([
            'success' => true,
            'rules' => $rules,
            'hasKey' => ! empty($apiKey),
            'locationName' => $locationName,
        ]);
    }

    /**
     * API: Save updated AI automation rules.
     * If locationName is present in body, saves location-specific rules only.
     * Otherwise saves to global rules.
     */
    public function updateAiRules(Request $request)
    {
        $locationName = $request->input('locationName');
        $isLocationSpecific = ! empty($locationName);
        $current = $this->getAiRulesArray($locationName ?: null);
        $input = $request->input('rules', $request->except('locationName'));

        $booleanKeys = [
            'enabled',
            'replyToEmptyReviews',
            'antiToxicityGuard',
            'languageMatching',
            'includeReviewerName',
            'referenceSpecificExperience',
        ];

        $integerKeys = [
            'minStarRating',
            'maxRepliesPerMinute',
            'delayBetweenRepliesSeconds',
        ];

        $stringKeys = [
            'tone',
            'contactPhone',
            'contactEmail',
            'customInstructions',
        ];

        foreach ($booleanKeys as $key) {
            if (array_key_exists($key, $input)) {
                $current[$key] = filter_var($input[$key], FILTER_VALIDATE_BOOLEAN);
            }
        }

        foreach ($integerKeys as $key) {
            if (array_key_exists($key, $input)) {
                $current[$key] = max(1, (int) $input[$key]);
            }
        }

        foreach ($stringKeys as $key) {
            if (array_key_exists($key, $input)) {
                $current[$key] = trim((string) $input[$key]);
            }
        }

        try {
            if ($isLocationSpecific) {
                // Save to candidate keys for this specific location
                $candidates = [$locationName];
                $v1Name = $this->resolveLocationV1Name($locationName);
                if ($v1Name && ! in_array($v1Name, $candidates)) {
                    $candidates[] = $v1Name;
                }
                $v4Name = $this->resolveLocationV4Name($locationName);
                if ($v4Name && ! in_array($v4Name, $candidates)) {
                    $candidates[] = $v4Name;
                }
                foreach ($candidates as $cand) {
                    Cache::forever('gemini_ai_rules_loc_'.md5($cand), $current);
                }
            } else {
                // Save to global cache keys
                Cache::forever('gemini_ai_rules', $current);
                Cache::forever('gemini_ai_enabled', $current['enabled']);
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to save AI rules to cache: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'rules' => $current,
            'message' => $isLocationSpecific
                ? 'AI rules saved for this profile only'
                : 'AI automation rules saved successfully',
        ]);
    }

    /**
     * Generate multi-profile daily growth report for all locations linked with the authenticated Google account.
     * Stored persistently on server and only regenerated on explicit button click (refresh=true).
     */
    public function getMultiProfileReport(Request $request)
    {
        $accessToken = $this->getValidAccessToken();
        if (! $accessToken) {
            return response()->json([
                'success' => false,
                'authenticated' => false,
                'message' => 'Not authenticated with Google.',
                'locations' => [],
            ], 401);
        }

        $token = $this->getPersistentToken() ?? [];
        $userEmail = $token['user_email'] ?? 'Google Account';
        $reportKey = 'gbp_multi_report_'.md5($userEmail);
        $forceRefresh = $request->boolean('refresh', false);

        // 1. Serve persistently saved report from server unless user explicitly requests refresh
        if (! $forceRefresh) {
            $savedReport = $this->getServerData($reportKey);
            if ($savedReport !== null && is_array($savedReport) && ! empty($savedReport['locations'])) {
                $savedReport['cached'] = true;
                $savedReport['hasReport'] = true;

                return response()->json($savedReport);
            }

            // If no report has ever been generated, do NOT hit Google API automatically!
            return response()->json([
                'success' => true,
                'hasReport' => false,
                'userEmail' => $userEmail,
                'generatedAt' => null,
                'locations' => [],
                'overall' => [
                    'totalProfiles' => 0,
                    'totalReviews' => 0,
                    'totalTodayNew' => 0,
                    'totalPending' => 0,
                    'averageRating' => 0.0,
                ],
                'message' => 'No report generated yet. Click "Generate Report" button to create live report.',
            ]);
        }

        // 2. Fetch fresh report from Google on explicit user request
        $locationsRes = $this->getLocations($request);
        $locationsData = $locationsRes->getData(true);
        $locations = $locationsData['locations'] ?? [];

        if (empty($locations)) {
            $emptyReport = [
                'success' => true,
                'hasReport' => true,
                'userEmail' => $userEmail,
                'generatedAt' => now()->toIso8601String(),
                'locations' => [],
                'overall' => [
                    'totalProfiles' => 0,
                    'totalReviews' => 0,
                    'totalTodayNew' => 0,
                    'totalPending' => 0,
                    'averageRating' => 0.0,
                ],
                'cached' => false,
            ];
            $this->saveServerData($reportKey, $emptyReport);

            return response()->json($emptyReport);
        }

        $todayDate = now()->toDateString();
        $yesterdayDate = now()->subDay()->toDateString();
        $reportItems = [];

        $combinedReviews = 0;
        $combinedTodayNew = 0;
        $combinedPending = 0;
        $totalRatingPoints = 0;
        $ratedProfilesCount = 0;

        foreach ($locations as $loc) {
            $locName = $loc['name'];
            $v4Name = $loc['v4Name'] ?? $this->resolveLocationV4Name($locName);
            $locIdHash = md5($locName);

            $totalCount = 0;
            $avgRating = 5.0;
            $todayCount = 0;
            $repliedCount = 0;
            $pendingCount = 0;

            try {
                $revResponse = Http::timeout(12)->connectTimeout(5)->withToken($accessToken)
                    ->get("https://mybusiness.googleapis.com/v4/{$v4Name}/reviews", [
                        'pageSize' => 50,
                    ]);

                if ($revResponse->successful()) {
                    $rawReviews = $revResponse->json('reviews', []);
                    $totalCount = (int) $revResponse->json('totalReviewCount', count($rawReviews));
                    $avgRating = (float) $revResponse->json('averageRating', 5.0);

                    foreach ($rawReviews as $r) {
                        $createTime = $r['createTime'] ?? '';
                        if (! empty($createTime)) {
                            try {
                                if (Carbon::parse($createTime)->setTimezone(config('app.timezone', 'UTC'))->isToday()) {
                                    $todayCount++;
                                }
                            } catch (\Throwable $e) {
                                if (str_starts_with($createTime, $todayDate)) {
                                    $todayCount++;
                                }
                            }
                        }
                        if (! empty($r['reviewReply']['comment'])) {
                            $repliedCount++;
                        } else {
                            $pendingCount++;
                        }
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Multi-profile report review fetch error for {$locName}: ".$e->getMessage());
            }

            // Snapshot history comparison
            $todaySnapshotKey = "gbp_snap_{$locIdHash}_{$todayDate}";
            $yesterdaySnapshotKey = "gbp_snap_{$locIdHash}_{$yesterdayDate}";
            $latestSnapshotKey = "gbp_snap_latest_{$locIdHash}";

            $yesterdaySnap = null;
            $latestSnap = null;
            try {
                $yesterdaySnap = Cache::get($yesterdaySnapshotKey);
                $latestSnap = Cache::get($latestSnapshotKey);
            } catch (\Throwable $e) {
            }

            if ($yesterdaySnap !== null && isset($yesterdaySnap['total'])) {
                $beforeTodayCount = (int) $yesterdaySnap['total'];
            } elseif ($latestSnap !== null && isset($latestSnap['total']) && ($latestSnap['date'] ?? '') !== $todayDate) {
                $beforeTodayCount = (int) $latestSnap['total'];
            } else {
                $beforeTodayCount = max(0, $totalCount - $todayCount);
            }

            $difference = $totalCount - $beforeTodayCount;

            // Save snapshot for continuous tracking
            try {
                Cache::forever($todaySnapshotKey, [
                    'total' => $totalCount,
                    'rating' => $avgRating,
                    'date' => $todayDate,
                ]);
                Cache::forever($latestSnapshotKey, [
                    'total' => $totalCount,
                    'rating' => $avgRating,
                    'date' => $todayDate,
                ]);
            } catch (\Throwable $e) {
            }

            $placeId = $loc['metadata']['placeId'] ?? null;
            $reviewLink = $placeId
                ? "https://search.google.com/local/writereview?placeid={$placeId}"
                : 'https://search.google.com/local/writereview';

            $reportItems[] = [
                'id' => $locName,
                'name' => $locName,
                'v4Name' => $v4Name,
                'title' => $loc['title'] ?? 'Google Profile',
                'address' => $loc['address'] ?? '',
                'storeCode' => $loc['storeCode'] ?? null,
                'totalReviews' => $totalCount,
                'beforeTodayReviews' => $beforeTodayCount,
                'todayNewReviews' => $todayCount,
                'difference' => $difference,
                'averageRating' => round($avgRating, 1),
                'repliedCount' => $repliedCount,
                'pendingCount' => $pendingCount,
                'reviewLink' => $reviewLink,
            ];

            $combinedReviews += $totalCount;
            $combinedTodayNew += $todayCount;
            $combinedPending += $pendingCount;
            if ($avgRating > 0) {
                $totalRatingPoints += $avgRating;
                $ratedProfilesCount++;
            }
        }

        $overallAverageRating = $ratedProfilesCount > 0 ? round($totalRatingPoints / $ratedProfilesCount, 1) : 5.0;

        $reportData = [
            'success' => true,
            'hasReport' => true,
            'userEmail' => $userEmail,
            'generatedAt' => now()->toIso8601String(),
            'locations' => $reportItems,
            'overall' => [
                'totalProfiles' => count($reportItems),
                'totalReviews' => $combinedReviews,
                'totalTodayNew' => $combinedTodayNew,
                'totalPending' => $combinedPending,
                'averageRating' => $overallAverageRating,
            ],
            'cached' => false,
        ];

        // Save report data persistently to server
        $this->saveServerData($reportKey, $reportData);

        return response()->json($reportData);
    }

    /**
     * Save custom baseline / snapshot for a profile
     */
    public function saveProfileSnapshot(Request $request)
    {
        $locName = $request->input('locationName');
        $beforeCount = (int) $request->input('beforeTodayReviews', 0);

        if (! $locName) {
            return response()->json(['error' => 'locationName is required'], 422);
        }

        $locIdHash = md5($locName);
        $yesterdayDate = now()->subDay()->toDateString();
        $yesterdaySnapshotKey = "gbp_snap_{$locIdHash}_{$yesterdayDate}";
        $latestSnapshotKey = "gbp_snap_latest_{$locIdHash}";

        try {
            Cache::forever($yesterdaySnapshotKey, [
                'total' => $beforeCount,
                'date' => $yesterdayDate,
            ]);
            Cache::forever($latestSnapshotKey, [
                'total' => $beforeCount,
                'date' => $yesterdayDate,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to save snapshot to cache: '.$e->getMessage());
        }

        // If saved report exists on server, update this profile inside it too!
        $token = $this->getPersistentToken() ?? [];
        $userEmail = $token['user_email'] ?? 'Google Account';
        $reportKey = 'gbp_multi_report_'.md5($userEmail);
        $savedReport = $this->getServerData($reportKey);
        if ($savedReport && ! empty($savedReport['locations'])) {
            foreach ($savedReport['locations'] as &$item) {
                if ($item['name'] === $locName || $item['id'] === $locName) {
                    $item['beforeTodayReviews'] = $beforeCount;
                    $item['difference'] = $item['totalReviews'] - $beforeCount;
                }
            }
            unset($item);
            $this->saveServerData($reportKey, $savedReport);
        }

        return response()->json([
            'success' => true,
            'message' => 'Baseline snapshot updated successfully',
            'beforeTodayReviews' => $beforeCount,
        ]);
    }

    /**
     * Render public, embeddable Google Reviews Widget
     */
    public function renderWidgetPreview(Request $request)
    {
        $widgetData = $this->buildWidgetData($request);

        return response()->view('widget', [
            'profile' => $widgetData['profile'],
            'reviews' => $widgetData['reviews'],
            'theme' => $widgetData['theme'],
            'layout' => $widgetData['layout'],
            'hideHeader' => $widgetData['hideHeader'],
            'accent' => $widgetData['accent'],
        ]);
    }

    /**
     * API endpoint returning widget reviews in JSON format
     */
    public function getWidgetReviews(Request $request)
    {
        $widgetData = $this->buildWidgetData($request);

        return response()->json([
            'success' => true,
            'profile' => $widgetData['profile'],
            'reviews' => $widgetData['reviews'],
            'theme' => $widgetData['theme'],
            'layout' => $widgetData['layout'],
        ])->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    }

    /**
     * Helper to prepare widget data for blade view & API
     */
    protected function buildWidgetData(Request $request): array
    {
        $locationParam = $request->query('locationName', $request->query('location', ''));
        $theme = $request->query('theme', 'light');
        if (! in_array($theme, ['light', 'dark', 'glass'])) {
            $theme = 'light';
        }
        $layout = $request->query('layout', 'carousel');
        if (! in_array($layout, ['carousel', 'grid', 'badge', 'list'])) {
            $layout = 'carousel';
        }
        $minRating = (int) $request->query('minRating', $request->query('min_rating', 1));
        if ($minRating < 1 || $minRating > 5) {
            $minRating = 1;
        }
        $hideHeader = filter_var($request->query('hideHeader', $request->query('hide_header', false)), FILTER_VALIDATE_BOOLEAN);
        $accent = (string) $request->query('accent', '#2563eb');
        if (! preg_match('/^#[0-9a-fA-F]{3,8}$/', $accent)) {
            $accent = '#2563eb';
        }
        $limit = max(1, min(100, (int) $request->query('limit', 20)));

        // 1. Resolve Location & Profile
        $matchedLoc = null;
        $token = $this->getPersistentToken() ?? [];
        $accountKey = 'gbp_locations_'.md5($token['user_email'] ?? 'default');
        $cachedLocations = $this->getServerData($accountKey) ?: [];

        if (! empty($cachedLocations) && is_array($cachedLocations)) {
            if (! empty($locationParam)) {
                foreach ($cachedLocations as $loc) {
                    if (($loc['name'] ?? '') === $locationParam ||
                        ($loc['v4Name'] ?? '') === $locationParam ||
                        ($loc['title'] ?? '') === $locationParam ||
                        ($loc['storeCode'] ?? '') === $locationParam) {
                        $matchedLoc = $loc;
                        break;
                    }
                }
            }
            if (! $matchedLoc) {
                $matchedLoc = $cachedLocations[0];
            }
        }

        $businessTitle = $matchedLoc['title'] ?? 'Google Customer Reviews';
        $placeId = $matchedLoc['metadata']['placeId'] ?? null;
        $reviewLink = $placeId
            ? "https://search.google.com/local/writereview?placeid={$placeId}"
            : 'https://search.google.com/local/writereview';

        // 2. Fetch Cached or Live Reviews
        $rawReviews = [];
        $averageRating = 5.0;
        $totalReviewCount = 0;

        $targetKeyName = $matchedLoc['name'] ?? $locationParam;
        $v4Name = $matchedLoc['v4Name'] ?? $this->resolveLocationV4Name($targetKeyName);

        // Check persistent server cache
        $cacheKeys = array_filter([
            $targetKeyName ? 'gbp_reviews_'.md5($targetKeyName) : null,
            $v4Name ? 'gbp_reviews_'.md5($v4Name) : null,
        ]);

        foreach ($cacheKeys as $ckey) {
            $savedData = $this->getServerData($ckey);
            if ($savedData && isset($savedData['reviews']) && is_array($savedData['reviews'])) {
                $rawReviews = $savedData['reviews'];
                $averageRating = (float) ($savedData['averageRating'] ?? 5.0);
                $totalReviewCount = (int) ($savedData['totalReviewCount'] ?? count($rawReviews));
                break;
            }
        }

        // If no reviews found in cache, attempt live fetch if token is valid
        if (empty($rawReviews) && ! empty($v4Name)) {
            $accessToken = $this->getValidAccessToken();
            if ($accessToken) {
                try {
                    $res = Http::timeout(12)->connectTimeout(5)->withToken($accessToken)
                        ->get("https://mybusiness.googleapis.com/v4/{$v4Name}/reviews", [
                            'pageSize' => 50,
                        ]);
                    if ($res->successful()) {
                        $pageReviews = $res->json('reviews', []);
                        $totalReviewCount = (int) $res->json('totalReviewCount', count($pageReviews));
                        $averageRating = (float) $res->json('averageRating', 5.0);

                        foreach ($pageReviews as $r) {
                            $reviewId = $r['reviewId'] ?? (basename($r['name'] ?? ''));
                            $rawReviews[] = [
                                'reviewId' => $reviewId,
                                'name' => $r['name'] ?? "{$v4Name}/reviews/{$reviewId}",
                                'reviewer' => [
                                    'displayName' => $r['reviewer']['displayName'] ?? 'Google User',
                                    'profilePhotoUrl' => $r['reviewer']['profilePhotoUrl'] ?? null,
                                ],
                                'starRating' => $r['starRating'] ?? 'FIVE',
                                'comment' => $r['comment'] ?? '',
                                'createTime' => $r['createTime'] ?? now()->toIso8601String(),
                                'updateTime' => $r['updateTime'] ?? null,
                                'reviewReply' => ! empty($r['reviewReply']) ? [
                                    'comment' => $r['reviewReply']['comment'] ?? '',
                                    'updateTime' => $r['reviewReply']['updateTime'] ?? now()->toIso8601String(),
                                ] : null,
                            ];
                        }

                        // Save in server cache
                        if (! empty($rawReviews)) {
                            $cachePayload = [
                                'reviews' => $rawReviews,
                                'averageRating' => $averageRating,
                                'totalReviewCount' => $totalReviewCount,
                                'savedAt' => now()->toIso8601String(),
                            ];
                            if ($targetKeyName) {
                                $this->saveServerData('gbp_reviews_'.md5($targetKeyName), $cachePayload);
                            }
                            $this->saveServerData('gbp_reviews_'.md5($v4Name), $cachePayload);
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning('buildWidgetData live fetch failed: '.$e->getMessage());
                }
            }
        }

        // 3. Format and Filter Reviews for the Widget
        $formattedReviews = [];
        foreach ($rawReviews as $r) {
            $starStr = $r['starRating'] ?? 'FIVE';
            $starNum = $this->ratingStringToNumber($starStr);

            // Filter out reviews below minimum rating configured (e.g. only 4★ and 5★ reviews)
            if ($starNum < $minRating) {
                continue;
            }

            // Calculate human-friendly time ago
            $timeAgo = 'Recently';
            if (! empty($r['createTime'])) {
                try {
                    $createCarbon = Carbon::parse($r['createTime']);
                    $timeAgo = $createCarbon->diffForHumans(['short' => true]);
                } catch (\Throwable $e) {
                    $timeAgo = 'Recently';
                }
            }

            $displayName = $r['reviewer']['displayName'] ?? 'Google User';
            $photoUrl = $r['reviewer']['profilePhotoUrl'] ?? null;
            $comment = trim($r['comment'] ?? '');
            $replyComment = $r['reviewReply']['comment'] ?? null;

            $formattedReviews[] = [
                'reviewerName' => $displayName,
                'profilePhotoUrl' => $photoUrl,
                'starRating' => $starNum,
                'comment' => $comment,
                'timeAgo' => $timeAgo,
                'ownerReply' => $replyComment,
            ];

            if (count($formattedReviews) >= $limit) {
                break;
            }
        }

        return [
            'profile' => [
                'title' => $businessTitle,
                'averageRating' => $averageRating,
                'totalReviews' => $totalReviewCount ?: count($rawReviews),
                'reviewLink' => $reviewLink,
            ],
            'reviews' => $formattedReviews,
            'theme' => $theme,
            'layout' => $layout,
            'hideHeader' => $hideHeader,
            'accent' => $accent,
        ];
    }
}
