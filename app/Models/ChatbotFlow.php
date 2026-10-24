<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatbotFlow extends Model
{
    use HasFactory;

    protected $fillable = [
        'widget_id',
        'name',
        'description',
        'trigger_type',
        'trigger_keywords',
        'canvas_data',
        'compiled_flow',
        'is_active',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'canvas_data' => 'array',
            'compiled_flow' => 'array',
            'is_active' => 'boolean',
            'version' => 'integer',
        ];
    }

    /**
     * Parent widget.
     */
    public function widget(): BelongsTo
    {
        return $this->belongsTo(ChatWidget::class, 'widget_id');
    }

    /**
     * Create starter default flow with complete nodes and branches.
     */
    public static function createDefaultFlow(int $widgetId): self
    {
        $nodes = [
            [
                'id' => 'trigger_start',
                'type' => 'trigger',
                'position' => ['x' => 80, 'y' => 180],
                'data' => [
                    'label' => 'Start Trigger',
                    'triggerType' => 'chat_opened',
                    'description' => 'Fires automatically when a visitor opens the chat widget',
                ],
            ],
            [
                'id' => 'node_welcome',
                'type' => 'message',
                'position' => ['x' => 380, 'y' => 180],
                'data' => [
                    'label' => 'Welcome Greeting',
                    'message' => 'Hi there! Welcome to our website. How can we help you achieve your goals today?',
                ],
            ],
            [
                'id' => 'node_options',
                'type' => 'buttons',
                'position' => ['x' => 700, 'y' => 180],
                'data' => [
                    'label' => 'Main Menu Choices',
                    'prompt' => 'Please choose one of the options below:',
                    'buttons' => [
                        ['id' => 'btn_services', 'text' => 'Explore Services', 'targetNodeId' => 'node_services'],
                        ['id' => 'btn_support', 'text' => 'FAQ & Help', 'targetNodeId' => 'node_ai_faq'],
                        ['id' => 'btn_agent', 'text' => 'Speak to Team Member', 'targetNodeId' => 'node_handoff'],
                    ],
                ],
            ],
            [
                'id' => 'node_services',
                'type' => 'message',
                'position' => ['x' => 1050, 'y' => 60],
                'data' => [
                    'label' => 'Services Info',
                    'message' => 'We offer premium Business Coaching, Growth Marketing, and Profile Optimization tailored for your brand!',
                ],
            ],
            [
                'id' => 'node_lead_form',
                'type' => 'input',
                'position' => ['x' => 1380, 'y' => 60],
                'data' => [
                    'label' => 'Lead Capture',
                    'inputType' => 'phone',
                    'variableName' => 'visitor_phone',
                    'prompt' => 'Leave your contact number or email so our director can send you the full brochure & free consultation details:',
                ],
            ],
            [
                'id' => 'node_lead_thankyou',
                'type' => 'message',
                'position' => ['x' => 1700, 'y' => 60],
                'data' => [
                    'label' => 'Lead Thank You',
                    'message' => 'Thank you! Our senior consultant will contact you shortly with your customized proposal.',
                ],
            ],
            [
                'id' => 'node_ai_faq',
                'type' => 'gemini_ai',
                'position' => ['x' => 1050, 'y' => 240],
                'data' => [
                    'label' => 'Gemini AI Assistant',
                    'prompt' => 'You are an intelligent customer support assistant for our business. Answer questions concisely, courteously, and offer to connect with a team member if complex.',
                    'systemInstructions' => 'Be polite, friendly, and accurate. Mention business hours 9am to 6pm.',
                ],
            ],
            [
                'id' => 'node_handoff',
                'type' => 'handoff',
                'position' => ['x' => 1050, 'y' => 420],
                'data' => [
                    'label' => 'Team Assignment',
                    'assignmentType' => 'round_robin',
                    'notificationMessage' => 'Connecting you to an available team member right now. Please hold on a moment...',
                ],
            ],
        ];

        $edges = [
            ['id' => 'e_start_welcome', 'source' => 'trigger_start', 'target' => 'node_welcome'],
            ['id' => 'e_welcome_options', 'source' => 'node_welcome', 'target' => 'node_options'],
            ['id' => 'e_opt_services', 'source' => 'node_options', 'target' => 'node_services', 'sourceHandle' => 'btn_services'],
            ['id' => 'e_services_lead', 'source' => 'node_services', 'target' => 'node_lead_form'],
            ['id' => 'e_lead_thankyou', 'source' => 'node_lead_form', 'target' => 'node_lead_thankyou'],
            ['id' => 'e_opt_faq', 'source' => 'node_options', 'target' => 'node_ai_faq', 'sourceHandle' => 'btn_support'],
            ['id' => 'e_opt_handoff', 'source' => 'node_options', 'target' => 'node_handoff', 'sourceHandle' => 'btn_agent'],
        ];

        return static::create([
            'widget_id' => $widgetId,
            'name' => 'Default Interactive Customer Support & Lead Gen Flow',
            'description' => 'Visual auto-reply bot with interactive buttons, lead capture, Gemini AI FAQ answering, and live team member handoff.',
            'trigger_type' => 'chat_opened',
            'trigger_keywords' => 'hello, hi, help, info, support, inquiry',
            'canvas_data' => [
                'nodes' => $nodes,
                'edges' => $edges,
                'viewport' => ['x' => 50, 'y' => 50, 'zoom' => 0.95],
            ],
            'compiled_flow' => [
                'startNodeId' => 'trigger_start',
                'nodes' => collect($nodes)->keyBy('id')->toArray(),
            ],
            'is_active' => true,
            'version' => 1,
        ]);
    }
}
