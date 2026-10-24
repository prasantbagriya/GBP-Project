<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'conversation_id',
        'sender_type',
        'sender_id',
        'sender_name',
        'message_type',
        'content',
        'metadata',
        'is_read',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'is_read' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ChatMessage $msg) {
            if (empty($msg->uuid)) {
                $msg->uuid = (string) Str::uuid();
            }
        });

        static::created(function (ChatMessage $msg) {
            // Update last_message_at on the parent conversation
            if ($msg->message_type !== 'private_note') {
                $msg->conversation?->update(['last_message_at' => now()]);
            }
        });
    }

    /**
     * Parent conversation.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    /**
     * Scope to exclude private internal notes from visitor-facing queries.
     */
    public function scopeVisitorFacing(Builder $query): Builder
    {
        return $query->where('message_type', '!=', 'private_note');
    }
}
