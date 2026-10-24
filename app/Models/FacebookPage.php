<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacebookPage extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'page_id',
        'name',
        'category',
        'access_token',
        'avatar_url',
        'cover_url',
        'followers_count',
        'likes_count',
        'phone',
        'email',
        'website',
        'about',
        'hours_json',
        'auto_reply_enabled',
        'auto_reply_rules',
        'is_active',
        'metadata',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'access_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'hours_json' => 'array',
            'auto_reply_enabled' => 'boolean',
            'auto_reply_rules' => 'array',
            'is_active' => 'boolean',
            'metadata' => 'array',
            'followers_count' => 'integer',
            'likes_count' => 'integer',
        ];
    }

    /**
     * Get the user that connected this page.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
