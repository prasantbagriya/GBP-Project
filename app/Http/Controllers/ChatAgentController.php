<?php

namespace App\Http\Controllers;

use App\Models\ChatCannedResponse;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatAgentController extends Controller
{
    /**
     * Get live conversations list with filters and counts.
     */
    public function getConversations(Request $request): JsonResponse
    {
        $filter = $request->query('filter', 'all'); // all, unassigned, mine, bot, resolved
        $search = trim($request->query('search', ''));
        $currentUserId = Auth::id();

        $query = ChatConversation::query()
            ->with(['assignedUser:id,name,email', 'widget:id,title,brand_color'])
            ->withCount(['messages' => function ($q) {
                $q->where('is_read', false)->where('sender_type', 'visitor');
            }]);

        // Filter status
        if ($filter === 'unassigned') {
            $query->whereIn('status', ['waiting', 'bot'])->whereNull('assigned_to_user_id');
        } elseif ($filter === 'mine') {
            $query->where('assigned_to_user_id', $currentUserId);
        } elseif ($filter === 'bot') {
            $query->where('status', 'bot');
        } elseif ($filter === 'resolved') {
            $query->whereIn('status', ['resolved', 'closed']);
        } else {
            // "all" active chats by default
            $query->whereIn('status', ['bot', 'waiting', 'active']);
        }

        // Search by visitor name, email, phone, or message text
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('visitor_name', 'like', "%{$search}%")
                    ->orWhere('visitor_email', 'like', "%{$search}%")
                    ->orWhere('visitor_phone', 'like', "%{$search}%")
                    ->orWhereHas('messages', function ($mq) use ($search) {
                        $mq->where('content', 'like', "%{$search}%");
                    });
            });
        }

        $conversations = $query->orderBy('last_message_at', 'desc')->paginate(30);

        // Calculate summary counts for badge indicators
        $counts = [
            'all' => ChatConversation::whereIn('status', ['bot', 'waiting', 'active'])->count(),
            'unassigned' => ChatConversation::whereIn('status', ['waiting', 'bot'])->whereNull('assigned_to_user_id')->count(),
            'mine' => $currentUserId ? ChatConversation::where('assigned_to_user_id', $currentUserId)->whereIn('status', ['waiting', 'active'])->count() : 0,
            'bot' => ChatConversation::where('status', 'bot')->count(),
            'resolved' => ChatConversation::whereIn('status', ['resolved', 'closed'])->count(),
        ];

        // Format items with last message snippet
        $items = collect($conversations->items())->map(function (ChatConversation $conv) {
            $lastMsg = $conv->messages()->latest('id')->first();

            return [
                'id' => $conv->id,
                'uuid' => $conv->uuid,
                'visitor_name' => $conv->visitor_name ?: 'Visitor #'.substr($conv->uuid, 0, 6),
                'visitor_email' => $conv->visitor_email,
                'visitor_phone' => $conv->visitor_phone,
                'visitor_city' => $conv->visitor_city,
                'visitor_page_url' => $conv->visitor_page_url,
                'status' => $conv->status,
                'priority' => $conv->priority,
                'csat_rating' => $conv->csat_rating,
                'unread_count' => $conv->messages_count ?? 0,
                'assigned_user' => $conv->assignedUser ? [
                    'id' => $conv->assignedUser->id,
                    'name' => $conv->assignedUser->name,
                    'email' => $conv->assignedUser->email,
                ] : null,
                'last_message' => $lastMsg ? [
                    'content' => $lastMsg->content,
                    'sender_type' => $lastMsg->sender_type,
                    'sender_name' => $lastMsg->sender_name,
                    'created_at' => $lastMsg->created_at?->toIso8601String(),
                ] : null,
                'last_message_at' => $conv->last_message_at?->toIso8601String(),
                'created_at' => $conv->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'counts' => $counts,
            'conversations' => $items,
            'pagination' => [
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'total' => $conversations->total(),
            ],
        ]);
    }

    /**
     * Get single conversation details with full message thread and visitor telemetry.
     */
    public function getConversationDetails(Request $request, string $uuid): JsonResponse
    {
        $conversation = ChatConversation::query()
            ->with(['assignedUser:id,name,email', 'widget'])
            ->where('uuid', $uuid)
            ->first();

        if (! $conversation) {
            return response()->json(['error' => 'Conversation not found.'], 404);
        }

        // Mark unread messages as read
        $conversation->messages()
            ->where('is_read', false)
            ->where('sender_type', 'visitor')
            ->update(['is_read' => true, 'read_at' => now()]);

        // Get full message list (including internal private notes)
        $messages = $conversation->messages()
            ->orderBy('id', 'asc')
            ->get()
            ->map(fn (ChatMessage $m) => [
                'id' => $m->id,
                'uuid' => $m->uuid,
                'sender_type' => $m->sender_type,
                'sender_id' => $m->sender_id,
                'sender_name' => $m->sender_name,
                'message_type' => $m->message_type,
                'content' => $m->content,
                'metadata' => $m->metadata,
                'is_read' => $m->is_read,
                'created_at' => $m->created_at?->toIso8601String(),
            ]);

        // Fetch team members list for real-time reassignment
        $teamMembers = User::query()
            ->where('status', 'active')
            ->select(['id', 'name', 'email', 'role'])
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'conversation' => [
                'id' => $conversation->id,
                'uuid' => $conversation->uuid,
                'visitor_token' => $conversation->visitor_token,
                'visitor_name' => $conversation->visitor_name,
                'visitor_email' => $conversation->visitor_email,
                'visitor_phone' => $conversation->visitor_phone,
                'visitor_ip' => $conversation->visitor_ip,
                'visitor_city' => $conversation->visitor_city,
                'visitor_page_url' => $conversation->visitor_page_url,
                'visitor_referrer' => $conversation->visitor_referrer,
                'visitor_user_agent' => $conversation->visitor_user_agent,
                'status' => $conversation->status,
                'priority' => $conversation->priority,
                'collected_data' => $conversation->collected_data,
                'csat_rating' => $conversation->csat_rating,
                'csat_feedback' => $conversation->csat_feedback,
                'assigned_user' => $conversation->assignedUser ? [
                    'id' => $conversation->assignedUser->id,
                    'name' => $conversation->assignedUser->name,
                    'email' => $conversation->assignedUser->email,
                ] : null,
                'last_message_at' => $conversation->last_message_at?->toIso8601String(),
                'resolved_at' => $conversation->resolved_at?->toIso8601String(),
                'created_at' => $conversation->created_at?->toIso8601String(),
            ],
            'messages' => $messages,
            'team_members' => $teamMembers,
        ]);
    }

    /**
     * Agent sends a reply or internal private note.
     */
    public function sendMessage(Request $request, string $uuid): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'max:5000'],
            'message_type' => ['nullable', 'string', 'in:text,private_note,file'],
        ]);

        $conversation = ChatConversation::where('uuid', $uuid)->first();
        if (! $conversation) {
            return response()->json(['error' => 'Conversation not found.'], 404);
        }

        $user = Auth::user();
        $senderName = $user ? $user->name : 'Support Agent';
        $messageType = $validated['message_type'] ?? 'text';

        // Auto-assign to current agent if not already assigned
        if ($user && empty($conversation->assigned_to_user_id)) {
            $conversation->update([
                'assigned_to_user_id' => $user->id,
                'status' => 'active',
            ]);
        } elseif ($conversation->status === 'bot' || $conversation->status === 'waiting') {
            $conversation->update(['status' => 'active']);
        }

        $message = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'agent',
            'sender_id' => $user?->id,
            'sender_name' => $senderName,
            'message_type' => $messageType,
            'content' => trim($validated['content']),
            'is_read' => true,
        ]);

        $conversation->update(['last_message_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => [
                'id' => $message->id,
                'uuid' => $message->uuid,
                'sender_type' => $message->sender_type,
                'sender_id' => $message->sender_id,
                'sender_name' => $message->sender_name,
                'message_type' => $message->message_type,
                'content' => $message->content,
                'metadata' => $message->metadata,
                'is_read' => $message->is_read,
                'created_at' => $message->created_at?->toIso8601String(),
            ],
            'conversation_status' => $conversation->status,
        ]);
    }

    /**
     * Assign / re-assign conversation to a team member in real-time.
     */
    public function assignAgent(Request $request, string $uuid): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'transfer_note' => ['nullable', 'string', 'max:500'],
        ]);

        $conversation = ChatConversation::where('uuid', $uuid)->first();
        if (! $conversation) {
            return response()->json(['error' => 'Conversation not found.'], 404);
        }

        $userId = $validated['user_id'] ?? null;
        $targetUser = $userId ? User::find($userId) : null;
        $currentUser = Auth::user();

        $conversation->update([
            'assigned_to_user_id' => $userId,
            'status' => $userId ? 'active' : 'waiting',
        ]);

        // Post system / private note regarding transfer
        $transferReason = $validated['transfer_note'] ?? '';
        $noteContent = $targetUser
            ? "Conversation assigned to {$targetUser->name}".($currentUser ? " by {$currentUser->name}" : '').($transferReason ? ". Note: {$transferReason}" : '')
            : 'Conversation unassigned and moved to waiting queue.';

        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'system',
            'sender_name' => 'System',
            'message_type' => 'private_note',
            'content' => $noteContent,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Conversation assignment updated successfully.',
            'assigned_user' => $targetUser ? [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
            ] : null,
            'status' => $conversation->status,
        ]);
    }

    /**
     * Update conversation status (active, waiting, resolved, closed).
     */
    public function updateStatus(Request $request, string $uuid): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:bot,waiting,active,resolved,closed'],
            'priority' => ['nullable', 'string', 'in:low,normal,high,urgent'],
        ]);

        $conversation = ChatConversation::where('uuid', $uuid)->first();
        if (! $conversation) {
            return response()->json(['error' => 'Conversation not found.'], 404);
        }

        $updates = ['status' => $validated['status']];
        if (isset($validated['priority'])) {
            $updates['priority'] = $validated['priority'];
        }

        if (in_array($validated['status'], ['resolved', 'closed'])) {
            $updates['resolved_at'] = now();
        } else {
            $updates['resolved_at'] = null;
        }

        $conversation->update($updates);

        // Add private log
        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'system',
            'sender_name' => 'System',
            'message_type' => 'private_note',
            'content' => "Status changed to '{$validated['status']}' by ".(Auth::user()?->name ?: 'Agent').'.',
        ]);

        return response()->json([
            'success' => true,
            'status' => $conversation->status,
            'priority' => $conversation->priority,
        ]);
    }

    /**
     * Generate an AI reply recommendation using Google Gemini for human agent.
     */
    public function generateAiReply(Request $request, string $uuid): JsonResponse
    {
        $conversation = ChatConversation::where('uuid', $uuid)->first();
        if (! $conversation) {
            return response()->json(['error' => 'Conversation not found.'], 404);
        }

        $apiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        if (! $apiKey) {
            return response()->json(['error' => 'Gemini API key is not configured.'], 422);
        }

        $modelsToTry = array_values(array_filter(array_unique([
            'gemini-3.1-flash-lite',
            'gemini-3.6-flash',
            'gemini-3-flash-preview',
            config('services.gemini.model') ?: env('GEMINI_MODEL') ?: 'gemini-3.1-flash-lite',
            'gemini-2.5-flash',
        ])));

        // Get past messages
        $messages = $conversation->messages()
            ->visitorFacing()
            ->latest('id')
            ->take(10)
            ->get()
            ->reverse()
            ->map(fn ($m) => "{$m->sender_type}: {$m->content}")
            ->implode("\n");

        $prompt = 'You are an expert customer support agent assistant. Draft a courteous, helpful, and concise suggested response that the human agent can review and send to the website visitor.
Visitor Name: '.($conversation->visitor_name ?: 'Visitor').'
Visitor Location/URL: '.($conversation->visitor_page_url ?: 'Homepage')."

Conversation History:
{$messages}

Draft Suggested Reply (Only the reply text, no extra markdown or quotes):";

        $lastErrorMessage = null;
        $isQuotaError = false;

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
                    $suggested = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    if (! empty(trim($suggested))) {
                        return response()->json([
                            'success' => true,
                            'suggested_reply' => trim($suggested),
                            'model_used' => $model,
                        ]);
                    }
                }

                if ($response->status() === 429) {
                    $isQuotaError = true;
                    Log::warning("Gemini model {$model} exceeded quota (429), trying fallback model...");

                    continue;
                }

                $lastErrorMessage = $response->json()['error']['message'] ?? $response->body();
            } catch (\Throwable $e) {
                Log::warning("Gemini call for model {$model} failed: ".$e->getMessage());
                $lastErrorMessage = $e->getMessage();
            }
        }

        if ($isQuotaError) {
            return response()->json([
                'error' => 'Gemini AI free-tier quota is temporarily exhausted for this API key. Please try again shortly or configure an upgraded Gemini API key.',
            ], 429);
        }

        return response()->json([
            'error' => 'AI generation failed: '.($lastErrorMessage ?: 'Unknown error. Please try again.'),
        ], 500);
    }

    /**
     * Get canned responses / shortcuts list.
     */
    public function getCannedResponses(Request $request): JsonResponse
    {
        ChatCannedResponse::seedDefaults(Auth::id());

        $responses = ChatCannedResponse::query()
            ->orderBy('category', 'asc')
            ->orderBy('shortcut', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'canned_responses' => $responses,
        ]);
    }

    /**
     * Save / update a canned response.
     */
    public function saveCannedResponse(Request $request): JsonResponse
    {
        $id = $request->input('id');
        $validated = $request->validate([
            'shortcut' => ['required', 'string', 'max:50'],
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:3000'],
            'category' => ['nullable', 'string', 'max:50'],
        ]);

        $shortcut = trim($validated['shortcut']);
        if (! str_starts_with($shortcut, '/')) {
            $shortcut = '/'.$shortcut;
        }

        $canned = ChatCannedResponse::updateOrCreate(
            ['id' => $id],
            [
                'shortcut' => $shortcut,
                'title' => trim($validated['title']),
                'content' => trim($validated['content']),
                'category' => trim($validated['category'] ?? 'General'),
                'created_by_user_id' => Auth::id(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Canned response saved successfully.',
            'canned_response' => $canned,
        ]);
    }

    /**
     * Delete a canned response.
     */
    public function deleteCannedResponse(Request $request, int $id): JsonResponse
    {
        $canned = ChatCannedResponse::find($id);
        if ($canned) {
            $canned->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Canned response deleted.',
        ]);
    }

    /**
     * Server-Sent Events (SSE) Stream for Real-Time Agent Inbox.
     * Pushes new messages, active visitor counts, and typing indicators.
     */
    public function streamEvents(Request $request): StreamedResponse|JsonResponse
    {
        if (! Auth::check()) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $lastCheckedId = (int) $request->query('last_message_id', 0);

        // Immediately close session to prevent blocking concurrent HTTP requests
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }

        return response()->stream(function () use ($lastCheckedId) {
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_write_close();
            }

            @set_time_limit(30);
            while (ob_get_level()) {
                ob_end_flush();
            }

            $currentLastId = $lastCheckedId;
            $iterations = 0;

            // Stream for up to 25 seconds per HTTP connection
            while ($iterations < 25) {
                if (connection_aborted()) {
                    break;
                }

                // Query new messages across conversations
                $newMessages = ChatMessage::query()
                    ->with('conversation:id,uuid,visitor_name,status,assigned_to_user_id')
                    ->where('id', '>', $currentLastId)
                    ->orderBy('id', 'asc')
                    ->take(10)
                    ->get();

                if ($newMessages->isNotEmpty()) {
                    $currentLastId = $newMessages->last()->id;

                    $payload = $newMessages->map(fn (ChatMessage $m) => [
                        'id' => $m->id,
                        'uuid' => $m->uuid,
                        'conversation_uuid' => $m->conversation?->uuid,
                        'sender_type' => $m->sender_type,
                        'sender_name' => $m->sender_name,
                        'message_type' => $m->message_type,
                        'content' => $m->content,
                        'created_at' => $m->created_at?->toIso8601String(),
                    ]);

                    echo "event: new_messages\n";
                    echo 'data: '.json_encode(['messages' => $payload, 'last_id' => $currentLastId])."\n\n";
                    @flush();
                }

                // Send heartbeat comment every 5 seconds
                if ($iterations % 5 === 0) {
                    echo ": heartbeat\n\n";
                    @flush();
                }

                sleep(1);
                $iterations++;
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
