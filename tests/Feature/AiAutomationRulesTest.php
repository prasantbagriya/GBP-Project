<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AiAutomationRulesTest extends TestCase
{
    public function test_can_fetch_default_ai_automation_rules(): void
    {
        $response = $this->getJson('/api/settings/ai-rules');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'rules' => [
                    'enabled',
                    'minStarRating',
                    'replyToEmptyReviews',
                    'maxRepliesPerMinute',
                    'delayBetweenRepliesSeconds',
                    'tone',
                    'antiToxicityGuard',
                    'languageMatching',
                    'includeReviewerName',
                    'referenceSpecificExperience',
                    'contactPhone',
                    'contactEmail',
                    'customInstructions',
                    'model',
                ],
            ]);
    }

    public function test_can_update_ai_automation_rules(): void
    {
        $payload = [
            'maxRepliesPerMinute' => 12,
            'delayBetweenRepliesSeconds' => 4,
            'minStarRating' => 4,
            'replyToEmptyReviews' => false,
            'tone' => 'Empathetic & Solution-Oriented',
            'antiToxicityGuard' => true,
            'languageMatching' => true,
            'includeReviewerName' => true,
            'referenceSpecificExperience' => true,
            'contactPhone' => '+91 9999999999',
            'contactEmail' => 'help@example.com',
            'customInstructions' => 'Always mention our upcoming batch.',
        ];

        $response = $this->postJson('/api/settings/ai-rules', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('rules.maxRepliesPerMinute', 12)
            ->assertJsonPath('rules.minStarRating', 4)
            ->assertJsonPath('rules.tone', 'Empathetic & Solution-Oriented');
    }

    public function test_generate_reply_respects_star_rating_threshold(): void
    {
        // Set minimum star rating to 4 stars
        $this->postJson('/api/settings/ai-rules', [
            'minStarRating' => 4,
        ]);

        // Attempt reply for 2-star review
        $response = $this->postJson('/api/reviews/ai-reply', [
            'reviewerName' => 'Rahul Sharma',
            'starRating' => 'TWO',
            'comment' => 'Slow service',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => false,
                'eligible' => false,
            ]);
    }

    public function test_can_toggle_gemini_ai_status(): void
    {
        $response = $this->postJson('/api/settings/ai', [
            'enabled' => true,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'enabled' => true,
            ]);
    }

    public function test_multi_profile_report_endpoint_requires_auth(): void
    {
        $response = $this->getJson('/api/gbp/multi-profile-report');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'authenticated' => false,
            ]);
    }

    public function test_can_save_profile_snapshot_baseline(): void
    {
        $response = $this->postJson('/api/gbp/multi-profile-snapshot', [
            'locationName' => 'locations/test12345',
            'beforeTodayReviews' => 538,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Baseline snapshot updated successfully',
            ]);
    }

    public function test_persistent_token_retrieval_and_logout(): void
    {
        $dummyToken = [
            'access_token' => 'ya29.test-persistent-access-token',
            'refresh_token' => '1//test-refresh-token',
            'expires_in' => 3599,
            'created' => time(),
            'user_email' => 'persisted-user@example.com',
        ];

        // Store in cache
        Cache::forever('gbp_persistent_google_token', $dummyToken);

        // Status should be authenticated even with fresh session!
        $statusRes = $this->getJson('/api/user/status');
        $statusRes->assertStatus(200)
            ->assertJson([
                'isAuthenticated' => true,
                'userEmail' => 'persisted-user@example.com',
            ]);

        // Explicit logout clears everything
        $logoutRes = $this->postJson('/api/logout');
        $logoutRes->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Now status should be unauthenticated
        $statusAfterLogout = $this->getJson('/api/user/status');
        $statusAfterLogout->assertStatus(200)
            ->assertJson([
                'isAuthenticated' => false,
            ]);
    }

    public function test_multi_profile_report_returns_not_generated_when_cached_report_does_not_exist(): void
    {
        $dummyToken = [
            'access_token' => 'ya29.test-access-token',
            'refresh_token' => '1//test-refresh-token',
            'expires_in' => 3599,
            'created' => time(),
            'user_email' => 'client@example.com',
        ];
        Cache::forever('gbp_persistent_google_token', $dummyToken);

        $response = $this->getJson('/api/gbp/multi-profile-report');
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'hasReport' => false,
            ]);
    }

    public function test_multi_profile_report_serves_cached_data_without_external_api_call(): void
    {
        $userEmail = 'persisted-user@example.com';
        $dummyToken = [
            'access_token' => 'ya29.test-access-token',
            'refresh_token' => '1//test-refresh-token',
            'expires_in' => 3599,
            'created' => time(),
            'user_email' => $userEmail,
        ];
        Cache::forever('gbp_persistent_google_token', $dummyToken);

        $reportKey = 'gbp_multi_report_'.md5($userEmail);
        $savedData = [
            'success' => true,
            'hasReport' => true,
            'userEmail' => $userEmail,
            'generatedAt' => '2026-10-11T12:00:00+00:00',
            'locations' => [
                [
                    'id' => 'locations/loc-1',
                    'name' => 'locations/loc-1',
                    'title' => 'Test Coaching Profile',
                    'totalReviews' => 120,
                    'beforeTodayReviews' => 118,
                    'todayNewReviews' => 2,
                    'difference' => 2,
                    'averageRating' => 4.9,
                    'repliedCount' => 110,
                    'pendingCount' => 10,
                ],
            ],
            'overall' => [
                'totalProfiles' => 1,
                'totalReviews' => 120,
                'totalTodayNew' => 2,
                'totalPending' => 10,
                'averageRating' => 4.9,
            ],
        ];
        Cache::forever($reportKey, $savedData);

        $response = $this->getJson('/api/gbp/multi-profile-report');
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'hasReport' => true,
                'cached' => true,
                'overall' => [
                    'totalReviews' => 120,
                ],
            ]);
    }

    public function test_posts_and_services_serve_cached_server_data_when_not_refreshing(): void
    {
        $locName = 'locations/test-branch';
        $postsKey = 'gbp_posts_'.md5($locName);
        $servicesKey = 'gbp_services_'.md5($locName);

        $mockPosts = [
            ['id' => 'post-1', 'summary' => 'Admissions open for new batch!'],
        ];
        $mockServices = [
            ['id' => '1', 'name' => 'NDA Foundation Course', 'price' => 50000],
        ];

        Cache::forever($postsKey, $mockPosts);
        Cache::forever($servicesKey, $mockServices);

        // Fetch posts without refresh
        $postsRes = $this->getJson('/api/gbp/posts?locationName='.urlencode($locName));
        $postsRes->assertStatus(200)
            ->assertJson([
                'cached' => true,
                'posts' => $mockPosts,
            ]);

        // Fetch services without refresh
        $servicesRes = $this->getJson('/api/gbp/services?locationName='.urlencode($locName));
        $servicesRes->assertStatus(200)
            ->assertJson([
                'cached' => true,
                'services' => $mockServices,
            ]);
    }

    public function test_ai_sentiment_serves_cached_data_on_get_request(): void
    {
        $locName = 'locations/test-branch';
        $sentimentKey = 'gbp_sentiment_'.md5($locName);

        $mockSentiment = [
            'hasSentiment' => true,
            'overallSentiment' => 'POSITIVE',
            'positiveScore' => 95,
            'neutralScore' => 5,
            'negativeScore' => 0,
            'topPraises' => ['Excellent faculty'],
            'topComplaints' => [],
            'actionRecommendation' => 'Keep up the good work.',
        ];

        Cache::forever($sentimentKey, $mockSentiment);

        $res = $this->getJson('/api/reviews/ai-sentiment?locationName='.urlencode($locName));
        $res->assertStatus(200)
            ->assertJson([
                'cached' => true,
                'hasSentiment' => true,
                'positiveScore' => 95,
            ]);
    }
}
