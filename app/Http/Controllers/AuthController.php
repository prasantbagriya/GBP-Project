<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Ensure at least one default super admin user exists if the database is empty.
     */
    public static function ensureDefaultAdmin(): User
    {
        $existingAdmin = User::where('role', 'admin')->first();
        if ($existingAdmin) {
            return $existingAdmin;
        }

        $anyUser = User::first();
        if ($anyUser) {
            $anyUser->update(['role' => 'admin']);

            return $anyUser;
        }

        return User::create([
            'name' => 'Admin',
            'email' => 'admin@coachingsinsikar.com',
            'password' => Hash::make('Admin@123456'),
            'role' => 'admin',
            'status' => 'active',
        ]);
    }

    /**
     * Check current authentication status and return user details.
     */
    public function me(Request $request): JsonResponse
    {
        // Auto-seed default admin if no users exist
        if (User::count() === 0) {
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
                'role' => $user->role ?? 'member',
                'status' => $user->status ?? 'active',
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
        if (User::count() === 0) {
            self::ensureDefaultAdmin();
        }

        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $email = strtolower(trim($validated['email']));
        $password = $validated['password'];
        $remember = (bool) ($validated['remember'] ?? false);

        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password. Please try again.',
            ], 422);
        }

        if ($user->status === 'inactive') {
            return response()->json([
                'success' => false,
                'message' => 'This account has been deactivated. Please contact your administrator.',
            ], 403);
        }

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
                'role' => $user->role ?? 'member',
                'status' => $user->status ?? 'active',
                'last_login_at' => $user->last_login_at ? $user->last_login_at->toIso8601String() : null,
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
