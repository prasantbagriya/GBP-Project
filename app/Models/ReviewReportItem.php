<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewReportItem extends Model
{
    protected $fillable = [
        'report_id',
        'report_date',
        'location_name',
        'v4_name',
        'title',
        'address',
        'store_code',
        'total_reviews',
        'before_today_reviews',
        'today_new_reviews',
        'difference',
        'average_rating',
        'replied_count',
        'pending_count',
        'assigned_staff',
        'assigned_staff_bracket',
        'assigned_staff_phone',
        'review_link',
        'raw_data',
    ];

    protected $casts = [
        'report_date' => 'date',
        'assigned_staff' => 'array',
        'total_reviews' => 'integer',
        'before_today_reviews' => 'integer',
        'today_new_reviews' => 'integer',
        'difference' => 'integer',
        'average_rating' => 'float',
        'replied_count' => 'integer',
        'pending_count' => 'integer',
        'raw_data' => 'array',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(ReviewReport::class, 'report_id');
    }
}
