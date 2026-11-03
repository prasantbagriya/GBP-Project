<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ForgotPasswordOtpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Auth::logout();
        Mail::fake();
    }

    public function test_send_otp_via_registered_email(): void
    {
        $user = User::factory()->create([
            'email' => 'teacher@princeeduhub.com',
            'phone' => '+919876543210',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/forgot-password/send-otp', [
            'identifier' => 'teacher@princeeduhub.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'email' => 'teacher@princeeduhub.com',
            ]);

        $cachedOtp = Cache::get('pwd_reset_otp_user_'.$user->id);
        $this->assertNotEmpty($cachedOtp);
        $this->assertEquals(6, strlen($cachedOtp));
    }

    public function test_send_otp_via_registered_mobile_number(): void
    {
        $user = User::factory()->create([
            'email' => 'staff@princeeduhub.com',
            'phone' => '+919988776655',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/forgot-password/send-otp', [
            'identifier' => '9988776655',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'email' => 'staff@princeeduhub.com',
            ]);

        $cachedOtp = Cache::get('pwd_reset_otp_user_'.$user->id);
        $this->assertNotEmpty($cachedOtp);
    }

    public function test_send_otp_returns_404_when_user_not_found(): void
    {
        $response = $this->postJson('/api/auth/forgot-password/send-otp', [
            'identifier' => 'unknown@princeeduhub.com',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_send_otp_returns_403_for_inactive_account(): void
    {
        User::factory()->create([
            'email' => 'inactive@princeeduhub.com',
            'status' => 'inactive',
        ]);

        $response = $this->postJson('/api/auth/forgot-password/send-otp', [
            'identifier' => 'inactive@princeeduhub.com',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_verify_otp_and_reset_password_successfully(): void
    {
        $user = User::factory()->create([
            'email' => 'resetuser@princeeduhub.com',
            'phone' => '+919123456789',
            'password' => Hash::make('oldpassword123'),
            'status' => 'active',
        ]);

        // Send OTP first
        $this->postJson('/api/auth/forgot-password/send-otp', [
            'identifier' => 'resetuser@princeeduhub.com',
        ]);

        $otp = Cache::get('pwd_reset_otp_user_'.$user->id);
        $this->assertNotEmpty($otp);

        // Verify and Reset
        $resetResponse = $this->postJson('/api/auth/forgot-password/verify-reset', [
            'identifier' => 'resetuser@princeeduhub.com',
            'otp' => $otp,
            'password' => 'NewSecretPass123!',
        ]);

        $resetResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Refresh user and test new password
        $user->refresh();
        $this->assertTrue(Hash::check('NewSecretPass123!', $user->password));

        // Test user can log in with new password
        Auth::logout();
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'resetuser@princeeduhub.com',
            'password' => 'NewSecretPass123!',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Test user can also log in with phone number and new password
        Auth::logout();
        $phoneLoginResponse = $this->postJson('/api/auth/login', [
            'email' => '9123456789',
            'password' => 'NewSecretPass123!',
        ]);

        $phoneLoginResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_verify_otp_fails_with_invalid_otp(): void
    {
        User::factory()->create([
            'email' => 'wrongotp@princeeduhub.com',
            'status' => 'active',
        ]);

        $this->postJson('/api/auth/forgot-password/send-otp', [
            'identifier' => 'wrongotp@princeeduhub.com',
        ]);

        $response = $this->postJson('/api/auth/forgot-password/verify-reset', [
            'identifier' => 'wrongotp@princeeduhub.com',
            'otp' => '000000',
            'password' => 'newpassword123',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }
}
