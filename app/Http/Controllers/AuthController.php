<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class AuthController extends Controller
{
    /**
     * Ensure at least one default super admin user exists if the database is empty.
     */
    public static function ensureDefaultAdmin(): User
    {
        // Self-heal: ensure users table has required role, status, and assigned_wing columns
        try {
            if (! Schema::hasColumn('users', 'status') || ! Schema::hasColumn('users', 'assigned_wing')) {
                Schema::table('users', function ($table) {
                    if (! Schema::hasColumn('users', 'role')) {
                        $table->string('role')->default('member');
                    }
                    if (! Schema::hasColumn('users', 'status')) {
                        $table->string('status')->default('active');
                    }
                    if (! Schema::hasColumn('users', 'phone')) {
                        $table->string('phone')->nullable();
                    }
                    if (! Schema::hasColumn('users', 'assigned_wing')) {
                        $table->string('assigned_wing')->nullable();
                    }
                    if (! Schema::hasColumn('users', 'last_login_at')) {
                        $table->timestamp('last_login_at')->nullable();
                    }
                });
            }
        } catch (\Throwable $e) {
            Log::warning('Auto-migration for users columns skipped: '.$e->getMessage());
        }

        $defaultPassword = (string) (env('ADMIN_INITIAL_PASSWORD') ?: 'Prince@Edu2026#');

        try {
            User::firstOrCreate(
                ['email' => 'prashantbagriya7877@gmail.com'],
                [
                    'name' => 'Prashant Bagriya',
                    'phone' => '+917877217768',
                    'role' => 'admin',
                    'status' => 'active',
                    'assigned_wing' => '*',
                    'password' => Hash::make($defaultPassword),
                ]
            );
        } catch (\Throwable $e) {
        }

        try {
            $existingAdmin = User::where('email', 'admin@gmb.princeeduhub.com')->first();
            if ($existingAdmin) {
                return $existingAdmin;
            }
        } catch (\Throwable $e) {
        }

        $userData = [
            'name' => 'Prince Super Admin',
            'password' => Hash::make($defaultPassword),
        ];
        if (Schema::hasColumn('users', 'role')) {
            $userData['role'] = 'admin';
        }
        if (Schema::hasColumn('users', 'status')) {
            $userData['status'] = 'active';
        }
        if (Schema::hasColumn('users', 'assigned_wing')) {
            $userData['assigned_wing'] = '*';
        }

        return User::firstOrCreate(
            ['email' => 'admin@gmb.princeeduhub.com'],
            $userData
        );
    }

    /**
     * Check current authentication status and return user details.
     */
    public function me(Request $request): JsonResponse
    {
        // Auto-seed default admin if no admin user exists
        if (User::where('role', 'admin')->count() === 0) {
            self::ensureDefaultAdmin();
        }

        if (! Auth::check()) {
            return response()->json([
                'authenticated' => false,
                'user' => null,
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        // Check if user was deactivated while logged in
        if ($user->status === 'inactive') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'authenticated' => false,
                'user' => null,
                'message' => 'Account is inactive',
            ], 403);
        }

        return response()->json([
            'authenticated' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role ?? 'member',
                'status' => $user->status ?? 'active',
                'assigned_wing' => $user->assigned_wing,
                'assigned_wings' => $user->getAssignedWings(),
                'is_admin' => $user->isAdmin(),
                'last_login_at' => $user->last_login_at ? $user->last_login_at->toIso8601String() : null,
            ],
        ]);
    }

    /**
     * Handle user login with email and password.
     */
    public function login(Request $request): JsonResponse
    {
        // Make sure at least default admin exists
        if (User::where('role', 'admin')->count() === 0) {
            self::ensureDefaultAdmin();
        }

        $validated = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $input = trim((string) $validated['email']);
        $password = $validated['password'];
        $remember = (bool) ($validated['remember'] ?? false);

        // Find user by Email or Mobile Number
        $user = null;
        if (str_contains($input, '@')) {
            $user = User::whereRaw('LOWER(email) = ?', [strtolower($input)])->first();
        } else {
            $digits = preg_replace('/[^0-9]/', '', $input);
            $user = User::where(function ($q) use ($input, $digits) {
                $q->where('phone', $input)
                    ->orWhere('phone', 'like', '%'.$digits);
                if (strlen($digits) >= 10) {
                    $last10 = substr($digits, -10);
                    $q->orWhere('phone', 'like', '%'.$last10);
                }
            })->first();
        }

        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email/phone or password. Please try again.',
            ], 422);
        }

        if ($user->status === 'inactive') {
            return response()->json([
                'success' => false,
                'message' => 'This account has been deactivated. Please contact your administrator.',
            ], 403);
        }

        $request->session()->forget(['google_token', 'location_v4_map', 'store_hours']);

        // Log the user in
        Auth::login($user, $remember);
        $request->session()->regenerate();

        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role ?? 'member',
                'status' => $user->status ?? 'active',
                'assigned_wing' => $user->assigned_wing,
                'assigned_wings' => $user->getAssignedWings(),
                'is_admin' => $user->isAdmin(),
                'last_login_at' => $user->last_login_at ? $user->last_login_at->toIso8601String() : null,
            ],
        ]);
    }

    /**
     * Send Password Reset OTP to user email and/or SMS.
     */
    public function forgotPasswordSendOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identifier' => ['sometimes', 'string', 'max:150'],
            'email' => ['sometimes', 'string', 'max:150'],
        ]);

        $input = trim((string) ($validated['identifier'] ?? $validated['email'] ?? $request->input('identifier') ?? $request->input('email')));

        if (empty($input)) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide your registered email or mobile number.',
            ], 422);
        }

        // Look up user by email or mobile number
        $user = null;
        if (str_contains($input, '@')) {
            $user = User::whereRaw('LOWER(email) = ?', [strtolower($input)])->first();
        } else {
            $digits = preg_replace('/[^0-9]/', '', $input);
            if (strlen($digits) < 10) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please provide a valid 10-digit mobile number or email address.',
                ], 422);
            }
            $user = User::where(function ($q) use ($input, $digits) {
                $q->where('phone', $input)
                    ->orWhere('phone', '+91'.$digits)
                    ->orWhere('phone', '+91 '.$digits)
                    ->orWhere('phone', $digits);
                if (strlen($digits) >= 10) {
                    $last10 = substr($digits, -10);
                    $q->orWhere('phone', 'like', '%'.$last10);
                }
            })->first();
        }

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'No account found with this email or mobile number.',
            ], 404);
        }

        if ($user->status === 'inactive') {
            return response()->json([
                'success' => false,
                'message' => 'This account has been deactivated. Please contact your administrator.',
            ], 403);
        }

        $otp = (string) random_int(100000, 999999);

        // Store OTP in cache for 15 minutes mapped to User ID, Email, and Phone
        Cache::put('pwd_reset_otp_user_'.$user->id, $otp, now()->addMinutes(15));
        if (! empty($user->email)) {
            Cache::put('pwd_reset_otp_'.strtolower($user->email), $otp, now()->addMinutes(15));
        }
        if (! empty($user->phone)) {
            $cleanPhone = preg_replace('/[^0-9]/', '', $user->phone);
            Cache::put('pwd_reset_otp_'.$cleanPhone, $otp, now()->addMinutes(15));
        }
        Cache::put('pwd_reset_otp_'.strtolower($input), $otp, now()->addMinutes(15));

        // 1. Dispatch Email OTP
        $emailSent = false;
        if (! empty($user->email)) {
            try {
                Mail::send('emails.otp', ['otp' => $otp, 'user' => $user], function ($msg) use ($user, $otp) {
                    $msg->to($user->email, $user->name)
                        ->subject('Prince Eduhub Password Reset OTP: '.$otp);
                });
                $emailSent = true;
            } catch (\Throwable $e) {
                Log::warning("Password reset OTP mail failed for {$user->email}: ".$e->getMessage());
            }
        }

        // 2. Dispatch SMS OTP
        $smsSent = false;
        $targetPhone = ! empty($user->phone) ? $user->phone : (! str_contains($input, '@') ? $input : null);
        if (! empty($targetPhone)) {
            try {
                $smsResult = SmsService::sendOtp($targetPhone, $otp, $user->name);
                $smsSent = $smsResult['success'] ?? false;
            } catch (\Throwable $e) {
                Log::warning("Password reset OTP SMS failed for {$targetPhone}: ".$e->getMessage());
            }
        }

        $maskedEmail = $user->email;
        if (! app()->environment('testing') && ! empty($user->email)) {
            $parts = explode('@', $user->email);
            $name = $parts[0];
            $domain = $parts[1] ?? '';
            $maskedName = strlen($name) > 2 ? substr($name, 0, 1).str_repeat('*', max(1, strlen($name) - 2)).substr($name, -1) : substr($name, 0, 1).'*';
            $maskedEmail = $maskedName.'@'.$domain;
        }

        $maskedPhone = $user->phone;
        if (! app()->environment('testing') && ! empty($user->phone)) {
            $digitsOnly = preg_replace('/[^0-9]/', '', $user->phone);
            if (strlen($digitsOnly) >= 10) {
                $last4 = substr($digitsOnly, -4);
                $maskedPhone = '******'.$last4;
            }
        }

        return response()->json([
            'success' => true,
            'message' => '6-digit OTP has been sent via Email and SMS.',
            'identifier' => $input,
            'email' => $maskedEmail,
            'phone' => $maskedPhone,
            'email_sent' => $emailSent,
            'sms_sent' => $smsSent,
            'debug_otp' => app()->environment('local', 'testing') ? $otp : null,
        ]);
    }

    /**
     * Verify OTP and set new password.
     */
    public function forgotPasswordVerifyAndReset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identifier' => ['sometimes', 'string'],
            'email' => ['sometimes', 'string'],
            'otp' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $input = trim((string) ($validated['identifier'] ?? $validated['email'] ?? $request->input('identifier') ?? $request->input('email')));
        $enteredOtp = trim($validated['otp']);
        $newPassword = $validated['password'];

        // Look up user
        $user = null;
        if (str_contains($input, '@')) {
            $user = User::whereRaw('LOWER(email) = ?', [strtolower($input)])->first();
        } else {
            $digits = preg_replace('/[^0-9]/', '', $input);
            $user = User::where(function ($q) use ($input, $digits) {
                $q->where('phone', $input)
                    ->orWhere('phone', '+91'.$digits)
                    ->orWhere('phone', '+91 '.$digits)
                    ->orWhere('phone', $digits);
                if (strlen($digits) >= 10) {
                    $last10 = substr($digits, -10);
                    $q->orWhere('phone', 'like', '%'.$last10);
                }
            })->first();
        }

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'User account not found.',
            ], 404);
        }

        // Check OTP from user id cache or identifier cache
        $cachedOtp = Cache::get('pwd_reset_otp_user_'.$user->id)
            ?? Cache::get('pwd_reset_otp_'.strtolower($user->email))
            ?? Cache::get('pwd_reset_otp_'.strtolower($input));

        if (! $cachedOtp && ! empty($user->phone)) {
            $cleanPhone = preg_replace('/[^0-9]/', '', $user->phone);
            $cachedOtp = Cache::get('pwd_reset_otp_'.$cleanPhone);
        }

        $attemptsKey = 'pwd_reset_attempts_user_'.$user->id;
        $attempts = (int) Cache::get($attemptsKey, 0);

        if (! $cachedOtp || $cachedOtp !== $enteredOtp) {
            $attempts++;
            Cache::put($attemptsKey, $attempts, now()->addMinutes(15));

            if ($attempts >= 5) {
                Cache::forget('pwd_reset_otp_user_'.$user->id);
                Cache::forget('pwd_reset_otp_'.strtolower($user->email));
                Cache::forget('pwd_reset_otp_'.strtolower($input));
                if (! empty($user->phone)) {
                    Cache::forget('pwd_reset_otp_'.preg_replace('/[^0-9]/', '', $user->phone));
                }
                Cache::forget($attemptsKey);

                return response()->json([
                    'success' => false,
                    'message' => 'Too many invalid attempts. For your security, this OTP has been invalidated. Please request a new one.',
                ], 429);
            }

            return response()->json([
                'success' => false,
                'message' => "Invalid or expired OTP code. Attempt {$attempts} of 5. Please check and try again.",
            ], 422);
        }

        Cache::forget($attemptsKey);

        $user->forceFill([
            'password' => Hash::make($newPassword),
        ])->save();

        // Clear OTP caches
        Cache::forget('pwd_reset_otp_user_'.$user->id);
        Cache::forget('pwd_reset_otp_'.strtolower($user->email));
        Cache::forget('pwd_reset_otp_'.strtolower($input));
        if (! empty($user->phone)) {
            Cache::forget('pwd_reset_otp_'.preg_replace('/[^0-9]/', '', $user->phone));
        }

        // Auto login user upon successful password reset
        Auth::login($user, true);
        $request->session()->regenerate();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully! You are now logged in.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role ?? 'member',
                'status' => $user->status ?? 'active',
                'assigned_wing' => $user->assigned_wing,
                'assigned_wings' => $user->getAssignedWings(),
                'is_admin' => $user->isAdmin(),
                'last_login_at' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }
}
