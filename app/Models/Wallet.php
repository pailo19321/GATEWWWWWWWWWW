<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Wallet extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'balance',
        'available_balance',
        'pending_balance',
        'currency',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'available_balance' => 'decimal:2',
            'pending_balance' => 'decimal:2',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
