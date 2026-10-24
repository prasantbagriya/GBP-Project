<?php

namespace Tests\Feature;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\ChatWidget;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatSupportFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_widget_init_creates_default_widget_and_conversation(): void
    {
        $response = $this->postJson('/api/chat/public/init', [
            'visitor_name' => 'Alice Test',
            'visitor_email' => 'alice@example.com',
            'page_url' => 'https://example.com/pricing',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'bot',
            ])
            ->assertJsonStructure([
                'visitor_token',
                'conversation_uuid',
                'widget' => ['uuid', 'title', 'brand_color', 'bot_name'],
                'messages',
            ]);

        $this->assertDatabaseHas('chat_widgets', [
            'title' => 'Live Support & Helpdesk',
        ]);

        $this->assertDatabaseHas('chat_conversations', [
            'visitor_name' => 'Alice Test',
            'visitor_email' => 'alice@example.com',
        ]);
    }

    public function test_visitor_can_send_message_and_receive_flow_response(): void
    {
        $widget = ChatWidget::getDefault();
        $conversation = ChatConversation::create([
            'widget_id' => $widget->id,
            'visitor_token' => 'test-visitor-token-123',
            'visitor_name' => 'Bob Builder',
            'status' => 'bot',
        ]);

        $response = $this->postJson('/api/chat/public/message', [
            'conversation_uuid' => $conversation->uuid,
            'content' => 'Hello there, can you help me?',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('chat_messages', [
            'conversation_id' => $conversation->id,
            'sender_type' => 'visitor',
            'content' => 'Hello there, can you help me?',
        ]);
    }

    public function test_visitor_can_submit_csat_feedback(): void
    {
        $widget = ChatWidget::getDefault();
        $conversation = ChatConversation::create([
            'widget_id' => $widget->id,
            'visitor_token' => 'test-token-csat',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/chat/public/feedback', [
            'conversation_uuid' => $conversation->uuid,
            'rating' => 5,
            'feedback' => 'Incredible fast support, thank you!',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('chat_conversations', [
            'id' => $conversation->id,
            'csat_rating' => 5,
            'csat_feedback' => 'Incredible fast support, thank you!',
            'status' => 'resolved',
        ]);
    }

    public function test_admin_can_list_conversations_and_view_details(): void
    {
        $widget = ChatWidget::getDefault();
        $user = User::factory()->create(['role' => 'admin', 'status' => 'active']);

        $conversation = ChatConversation::create([
            'widget_id' => $widget->id,
            'visitor_token' => 'admin-view-token',
            'visitor_name' => 'Charlie Visitor',
            'status' => 'waiting',
        ]);

        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'visitor',
            'sender_name' => 'Charlie Visitor',
            'content' => 'Need help with registration',
        ]);

        $listRes = $this->actingAs($user)->getJson('/api/chat/admin/conversations?filter=all');
        $listRes->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['counts', 'conversations']);

        $detailRes = $this->actingAs($user)->getJson("/api/chat/admin/conversations/{$conversation->uuid}");
        $detailRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'conversation' => [
                    'visitor_name' => 'Charlie Visitor',
                    'status' => 'waiting',
                ],
            ]);
    }

    public function test_agent_can_send_reply_and_private_whisper_note(): void
    {
        $widget = ChatWidget::getDefault();
        $agent = User::factory()->create(['name' => 'Agent Smith', 'role' => 'member', 'status' => 'active']);

        $conversation = ChatConversation::create([
            'widget_id' => $widget->id,
            'visitor_token' => 'whisper-token',
            'status' => 'waiting',
        ]);

        // Agent public message
        $replyRes = $this->actingAs($agent)->postJson("/api/chat/admin/conversations/{$conversation->uuid}/messages", [
            'content' => 'Hello! How may I assist you today?',
            'message_type' => 'text',
        ]);

        $replyRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => [
                    'sender_type' => 'agent',
                    'sender_name' => 'Agent Smith',
                    'content' => 'Hello! How may I assist you today?',
                ],
            ]);

        // Agent internal private whisper note
        $noteRes = $this->actingAs($agent)->postJson("/api/chat/admin/conversations/{$conversation->uuid}/messages", [
            'content' => 'Note: Visitor is asking about enterprise custom package.',
            'message_type' => 'private_note',
        ]);

        $noteRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => [
                    'message_type' => 'private_note',
                ],
            ]);

        // Verify visitor sync does not expose private whisper note
        $visitorSyncRes = $this->getJson("/api/chat/public/sync?conversation_uuid={$conversation->uuid}");
        $visitorSyncRes->assertStatus(200);
        $visitorMessages = collect($visitorSyncRes->json('messages'));
        $this->assertFalse($visitorMessages->contains('message_type', 'private_note'));
    }

    public function test_agent_can_reassign_conversation_to_team_member(): void
    {
        $widget = ChatWidget::getDefault();
        $admin = User::factory()->create(['name' => 'Admin User', 'role' => 'admin']);
        $specialist = User::factory()->create(['name' => 'Tech Specialist', 'role' => 'member']);

        $conversation = ChatConversation::create([
            'widget_id' => $widget->id,
            'visitor_token' => 'reassign-token',
            'status' => 'waiting',
        ]);

        $assignRes = $this->actingAs($admin)->postJson("/api/chat/admin/conversations/{$conversation->uuid}/assign", [
            'user_id' => $specialist->id,
            'transfer_note' => 'Needs technical troubleshooting assistance',
        ]);

        $assignRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'active',
                'assigned_user' => [
                    'id' => $specialist->id,
                    'name' => 'Tech Specialist',
                ],
            ]);

        $this->assertDatabaseHas('chat_conversations', [
            'id' => $conversation->id,
            'assigned_to_user_id' => $specialist->id,
            'status' => 'active',
        ]);
    }

    public function test_admin_can_save_and_retrieve_flow_builder_canvas(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $widget = ChatWidget::getDefault();

        $canvasData = [
            'nodes' => [
                ['id' => 'trigger_start', 'type' => 'trigger', 'position' => ['x' => 100, 'y' => 100], 'data' => ['label' => 'Start']],
                ['id' => 'node_welcome', 'type' => 'message', 'position' => ['x' => 300, 'y' => 100], 'data' => ['label' => 'Msg', 'message' => 'Custom Flow Greeting']],
            ],
            'edges' => [
                ['id' => 'e1', 'source' => 'trigger_start', 'target' => 'node_welcome'],
            ],
        ];

        $saveRes = $this->actingAs($user)->postJson('/api/chat/admin/flows', [
            'name' => 'Custom Marketing Bot',
            'description' => 'Tested via PHPUnit',
            'canvas_data' => $canvasData,
            'is_active' => true,
        ]);

        $saveRes->assertStatus(200)
            ->assertJson(['success' => true]);

        $getRes = $this->actingAs($user)->getJson('/api/chat/admin/flows');
        $getRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'flow' => [
                    'name' => 'Custom Marketing Bot',
                ],
            ]);
    }

    public function test_canned_responses_crud(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        // Create
        $createRes = $this->actingAs($user)->postJson('/api/chat/admin/canned-responses', [
            'shortcut' => '/discount',
            'title' => 'Offer 10% Discount',
            'content' => 'Use coupon code WELCOME10 for 10% off your first month!',
            'category' => 'Sales',
        ]);

        $createRes->assertStatus(200)->assertJson(['success' => true]);
        $cannedId = $createRes->json('canned_response.id');

        // Read
        $listRes = $this->actingAs($user)->getJson('/api/chat/admin/canned-responses');
        $listRes->assertStatus(200);
        $this->assertTrue(collect($listRes->json('canned_responses'))->contains('shortcut', '/discount'));

        // Delete
        $deleteRes = $this->actingAs($user)->deleteJson("/api/chat/admin/canned-responses/{$cannedId}");
        $deleteRes->assertStatus(200)->assertJson(['success' => true]);
    }

    public function test_embed_script_and_preview_endpoints(): void
    {
        $embedRes = $this->get('/embed/chat.js');
        $embedRes->assertStatus(200)
            ->assertHeader('Content-Type', 'application/javascript');

        $previewRes = $this->get('/chat/preview');
        $previewRes->assertStatus(200)
            ->assertSee('Live Support');
    }
}
