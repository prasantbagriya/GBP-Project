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
        // 1. Persistent Key-Value SQL Storage for GBP Settings & Cache
        if (! Schema::hasTable('gbp_system_data')) {
            Schema::create('gbp_system_data', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->longText('value')->nullable();
                $table->timestamps();
            });
        }

        // 2. Daily Multi-Profile Review Reports Header
        if (! Schema::hasTable('review_reports')) {
            Schema::create('review_reports', function (Blueprint $table) {
                $table->id();
                $table->date('report_date')->index();
                $table->string('user_email')->default('default')->index();
                $table->integer('total_profiles')->default(0);
                $table->integer('total_reviews')->default(0);
                $table->integer('total_today_new')->default(0);
                $table->integer('total_pending')->default(0);
                $table->decimal('average_rating', 3, 1)->default(5.0);
                $table->json('overall_stats')->nullable();
                $table->timestamps();
            });
        }

        // 3. Detailed Daily Review Report Items per Branch
        if (! Schema::hasTable('review_report_items')) {
            Schema::create('review_report_items', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('report_id')->nullable()->index();
                $table->date('report_date')->index();
                $table->string('location_name')->index();
                $table->string('v4_name')->nullable();
                $table->string('title');
                $table->text('address')->nullable();
                $table->string('store_code')->nullable();
                $table->integer('total_reviews')->default(0);
                $table->integer('before_today_reviews')->default(0);
                $table->integer('today_new_reviews')->default(0);
                $table->integer('difference')->default(0);
                $table->decimal('average_rating', 3, 1)->default(5.0);
                $table->integer('replied_count')->default(0);
                $table->integer('pending_count')->default(0);
                $table->string('assigned_staff')->nullable();
                $table->string('assigned_staff_bracket')->nullable();
                $table->string('assigned_staff_phone')->nullable();
                $table->text('review_link')->nullable();
                $table->json('raw_data')->nullable();
                $table->timestamps();
            });
        }

        // 4. Daily Baseline Review Snapshots
        if (! Schema::hasTable('review_snapshots')) {
            Schema::create('review_snapshots', function (Blueprint $table) {
                $table->id();
                $table->date('snapshot_date')->index();
                $table->string('location_name')->index();
                $table->string('location_id')->nullable();
                $table->string('title')->nullable();
                $table->integer('total_count')->default(0);
                $table->timestamps();
            });
        }

        // 5. Individual Google Customer Reviews
        if (! Schema::hasTable('google_reviews')) {
            Schema::create('google_reviews', function (Blueprint $table) {
                $table->id();
                $table->string('review_id')->unique();
                $table->string('location_name')->index();
                $table->string('v4_name')->nullable();
                $table->string('reviewer_name');
                $table->text('reviewer_photo_url')->nullable();
                $table->string('star_rating', 20)->default('FIVE');
                $table->unsignedTinyInteger('star_number')->default(5);
                $table->text('comment')->nullable();
                $table->dateTime('create_time')->nullable()->index();
                $table->dateTime('update_time')->nullable();
                $table->text('reply_comment')->nullable();
                $table->dateTime('reply_time')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('google_reviews');
        Schema::dropIfExists('review_snapshots');
        Schema::dropIfExists('review_report_items');
        Schema::dropIfExists('review_reports');
        Schema::dropIfExists('gbp_system_data');
    }
};
