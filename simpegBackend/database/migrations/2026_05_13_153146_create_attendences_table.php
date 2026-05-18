<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            
            // Absen Masuk
            $table->time('check_in_time')->nullable();
            $table->decimal('check_in_lat', 10, 8)->nullable();
            $table->decimal('check_in_lng', 11, 8)->nullable();
            $table->string('check_in_photo')->nullable();
            $table->integer('distance_check_in')->nullable();
            $table->boolean('location_valid_check_in')->default(false);
            
            // Absen Pulang
            $table->time('check_out_time')->nullable();
            $table->decimal('check_out_lat', 10, 8)->nullable();
            $table->decimal('check_out_lng', 11, 8)->nullable();
            $table->string('check_out_photo')->nullable();
            $table->integer('distance_check_out')->nullable();
            $table->boolean('location_valid_check_out')->default(false);
            
            $table->enum('status', ['hadir', 'terlambat', 'izin', 'sakit', 'tidak_hadir'])->default('tidak_hadir');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendences');
    }
};
