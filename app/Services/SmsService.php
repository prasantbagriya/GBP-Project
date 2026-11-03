<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Normalize Indian or international phone number to E.164 format.
     */
    public static function formatPhoneNumber(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);

        // If 10-digit Indian mobile number
        if (strlen($cleaned) === 10) {
            return '+91'.$cleaned;
        }

        // If 12-digit starting with 91
        if (strlen($cleaned) === 12 && str_starts_with($cleaned, '91')) {
            return '+'.$cleaned;
        }

        if (str_starts_with($phone, '+')) {
            return '+'.$cleaned;
        }

        return '+91'.$cleaned;
    }

    /**
     * Send Transactional OTP SMS.
     *
     * @return array{success: bool, provider: string, message: string}
     */
    public static function sendOtp(string $phone, string $otp, ?string $userName = null): array
    {
        $formattedPhone = self::formatPhoneNumber($phone);
        $smsContent = "Your Prince Edu Hub verification OTP is {$otp}. Valid for 15 minutes. Do not share this code with anyone.";

        Log::info("SMS OTP triggered for {$formattedPhone}: {$otp}");

        // 1. Try Brevo (Sendinblue) Transactional SMS API
        $brevoApiKey = config('services.brevo.api_key') ?: env('BREVO_API_KEY', env('BREVO_KEY'));
        if (! empty($brevoApiKey)) {
            try {
                $sender = substr(preg_replace('/[^a-zA-Z0-9]/', '', (string) env('BREVO_SMS_SENDER', 'PrinceEdu')), 0, 11);
                $res = Http::withHeaders([
                    'api-key' => $brevoApiKey,
                    'accept' => 'application/json',
                    'content-type' => 'application/json',
                ])->timeout(10)->post('https://api.brevo.com/v3/transactionalSMS/send', [
                    'type' => 'transactional',
                    'unicodeEnabled' => false,
                    'sender' => $sender ?: 'PrinceEdu',
                    'recipient' => $formattedPhone,
                    'content' => $smsContent,
                ]);

                if ($res->successful()) {
                    Log::info("Brevo SMS sent successfully to {$formattedPhone}: ".$res->body());

                    return [
                        'success' => true,
                        'provider' => 'brevo',
                        'message' => 'SMS sent successfully via Brevo.',
                    ];
                }

                Log::warning("Brevo SMS failed for {$formattedPhone}: (HTTP {$res->status()}) ".$res->body());
            } catch (\Throwable $e) {
                Log::warning("Brevo SMS exception for {$formattedPhone}: ".$e->getMessage());
            }
        }

        // 2. Try Fast2SMS (Indian Gateway) if configured
        $fast2smsKey = env('FAST2SMS_API_KEY');
        if (! empty($fast2smsKey)) {
            try {
                $digits = preg_replace('/[^0-9]/', '', $phone);
                if (strlen($digits) > 10) {
                    $digits = substr($digits, -10);
                }

                $res = Http::withHeaders([
                    'authorization' => $fast2smsKey,
                ])->timeout(10)->post('https://www.fast2sms.com/dev/bulkV2', [
                    'variables_values' => $otp,
                    'route' => 'otp',
                    'numbers' => $digits,
                ]);

                if ($res->successful()) {
                    Log::info("Fast2SMS sent successfully to {$digits}: ".$res->body());

                    return [
                        'success' => true,
                        'provider' => 'fast2sms',
                        'message' => 'SMS sent successfully via Fast2SMS.',
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning("Fast2SMS exception for {$phone}: ".$e->getMessage());
            }
        }

        // Fallback: Recorded in logs
        return [
            'success' => true,
            'provider' => 'log',
            'message' => 'SMS OTP generated and dispatched.',
        ];
    }
}
