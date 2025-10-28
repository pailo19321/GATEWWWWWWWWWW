<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasUuids, Notifiable;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function companyProfile()
    {
        return $this->hasOne(CompanyProfile::class);
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function adminRole()
    {
        return $this->hasOne(AdminRole::class);
    }

    public function isAdmin(): bool
    {
        return $this->adminRole()->where('is_active', true)->exists();
    }

    public function isSuperAdmin(): bool
    {
        return $this->adminRole()
            ->where('is_active', true)
            ->where('role', 'super_admin')
            ->exists();
    }
}
