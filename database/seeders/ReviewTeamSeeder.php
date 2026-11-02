<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ReviewTeamSeeder extends Seeder
{
    /**
     * Run the database seeds for the official GBP review team.
     */
    public function run(): void
    {
        // 1. Remove any old review team members
        User::where('role', 'member')->delete();

        // 2. Insert the official review team members permanently
        $team = [
            [
                'name' => 'Abhishek Ji (PCP Piprali Road)',
                'email' => 'abhishek.piprali@princeeduhub.com',
                'phone' => '+91 72969 89764',
                'password' => Hash::make('Prince@72969'),
                'role' => 'member',
                'status' => 'active',
            ],
            [
                'name' => 'Aditya Mehrotra (Prince Hospital)',
                'email' => 'aditya.hospital@princeeduhub.com',
                'phone' => '+91 72300 89108',
                'password' => Hash::make('Prince@72300'),
                'role' => 'member',
                'status' => 'active',
            ],
            [
                'name' => 'Floreto reviews PEH',
                'email' => 'floreto.peh@princeeduhub.com',
                'phone' => '+91 96108 15222',
                'password' => Hash::make('Prince@96108'),
                'role' => 'member',
                'status' => 'active',
            ],
            [
                'name' => 'minautitiwari (Medical College)',
                'email' => 'minauti.medical@princeeduhub.com',
                'phone' => '+91 91660 95690',
                'password' => Hash::make('Prince@91660'),
                'role' => 'member',
                'status' => 'active',
            ],
            [
                'name' => 'Dr-Shankar Kajla (Prince College Sikar)',
                'email' => 'shankar.college@princeeduhub.com',
                'phone' => '+91 95216 83580',
                'password' => Hash::make('Prince@95216'),
                'role' => 'member',
                'status' => 'active',
            ],
            [
                'name' => 'Nitesh Sharma PDA Reviews (Prince Defence)',
                'email' => 'nitesh.pda@princeeduhub.com',
                'phone' => '+91 79764 36882',
                'password' => Hash::make('Prince@79764'),
                'role' => 'member',
                'status' => 'active',
            ],
            [
                'name' => 'Vineet Ji (Prince Sainik School)',
                'email' => 'vineet.sainik@princeeduhub.com',
                'phone' => '+91 79764 36882',
                'password' => Hash::make('Prince@79764'),
                'role' => 'member',
                'status' => 'active',
            ],
            [
                'name' => 'PCP Jaipur',
                'email' => 'pcp.jaipur@princeeduhub.com',
                'phone' => '+91 82339 11938',
                'password' => Hash::make('Prince@82339'),
                'role' => 'member',
                'status' => 'active',
            ],
            [
                'name' => 'Prince academy FDO',
                'email' => 'academy.fdo@princeeduhub.com',
                'phone' => '+91 97999 12938',
                'password' => Hash::make('Prince@97999'),
                'role' => 'member',
                'status' => 'active',
            ],
            [
                'name' => 'Rahul Ji Mishra (PCP Prime)',
                'email' => 'rahul.mishra.prime@princeeduhub.com',
                'phone' => '+91 63769 13003',
                'password' => Hash::make('Prince@63769'),
                'role' => 'member',
                'status' => 'active',
            ],
            [
                'name' => 'Rahul ji Reviews (PCP Prime)',
                'email' => 'rahul.reviews.prime@princeeduhub.com',
                'phone' => '+91 92516 34059',
                'password' => Hash::make('Prince@92516'),
                'role' => 'member',
                'status' => 'active',
            ],
            [
                'name' => 'Santosh Ji Prince RBSE',
                'email' => 'santosh.rbse@princeeduhub.com',
                'phone' => '+91 95875 74938',
                'password' => Hash::make('Prince@95875'),
                'role' => 'member',
                'status' => 'active',
            ],
        ];

        foreach ($team as $member) {
            User::updateOrCreate(
                ['email' => $member['email']],
                $member
            );
        }
    }
}
