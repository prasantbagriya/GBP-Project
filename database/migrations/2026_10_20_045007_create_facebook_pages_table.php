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
        Schema::create('facebook_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('page_id', 64)->unique();
            $table->string('name', 255);
            $table->string('category', 100)->nullable();
            $table->text('access_token');
            $table->text('avatar_url')->nullable();
            $table->text('cover_url')->nullable();
            $table->unsignedInteger('followers_count')->default(0);
            $table->unsignedInteger('likes_count')->default(0);
            $table->string('phone', 50)->nullable();
            $table->string('email', 100)->nullable();
            $table->text('website')->nullable();
            $table->text('about')->nullable();
            $table->json('hours_json')->nullable();
            $table->boolean('auto_reply_enabled')->default(false);
            $table->json('auto_reply_rules')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facebook_pages');
    }
};
