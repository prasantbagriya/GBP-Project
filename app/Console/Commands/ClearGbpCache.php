<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

class ClearGbpCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'gbp:clear-cache {--all : Also clear persistent Google token file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear all server-side cached Google Business Profile data, reports, and review snapshots';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Clearing server-side GBP cache...');

        $deletedFiles = 0;
        $dir = storage_path('app/gbp_data');

        if (File::isDirectory($dir)) {
            $files = File::files($dir);
            foreach ($files as $file) {
                if ($file->getFilename() !== '.gitignore') {
                    @unlink($file->getRealPath());
                    $deletedFiles++;
                }
            }
        }

        // Clear general application cache
        try {
            Cache::flush();
            $this->info('Application cache flushed successfully.');
        } catch (\Throwable $e) {
            $this->warn('Could not flush cache: '.$e->getMessage());
        }

        // If --all passed, delete the stored token
        if ($this->option('all')) {
            $tokenFile = storage_path('app/google_token.json');
            if (File::exists($tokenFile)) {
                @unlink($tokenFile);
                $this->warn('Google OAuth token removed from disk. You will need to reconnect.');
            }
        } else {
            // Restore persistent token if it exists so auth remains intact
            $tokenFile = storage_path('app/google_token.json');
            if (File::exists($tokenFile)) {
                try {
                    $token = json_decode(File::get($tokenFile), true);
                    if (! empty($token)) {
                        Cache::forever('gbp_persistent_google_token', $token);
                    }
                } catch (\Throwable $e) {
                }
            }
            $this->info('Google OAuth credentials preserved (No re-login needed).');
        }

        $this->info("Cleared {$deletedFiles} cached data file(s) from {$dir}.");
        $this->info('Server cache is completely clean!');

        return Command::SUCCESS;
    }
}
