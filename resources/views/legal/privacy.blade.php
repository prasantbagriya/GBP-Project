<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - {{ config('app.name', 'Coaching in Sikar') }}</title>
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
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
            <p class="text-sm text-slate-600 leading-relaxed">
                This Privacy Policy explains how {{ config('app.name', 'Coaching in Sikar') }} ("we", "our", or "us") collects, uses, processes, and protects your information when you connect and use our services, including our integrations with Meta/Facebook Graph API, Google Business Profile API, and our website communication tools.
            </p>

            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1">1. Information We Collect</h2>
                <p class="text-sm text-slate-600 leading-relaxed">When you authorize our application via Meta/Facebook OAuth or use our tools, we may collect:</p>
                <ul class="list-disc list-inside text-sm text-slate-600 space-y-1 ml-2">
                    <li><strong>Facebook Page Information:</strong> Page ID, Page name, category, and access tokens for pages you manage.</li>
                    <li><strong>Page Engagement Data:</strong> Public comments, posts, and visitor inquiries sent to your managed pages.</li>
                    <li><strong>User Account Details:</strong> Name and email address provided during authentication.</li>
                    <li><strong>Communication Data:</strong> Chat interactions submitted via our website live chat widget.</li>
                </ul>
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1">2. How We Use Your Information</h2>
                <p class="text-sm text-slate-600 leading-relaxed">We use the collected information solely for providing and improving our services, including:</p>
                <ul class="list-disc list-inside text-sm text-slate-600 space-y-1 ml-2">
                    <li>Facilitating scheduled posting and content publication to your authorized Facebook Pages.</li>
                    <li>Moderating and automating responses to customer comments and direct messages using AI.</li>
                    <li>Providing analytics and engagement metrics to page owners.</li>
                    <li>Powering our website live chat assistant and routing leads to your team.</li>
                </ul>
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1">3. Data Sharing & Third Parties</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    We do <strong>not</strong> sell, rent, or trade your personal information or your social media data to third parties. Data is only exchanged with:
                </p>
                <ul class="list-disc list-inside text-sm text-slate-600 space-y-1 ml-2">
                    <li><strong>Meta Platforms, Inc. (Facebook Graph API):</strong> To read and post page updates as authorized by you.</li>
                    <li><strong>Google APIs:</strong> For Google Business Profile management and Gemini AI natural language processing.</li>
                </ul>
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1">4. Data Retention and Deletion</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    We retain data only as long as necessary to provide you with the services. You can disconnect your Facebook Page or Google account at any time directly through the dashboard. 
                </p>
                <p class="text-sm text-slate-600 leading-relaxed">
                    To request complete deletion of your data, visit our <a href="/data-deletion" class="text-indigo-600 underline font-semibold">User Data Deletion Instructions</a> page or contact us at <span class="font-semibold text-slate-700">support@coachingsinsikar.com</span>.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1">5. Security</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    We implement industry-standard encryption protocols (HTTPS/TLS) and secure token storage to safeguard access credentials and avoid unauthorized access.
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
