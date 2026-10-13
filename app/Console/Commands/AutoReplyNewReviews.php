<?php

namespace App\Console\Commands;

use App\Http\Controllers\GoogleBusinessController;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('gbp:auto-reply {--location= : Specific location name to process (e.g. locations/12345)} {--force : Force auto-reply even if profile has auto-reply disabled}')]
#[Description('Auto-reply to new incoming reviews for Google Business Profiles based on per-profile rules')]
class AutoReplyNewReviews extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(GoogleBusinessController $controller): int
    {
        $specificLocation = $this->option('location');
        $force = (bool) $this->option('force');

        $this->info('Starting GBP AI Auto-Reply engine...');

        if ($specificLocation) {
            $this->info("Processing single profile: {$specificLocation}");
            $result = $controller->autoReplyForProfile($specificLocation, $force);
            $this->displayProfileResult($result);

            return self::SUCCESS;
        }

        // Retrieve all saved locations
        $token = $controller->getPersistentToken() ?? [];
        $accountKey = 'gbp_locations_'.md5($token['user_email'] ?? 'default');
        $locations = $controller->getServerData($accountKey);

        if (empty($locations) || ! is_array($locations)) {
            $this->warn('No saved Google Business Profiles found. Connect your Google account first.');

            return self::SUCCESS;
        }

        $this->info('Scanning '.count($locations).' profile(s) individually...');

        $totalReplied = 0;
        $totalSkipped = 0;
        $activeProfiles = 0;

        foreach ($locations as $loc) {
            $locName = $loc['name'] ?? null;
            $locTitle = $loc['title'] ?? ($locName ?: 'Unknown Profile');
            if (! $locName) {
                continue;
            }

            // Check this profile's rules individually
            $rules = $controller->getAiRulesArray($locName);
            $isEnabled = ! empty($rules['enabled']);

            if (! $isEnabled && ! $force) {
                $this->line(" <fg=gray>[SKIPPED]</> {$locTitle} ({$locName}) - Auto-reply disabled for this profile.");

                continue;
            }

            $activeProfiles++;
            $this->line(" <fg=cyan>[PROCESSING]</> {$locTitle} ({$locName}) - Profile rules active (Min: {$rules['minStarRating']}★, Tone: {$rules['tone']})");

            $result = $controller->autoReplyForProfile($locName, $force);
            $totalReplied += ($result['repliedCount'] ?? 0);
            $totalSkipped += ($result['skippedCount'] ?? 0);

            if (! empty($result['repliedCount'])) {
                $this->info("   -> Replied to {$result['repliedCount']} review(s) successfully.");
            } elseif (! empty($result['message'])) {
                $this->line("   -> {$result['message']}");
            }
        }

        $this->newLine();
        $this->info("Finished! Active profiles: {$activeProfiles}, Total reviews replied: {$totalReplied}, Skipped: {$totalSkipped}");

        return self::SUCCESS;
    }

    /**
     * Display single profile execution result
     */
    protected function displayProfileResult(array $result): void
    {
        if (empty($result['success']) && empty($result['enabled'])) {
            $this->warn($result['message'] ?? 'Auto-reply failed or disabled.');

            return;
        }

        $this->line("Location: {$result['locationName']}");
        $this->line("Total Pending: {$result['totalPending']}");
        $this->info("Replied: {$result['repliedCount']}");
        $this->comment("Skipped: {$result['skippedCount']}");
        if (! empty($result['message'])) {
            $this->line($result['message']);
        }
    }
}
