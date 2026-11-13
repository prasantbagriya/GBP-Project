<?php

namespace App\Http\Controllers;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\ChatWidget;
use App\Services\ChatbotEngineService;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class ChatWidgetController extends Controller
{
    public function __construct(
        protected ChatbotEngineService $engine
    ) {}

    /**
     * Initialize or resume visitor chat session.
     */
    public function init(Request $request): JsonResponse
    {
        $widgetUuid = $request->input('widget_id');
        $widget = $widgetUuid ? ChatWidget::where('uuid', $widgetUuid)->first() : ChatWidget::getDefault();

        if (! $widget) {
            $widget = ChatWidget::getDefault();
        }

        $visitorToken = $request->input('visitor_token');
        if (empty($visitorToken)) {
            $visitorToken = (string) Str::uuid();
        }

        // Find existing unclosed conversation or create new
        $conversation = ChatConversation::where('widget_id', $widget->id)
            ->where('visitor_token', $visitorToken)
            ->whereIn('status', ['bot', 'waiting', 'active'])
            ->latest('id')
            ->first();

        $isNew = false;
        if (! $conversation) {
            $isNew = true;
            $conversation = ChatConversation::create([
                'widget_id' => $widget->id,
                'visitor_token' => $visitorToken,
                'visitor_name' => $request->input('visitor_name'),
                'visitor_email' => $request->input('visitor_email'),
                'visitor_phone' => $request->input('visitor_phone'),
                'visitor_ip' => $request->ip(),
                'visitor_page_url' => $request->input('page_url'),
                'visitor_referrer' => $request->input('referrer'),
                'visitor_user_agent' => $request->userAgent(),
                'status' => 'bot',
                'priority' => 'normal',
                'last_message_at' => now(),
            ]);

            // Execute entry flow nodes
            $this->engine->startConversation($conversation);
        } else {
            // Update page URL if visitor navigated
            if ($request->filled('page_url')) {
                $conversation->update(['visitor_page_url' => $request->input('page_url')]);
            }
        }

        $messages = $conversation->messages()
            ->visitorFacing()
            ->get()
            ->map(fn (ChatMessage $m) => [
                'id' => $m->id,
                'uuid' => $m->uuid,
                'sender_type' => $m->sender_type,
                'sender_name' => $m->sender_name,
                'message_type' => $m->message_type,
                'content' => $m->content,
                'metadata' => $m->metadata,
                'created_at' => $m->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'success' => true,
            'visitor_token' => $visitorToken,
            'conversation_uuid' => $conversation->uuid,
            'status' => $conversation->status,
            'assigned_agent' => $conversation->assignedUser ? [
                'id' => $conversation->assignedUser->id,
                'name' => $conversation->assignedUser->name,
            ] : null,
            'widget' => [
                'uuid' => $widget->uuid,
                'title' => $widget->title,
                'subtitle' => $widget->subtitle,
                'brand_color' => $widget->brand_color,
                'bot_name' => $widget->bot_name,
                'avatar_url' => $widget->avatar_url,
                'launcher_icon' => $widget->launcher_icon,
                'position' => $widget->position,
                'pre_chat_form_enabled' => $widget->pre_chat_form_enabled,
                'pre_chat_fields' => $widget->pre_chat_fields,
                'sound_enabled' => $widget->sound_enabled,
                'offline_mode_enabled' => $widget->offline_mode_enabled,
                'offline_message' => $widget->offline_message,
            ],
            'messages' => $messages,
        ]);
    }

    /**
     * Visitor sends message or clicks interactive button.
     */
    public function sendMessage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_uuid' => ['required', 'string'],
            'content' => ['nullable', 'string', 'max:3000'],
            'button_payload' => ['nullable', 'string'],
            'visitor_token' => ['nullable', 'string'],
        ]);

        $conversation = ChatConversation::where('uuid', $validated['conversation_uuid'])->first();
        if (! $conversation) {
            return response()->json(['error' => 'Conversation not found.'], 404);
        }

        $content = trim($validated['content'] ?? '');
        $buttonPayload = $validated['button_payload'] ?? null;

        if ($content === '' && ! $buttonPayload) {
            return response()->json(['error' => 'Message content is required.'], 422);
        }

        // If conversation was resolved, reopen it
        if (in_array($conversation->status, ['resolved', 'closed'])) {
            $conversation->update([
                'status' => $conversation->assigned_to_user_id ? 'active' : 'bot',
                'resolved_at' => null,
            ]);
        }

        // Save visitor message
        $visitorMessage = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'visitor',
            'sender_name' => $conversation->visitor_name ?: 'Visitor',
            'message_type' => 'text',
            'content' => $content ?: ($buttonPayload ? 'Selected option' : ''),
            'metadata' => $buttonPayload ? ['button_selected' => $buttonPayload] : null,
        ]);

        $conversation->update(['last_message_at' => now()]);

        // Process through engine (only if in bot mode)
        if ($conversation->status === 'bot') {
            $this->engine->processVisitorMessage($conversation, $content, $buttonPayload);
        }

        // Return latest messages
        $messages = $conversation->messages()
            ->visitorFacing()
            ->where('id', '>=', $visitorMessage->id)
            ->get()
            ->map(fn (ChatMessage $m) => [
                'id' => $m->id,
                'uuid' => $m->uuid,
                'sender_type' => $m->sender_type,
                'sender_name' => $m->sender_name,
                'message_type' => $m->message_type,
                'content' => $m->content,
                'metadata' => $m->metadata,
                'created_at' => $m->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'success' => true,
            'status' => $conversation->status,
            'messages' => $messages,
        ]);
    }

    /**
     * Poll new messages for visitor widget.
     */
    public function sync(Request $request): JsonResponse
    {
        $conversationUuid = $request->query('conversation_uuid');
        $afterId = (int) $request->query('after_id', 0);

        if (! $conversationUuid) {
            return response()->json(['error' => 'conversation_uuid required'], 400);
        }

        $conversation = ChatConversation::where('uuid', $conversationUuid)->first();
        if (! $conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        $query = $conversation->messages()->visitorFacing();
        if ($afterId > 0) {
            $query->where('id', '>', $afterId);
        }

        $newMessages = $query->get()->map(fn (ChatMessage $m) => [
            'id' => $m->id,
            'uuid' => $m->uuid,
            'sender_type' => $m->sender_type,
            'sender_name' => $m->sender_name,
            'message_type' => $m->message_type,
            'content' => $m->content,
            'metadata' => $m->metadata,
            'created_at' => $m->created_at?->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'status' => $conversation->status,
            'assigned_agent' => $conversation->assignedUser ? [
                'id' => $conversation->assignedUser->id,
                'name' => $conversation->assignedUser->name,
            ] : null,
            'messages' => $newMessages,
        ]);
    }

    /**
     * Submit CSAT rating & optional feedback.
     */
    public function feedback(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_uuid' => ['required', 'string'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'feedback' => ['nullable', 'string', 'max:1000'],
        ]);

        $conversation = ChatConversation::where('uuid', $validated['conversation_uuid'])->first();
        if (! $conversation) {
            return response()->json(['error' => 'Conversation not found.'], 404);
        }

        $conversation->update([
            'csat_rating' => $validated['rating'],
            'csat_feedback' => $validated['feedback'] ?? null,
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);

        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'system',
            'sender_name' => 'System',
            'message_type' => 'text',
            'content' => "Thank you for rating us {$validated['rating']} stars! Your feedback helps us improve.",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your feedback!',
        ]);
    }

    /**
     * Serve dynamic embed script for third-party websites.
     */
    public function embedScript(): Response
    {
        $defaultWidget = ChatWidget::getDefault();
        $origin = request()->getSchemeAndHttpHost();

        $jsContent = <<<JS
(function() {
    if (window.__GBP_CHAT_INITIALIZED__) return;
    window.__GBP_CHAT_INITIALIZED__ = true;

    var scriptTag = document.currentScript || (function() {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();

    var widgetId = (scriptTag && scriptTag.getAttribute('data-widget-id')) || '{$defaultWidget->uuid}';
    var host = '{$origin}';

    // Create container
    var container = document.createElement('div');
    container.id = 'gbp-live-chat-container';
    container.style.cssText = 'position:fixed; z-index:9999999; bottom:20px; right:20px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
    document.body.appendChild(container);

    // Floating launcher button
    var launcher = document.createElement('button');
    launcher.id = 'gbp-chat-launcher';
    launcher.setAttribute('aria-label', 'Open Live Support Chat');
    launcher.style.cssText = 'width:60px; height:60px; border-radius:50%; background:{$defaultWidget->brand_color}; color:#fff; border:none; box-shadow:0 8px 24px rgba(0,0,0,0.18); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); outline:none;';
    launcher.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    container.appendChild(launcher);

    // Iframe chat box
    var iframe = document.createElement('iframe');
    iframe.id = 'gbp-chat-iframe';
    iframe.src = host + '/chat/preview?widget_id=' + encodeURIComponent(widgetId) + '&page_url=' + encodeURIComponent(window.location.href);
    iframe.style.cssText = 'position:fixed; bottom:92px; right:20px; width:380px; height:600px; max-height:calc(100vh - 110px); max-width:calc(100vw - 30px); border:none; border-radius:18px; box-shadow:0 12px 40px rgba(0,0,0,0.22); display:none; opacity:0; transform:translateY(20px) scale(0.95); transition:all 0.25s cubic-bezier(0.16, 1, 0.3, 1); z-index:9999999;';
    document.body.appendChild(iframe);

    var isOpen = false;
    launcher.addEventListener('click', function() {
        isOpen = !isOpen;
        if (isOpen) {
            iframe.style.display = 'block';
            setTimeout(function() {
                iframe.style.opacity = '1';
                iframe.style.transform = 'translateY(0) scale(1)';
            }, 10);
            launcher.style.transform = 'rotate(90deg)';
            launcher.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        } else {
            iframe.style.opacity = '0';
            iframe.style.transform = 'translateY(20px) scale(0.95)';
            setTimeout(function() { iframe.style.display = 'none'; }, 250);
            launcher.style.transform = 'rotate(0deg)';
            launcher.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
        }
    });
})();
JS;

        return response($jsContent, 200, [
            'Content-Type' => 'application/javascript',
            'Cache-Control' => 'no-cache, private',
        ]);
    }

    /**
     * Render standalone preview view of the widget.
     */
    public function renderPreview(Request $request): View
    {
        $widgetUuid = $request->query('widget_id');
        $widget = $widgetUuid ? ChatWidget::where('uuid', $widgetUuid)->first() : ChatWidget::getDefault();
        if (! $widget) {
            $widget = ChatWidget::getDefault();
        }

        return view('chat_widget_preview', [
            'widget' => $widget,
            'pageUrl' => $request->query('page_url', ''),
        ]);
    }
}
