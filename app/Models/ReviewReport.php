<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReviewReport extends Model
{
    protected $fillable = [
        'report_date',
        'user_email',
        'total_profiles',
        'total_reviews',
        'total_today_new',
        'total_pending',
        'average_rating',
        'overall_stats',
    ];

    protected $casts = [
        'report_date' => 'date',
        'overall_stats' => 'array',
        'average_rating' => 'float',
        'total_profiles' => 'integer',
        'total_reviews' => 'integer',
        'total_today_new' => 'integer',
        'total_pending' => 'integer',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(ReviewReportItem::class, 'report_id');
    }
}
