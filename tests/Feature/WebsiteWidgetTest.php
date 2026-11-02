<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WebsiteWidgetTest extends TestCase
{
    public function test_widget_returns_reviews_for_the_requested_profile_when_its_identifier_format_differs(): void
    {
        $this->seedWidgetProfiles();
        Http::preventStrayRequests();

        $response = $this->getJson('/api/widget/reviews?locationName=accounts%2F456%2Flocations%2Fbusiness-profile');

        $response->assertOk()
            ->assertJsonPath('profile.title', 'Business Profile')
            ->assertJsonPath('reviews.0.reviewerName', 'Business Customer');
    }

    public function test_widget_returns_404_instead_of_using_another_profiles_reviews_when_the_requested_profile_is_unknown(): void
    {
        $this->seedWidgetProfiles();
        Http::preventStrayRequests();

        $response = $this->getJson('/api/widget/reviews?locationName=locations%2Funknown-profile');

        $response->assertNotFound()
            ->assertJson([
                'success' => false,
                'message' => 'The requested Google Business Profile could not be found.',
            ])
            ->assertJsonMissingPath('profile')
            ->assertJsonMissingPath('reviews');
    }

    private function seedWidgetProfiles(): void
    {
        Cache::forever('gbp_persistent_google_token', [
            'access_token' => 'test-access-token',
            'user_email' => 'widget@example.com',
        ]);

        Cache::forever('gbp_locations_'.md5('widget@example.com'), [
            [
                'name' => 'locations/college-profile',
                'v4Name' => 'accounts/456/locations/college-profile',
                'title' => 'College Profile',
            ],
            [
                'name' => 'locations/business-profile',
                'v4Name' => 'accounts/456/locations/business-profile',
                'title' => 'Business Profile',
            ],
        ]);

        Cache::forever('gbp_reviews_'.md5('business-profile'), [
            'reviews' => [
                [
                    'reviewer' => ['displayName' => 'Business Customer'],
                    'starRating' => 'FIVE',
                    'comment' => 'Excellent service.',
                    'createTime' => '2026-11-01T00:00:00+00:00',
                ],
            ],
            'averageRating' => 5.0,
            'totalReviewCount' => 1,
        ]);

        Cache::forever('gbp_reviews_'.md5('locations/college-profile'), [
            'reviews' => [
                [
                    'reviewer' => ['displayName' => 'College Student'],
                    'starRating' => 'FIVE',
                    'comment' => 'Great college.',
                    'createTime' => '2026-11-01T00:00:00+00:00',
                ],
            ],
            'averageRating' => 5.0,
            'totalReviewCount' => 1,
        ]);
    }
}
