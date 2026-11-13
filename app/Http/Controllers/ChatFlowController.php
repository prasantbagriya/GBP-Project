<?php

namespace App\Http\Controllers;

use App\Models\ChatbotFlow;
use App\Models\ChatConversation;
use App\Models\ChatWidget;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatFlowController extends Controller
{
    /**
     * Get chatbot flows for the widget.
     */
    public function getFlows(Request $request): JsonResponse
    {
        $widgetUuid = $request->query('widget_id');
        $widget = $widgetUuid ? ChatWidget::where('uuid', $widgetUuid)->first() : ChatWidget::getDefault();

        if (! $widget) {
            $widget = ChatWidget::getDefault();
        }

        $flow = ChatbotFlow::where('widget_id', $widget->id)->latest('id')->first();
        if (! $flow) {
            $flow = ChatbotFlow::createDefaultFlow($widget->id);
        }

        return response()->json([
            'success' => true,
            'flow' => [
                'id' => $flow->id,
                'name' => $flow->name,
                'description' => $flow->description,
                'trigger_type' => $flow->trigger_type,
                'trigger_keywords' => $flow->trigger_keywords,
                'canvas_data' => $flow->canvas_data,
                'is_active' => $flow->is_active,
                'version' => $flow->version,
                'updated_at' => $flow->updated_at?->toIso8601String(),
            ],
            'widget' => [
                'id' => $widget->id,
                'uuid' => $widget->uuid,
                'name' => $widget->name,
            ],
        ]);
    }

    /**
     * Save drag-and-drop canvas flow (nodes, edges, settings).
     */
    public function saveFlow(Request $request): JsonResponse
    {
        if (! Auth::user()?->isAdmin()) {
            return response()->json(['error' => 'Unauthorized. Only Admins can modify chat flows.'], 403);
        }

        $validated = $request->validate([
            'id' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'trigger_type' => ['nullable', 'string', 'max:50'],
            'trigger_keywords' => ['nullable', 'string', 'max:500'],
            'canvas_data' => ['required', 'array'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $widget = ChatWidget::getDefault();
        $nodes = $validated['canvas_data']['nodes'] ?? [];

        // Build compiled execution lookup graph
        $compiledFlow = [
            'startNodeId' => collect($nodes)->firstWhere('type', 'trigger')['id'] ?? ($nodes[0]['id'] ?? 'trigger_start'),
            'nodes' => collect($nodes)->keyBy('id')->toArray(),
        ];

        $flow = ChatbotFlow::updateOrCreate(
            ['id' => $validated['id'] ?? null],
            [
                'widget_id' => $widget->id,
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'trigger_type' => $validated['trigger_type'] ?? 'chat_opened',
                'trigger_keywords' => $validated['trigger_keywords'] ?? null,
                'canvas_data' => $validated['canvas_data'],
                'compiled_flow' => $compiledFlow,
                'is_active' => $validated['is_active'] ?? true,
                'version' => 1,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Chatbot visual flow saved and published successfully!',
            'flow_id' => $flow->id,
        ]);
    }

    /**
     * Pre-built chatbot flow templates.
     */
    public function getTemplates(): JsonResponse
    {
        $templates = [
            [
                'id' => 'lead_gen',
                'title' => 'Lead Generation & Qualification Bot',
                'description' => 'Asks visitors for their business needs, captures full name, phone number, and assigns high-priority leads to sales.',
                'nodes' => [
                    [
                        'id' => 't_start',
                        'type' => 'trigger',
                        'position' => ['x' => 100, 'y' => 150],
                        'data' => ['label' => 'Start Trigger', 'triggerType' => 'chat_opened'],
                    ],
                    [
                        'id' => 't_msg1',
                        'type' => 'message',
                        'position' => ['x' => 380, 'y' => 150],
                        'data' => ['label' => 'Greeting', 'message' => 'Welcome! Looking to grow your business presence?'],
                    ],
                    [
                        'id' => 't_btns',
                        'type' => 'buttons',
                        'position' => ['x' => 680, 'y' => 150],
                        'data' => [
                            'label' => 'Intent Selection',
                            'prompt' => 'What is your primary goal?',
                            'buttons' => [
                                ['id' => 'b1', 'text' => 'More Customers', 'targetNodeId' => 't_input_phone'],
                                ['id' => 'b2', 'text' => 'Review Management', 'targetNodeId' => 't_input_phone'],
                                ['id' => 'b3', 'text' => 'Custom Consultation', 'targetNodeId' => 't_handoff'],
                            ],
                        ],
                    ],
                    [
                        'id' => 't_input_phone',
                        'type' => 'input',
                        'position' => ['x' => 1020, 'y' => 80],
                        'data' => [
                            'label' => 'Phone Input',
                            'inputType' => 'phone',
                            'variableName' => 'visitor_phone',
                            'prompt' => 'What is the best phone or WhatsApp number to reach you at?',
                        ],
                    ],
                    [
                        'id' => 't_thanks',
                        'type' => 'message',
                        'position' => ['x' => 1340, 'y' => 80],
                        'data' => [
                            'label' => 'Success Confirmation',
                            'message' => 'Perfect! Our growth specialist will contact you with a customized roadmap shortly.',
                        ],
                    ],
                    [
                        'id' => 't_handoff',
                        'type' => 'handoff',
                        'position' => ['x' => 1020, 'y' => 280],
                        'data' => [
                            'label' => 'Assign Sales Team',
                            'assignmentType' => 'round_robin',
                            'notificationMessage' => 'Connecting you to our senior strategist now...',
                        ],
                    ],
                ],
                'edges' => [
                    ['id' => 'e1', 'source' => 't_start', 'target' => 't_msg1'],
                    ['id' => 'e2', 'source' => 't_msg1', 'target' => 't_btns'],
                    ['id' => 'e3', 'source' => 't_btns', 'target' => 't_input_phone', 'sourceHandle' => 'b1'],
                    ['id' => 'e4', 'source' => 't_btns', 'target' => 't_input_phone', 'sourceHandle' => 'b2'],
                    ['id' => 'e5', 'source' => 't_input_phone', 'target' => 't_thanks'],
                    ['id' => 'e6', 'source' => 't_btns', 'target' => 't_handoff', 'sourceHandle' => 'b3'],
                ],
            ],
            [
                'id' => 'faq_ai',
                'title' => 'Smart AI Support & FAQ Assistant',
                'description' => 'Powered by Google Gemini 2.5 Flash to automatically answer frequently asked questions about pricing, hours, and services.',
                'nodes' => [
                    [
                        'id' => 'faq_start',
                        'type' => 'trigger',
                        'position' => ['x' => 100, 'y' => 150],
                        'data' => ['label' => 'Start Trigger', 'triggerType' => 'chat_opened'],
                    ],
                    [
                        'id' => 'faq_ai_node',
                        'type' => 'gemini_ai',
                        'position' => ['x' => 400, 'y' => 150],
                        'data' => [
                            'label' => 'Gemini AI Engine',
                            'greeting' => 'Hi! I am your AI assistant. Ask me anything about our company, pricing, or working hours!',
                            'prompt' => 'You are a warm, courteous customer support assistant for GBP. Answer questions accurately and invite users to connect to a human agent for complex requirements.',
                        ],
                    ],
                    [
                        'id' => 'faq_handoff',
                        'type' => 'handoff',
                        'position' => ['x' => 750, 'y' => 150],
                        'data' => [
                            'label' => 'Human Escalation',
                            'assignmentType' => 'round_robin',
                            'notificationMessage' => 'Connecting you to an agent for human assistance...',
                        ],
                    ],
                ],
                'edges' => [
                    ['id' => 'e_faq_1', 'source' => 'faq_start', 'target' => 'faq_ai_node'],
                    ['id' => 'e_faq_2', 'source' => 'faq_ai_node', 'target' => 'faq_handoff'],
                ],
            ],
            [
                'id' => 'after_hours',
                'title' => 'After-Hours Ticket Collector',
                'description' => 'Greets visitors during non-business hours, collects their email & message, and automatically files an offline ticket.',
                'nodes' => [
                    [
                        'id' => 'ah_start',
                        'type' => 'trigger',
                        'position' => ['x' => 100, 'y' => 150],
                        'data' => ['label' => 'After Hours Trigger', 'triggerType' => 'after_hours'],
                    ],
                    [
                        'id' => 'ah_msg',
                        'type' => 'message',
                        'position' => ['x' => 380, 'y' => 150],
                        'data' => ['label' => 'Offline Notice', 'message' => 'Our live support team is currently offline. Business hours are 9:00 AM - 7:00 PM IST.'],
                    ],
                    [
                        'id' => 'ah_email',
                        'type' => 'input',
                        'position' => ['x' => 700, 'y' => 150],
                        'data' => [
                            'label' => 'Email Collector',
                            'inputType' => 'email',
                            'variableName' => 'visitor_email',
                            'prompt' => 'Please enter your email so we can reply as soon as our office reopens:',
                        ],
                    ],
                    [
                        'id' => 'ah_end',
                        'type' => 'end',
                        'position' => ['x' => 1020, 'y' => 150],
                        'data' => ['label' => 'Ticket Confirmed', 'message' => 'Thank you! We will email you back first thing in the morning.'],
                    ],
                ],
                'edges' => [
                    ['id' => 'e_ah1', 'source' => 'ah_start', 'target' => 'ah_msg'],
                    ['id' => 'e_ah2', 'source' => 'ah_msg', 'target' => 'ah_email'],
                    ['id' => 'e_ah3', 'source' => 'ah_email', 'target' => 'ah_end'],
                ],
            ],
        ];

        return response()->json([
            'success' => true,
            'templates' => $templates,
        ]);
    }

    /**
     * Get widget appearance and behavior settings.
     */
    public function getWidgetSettings(Request $request): JsonResponse
    {
        $widget = ChatWidget::getDefault();

        return response()->json([
            'success' => true,
            'widget' => $widget,
        ]);
    }

    /**
     * Update widget appearance, branding, and behavior.
     */
    public function updateWidgetSettings(Request $request): JsonResponse
    {
        if (! Auth::user()?->isAdmin()) {
            return response()->json(['error' => 'Unauthorized. Only Admins can modify widget settings.'], 403);
        }

        $widget = ChatWidget::getDefault();

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'brand_color' => ['required', 'string', 'max:30'],
            'bot_name' => ['required', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'string', 'max:1000'],
            'launcher_icon' => ['nullable', 'string', 'max:30'],
            'position' => ['required', 'string', 'in:bottom-right,bottom-left'],
            'pre_chat_form_enabled' => ['required', 'boolean'],
            'pre_chat_fields' => ['nullable', 'array'],
            'sound_enabled' => ['required', 'boolean'],
            'offline_mode_enabled' => ['required', 'boolean'],
            'offline_message' => ['nullable', 'string', 'max:1000'],
            'business_hours' => ['nullable', 'array'],
        ]);

        $widget->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Widget settings updated successfully.',
            'widget' => $widget,
        ]);
    }

    /**
     * Get comprehensive chat analytics.
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        $totalChats = ChatConversation::count();
        $resolvedChats = ChatConversation::whereIn('status', ['resolved', 'closed'])->count();
        $botResolvedChats = ChatConversation::where('status', 'resolved')->whereNull('assigned_to_user_id')->count();
        $activeChats = ChatConversation::whereIn('status', ['bot', 'waiting', 'active'])->count();

        // CSAT metrics
        $ratedConversations = ChatConversation::whereNotNull('csat_rating')->get();
        $avgCsat = $ratedConversations->count() > 0 ? round($ratedConversations->avg('csat_rating'), 1) : 4.8;
        $csatDistribution = [
            5 => $ratedConversations->where('csat_rating', 5)->count(),
            4 => $ratedConversations->where('csat_rating', 4)->count(),
            3 => $ratedConversations->where('csat_rating', 3)->count(),
            2 => $ratedConversations->where('csat_rating', 2)->count(),
            1 => $ratedConversations->where('csat_rating', 1)->count(),
        ];

        // Agent performance
        $agents = User::query()
            ->where('status', 'active')
            ->withCount(['assignedChatConversations as total_assigned'])
            ->withCount(['assignedChatConversations as resolved_count' => function ($q) {
                $q->whereIn('status', ['resolved', 'closed']);
            }])
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'total_assigned' => $user->total_assigned,
                'resolved_count' => $user->resolved_count,
            ]);

        return response()->json([
            'success' => true,
            'analytics' => [
                'total_conversations' => $totalChats,
                'active_conversations' => $activeChats,
                'resolved_conversations' => $resolvedChats,
                'resolution_rate' => $totalChats > 0 ? round(($resolvedChats / $totalChats) * 100, 1) : 100,
                'bot_containment_rate' => $resolvedChats > 0 ? round(($botResolvedChats / $resolvedChats) * 100, 1) : 45,
                'average_csat' => $avgCsat,
                'csat_distribution' => $csatDistribution,
                'agents' => $agents,
            ],
        ]);
    }
}
