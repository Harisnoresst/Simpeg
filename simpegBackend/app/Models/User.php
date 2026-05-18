<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // <--- PASTIKAN ADA INI

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable; // <--- TAMBAHKAN HasApiTokens DI SINI

   /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',          // <-- Pastikan ada
        'nip',           // <-- Pastikan ada
        'gender',        // <-- INI BIANG KEROKNYA, tambahkan!
        'subject',       // <-- Tambahkan
        'status',        // <-- Tambahkan
        'phone',         // <-- Tambahkan
        'avatar_url',    // <-- Tambahkan
        'address',       // <-- Tambahkan (untuk profil)
        'instansi',      // <-- Tambahkan (untuk profil)
        'last_login',    
        'pendidikan',
        'golongan',
        'status_pegawai',
        'tanggal_mulai',
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
}