<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-clean temporary GBP post uploads older than 24 hours
Schedule::call(function () {
    $dir = public_path('uploads/posts');
    if (File::exists($dir)) {
        $expireTime = time() - (24 * 3600);
        foreach (File::files($dir) as $file) {
            if ($file->getFilename() !== '.gitignore' && $file->getMTime() < $expireTime) {
                @unlink($file->getRealPath());
            }
        }
    }
})->daily()->name('cleanup-gbp-uploads');

// Daily maintenance: Prune stale disk cache files older than 90 days (never touches tokens)
Schedule::call(function () {
    $dir = storage_path('app/gbp_data');
    if (File::isDirectory($dir)) {
        $expireTime = time() - (90 * 86400);
        foreach (File::files($dir) as $file) {
            if ($file->getFilename() !== '.gitignore' && $file->getMTime() < $expireTime) {
                @unlink($file->getRealPath());
            }
        }
    }
})->daily()->name('cleanup-stale-gbp-cache');

// Automated daily database & token backup with 7-day retention
Schedule::command('gbp:backup --retention=7')->daily()->at('03:00')->name('daily-gbp-backup');

// Auto-reply to new incoming reviews every 15 minutes for profiles with auto-reply enabled
Schedule::command('gbp:auto-reply')->everyFifteenMinutes()->name('gbp-auto-reply-reviews');
