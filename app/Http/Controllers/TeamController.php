<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TeamController extends Controller
{
    /**
     * Get all team members.
     */
    public function index(Request $request): JsonResponse
    {
        if (! Auth::check()) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $members = User::query()
            ->select(['id', 'name', 'email', 'phone', 'assigned_wing', 'role', 'status', 'last_login_at', 'created_at'])
            ->orderByRaw("CASE WHEN role = 'admin' THEN 0 ELSE 1 END")
            ->orderBy('id', 'asc')
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'assigned_wing' => $user->assigned_wing,
                    'assigned_wings' => $user->getAssignedWings(),
                    'role' => $user->role ?? 'member',
                    'status' => $user->status ?? 'active',
                    'last_login_at' => $user->last_login_at ? $user->last_login_at->toIso8601String() : null,
                    'created_at' => $user->created_at ? $user->created_at->toIso8601String() : null,
                ];
            });

        return response()->json([
            'success' => true,
            'members' => $members,
            'current_user_id' => Auth::id(),
            'is_admin' => Auth::user()?->isAdmin() ?? false,
        ]);
    }

    /**
     * Create a new team member.
     */
    public function store(Request $request): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = Auth::user();
        if (! $currentUser || ! $currentUser->isAdmin()) {
            return response()->json(['error' => 'Unauthorized. Only Admins can add team members.'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'assigned_wing' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['nullable', 'string', Rule::in(['admin', 'member'])],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        $name = trim($validated['name']);

        $email = ! empty($validated['email'])
            ? strtolower(trim($validated['email']))
            : strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name)).'_'.time().'@princeeduhub.com';

        if (User::where('email', $email)->exists()) {
            $email = 'member_'.time().'_'.rand(100, 999).'@princeeduhub.com';
        }

        $password = ! empty($validated['password'])
            ? $validated['password']
            : Str::random(12);

        $phone = ! empty($validated['phone']) ? trim($validated['phone']) : null;
        if ($phone && ! str_starts_with($phone, '+') && ! str_starts_with($phone, '91')) {
            $digits = preg_replace('/[^0-9]/', '', $phone);
            if (strlen($digits) === 10) {
                $phone = '+91 '.$digits;
            }
        }

        $newUser = User::create([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'assigned_wing' => ! empty($validated['assigned_wing']) ? trim($validated['assigned_wing']) : null,
            'password' => Hash::make($password),
            'role' => $validated['role'] ?? 'member',
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Team member added successfully',
            'member' => [
                'id' => $newUser->id,
                'name' => $newUser->name,
                'email' => $newUser->email,
                'phone' => $newUser->phone,
                'assigned_wing' => $newUser->assigned_wing,
                'assigned_wings' => $newUser->getAssignedWings(),
                'role' => $newUser->role,
                'status' => $newUser->status,
                'last_login_at' => null,
                'created_at' => $newUser->created_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Update an existing team member.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = Auth::user();
        if ($currentUser && ! $currentUser->isAdmin()) {
            return response()->json(['error' => 'Unauthorized. Only Admins can modify team members.'], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'assigned_wing' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['nullable', 'string', Rule::in(['admin', 'member'])],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        // Security check: Admin cannot deactivate or demote themselves if they are the current user
        if ($currentUser && $currentUser->id === $user->id) {
            if (isset($validated['status']) && $validated['status'] === 'inactive') {
                return response()->json(['error' => 'You cannot deactivate your own admin account.'], 422);
            }
            if (isset($validated['role']) && $validated['role'] !== 'admin') {
                return response()->json(['error' => 'You cannot demote your own admin account.'], 422);
            }
        }

        $user->name = trim($validated['name']);
        $user->email = strtolower(trim($validated['email']));

        if (array_key_exists('phone', $validated)) {
            $phone = ! empty($validated['phone']) ? trim($validated['phone']) : null;
            if ($phone && ! str_starts_with($phone, '+') && ! str_starts_with($phone, '91')) {
                $digits = preg_replace('/[^0-9]/', '', $phone);
                if (strlen($digits) === 10) {
                    $phone = '+91 '.$digits;
                }
            }
            $user->phone = $phone;
        }

        if (array_key_exists('assigned_wing', $validated)) {
            $user->assigned_wing = ! empty($validated['assigned_wing']) ? trim($validated['assigned_wing']) : null;
        }

        if (! empty($validated['role'])) {
            $user->role = $validated['role'];
        }

        if (! empty($validated['status'])) {
            $user->status = $validated['status'];
        }

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Team member updated successfully',
            'member' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'assigned_wing' => $user->assigned_wing,
                'assigned_wings' => $user->getAssignedWings(),
                'role' => $user->role,
                'status' => $user->status,
                'last_login_at' => $user->last_login_at ? $user->last_login_at->toIso8601String() : null,
                'created_at' => $user->created_at ? $user->created_at->toIso8601String() : null,
            ],
        ]);
    }

    /**
     * Delete a team member.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = Auth::user();
        if ($currentUser && ! $currentUser->isAdmin()) {
            return response()->json(['error' => 'Unauthorized. Only Admins can delete team members.'], 403);
        }

        if ($currentUser && $currentUser->id === $id) {
            return response()->json(['error' => 'You cannot delete your own account.'], 422);
        }

        $user = User::findOrFail($id);

        // Don't allow deleting the last admin
        if ($user->role === 'admin' && User::where('role', 'admin')->count() <= 1) {
            return response()->json(['error' => 'Cannot delete the only remaining admin in the system.'], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Team member deleted successfully',
        ]);
    }
}
