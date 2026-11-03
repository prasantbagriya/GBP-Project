<?php

namespace Tests\Feature;

use App\Models\FacebookPage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FacebookPageManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $admin = User::firstOrCreate(
            ['email' => 'fbadmin@test.com'],
            ['name' => 'FB Admin', 'role' => 'admin', 'password' => 'secret123']
        );
        $this->actingAs($admin);
    }

    /**
     * Test unauthenticated access is blocked.
     */
    public function test_unauthenticated_user_cannot_access_facebook_management(): void
    {
        Auth::logout();
        $response = $this->getJson('/api/fb/status');
        $response->assertStatus(401);
    }

    /**
     * Test status endpoint returns expected structure.
     */
    public function test_status_endpoint_returns_expected_structure(): void
    {
        $response = $this->getJson('/api/fb/status');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'configured',
                'pages_count',
                'pages',
                'has_pages',
            ]);
    }

    /**
     * Test connecting a Facebook Page via manual access token.
     */
    public function test_manual_token_connection_creates_page(): void
    {
        Http::fake([
            'https://graph.facebook.com/v21.0/me*' => Http::response([
                'id' => '1029384756',
                'name' => 'Demo Coaching Institute',
                'category' => 'Education',
                'followers_count' => 1250,
                'fan_count' => 1200,
                'phone' => '+91 9610447938',
                'website' => 'https://example.com',
                'about' => 'Premier coaching institute in Sikar',
            ], 200),
        ]);

        $response = $this->postJson('/api/fb/manual-token', [
            'access_token' => 'EAA_test_mock_token_123',
            'page_id' => 'me',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('facebook_pages', [
            'page_id' => '1029384756',
            'name' => 'Demo Coaching Institute',
        ]);
    }

    /**
     * Test updating Facebook Page details.
     */
    public function test_updating_page_details(): void
    {
        $page = FacebookPage::create([
            'page_id' => '99887766',
            'name' => 'Test Academy',
            'access_token' => 'mock_token',
            'phone' => '1234567890',
            'about' => 'Old bio',
        ]);

        Http::fake([
            'https://graph.facebook.com/v21.0/99887766' => Http::response(['success' => true], 200),
        ]);

        $response = $this->postJson("/api/fb/pages/{$page->id}", [
            'about' => 'New updated bio for 2026',
            'phone' => '+91 9876543210',
            'website' => 'https://testacademy.com',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('facebook_pages', [
            'id' => $page->id,
            'about' => 'New updated bio for 2026',
            'phone' => '+91 9876543210',
        ]);
    }

    /**
     * Test generating AI reply for a comment.
     */
    public function test_ai_comment_reply_generation(): void
    {
        $response = $this->postJson('/api/fb/comment/ai-reply', [
            'comment' => 'Bahut hi badiya coaching hai, best teachers!',
            'userName' => 'Rahul Sharma',
            'businessName' => 'Sikar Coaching',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['reply']);

        $this->assertNotEmpty($response->json('reply'));
    }

    /**
     * Test generating AI post copy.
     */
    public function test_ai_post_copy_generation(): void
    {
        $response = $this->postJson('/api/fb/posts/ai-post', [
            'topic' => 'New NEET 2026 Batch Starting this Monday with 20% Scholarship',
            'businessName' => 'Elite Institute',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['post_text']);

        $this->assertNotEmpty($response->json('post_text'));
    }

    /**
     * Test disconnecting a page.
     */
    public function test_disconnecting_page(): void
    {
        $page = FacebookPage::create([
            'page_id' => '11223344',
            'name' => 'To Be Disconnected',
            'access_token' => 'mock_token',
        ]);

        $response = $this->deleteJson("/api/fb/pages/{$page->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('facebook_pages', [
            'id' => $page->id,
        ]);
    }
}
