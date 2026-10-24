<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ChatConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'widget_id',
        'visitor_token',
        'visitor_name',
        'visitor_email',
        'visitor_phone',
        'visitor_ip',
        'visitor_city',
        'visitor_page_url',
        'visitor_referrer',
        'visitor_user_agent',
        'assigned_to_user_id',
        'status',
        'priority',
        'current_flow_node_id',
        'collected_data',
        'csat_rating',
        'csat_feedback',
        'last_message_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'collected_data' => 'array',
            'csat_rating' => 'integer',
            'last_message_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ChatConversation $conv) {
            if (empty($conv->uuid)) {
                $conv->uuid = (string) Str::uuid();
            }
            if (empty($conv->last_message_at)) {
                $conv->last_message_at = now();
            }
        });
    }

    /**
     * Associated widget.
     */
    public function widget(): BelongsTo
    {
        return $this->belongsTo(ChatWidget::class, 'widget_id');
    }

    /**
     * Messages in this conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id')->orderBy('id', 'asc');
    }

    /**
     * Assigned team member user.
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    /**
     * Check if conversation is currently handled by bot.
     */
    public function isBot(): bool
    {
        return $this->status === 'bot';
    }

    /**
     * Check if conversation is active with human agent.
     */
    public function isActive(): bool
    {
        return in_array($this->status, ['waiting', 'active']);
    }

    /**
     * Handoff to human agent / queue.
     */
    public function handoffToAgent(?int $agentUserId = null): void
    {
        $this->update([
            'status' => $agentUserId ? 'active' : 'waiting',
            'assigned_to_user_id' => $agentUserId,
            'current_flow_node_id' => null,
        ]);
    }
}
