<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

#[Signature('gbp:backup {--retention=7 : Number of days to retain backups}')]
#[Description('Safely snapshot SQLite database and persistent Google tokens with automated retention rotation')]
class BackupDatabase extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $backupDir = storage_path('app/backups');
        if (! File::isDirectory($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $timestamp = date('Y-m-d_His');
        $retentionDays = max(1, (int) $this->option('retention'));
        $backedUpFiles = 0;

        // 1. Snapshot SQLite Database if present
        $dbPath = database_path('database.sqlite');
        if (File::exists($dbPath)) {
            $backupDbPath = "{$backupDir}/db_backup_{$timestamp}.sqlite";
            try {
                // If SQLite connection is active, try WAL checkpoint before copy
                try {
                    \DB::connection()->getPdo()->exec('PRAGMA wal_checkpoint(TRUNCATE);');
                } catch (\Throwable $e) {
                    // Non-fatal if DB is busy or connection not active
                    Log::debug('WAL checkpoint notice during backup: '.$e->getMessage());
                }

                File::copy($dbPath, $backupDbPath);
                $this->info("Database snapshot created: db_backup_{$timestamp}.sqlite (".round(filesize($backupDbPath) / 1024, 1).' KB)');
                $backedUpFiles++;
            } catch (\Throwable $e) {
                $this->error('Failed to backup SQLite database: '.$e->getMessage());
                Log::error('GBP Backup failure (Database): '.$e->getMessage());
            }
        }

        // 2. Snapshot Persistent Google OAuth Token
        $tokenPath = storage_path('app/google_token.json');
        if (File::exists($tokenPath)) {
            $backupTokenPath = "{$backupDir}/token_backup_{$timestamp}.json";
            try {
                File::copy($tokenPath, $backupTokenPath);
                $this->info("Persistent token snapshot created: token_backup_{$timestamp}.json");
                $backedUpFiles++;
            } catch (\Throwable $e) {
                $this->warn('Failed to backup google_token.json: '.$e->getMessage());
                Log::warning('GBP Backup warning (Token): '.$e->getMessage());
            }
        }

        // 3. Automated Retention: Prune snapshots older than retention days
        $cutoffTime = time() - ($retentionDays * 86400);
        $prunedCount = 0;

        foreach (File::files($backupDir) as $file) {
            if ($file->getMTime() < $cutoffTime && $file->getFilename() !== '.gitignore') {
                @unlink($file->getRealPath());
                $prunedCount++;
            }
        }

        if ($prunedCount > 0) {
            $this->comment("Pruned {$prunedCount} snapshot(s) older than {$retentionDays} day(s).");
        }

        Log::info("GBP Automated Backup completed. Snapshots created: {$backedUpFiles}, Pruned: {$prunedCount}.");

        return self::SUCCESS;
    }
}
