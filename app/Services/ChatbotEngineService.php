<?php

namespace App\Services;

use App\Models\ChatbotFlow;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ChatbotEngineService
{
    /**
     * Start conversation on active chatbot flow or resume.
     */
    public function startConversation(ChatConversation $conversation, ?ChatbotFlow $flow = null): void
    {
        $widget = $conversation->widget;
        if (! $flow) {
            $flow = ChatbotFlow::where('widget_id', $widget->id)->where('is_active', true)->first();
        }

        if (! $flow || empty($flow->canvas_data['nodes'])) {
            // If no flow, send default warm greeting
            ChatMessage::create([
                'conversation_id' => $conversation->id,
                'sender_type' => 'bot',
                'sender_name' => $widget->bot_name ?: 'AI Assistant',
                'message_type' => 'text',
                'content' => "Hello! Welcome to {$widget->title}. How can we assist you today?",
            ]);

            return;
        }

        $nodes = collect($flow->canvas_data['nodes'])->keyBy('id');
        $edges = collect($flow->canvas_data['edges'] ?? []);

        // Find entry trigger node
        $triggerNode = $nodes->first(fn ($n) => ($n['type'] ?? '') === 'trigger');
        if (! $triggerNode) {
            $triggerNode = $nodes->first();
        }

        if ($triggerNode) {
            $conversation->update(['current_flow_node_id' => $triggerNode['id']]);
            $this->executeNextNodes($conversation, $flow, $triggerNode['id']);
        }
    }

    /**
     * Process incoming visitor message (text or button selection).
     */
    public function processVisitorMessage(ChatConversation $conversation, string $text, ?string $buttonPayload = null): void
    {
        $widget = $conversation->widget;

        // 1. If conversation is already assigned to active human agent, don't interfere with bot
        if ($conversation->status === 'active' || $conversation->status === 'waiting') {
            // Handled directly by live agents
            return;
        }

        $flow = ChatbotFlow::where('widget_id', $widget->id)->where('is_active', true)->first();
        if (! $flow) {
            // Fallback to Gemini AI if no flow is active
            $this->replyWithGeminiAi($conversation, $text);

            return;
        }

        $nodes = collect($flow->canvas_data['nodes'] ?? [])->keyBy('id');
        $edges = collect($flow->canvas_data['edges'] ?? []);

        $currentNodeId = $conversation->current_flow_node_id;
        $currentNode = $currentNodeId ? $nodes->get($currentNodeId) : null;

        // Check for urgent human handoff keywords
        $lower = strtolower(trim($text));
        if (in_array($lower, ['agent', 'human', 'live agent', 'support team', 'speak to human', 'talk to person'])) {
            $this->triggerHandoff($conversation, 'Visitor requested human agent assistance.');

            return;
        }

        // Case A: Visitor clicked a button
        if ($buttonPayload) {
            // Find target node from edge matching sourceHandle or payload target
            $targetEdge = $edges->first(function ($e) use ($currentNodeId, $buttonPayload) {
                return ($e['source'] ?? '') === $currentNodeId &&
                    (($e['sourceHandle'] ?? '') === $buttonPayload || ($e['id'] ?? '') === $buttonPayload);
            });

            $targetNodeId = $targetEdge ? ($targetEdge['target'] ?? null) : $buttonPayload;

            if ($targetNodeId && $nodes->has($targetNodeId)) {
                $conversation->update(['current_flow_node_id' => $targetNodeId]);
                $this->executeNode($conversation, $flow, $nodes->get($targetNodeId));

                return;
            }
        }

        // Case B: Visitor answered an input form node
        if ($currentNode && ($currentNode['type'] ?? '') === 'input') {
            $varName = $currentNode['data']['variableName'] ?? 'visitor_input';
            $collected = $conversation->collected_data ?? [];
            $collected[$varName] = $text;

            // Auto-update visitor profile if name, email, or phone
            $updates = ['collected_data' => $collected];
            if (str_contains($varName, 'name') && empty($conversation->visitor_name)) {
                $updates['visitor_name'] = $text;
            } elseif (str_contains($varName, 'email') && empty($conversation->visitor_email)) {
                $updates['visitor_email'] = $text;
            } elseif (str_contains($varName, 'phone') && empty($conversation->visitor_phone)) {
                $updates['visitor_phone'] = $text;
            }

            $conversation->update($updates);

            // Move to next node connected to this input node
            $this->executeNextNodes($conversation, $flow, $currentNode['id'], $text);

            return;
        }

        // Case C: In a Gemini AI node or free-form question
        if ($currentNode && ($currentNode['type'] ?? '') === 'gemini_ai') {
            $customPrompt = $currentNode['data']['prompt'] ?? '';
            $this->replyWithGeminiAi($conversation, $text, $customPrompt);

            return;
        }

        // Default: Move down next edge or reply with Gemini
        $nextEdge = $edges->first(fn ($e) => ($e['source'] ?? '') === $currentNodeId);
        if ($nextEdge && isset($nextEdge['target']) && $nodes->has($nextEdge['target'])) {
            $conversation->update(['current_flow_node_id' => $nextEdge['target']]);
            $this->executeNode($conversation, $flow, $nodes->get($nextEdge['target']), $text);
        } else {
            // No next path, use Gemini AI fallback
            $this->replyWithGeminiAi($conversation, $text);
        }
    }

    /**
     * Execute chain of automatic nodes (e.g. trigger -> message -> buttons).
     */
    protected function executeNextNodes(ChatConversation $conversation, ChatbotFlow $flow, string $fromNodeId, ?string $input = null): void
    {
        $nodes = collect($flow->canvas_data['nodes'] ?? [])->keyBy('id');
        $edges = collect($flow->canvas_data['edges'] ?? []);

        $nextEdges = $edges->where('source', $fromNodeId)->values();
        if ($nextEdges->isEmpty()) {
            return;
        }

        // Traverse down the first linear edge
        $targetId = $nextEdges[0]['target'] ?? null;
        if ($targetId && $nodes->has($targetId)) {
            $conversation->update(['current_flow_node_id' => $targetId]);
            $this->executeNode($conversation, $flow, $nodes->get($targetId), $input);
        }
    }

    /**
     * Execute specific node action.
     */
    public function executeNode(ChatConversation $conversation, ChatbotFlow $flow, array $node, ?string $input = null): void
    {
        $type = $node['type'] ?? 'message';
        $data = $node['data'] ?? [];
        $widget = $conversation->widget;
        $botName = $widget->bot_name ?: 'AI Assistant';

        switch ($type) {
            case 'message':
                $text = $data['message'] ?? $data['text'] ?? '';
                if ($text !== '') {
                    // Replace variables
                    $text = str_replace(
                        ['{{visitor_name}}', '{{widget_title}}'],
                        [$conversation->visitor_name ?: 'Friend', $widget->title],
                        $text
                    );

                    ChatMessage::create([
                        'conversation_id' => $conversation->id,
                        'sender_type' => 'bot',
                        'sender_name' => $botName,
                        'message_type' => 'text',
                        'content' => $text,
                    ]);
                }
                // Automatically advance to connected node if any
                $this->executeNextNodes($conversation, $flow, $node['id']);
                break;

            case 'buttons':
                $prompt = $data['prompt'] ?? 'Please select an option:';
                $rawButtons = $data['buttons'] ?? [];
                $buttons = [];
                foreach ($rawButtons as $btn) {
                    $buttons[] = [
                        'id' => $btn['id'] ?? (string) Str::uuid(),
                        'text' => $btn['text'] ?? 'Option',
                        'targetNodeId' => $btn['targetNodeId'] ?? null,
                    ];
                }

                ChatMessage::create([
                    'conversation_id' => $conversation->id,
                    'sender_type' => 'bot',
                    'sender_name' => $botName,
                    'message_type' => 'buttons',
                    'content' => $prompt,
                    'metadata' => [
                        'buttons' => $buttons,
                    ],
                ]);
                break;

            case 'input':
                $prompt = $data['prompt'] ?? 'Please provide your answer:';
                ChatMessage::create([
                    'conversation_id' => $conversation->id,
                    'sender_type' => 'bot',
                    'sender_name' => $botName,
                    'message_type' => 'form',
                    'content' => $prompt,
                    'metadata' => [
                        'inputType' => $data['inputType'] ?? 'text',
                        'variableName' => $data['variableName'] ?? 'answer',
                    ],
                ]);
                break;

            case 'handoff':
                $notice = $data['notificationMessage'] ?? 'Connecting you with our support team...';
                ChatMessage::create([
                    'conversation_id' => $conversation->id,
                    'sender_type' => 'system',
                    'sender_name' => 'System',
                    'message_type' => 'text',
                    'content' => $notice,
                ]);

                $this->triggerHandoff($conversation, 'Transferred from chatbot flow.', $data['assignedUserId'] ?? null);
                break;

            case 'gemini_ai':
                $systemPrompt = $data['prompt'] ?? 'You are a helpful customer support agent.';
                $greeting = $data['greeting'] ?? 'I am your AI Assistant. Ask me any question about our services!';
                ChatMessage::create([
                    'conversation_id' => $conversation->id,
                    'sender_type' => 'bot',
                    'sender_name' => $botName,
                    'message_type' => 'text',
                    'content' => $greeting,
                ]);
                break;

            case 'end':
                ChatMessage::create([
                    'conversation_id' => $conversation->id,
                    'sender_type' => 'system',
                    'sender_name' => 'System',
                    'message_type' => 'text',
                    'content' => 'Conversation concluded. How did we do today? Please rate your experience below.',
                    'metadata' => ['show_csat' => true],
                ]);
                $conversation->update([
                    'status' => 'resolved',
                    'resolved_at' => now(),
                    'current_flow_node_id' => null,
                ]);
                break;
        }
    }

    /**
     * Answer with Google Gemini AI.
     */
    public function replyWithGeminiAi(ChatConversation $conversation, string $visitorQuestion, string $systemContext = ''): void
    {
        $widget = $conversation->widget;
        $botName = $widget->bot_name ?: 'AI Assistant';
        $apiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        if (! $apiKey) {
            ChatMessage::create([
                'conversation_id' => $conversation->id,
                'sender_type' => 'bot',
                'sender_name' => $botName,
                'message_type' => 'text',
                'content' => 'Thank you for your message! A team member will reply to you as soon as possible.',
            ]);
            $this->triggerHandoff($conversation, 'AI key unconfigured, queued for team member.');

            return;
        }

        $modelsToTry = array_values(array_filter(array_unique([
            'gemini-3.1-flash-lite',
            'gemini-3.6-flash',
            'gemini-3-flash-preview',
            config('services.gemini.model') ?: env('GEMINI_MODEL') ?: 'gemini-3.1-flash-lite',
            'gemini-2.5-flash',
        ])));

        // Get past messages for context
        $history = $conversation->messages()
            ->visitorFacing()
            ->latest('id')
            ->take(6)
            ->get()
            ->reverse()
            ->map(fn ($m) => "{$m->sender_type}: {$m->content}")
            ->implode("\n");

        $prompt = "You are '{$botName}', a friendly, professional real-time website support chatbot for '{$widget->title}'.
Business details: {$widget->subtitle}.
Visitor name: ".($conversation->visitor_name ?: 'Website Visitor').'.
Current page URL: '.($conversation->visitor_page_url ?: 'Homepage').".
Instructions: Keep your response concise (1-3 sentences max), helpful, and conversational. If you cannot answer or the user needs specific pricing/contracts, advise them that a human team member can connect right away.
{$systemContext}

Recent Conversation:
{$history}
Visitor: {$visitorQuestion}

Your Reply:";

        foreach ($modelsToTry as $model) {
            try {
                $response = Http::withoutVerifying()->timeout(8)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'maxOutputTokens' => 300,
                    ],
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $replyText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

                    if ($replyText) {
                        ChatMessage::create([
                            'conversation_id' => $conversation->id,
                            'sender_type' => 'bot',
                            'sender_name' => $botName,
                            'message_type' => 'text',
                            'content' => trim($replyText),
                        ]);

                        return;
                    }
                }

                if ($response->status() === 429) {
                    Log::warning("Gemini model {$model} exceeded quota (429), trying fallback model...");

                    continue;
                }

                Log::warning("Gemini model {$model} returned error: ".$response->body());
            } catch (\Throwable $e) {
                Log::warning("Gemini call failed for model {$model}: ".$e->getMessage());
            }
        }

        // Fallback friendly message if API call timed out
        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'bot',
            'sender_name' => $botName,
            'message_type' => 'text',
            'content' => "Thank you for reaching out! I've informed our team about your question. Would you like me to connect you to a live specialist?",
            'metadata' => [
                'buttons' => [
                    ['id' => 'btn_connect_agent', 'text' => 'Connect to agent', 'targetNodeId' => 'handoff'],
                ],
            ],
        ]);
    }

    /**
     * Hand off conversation to human team member.
     */
    public function triggerHandoff(ChatConversation $conversation, string $reason = '', ?int $specificUserId = null): void
    {
        $assignedUserId = $specificUserId;

        // If no specific user, pick an active team member using round-robin
        if (! $assignedUserId) {
            $availableAgent = User::query()
                ->where('status', 'active')
                ->withCount(['assignedChatConversations' => function ($q) {
                    $q->whereIn('status', ['waiting', 'active']);
                }])
                ->orderBy('assigned_chat_conversations_count', 'asc')
                ->first();

            if ($availableAgent) {
                $assignedUserId = $availableAgent->id;
            }
        }

        $conversation->update([
            'status' => $assignedUserId ? 'active' : 'waiting',
            'assigned_to_user_id' => $assignedUserId,
            'priority' => 'high',
            'current_flow_node_id' => null,
        ]);

        // Create internal private note for agent
        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'system',
            'sender_name' => 'System',
            'message_type' => 'private_note',
            'content' => "Chat handed off to human support. Reason: {$reason}".
                ($assignedUserId ? " Assigned to User #{$assignedUserId}." : ' Placed in unassigned waiting queue.'),
        ]);
    }
}
