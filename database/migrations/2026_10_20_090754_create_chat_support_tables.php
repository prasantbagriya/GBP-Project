<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Chat Widgets Table
        Schema::create('chat_widgets', function (Blueprint $table) {
            $table->id();
            $table->string('uuid', 36)->unique();
            $table->string('name')->default('Main Website Widget');
            $table->string('brand_color', 30)->default('#4f46e5');
            $table->string('title')->default('Customer Support');
            $table->string('subtitle')->default('We typically reply in under 5 minutes');
            $table->string('bot_name')->default('Support AI Assistant');
            $table->string('avatar_url')->nullable();
            $table->string('launcher_icon', 30)->default('chat');
            $table->string('position', 30)->default('bottom-right');
            $table->boolean('pre_chat_form_enabled')->default(false);
            $table->json('pre_chat_fields')->nullable();
            $table->boolean('sound_enabled')->default(true);
            $table->boolean('offline_mode_enabled')->default(true);
            $table->text('offline_message')->nullable();
            $table->json('business_hours')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Chat Conversations Table
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->string('uuid', 36)->unique();
            $table->foreignId('widget_id')->constrained('chat_widgets')->cascadeOnDelete();
            $table->string('visitor_token', 64)->index();
            $table->string('visitor_name')->nullable();
            $table->string('visitor_email')->nullable();
            $table->string('visitor_phone')->nullable();
            $table->string('visitor_ip', 45)->nullable();
            $table->string('visitor_city')->nullable();
            $table->text('visitor_page_url')->nullable();
            $table->text('visitor_referrer')->nullable();
            $table->text('visitor_user_agent')->nullable();
            $table->foreignId('assigned_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->default('bot'); // bot, waiting, active, resolved, closed
            $table->string('priority', 20)->default('normal'); // low, normal, high, urgent
            $table->string('current_flow_node_id')->nullable();
            $table->json('collected_data')->nullable();
            $table->unsignedTinyInteger('csat_rating')->nullable(); // 1 to 5
            $table->text('csat_feedback')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['widget_id', 'status']);
            $table->index(['assigned_to_user_id', 'status']);
        });

        // 3. Chat Messages Table
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->string('uuid', 36)->unique();
            $table->foreignId('conversation_id')->constrained('chat_conversations')->cascadeOnDelete();
            $table->string('sender_type', 20); // visitor, bot, agent, system
            $table->unsignedBigInteger('sender_id')->nullable();
            $table->string('sender_name')->default('Visitor');
            $table->string('message_type', 30)->default('text'); // text, buttons, form, file, private_note
            $table->text('content')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
        });

        // 4. Chatbot Visual Flows Table
        Schema::create('chatbot_flows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('widget_id')->constrained('chat_widgets')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('trigger_type', 40)->default('chat_opened'); // chat_opened, first_message, keyword, after_hours
            $table->text('trigger_keywords')->nullable();
            $table->json('canvas_data')->nullable(); // nodes, edges, position
            $table->json('compiled_flow')->nullable(); // optimized execution graph
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();

            $table->index(['widget_id', 'is_active']);
        });

        // 5. Canned Responses Table
        Schema::create('chat_canned_responses', function (Blueprint $table) {
            $table->id();
            $table->string('shortcut', 50)->unique();
            $table->string('title');
            $table->text('content');
            $table->string('category', 50)->default('General');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_canned_responses');
        Schema::dropIfExists('chatbot_flows');
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_conversations');
        Schema::dropIfExists('chat_widgets');
    }
};
