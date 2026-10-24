<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ChatWidget extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'name',
        'brand_color',
        'title',
        'subtitle',
        'bot_name',
        'avatar_url',
        'launcher_icon',
        'position',
        'pre_chat_form_enabled',
        'pre_chat_fields',
        'sound_enabled',
        'offline_mode_enabled',
        'offline_message',
        'business_hours',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'pre_chat_form_enabled' => 'boolean',
            'pre_chat_fields' => 'array',
            'sound_enabled' => 'boolean',
            'offline_mode_enabled' => 'boolean',
            'business_hours' => 'array',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ChatWidget $widget) {
            if (empty($widget->uuid)) {
                $widget->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Get conversations under this widget.
     */
    public function conversations(): HasMany
    {
        return $this->hasMany(ChatConversation::class, 'widget_id');
    }

    /**
     * Get flows created for this widget.
     */
    public function flows(): HasMany
    {
        return $this->hasMany(ChatbotFlow::class, 'widget_id');
    }

    /**
     * Get or create the default active widget.
     */
    public static function getDefault(): self
    {
        $widget = static::query()->first();
        if ($widget) {
            return $widget;
        }

        $newWidget = static::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Main Website Chat Widget',
            'brand_color' => '#4f46e5',
            'title' => 'Live Support & Helpdesk',
            'subtitle' => 'Ask us anything! We typically reply instantly.',
            'bot_name' => 'AI Assistant',
            'avatar_url' => null,
            'launcher_icon' => 'chat',
            'position' => 'bottom-right',
            'pre_chat_form_enabled' => false,
            'pre_chat_fields' => [
                'name' => ['enabled' => true, 'required' => true, 'label' => 'Your Name'],
                'email' => ['enabled' => true, 'required' => true, 'label' => 'Email Address'],
                'phone' => ['enabled' => false, 'required' => false, 'label' => 'Phone Number'],
            ],
            'sound_enabled' => true,
            'offline_mode_enabled' => true,
            'offline_message' => "We're currently away! Leave a message with your email and our team will get back to you shortly.",
            'business_hours' => [
                'enabled' => false,
                'start' => '09:00',
                'end' => '18:00',
                'timezone' => 'UTC',
                'days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            ],
            'is_active' => true,
        ]);

        // Seed default starter flow
        ChatbotFlow::createDefaultFlow($newWidget->id);

        return $newWidget;
    }
}
