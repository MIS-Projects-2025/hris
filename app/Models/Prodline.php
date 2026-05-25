<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prodline extends Model
{
    protected $table = 'prod_lines';
    protected $connection = 'masterlist';
    public $timestamps = false;

    protected $fillable = [
        'pl_name',
        'pl_head_id',
    ];
}
