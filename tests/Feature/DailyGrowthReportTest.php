<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DailyGrowthReportTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_multi_profile_report_requires_authentication(): void
    {
        $response = $this->getJson('/api/gbp/multi-profile-report');
        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'authenticated' => false,
            ]);
    }

    public function test_multi_profile_report_serves_cached_data_when_fresh(): void
    {
        $userEmail = 'daily-test@example.com';
        $dummyToken = [
            'access_token' => 'ya29.test-access-token',
            'refresh_token' => '1//test-refresh-token',
            'expires_in' => 3599,
            'created' => time(),
            'user_email' => $userEmail,
        ];
        Cache::forever('gbp_persistent_google_token', $dummyToken);

        $reportKey = 'gbp_multi_report_'.md5($userEmail);
        $savedData = [
            'success' => true,
            'hasReport' => true,
            'userEmail' => $userEmail,
            'generatedAt' => Carbon::now('Asia/Kolkata')->toIso8601String(),
            'locations' => [
                [
                    'id' => 'accounts/123/locations/loc-1',
                    'name' => 'accounts/123/locations/loc-1',
                    'title' => 'Alpha Coaching',
                    'totalReviews' => 150,
                    'beforeTodayReviews' => 148,
                    'todayNewReviews' => 2,
                    'difference' => 2,
                    'averageRating' => 4.8,
                    'repliedCount' => 140,
                    'pendingCount' => 10,
                ],
            ],
            'overall' => [
                'totalProfiles' => 1,
                'totalReviews' => 150,
                'totalTodayNew' => 2,
                'totalPending' => 10,
                'averageRating' => 4.8,
            ],
        ];
        Cache::forever($reportKey, $savedData);

        $response = $this->getJson('/api/gbp/multi-profile-report');
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'hasReport' => true,
                'cached' => true,
                'overall' => [
                    'totalReviews' => 150,
                    'totalTodayNew' => 2,
                ],
            ]);
    }

    public function test_live_refresh_queries_google_reviews_and_calculates_daily_growth(): void
    {
        $userEmail = 'live-refresh-user@example.com';
        $dummyToken = [
            'access_token' => 'ya29.live-token',
            'refresh_token' => '1//test-refresh-token',
            'expires_in' => 3599,
            'created' => time(),
            'user_email' => $userEmail,
        ];
        Cache::forever('gbp_persistent_google_token', $dummyToken);

        $tz = 'Asia/Kolkata';
        $todayDate = Carbon::now($tz)->toDateString();
        $yesterdayDate = Carbon::now($tz)->subDay()->toDateString();

        $accountKey = 'gbp_locations_'.md5($userEmail);
        $locationName = 'accounts/111/locations/loc-fresh';
        $locIdHash = md5($locationName);

        // Pre-set yesterday closing snapshot of 500 reviews
        Cache::forever("gbp_daily_snap_{$locIdHash}_{$yesterdayDate}", [
            'total' => 500,
            'rating' => 4.7,
            'date' => $yesterdayDate,
        ]);

        Cache::forever($accountKey, [
            [
                'name' => $locationName,
                'v4Name' => $locationName,
                'title' => 'Apex Defence Academy',
                'storeCode' => 'APEX01',
                'address' => 'Station Road, Sikar',
            ],
        ]);

        // Mock Google Business Profile reviews endpoint: returns 503 reviews (3 new today)
        $nowUtc = Carbon::now($tz)->setTimezone('UTC')->toIso8601String();
        Http::fake([
            'https://mybusiness.googleapis.com/v4/accounts/111/locations/loc-fresh/reviews*' => Http::response([
                'totalReviewCount' => 503,
                'averageRating' => 4.8,
                'reviews' => [
                    [
                        'reviewId' => 'rev-today-1',
                        'starRating' => 'FIVE',
                        'comment' => 'Best academy in Sikar!',
                        'createTime' => $nowUtc,
                        'reviewReply' => null,
                    ],
                    [
                        'reviewId' => 'rev-today-2',
                        'starRating' => 'FIVE',
                        'comment' => 'Great discipline and faculty',
                        'createTime' => $nowUtc,
                        'reviewReply' => ['comment' => 'Thank you!'],
                    ],
                    [
                        'reviewId' => 'rev-today-3',
                        'starRating' => 'FOUR',
                        'comment' => 'Good environment',
                        'createTime' => $nowUtc,
                        'reviewReply' => null,
                    ],
                    [
                        'reviewId' => 'rev-old-1',
                        'starRating' => 'FIVE',
                        'comment' => 'Joined last month',
                        'createTime' => Carbon::now($tz)->subDays(3)->toIso8601String(),
                        'reviewReply' => null,
                    ],
                ],
            ], 200),
        ]);

        // Call multi-profile-report with ?refresh=true
        $response = $this->getJson('/api/gbp/multi-profile-report?refresh=true');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'hasReport' => true,
                'cached' => false,
            ]);

        $locations = $response->json('locations');
        $this->assertCount(1, $locations);

        $loc = $locations[0];
        $this->assertEquals('Apex Defence Academy', $loc['title']);
        $this->assertEquals(503, $loc['totalReviews']);
        $this->assertEquals(500, $loc['beforeTodayReviews']); // Baseline from yesterday closing!
        $this->assertEquals(3, $loc['difference']); // Net growth = 503 - 500 = +3!
        $this->assertEquals(3, $loc['todayNewReviews']); // Verified 3 new reviews today!
        $this->assertEquals(4.8, $loc['averageRating']);
        $this->assertEquals(1, $loc['repliedCount']);
        $this->assertEquals(3, $loc['pendingCount']);

        // Check overall summary
        $this->assertEquals(503, $response->json('overall.totalReviews'));
        $this->assertEquals(3, $response->json('overall.totalTodayNew'));
    }

    public function test_midnight_rollover_resets_today_growth_when_no_new_reviews(): void
    {
        $userEmail = 'midnight-rollover@example.com';
        $dummyToken = [
            'access_token' => 'ya29.midnight-token',
            'refresh_token' => '1//test-refresh-token',
            'expires_in' => 3599,
            'created' => time(),
            'user_email' => $userEmail,
        ];
        Cache::forever('gbp_persistent_google_token', $dummyToken);

        $tz = 'Asia/Kolkata';
        $yesterdayDate = Carbon::now($tz)->subDay()->toDateString();

        $accountKey = 'gbp_locations_'.md5($userEmail);
        $locationName = 'accounts/222/locations/loc-midnight';
        $locIdHash = md5($locationName);

        // Yesterday closing total was 620
        Cache::forever("gbp_daily_snap_{$locIdHash}_{$yesterdayDate}", [
            'total' => 620,
            'rating' => 4.9,
            'date' => $yesterdayDate,
        ]);

        Cache::forever($accountKey, [
            [
                'name' => $locationName,
                'v4Name' => $locationName,
                'title' => 'Midnight Rollover Branch',
            ],
        ]);

        // At 12:05 AM, Google still has 620 reviews (0 new reviews today)
        Http::fake([
            'https://mybusiness.googleapis.com/v4/accounts/222/locations/loc-midnight/reviews*' => Http::response([
                'totalReviewCount' => 620,
                'averageRating' => 4.9,
                'reviews' => [
                    [
                        'reviewId' => 'rev-yesterday',
                        'starRating' => 'FIVE',
                        'comment' => 'Left yesterday evening',
                        'createTime' => Carbon::now($tz)->subDays(1)->toIso8601String(),
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/gbp/multi-profile-report?refresh=true');
        $response->assertStatus(200);

        $loc = $response->json('locations.0');
        $this->assertEquals(620, $loc['totalReviews']);
        $this->assertEquals(620, $loc['beforeTodayReviews']); // Baseline equals yesterday closing!
        $this->assertEquals(0, $loc['difference']); // Growth reset to 0 after midnight!
        $this->assertEquals(0, $loc['todayNewReviews']); // 0 new reviews today!
    }

    public function test_self_healing_baseline_corrects_when_reviews_detected_today(): void
    {
        $userEmail = 'self-healing@example.com';
        $dummyToken = [
            'access_token' => 'ya29.heal-token',
            'refresh_token' => '1//test-refresh-token',
            'expires_in' => 3599,
            'created' => time(),
            'user_email' => $userEmail,
        ];
        Cache::forever('gbp_persistent_google_token', $dummyToken);

        $tz = 'Asia/Kolkata';
        $todayDate = Carbon::now($tz)->toDateString();

        $accountKey = 'gbp_locations_'.md5($userEmail);
        $locationName = 'accounts/333/locations/loc-heal';
        $locIdHash = md5($locationName);

        // Suppose day baseline was mistakenly locked at 800 earlier when todayCount was 0
        Cache::forever("gbp_day_baseline_{$locIdHash}_{$todayDate}", 800);

        Cache::forever($accountKey, [
            [
                'name' => $locationName,
                'v4Name' => $locationName,
                'title' => 'Healing Branch',
            ],
        ]);

        // Google reports 800 total reviews, but 5 of them were created today!
        $nowIso = Carbon::now($tz)->toIso8601String();
        $todayReviews = [];
        for ($i = 1; $i <= 5; $i++) {
            $todayReviews[] = [
                'reviewId' => "rev-heal-{$i}",
                'starRating' => 'FIVE',
                'comment' => "Today review {$i}",
                'createTime' => $nowIso,
            ];
        }

        Http::fake([
            'https://mybusiness.googleapis.com/v4/accounts/333/locations/loc-heal/reviews*' => Http::response([
                'totalReviewCount' => 800,
                'averageRating' => 4.6,
                'reviews' => $todayReviews,
            ], 200),
        ]);

        $response = $this->getJson('/api/gbp/multi-profile-report?refresh=true');
        $response->assertStatus(200);

        $loc = $response->json('locations.0');
        $this->assertEquals(800, $loc['totalReviews']);
        $this->assertEquals(795, $loc['beforeTodayReviews']); // Self-healed: 800 - 5 = 795!
        $this->assertEquals(5, $loc['difference']); // Difference is +5!
        $this->assertEquals(5, $loc['todayNewReviews']); // Today new reviews is 5!
    }

    public function test_yesterday_saved_report_rolls_over_to_today_baseline_when_date_changes(): void
    {
        $userEmail = 'yesterday-report-rollover@example.com';
        $dummyToken = [
            'access_token' => 'ya29.rollover-token',
            'refresh_token' => '1//test-refresh-token',
            'expires_in' => 3599,
            'created' => time(),
            'user_email' => $userEmail,
        ];
        Cache::forever('gbp_persistent_google_token', $dummyToken);

        $tz = 'Asia/Kolkata';
        $yesterdayIso = Carbon::now($tz)->subDay()->setTime(21, 30)->toIso8601String();

        $accountKey = 'gbp_locations_'.md5($userEmail);
        $locationName = 'accounts/444/locations/loc-rollover';
        $locIdHash = md5($locationName);

        // Previous report generated yesterday had 420 -> 423 (+3 reviews yesterday)
        $reportKey = 'gbp_multi_report_'.md5($userEmail);
        Cache::forever($reportKey, [
            'success' => true,
            'hasReport' => true,
            'userEmail' => $userEmail,
            'generatedAt' => $yesterdayIso,
            'locations' => [
                [
                    'id' => $locationName,
                    'name' => $locationName,
                    'title' => 'Prince NDA Coaching',
                    'totalReviews' => 423,
                    'beforeTodayReviews' => 420,
                    'todayNewReviews' => 3,
                    'difference' => 3,
                    'averageRating' => 4.6,
                ],
            ],
            'overall' => [
                'totalProfiles' => 1,
                'totalReviews' => 423,
                'totalTodayNew' => 3,
                'averageRating' => 4.6,
            ],
        ]);

        Cache::forever($accountKey, [
            [
                'name' => $locationName,
                'v4Name' => $locationName,
                'title' => 'Prince NDA Coaching',
            ],
        ]);

        // Today on Google, total reviews is still 423 (0 new reviews today so far)
        Http::fake([
            'https://mybusiness.googleapis.com/v4/accounts/444/locations/loc-rollover/reviews*' => Http::response([
                'totalReviewCount' => 423,
                'averageRating' => 4.6,
                'reviews' => [],
            ], 200),
        ]);

        // When refreshing on the new day, it must roll over yesterday's closing 423 as today's opening baseline!
        $response = $this->getJson('/api/gbp/multi-profile-report?refresh=true');
        $response->assertStatus(200);

        $loc = $response->json('locations.0');
        $this->assertEquals(423, $loc['totalReviews']);
        $this->assertEquals(423, $loc['beforeTodayReviews']); // Today's opening baseline is yesterday's closing (423), NOT 420!
        $this->assertEquals(0, $loc['difference']); // Today's growth is 0 (resets for new day!)
        $this->assertEquals(0, $loc['todayNewReviews']); // Today's new reviews is 0!
    }
}
