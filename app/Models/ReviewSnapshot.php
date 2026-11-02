<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReviewSnapshot extends Model
{
    protected $fillable = [
        'snapshot_date',
        'location_name',
        'location_id',
        'title',
        'total_count',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'total_count' => 'integer',
    ];
}
