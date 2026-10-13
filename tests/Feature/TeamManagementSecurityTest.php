<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TeamManagementSecurityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Ensure clean session/auth state
        Auth::logout();
    }

    public function test_unauthenticated_user_cannot_access_team_members(): void
    {
        $response = $this->getJson('/api/team/members');
        $response->assertStatus(401)
            ->assertJson(['error' => 'Unauthenticated.']);
    }

    public function test_admin_can_view_team_members(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'testadmin_sec@example.com'],
            ['name' => 'Sec Admin', 'password' => Hash::make('password123'), 'role' => 'admin', 'status' => 'active']
        );

        $response = $this->actingAs($admin)->getJson('/api/team/members');
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'is_admin' => true,
            ]);
    }

    public function test_regular_member_cannot_add_team_member(): void
    {
        $member = User::firstOrCreate(
            ['email' => 'testmember_sec@example.com'],
            ['name' => 'Sec Member', 'password' => Hash::make('password123'), 'role' => 'member', 'status' => 'active']
        );

        $response = $this->actingAs($member)->postJson('/api/team/members', [
            'name' => 'Hacker User',
            'email' => 'hacker@example.com',
            'password' => 'secret123',
            'role' => 'admin',
        ]);

        $response->assertStatus(403)
            ->assertJson(['error' => 'Unauthorized. Only Admins can add team members.']);
    }

    public function test_admin_cannot_deactivate_themselves(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'selfadmin_sec@example.com'],
            ['name' => 'Self Admin', 'password' => Hash::make('password123'), 'role' => 'admin', 'status' => 'active']
        );

        $response = $this->actingAs($admin)->putJson("/api/team/members/{$admin->id}", [
            'name' => $admin->name,
            'email' => $admin->email,
            'status' => 'inactive',
        ]);

        $response->assertStatus(422)
            ->assertJson(['error' => 'You cannot deactivate your own admin account.']);
    }

    public function test_admin_cannot_demote_themselves(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'demoteadmin_sec@example.com'],
            ['name' => 'Demote Admin', 'password' => Hash::make('password123'), 'role' => 'admin', 'status' => 'active']
        );

        $response = $this->actingAs($admin)->putJson("/api/team/members/{$admin->id}", [
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => 'member',
        ]);

        $response->assertStatus(422)
            ->assertJson(['error' => 'You cannot demote your own admin account.']);
    }

    public function test_backup_command_executes_safely_and_creates_backup_directory(): void
    {
        $exitCode = Artisan::call('gbp:backup', ['--retention' => 7]);
        $this->assertEquals(0, $exitCode);

        $backupDir = storage_path('app/backups');
        $this->assertTrue(File::isDirectory($backupDir), 'Backup directory should be created.');
    }
}
