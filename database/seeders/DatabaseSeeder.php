<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(ReviewTeamSeeder::class);
        $this->call(GbpSqlSyncSeeder::class);

        User::firstOrCreate(
            ['email' => 'admin@princeeduhub.com'],
            [
                'name' => 'Admin',
                'password' => bcrypt('Admin@123456'),
                'role' => 'admin',
                'status' => 'active',
            ]
        );
    }
}
