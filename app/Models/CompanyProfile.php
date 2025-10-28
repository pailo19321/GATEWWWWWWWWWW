<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CompanyProfile extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'business_type',
        'document_number',
        'business_name',
        'invoice_name',
        'average_revenue',
        'average_ticket',
        'company_website',
        'products_sold',
        'sells_physical_products',
        'representative_name',
        'representative_cpf',
        'representative_email',
        'representative_phone',
        'date_of_birth',
        'mother_name',
        'postal_code',
        'street',
        'number',
        'neighborhood',
        'city',
        'state',
        'complement',
        'document_frontal_url',
        'document_back_url',
        'document_selfie_url',
        'document_contract_url',
        'status',
        'rejection_reason',
        'approved_at',
        'approved_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'average_revenue' => 'decimal:2',
            'average_ticket' => 'decimal:2',
            'sells_physical_products' => 'boolean',
            'approved_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
