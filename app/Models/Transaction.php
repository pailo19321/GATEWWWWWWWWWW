<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Transaction extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'customer_id',
        'amount',
        'net_amount',
        'fee_amount',
        'fee_percentage',
        'status',
        'type',
        'payment_method',
        'external_id',
        'gateway',
        'gateway_response',
        'description',
        'metadata',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'fee_amount' => 'decimal:2',
            'fee_percentage' => 'decimal:2',
            'gateway_response' => 'array',
            'metadata' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }
}
