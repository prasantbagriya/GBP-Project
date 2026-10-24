<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - {{ config('app.name', 'Coaching in Sikar') }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen flex flex-col justify-between">
    <header class="bg-white border-b border-slate-200 py-4 shadow-sm">
        <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
            <a href="/" class="text-xl font-bold text-indigo-600 flex items-center gap-2">
                <span>{{ config('app.name', 'Coaching in Sikar') }}</span>
            </a>
            <span class="text-xs text-slate-500">Last updated: October 2026</span>
        </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-10 flex-1">
        <div class="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
            <p class="text-sm text-slate-600 leading-relaxed">
                By accessing or using {{ config('app.name', 'Coaching in Sikar') }}, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>

            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1">1. Use of Services</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    Our platform allows users to manage their Google Business Profile, Facebook Pages, customer communication, and website live chat widgets. You agree to use these services only for authorized and legitimate business purposes in compliance with Meta Platforms terms and Google terms of service.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1">2. Third-Party Integrations</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    Our platform integrates with Meta/Facebook Graph API and Google APIs. Your use of these third-party features is subject to the respective platform's policies and terms. We are not responsible for account suspensions or changes imposed by third-party platforms.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1">3. Content and Conduct</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    You are solely responsible for the content you schedule, post, or publish through our platform. You agree not to post abusive, unlawful, harassing, defamatory, or spam content.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1">4. Termination</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    You may terminate your account or disconnect integrated services at any time. We reserve the right to suspend or terminate access to our services if terms are violated.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1">5. Contact Information</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    For any questions regarding these Terms, please reach out to us at <span class="font-semibold text-slate-700">support@coachingsinsikar.com</span>.
                </p>
            </section>
        </div>
    </main>

    <footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div class="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; {{ date('Y') }} {{ config('app.name', 'Coaching in Sikar') }}. All rights reserved.</span>
            <div class="flex gap-4">
                <a href="/privacy-policy" class="hover:underline">Privacy Policy</a>
                <a href="/terms-of-service" class="hover:underline">Terms of Service</a>
                <a href="/data-deletion" class="hover:underline">Data Deletion</a>
            </div>
        </div>
    </footer>
</body>
</html>
