<?php

namespace Database\Seeders;

use App\Http\Controllers\GoogleBusinessController;
use App\Models\GbpSystemData;
use App\Models\GoogleReview;
use App\Models\ReviewReport;
use App\Models\ReviewReportItem;
use App\Models\ReviewSnapshot;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class GbpSqlSyncSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $controller = new GoogleBusinessController;
        $tz = 'Asia/Kolkata';
        $todayDate = $controller->getBusinessDate();
        $yesterdayDate = Carbon::createFromFormat('Y-m-d', $todayDate, $tz)->subDay()->toDateString();

        // 1. Migrate all existing disk JSON files into gbp_system_data SQL table
        $dir = storage_path('app/gbp_data');
        if (File::isDirectory($dir)) {
            foreach (File::files($dir) as $file) {
                if ($file->getExtension() === 'json') {
                    $key = $file->getBasename('.json');
                    $content = File::get($file->getRealPath());
                    GbpSystemData::updateOrCreate(
                        ['key' => $key],
                        ['value' => $content]
                    );
                }
            }
        }

        // 2. Seed Official Known Business Profiles into review_reports and review_report_items
        $profiles = $controller->getKnownBusinessProfiles();
        $totalProfiles = count($profiles);
        $totalReviews = 0;
        $totalTodayNew = 0;
        $ratingSum = 0;

        foreach ($profiles as $p) {
            $totalReviews += (int) ($p['totalReviews'] ?? 0);
            $totalTodayNew += (int) ($p['todayNewReviews'] ?? 0);
            $ratingSum += (float) ($p['averageRating'] ?? 5.0);
        }

        $overallRating = $totalProfiles > 0 ? round($ratingSum / $totalProfiles, 1) : 4.7;

        $report = ReviewReport::updateOrCreate(
            [
                'report_date' => $todayDate,
                'user_email' => 'admin@coachingsinsikar.com',
            ],
            [
                'total_profiles' => $totalProfiles,
                'total_reviews' => $totalReviews,
                'total_today_new' => $totalTodayNew,
                'total_pending' => 0,
                'average_rating' => $overallRating,
                'overall_stats' => [
                    'totalProfiles' => $totalProfiles,
                    'totalReviews' => $totalReviews,
                    'totalTodayNew' => $totalTodayNew,
                    'totalPending' => 0,
                    'averageRating' => $overallRating,
                ],
            ]
        );

        foreach ($profiles as $p) {
            $title = $p['title'] ?? 'Google Profile';
            $locName = $p['name'] ?? ($p['id'] ?? $title);
            $beforeToday = (int) ($p['beforeTodayReviews'] ?? ($p['totalReviews'] ?? 0));
            $todayNew = (int) ($p['todayNewReviews'] ?? 0);
            $total = (int) ($p['totalReviews'] ?? ($beforeToday + $todayNew));
            $diff = (int) ($p['difference'] ?? $todayNew);
            $avg = (float) ($p['averageRating'] ?? 4.7);

            $staff = GoogleBusinessController::getPermanentAssignedStaff($title);
            $staffBracket = GoogleBusinessController::getPermanentStaffBracket($title);
            $phone = GoogleBusinessController::getPermanentStaffPhone($title);

            ReviewReportItem::updateOrCreate(
                [
                    'report_date' => $todayDate,
                    'location_name' => $locName,
                ],
                [
                    'report_id' => $report->id,
                    'v4_name' => $p['v4Name'] ?? null,
                    'title' => $title,
                    'address' => $p['address'] ?? null,
                    'store_code' => $p['storeCode'] ?? null,
                    'total_reviews' => $total,
                    'before_today_reviews' => $beforeToday,
                    'today_new_reviews' => $todayNew,
                    'difference' => $diff,
                    'average_rating' => $avg,
                    'replied_count' => $total,
                    'pending_count' => 0,
                    'assigned_staff' => $staff,
                    'assigned_staff_bracket' => $staffBracket,
                    'assigned_staff_phone' => $phone,
                    'review_link' => 'https://search.google.com/local/writereview?placeid='.($p['metadata']['placeId'] ?? ''),
                    'raw_data' => $p,
                ]
            );

            // 3. Seed Review Snapshot
            ReviewSnapshot::updateOrCreate(
                [
                    'snapshot_date' => $yesterdayDate,
                    'location_name' => $locName,
                ],
                [
                    'location_id' => preg_replace('#^accounts/[^/]+/locations/#', '', $locName),
                    'title' => $title,
                    'total_count' => $beforeToday,
                ]
            );

            // 4. Seed reviews into google_reviews SQL table using Reflection to access protected getBranchSpecificSampleReviews
            try {
                $refMethod = new \ReflectionMethod($controller, 'getBranchSpecificSampleReviews');
                $refMethod->setAccessible(true);
                $reviews = $refMethod->invoke($controller, $title, $avg);
                foreach ($reviews as $rev) {
                    GoogleReview::updateOrCreate(
                        ['review_id' => $rev['reviewId']],
                        [
                            'location_name' => $locName,
                            'v4_name' => $p['v4Name'] ?? null,
                            'reviewer_name' => $rev['reviewer']['displayName'] ?? 'Google User',
                            'reviewer_photo_url' => $rev['reviewer']['profilePhotoUrl'] ?? null,
                            'star_rating' => $rev['starRating'] ?? 'FIVE',
                            'star_number' => 5,
                            'comment' => $rev['comment'] ?? null,
                            'create_time' => ! empty($rev['createTime']) ? Carbon::parse($rev['createTime']) : null,
                            'update_time' => null,
                            'reply_comment' => $rev['reviewReply']['comment'] ?? null,
                            'reply_time' => ! empty($rev['reviewReply']['updateTime']) ? Carbon::parse($rev['reviewReply']['updateTime']) : null,
                        ]
                    );
                }
            } catch (\Throwable $e) {
            }
        }
    }
}
