<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SecurityAndBugFixesTest extends TestCase
{
    public function test_upload_post_image_rejects_executable_php_script(): void
    {
        $maliciousFile = UploadedFile::fake()->create('exploit.php', 10, 'text/x-php');

        $response = $this->postJson('/api/gbp/posts/upload-image', [
            'image' => $maliciousFile,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'error' => 'Unsupported image format. Allowed formats: JPG, JPEG, PNG, WEBP, GIF, BMP, AVIF.',
            ]);

        // Verify no PHP file was copied into public uploads
        $files = File::glob(public_path('uploads/posts/*.php'));
        $this->assertEmpty($files, 'No PHP script should ever be written to uploads directory.');
    }

    public function test_upload_post_image_accepts_valid_image(): void
    {
        $validImage = UploadedFile::fake()->image('banner.jpg', 600, 400);

        $response = $this->postJson('/api/gbp/posts/upload-image', [
            'image' => $validImage,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'mediaFormat' => 'PHOTO',
            ]);

        $filename = $response->json('filename');
        $this->assertNotEmpty($filename);

        // Cleanup created test file
        $filePath = public_path('uploads/posts/'.$filename);
        if (File::exists($filePath)) {
            @unlink($filePath);
        }
    }

    public function test_widget_accent_color_sanitized_against_css_injection(): void
    {
        $payload = 'red;}body{display:none;}';
        $response = $this->get('/widget/preview?accent='.urlencode($payload));

        $response->assertStatus(200);
        $content = $response->getContent();

        // Must fallback to safe default hex color
        $this->assertStringContainsString('--accent: #2563eb;', $content);
        $this->assertStringNotContainsString('display:none', $content);
    }

    public function test_ssrf_rejects_internal_ip_requests_safely(): void
    {
        $response = $this->postJson('/api/gbp/posts/extract-link', [
            'content' => 'http://127.0.0.1:8000/internal-secrets',
        ]);

        // Endpoint should safely handle without making internal network request
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Extracted media URL should not point to internal IP
        $mediaUrl = $response->json('mediaUrl');
        $this->assertStringNotContainsString('127.0.0.1', $mediaUrl);
    }

    public function test_status_endpoint_returns_client_id_from_services_config(): void
    {
        config(['services.google.client_id' => 'test-google-client-id-12345']);

        $response = $this->getJson('/api/user/status');

        $response->assertStatus(200)
            ->assertJson([
                'hasGoogleCredentials' => true,
                'clientId' => 'test-google-client-id-12345',
            ]);
    }

    public function test_ai_rules_are_strictly_isolated_per_profile(): void
    {
        // 1. Configure Profile A: enabled = true, minStarRating = 5, custom instructions
        $resA = $this->postJson('/api/settings/ai-rules', [
            'locationName' => 'locations/branch-a',
            'enabled' => true,
            'minStarRating' => 5,
            'tone' => 'Joyful & Inspiring',
            'customInstructions' => 'Instructions for Branch A only.',
        ]);
        $resA->assertStatus(200)
            ->assertJsonPath('rules.enabled', true)
            ->assertJsonPath('rules.minStarRating', 5)
            ->assertJsonPath('rules.customInstructions', 'Instructions for Branch A only.');

        // 2. Query Profile B (which has not had rules saved): must be disabled by default and NOT inherit Branch A's custom instructions or 5-star rule
        $resB = $this->getJson('/api/settings/ai-rules?locationName=locations/branch-b');
        $resB->assertStatus(200)
            ->assertJsonPath('rules.enabled', false)
            ->assertJsonPath('rules.minStarRating', 1);

        // 3. Configure Profile B separately: enabled = true, minStarRating = 2
        $resSaveB = $this->postJson('/api/settings/ai-rules', [
            'locationName' => 'locations/branch-b',
            'enabled' => true,
            'minStarRating' => 2,
            'tone' => 'Empathetic & Solution-Oriented',
            'customInstructions' => 'Instructions for Branch B only.',
        ]);
        $resSaveB->assertStatus(200)
            ->assertJsonPath('rules.minStarRating', 2);

        // 4. Verify Profile A is completely unaffected by Profile B's changes
        $verifyA = $this->getJson('/api/settings/ai-rules?locationName=locations/branch-a');
        $verifyA->assertStatus(200)
            ->assertJsonPath('rules.enabled', true)
            ->assertJsonPath('rules.minStarRating', 5)
            ->assertJsonPath('rules.customInstructions', 'Instructions for Branch A only.');
    }

    public function test_auto_reply_new_reviews_requires_location_name(): void
    {
        $response = $this->postJson('/api/gbp/reviews/auto-reply-new', []);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'locationName is required to auto-reply to new reviews.',
            ]);
    }

    public function test_auto_reply_new_reviews_skips_when_profile_auto_reply_is_disabled(): void
    {
        // Authenticate with dummy token
        Cache::forever('gbp_persistent_google_token', [
            'access_token' => 'ya29.test-access-token',
            'refresh_token' => '1//test-refresh-token',
            'expires_in' => 3599,
            'created' => time(),
            'user_email' => 'client@example.com',
        ]);

        // Branch C has auto-reply disabled
        $this->postJson('/api/settings/ai-rules', [
            'locationName' => 'locations/branch-c',
            'enabled' => false,
        ]);

        $response = $this->postJson('/api/gbp/reviews/auto-reply-new', [
            'locationName' => 'locations/branch-c',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => false,
                'enabled' => false,
            ]);
    }

    public function test_auto_reply_new_reviews_processes_eligible_reviews_per_profile_rules(): void
    {
        // Authenticate with dummy token
        Cache::forever('gbp_persistent_google_token', [
            'access_token' => 'ya29.test-access-token',
            'refresh_token' => '1//test-refresh-token',
            'expires_in' => 3599,
            'created' => time(),
            'user_email' => 'client@example.com',
        ]);

        $locName = 'locations/branch-active';
        $v4Name = 'accounts/123/locations/branch-active';

        // Set Profile Rules: enabled = true, minStarRating = 4
        $this->postJson('/api/settings/ai-rules', [
            'locationName' => $locName,
            'enabled' => true,
            'minStarRating' => 4,
            'replyToEmptyReviews' => true,
        ]);

        // Seed cached reviews for this profile:
        // 1. Five-star unreplied review -> eligible
        // 2. Two-star unreplied review -> skipped (below 4-star minimum threshold)
        // 3. Five-star already-replied review -> not pending
        $reviews = [
            [
                'reviewId' => 'rev-5-star',
                'name' => "{$v4Name}/reviews/rev-5-star",
                'reviewer' => ['displayName' => 'Amit Kumar'],
                'starRating' => 'FIVE',
                'comment' => 'Great experience!',
                'createTime' => now()->toIso8601String(),
                'reviewReply' => null,
            ],
            [
                'reviewId' => 'rev-2-star',
                'name' => "{$v4Name}/reviews/rev-2-star",
                'reviewer' => ['displayName' => 'Rahul Verma'],
                'starRating' => 'TWO',
                'comment' => 'Slow handling',
                'createTime' => now()->toIso8601String(),
                'reviewReply' => null,
            ],
            [
                'reviewId' => 'rev-already-replied',
                'name' => "{$v4Name}/reviews/rev-already-replied",
                'reviewer' => ['displayName' => 'Pooja Singh'],
                'starRating' => 'FIVE',
                'comment' => 'Loved it',
                'createTime' => now()->toIso8601String(),
                'reviewReply' => ['comment' => 'Thanks Pooja!'],
            ],
        ];

        Cache::forever('gbp_reviews_'.md5($locName), [
            'reviews' => $reviews,
            'averageRating' => 4.0,
            'totalReviewCount' => 3,
        ]);

        // Mock Google review reply PUT request and Google reviews live fetch
        Http::fake([
            'mybusiness.googleapis.com/v4/*/reviews*' => Http::response([
                'reviews' => [],
                'totalReviewCount' => 3,
                'averageRating' => 4.0,
            ], 200),
            'mybusiness.googleapis.com/v4/*/reply' => Http::response([
                'comment' => 'Thank you so much Amit Kumar!',
                'updateTime' => now()->toIso8601String(),
            ], 200),
        ]);

        $response = $this->postJson('/api/gbp/reviews/auto-reply-new', [
            'locationName' => $locName,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'enabled' => true,
                'locationName' => $locName,
                'totalPending' => 2,
                'repliedCount' => 1,
                'skippedCount' => 1,
            ]);

        $this->assertEquals('rev-5-star', $response->json('replies.0.reviewId'));
        $this->assertEquals('rev-2-star', $response->json('skipped.0.reviewId'));
    }

    public function test_artisan_command_gbp_auto_reply_runs_successfully(): void
    {
        Cache::forever('gbp_persistent_google_token', [
            'access_token' => 'ya29.test-access-token',
            'refresh_token' => '1//test-refresh-token',
            'expires_in' => 3599,
            'created' => time(),
            'user_email' => 'client@example.com',
        ]);

        // Set cached locations
        $accountKey = 'gbp_locations_'.md5('client@example.com');
        Cache::forever($accountKey, [
            [
                'name' => 'locations/loc-disabled',
                'v4Name' => 'accounts/123/locations/loc-disabled',
                'title' => 'Disabled Location',
            ],
        ]);

        // Disabled by default
        $exitCode = Artisan::call('gbp:auto-reply');
        $this->assertEquals(0, $exitCode);
    }

    public function test_extract_post_from_link_extracts_full_caption_and_ignores_truncated_og_description(): void
    {
        $mockHtml = '<!DOCTYPE html><html><head>'
            .'<meta property="og:description" content="Admission open for NDA 2026 batch at our campus. Call for info... See more">'
            .'<meta property="og:image" content="https://scontent.fdel1-1.fna.fbcdn.net/v/t39.30808-6/image_123.jpg">'
            .'</head><body>'
            .'<script>'
            .'require("ScheduledServerJS").handle({"require":[["RelayStore",[],[{"message":{"text":"📢 Admissions Open for NDA Foundation Batch 2026!\n\n🎖️ India’s premier defence coaching institute.\n📚 Comprehensive study material, physical training, and SSB guidance.\n\n📍 Visit Sikar Campus or call 9876543210 for registration."}}]]});'
            .'</script>'
            .'</body></html>';

        Http::fake([
            'https://www.facebook.com/testpage/posts/123456*' => Http::response($mockHtml, 200),
            'https://www.facebook.com/plugins/post.php*' => Http::response($mockHtml, 200),
            '*' => Http::response('', 200),
        ]);

        $response = $this->postJson('/api/gbp/posts/extract-link', [
            'content' => 'https://www.facebook.com/testpage/posts/123456',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $caption = $response->json('caption');
        $this->assertStringContainsString('Admissions Open for NDA Foundation Batch 2026', $caption);
        $this->assertStringContainsString('Comprehensive study material', $caption);
        $this->assertStringContainsString('Visit Sikar Campus', $caption);
        $this->assertStringNotContainsString('See more', $caption);
    }

    public function test_extract_post_from_link_preserves_user_pasted_text_alongside_link(): void
    {
        $mockHtml = '<!DOCTYPE html><html><head>'
            .'<meta property="og:description" content="Short preview... See more">'
            .'</head><body></body></html>';

        Http::fake([
            '*' => Http::response($mockHtml, 200),
        ]);

        $userText = 'Special batch starting next Monday! All new students get a complimentary welcome kit. Enroll now at campus.';
        $response = $this->postJson('/api/gbp/posts/extract-link', [
            'content' => $userText.' https://www.facebook.com/testpage/posts/999999',
        ]);

        $response->assertStatus(200);
        $caption = $response->json('caption');
        $this->assertStringContainsString('Special batch starting next Monday', $caption);
        $this->assertStringContainsString('complimentary welcome kit', $caption);
    }

    public function test_update_post_with_call_cta_does_not_send_url_to_google_api(): void
    {
        Cache::forever('gbp_persistent_google_token', [
            'access_token' => 'ya29.test-access-token',
            'refresh_token' => '1//test-refresh-token',
            'expires_in' => 3599,
            'created' => time(),
            'user_email' => 'client@example.com',
        ]);

        $recordedPayload = null;
        Http::fake([
            'mybusiness.googleapis.com/v4/accounts/123/locations/loc-1/localPosts/post-1*' => function ($request) use (&$recordedPayload) {
                $recordedPayload = $request->data();

                return Http::response([
                    'name' => 'accounts/123/locations/loc-1/localPosts/post-1',
                    'summary' => 'Updated summary text',
                ], 200);
            },
        ]);

        $response = $this->postJson('/api/gbp/posts/update', [
            'postId' => 'accounts/123/locations/loc-1/localPosts/post-1',
            'locationName' => 'locations/loc-1',
            'summary' => 'Updated summary text',
            'topicType' => 'STANDARD',
            'callToAction' => [
                'actionType' => 'CALL',
                'url' => 'tel:+919876543210',
            ],
        ]);

        $response->assertStatus(200);
        $this->assertNotNull($recordedPayload);
        $this->assertEquals('CALL', $recordedPayload['callToAction']['actionType'] ?? null);
        $this->assertArrayNotHasKey('url', $recordedPayload['callToAction'], 'Google LocalPost API rejects CALL actionType when url is present');
    }

    public function test_create_post_handles_event_topic_type_gracefully(): void
    {
        Cache::forever('gbp_persistent_google_token', [
            'access_token' => 'ya29.test-access-token',
            'refresh_token' => '1//test-refresh-token',
            'expires_in' => 3599,
            'created' => time(),
            'user_email' => 'client@example.com',
        ]);

        $accountKey = 'gbp_locations_'.md5('client@example.com');
        Cache::forever($accountKey, [
            [
                'name' => 'locations/loc-event',
                'v4Name' => 'accounts/123/locations/loc-event',
                'title' => 'Event Location',
            ],
        ]);

        $recordedPayload = null;
        Http::fake([
            'mybusiness.googleapis.com/v4/accounts/123/locations/loc-event/localPosts' => function ($request) use (&$recordedPayload) {
                $recordedPayload = $request->data();

                return Http::response([
                    'name' => 'accounts/123/locations/loc-event/localPosts/new-event-post',
                    'topicType' => 'EVENT',
                    'summary' => 'Annual Sports Meet 2026',
                ], 200);
            },
        ]);

        $response = $this->postJson('/api/gbp/posts', [
            'locationName' => 'locations/loc-event',
            'topicType' => 'EVENT',
            'summary' => 'Annual Sports Meet 2026',
        ]);

        $response->assertStatus(200);
        $this->assertNotNull($recordedPayload);
        $this->assertEquals('EVENT', $recordedPayload['topicType']);
        $this->assertArrayHasKey('event', $recordedPayload);
        $this->assertNotEmpty($recordedPayload['event']['title']);
        $this->assertArrayHasKey('schedule', $recordedPayload['event']);
        $this->assertArrayHasKey('startDate', $recordedPayload['event']['schedule']);
        $this->assertArrayHasKey('endDate', $recordedPayload['event']['schedule']);
    }

    public function test_reviews_embed_script_has_fixed_height_safeguards(): void
    {
        $scriptPath = public_path('embed/reviews.js');
        $this->assertFileExists($scriptPath);

        $scriptContent = File::get($scriptPath);
        $this->assertStringContainsString('data-height', $scriptContent);
        $this->assertStringContainsString('isFixed', $scriptContent);
        $this->assertStringContainsString('maxLimit', $scriptContent);
    }

    public function test_widget_preview_renders_compact_clamped_structure(): void
    {
        $response = $this->get('/widget/preview?layout=carousel');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertStringContainsString('-webkit-line-clamp', $content);
        $this->assertStringContainsString('gbp-widget-resize', $content);
    }
}
