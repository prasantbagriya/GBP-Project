<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Data Deletion Instructions - Coaching In Sikar</title>
    <meta name="description" content="Data Deletion Instructions for Google and Meta accounts connected to Coaching In Sikar GBP Live Sync Portal." />
    
    <link rel="icon" type="image/png" sizes="120x120" href="{{ asset('assets/branding/app-logo-120.png') }}">
    <link rel="icon" type="image/svg+xml" href="{{ asset('assets/branding/logo.svg') }}">

    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col justify-between selection:bg-indigo-600 selection:text-white">

    <!-- Header Navigation -->
    <header class="bg-white border-b border-slate-200 py-3.5 sticky top-0 z-50">
        <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
            <a href="/" class="flex items-center gap-2.5">
                <img src="{{ asset('assets/branding/logo.svg') }}" alt="Prince Edu Hub Logo" class="w-8 h-8 rounded-lg" />
                <div class="flex flex-col">
                    <span class="text-sm font-bold text-slate-900 leading-tight">Prince Edu Hub</span>
                    <span class="text-xs text-indigo-600 font-semibold uppercase tracking-wider">GBP sync portal</span>
                </div>
            </a>
            <div class="flex items-center gap-4 text-xs font-medium">
                <a href="/" class="text-slate-600 hover:text-indigo-600">Home</a>
                <a href="/privacy-policy" class="text-slate-600 hover:text-indigo-600">Privacy policy</a>
                <a href="/terms-of-service" class="text-slate-600 hover:text-indigo-600">Terms of service</a>
                <a href="/dashboard" class="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-bold shadow-xs">Staff portal</a>
            </div>
        </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <div class="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div class="border-b border-slate-100 pb-4">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
                    User rights and compliance
                </div>
                <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">User Data Deletion Instructions</h1>
                <p class="text-sm text-slate-600 leading-relaxed mt-2">
                    In compliance with Google API Services and Meta Platform policies, <strong>Coaching In Sikar</strong> provides a transparent process for users and page owners to request the complete removal of personal information and OAuth access tokens.
                </p>
            </div>

            <!-- Option 1: Google Account Disconnect -->
            <section class="space-y-3">
                <h2 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                    <span class="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs flex items-center justify-center font-bold">1</span>
                    <span>Disconnect via Google account permissions</span>
                </h2>
                <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    You can revoke our application's access to your Google Business Profile and Google Account at any time:
                </p>
                <ol class="list-decimal list-inside text-xs sm:text-sm text-slate-600 space-y-1.5 ml-2">
                    <li>Navigate to your Google Account Security settings at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" class="text-indigo-600 underline font-semibold">https://myaccount.google.com/permissions</a>.</li>
                    <li>Locate <strong>Coaching In Sikar</strong> or <strong>GBP Live Sync Portal</strong> under third-party apps with account access.</li>
                    <li>Click on the application and select <strong>Remove Access</strong>.</li>
                    <li>Google immediately revokes all OAuth2 authorization tokens.</li>
                </ol>
            </section>

            <!-- Option 2: Dashboard Disconnect -->
            <section class="space-y-3">
                <h2 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                    <span class="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs flex items-center justify-center font-bold">2</span>
                    <span>Disconnect directly from application dashboard</span>
                </h2>
                <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Within our application:
                </p>
                <ul class="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1.5 ml-2">
                    <li>For Google Business Profile: Click <strong>Disconnect Account / Logout</strong> in the top user menu. This destroys active session keys and clears access tokens.</li>
                    <li>For Facebook Pages: Navigate to the <strong>Facebook Suite</strong> tab and click <strong>Disconnect Page</strong>. All cached comments, tokens, and page metadata are immediately removed.</li>
                </ul>
            </section>

            <!-- Option 3: Manual Erase Request -->
            <section class="space-y-3">
                <h2 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                    <span class="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs flex items-center justify-center font-bold">3</span>
                    <span>Submit a formal data deletion request</span>
                </h2>
                <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    If you wish to have all stored records, cached profile data, audit logs, and authentication tokens permanently wiped from our server databases, please submit a deletion request to:
                </p>
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 flex items-center justify-between">
                    <span class="font-semibold text-indigo-700">admin@coachingsinsikar.com</span>
                    <span class="text-xs text-slate-500 font-medium">Processed within 48 hours</span>
                </div>
                <p class="text-xs text-slate-500 leading-relaxed font-medium">
                    Please include your connected Google or Facebook email address. Our systems administrator will execute the permanent purge and send you an email confirmation.
                </p>
            </section>
        </div>
    </main>

    <footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-medium">
        <div class="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; {{ date('Y') }} Coaching In Sikar / Prince Eduhub. All rights reserved.</span>
            <div class="flex gap-4">
                <a href="/" class="hover:text-indigo-600 transition-colors">Home</a>
                <a href="/privacy-policy" class="hover:text-indigo-600 transition-colors">Privacy policy</a>
                <a href="/terms-of-service" class="hover:text-indigo-600 transition-colors">Terms of service</a>
                <a href="/data-deletion" class="text-indigo-600 font-bold">Data deletion</a>
            </div>
        </div>
    </footer>
</body>
</html>
