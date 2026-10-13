<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
            ->select(['id', 'name', 'email', 'role', 'status', 'last_login_at', 'created_at'])
            ->orderByRaw("CASE WHEN role = 'admin' THEN 0 ELSE 1 END")
            ->orderBy('id', 'asc')
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
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
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['nullable', 'string', Rule::in(['admin', 'member'])],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        $newUser = User::create([
            'name' => trim($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
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
        if (! $currentUser || ! $currentUser->isAdmin()) {
            return response()->json(['error' => 'Unauthorized. Only Admins can modify team members.'], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['nullable', 'string', Rule::in(['admin', 'member'])],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        // Security check: Admin cannot deactivate or demote themselves if they are the current user
        if ($currentUser->id === $user->id) {
            if (isset($validated['status']) && $validated['status'] === 'inactive') {
                return response()->json(['error' => 'You cannot deactivate your own admin account.'], 422);
            }
            if (isset($validated['role']) && $validated['role'] !== 'admin') {
                return response()->json(['error' => 'You cannot demote your own admin account.'], 422);
            }
        }

        $user->name = trim($validated['name']);
        $user->email = strtolower(trim($validated['email']));

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
        if (! $currentUser || ! $currentUser->isAdmin()) {
            return response()->json(['error' => 'Unauthorized. Only Admins can delete team members.'], 403);
        }

        if ($currentUser->id === $id) {
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
