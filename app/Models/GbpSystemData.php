<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GbpSystemData extends Model
{
    protected $table = 'gbp_system_data';

    protected $fillable = [
        'key',
        'value',
    ];
}
