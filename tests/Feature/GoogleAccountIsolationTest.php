<?php

namespace Tests\Feature;

use App\Http\Controllers\GoogleBusinessController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleAccountIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_token_from_another_panel_user_is_not_reused(): void
    {
        $firstUser = User::factory()->create();
        $secondUser = User::factory()->create();
        Cache::forever('gbp_persistent_google_token', ['access_token' => 'foreign-token']);

        $this->actingAs($secondUser);
        session(['google_token' => [
            'access_token' => 'foreign-token',
            'panel_user_id' => $firstUser->id,
        ]]);

        $token = app(GoogleBusinessController::class)->getPersistentToken();

        $this->assertNull($token);
        $this->assertFalse(session()->has('google_token'));
    }

    public function test_google_token_saved_for_the_active_panel_user_can_be_retrieved(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        session(['google_token' => [
            'access_token' => 'current-user-token',
            'panel_user_id' => $user->id,
        ]]);

        $token = app(GoogleBusinessController::class)->getPersistentToken();

        $this->assertSame('current-user-token', $token['access_token']);
    }

    public function test_locations_are_loaded_from_google_instead_of_a_previous_report_cache(): void
    {
        session(['google_token' => [
            'access_token' => 'current-google-token',
            'user_email' => 'owner@example.com',
        ]]);
        Cache::forever('gbp_locations_'.md5('owner@example.com'), [[
            'name' => 'locations/old-profile',
            'v4Name' => 'accounts/old-account/locations/old-profile',
            'title' => 'Old Profile',
        ]]);

        Http::preventStrayRequests();
        Http::fake([
            'https://mybusinessaccountmanagement.googleapis.com/v1/accounts' => Http::response([
                'accounts' => [['name' => 'accounts/live-account']],
            ]),
            'https://mybusinessbusinessinformation.googleapis.com/v1/accounts/live-account/locations*' => Http::response([
                'locations' => [[
                    'name' => 'locations/live-profile',
                    'title' => 'Live Profile',
                ]],
            ]),
        ]);

        $response = $this->getJson('/api/gbp/locations');

        $response->assertOk()->assertJsonPath('locations.0.name', 'locations/live-profile');
        $response->assertJsonMissing(['title' => 'Old Profile']);
    }
}
