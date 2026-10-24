<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatCannedResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'shortcut',
        'title',
        'content',
        'category',
        'created_by_user_id',
    ];

    /**
     * User who created this canned response.
     */
    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Seed initial popular canned responses if none exist.
     */
    public static function seedDefaults(?int $userId = null): void
    {
        if (static::query()->count() > 0) {
            return;
        }

        $defaults = [
            [
                'shortcut' => '/hello',
                'title' => 'Warm Welcome Greeting',
                'content' => 'Hello! Thank you for reaching out to us today. How may I assist you with your inquiry?',
                'category' => 'Greetings',
            ],
            [
                'shortcut' => '/pricing',
                'title' => 'Pricing & Quotation Info',
                'content' => 'Our plans are customized based on your business requirements. Could you please share your specific requirements so I can give you an exact quote?',
                'category' => 'Sales',
            ],
            [
                'shortcut' => '/hours',
                'title' => 'Business Operating Hours',
                'content' => 'Our support team is available Monday through Saturday from 9:00 AM to 7:00 PM IST.',
                'category' => 'Support',
            ],
            [
                'shortcut' => '/transfer',
                'title' => 'Department Transfer Notice',
                'content' => 'I am transferring this chat to our senior specialist who can provide you with dedicated assistance on this topic. Please hold on for a moment.',
                'category' => 'Support',
            ],
            [
                'shortcut' => '/feedback',
                'title' => 'Ask for CSAT Review',
                'content' => 'Thank you for chatting with us today! Before you go, we would really appreciate it if you could rate your experience using the star rating above.',
                'category' => 'Closing',
            ],
        ];

        foreach ($defaults as $item) {
            static::create([
                ...$item,
                'created_by_user_id' => $userId,
            ]);
        }
    }
}
