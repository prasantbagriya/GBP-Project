<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleReview extends Model
{
    protected $fillable = [
        'review_id',
        'location_name',
        'v4_name',
        'reviewer_name',
        'reviewer_photo_url',
        'star_rating',
        'star_number',
        'comment',
        'create_time',
        'update_time',
        'reply_comment',
        'reply_time',
    ];

    protected $casts = [
        'star_number' => 'integer',
        'create_time' => 'datetime',
        'update_time' => 'datetime',
        'reply_time' => 'datetime',
    ];
}
