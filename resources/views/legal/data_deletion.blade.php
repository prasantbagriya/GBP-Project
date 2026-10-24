<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Data Deletion Instructions - {{ config('app.name', 'Coaching in Sikar') }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen flex flex-col justify-between">
    <header class="bg-white border-b border-slate-200 py-4 shadow-sm">
        <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
            <a href="/" class="text-xl font-bold text-indigo-600 flex items-center gap-2">
                <span>{{ config('app.name', 'Coaching in Sikar') }}</span>
            </a>
            <span class="text-xs text-slate-500">Facebook Platform Compliance</span>
        </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-10 flex-1">
        <div class="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">User Data Deletion Instructions</h1>
            <p class="text-sm text-slate-600 leading-relaxed">
                In compliance with Meta Platforms' Facebook Platform terms, {{ config('app.name', 'Coaching in Sikar') }} provides a transparent way for users to request the removal and permanent deletion of any data obtained through Facebook Login or our services.
            </p>

            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1">Option 1: Disconnect and Delete via Facebook Settings</h2>
                <p class="text-sm text-slate-600 leading-relaxed">You can remove our application's access directly from your Facebook account at any time:</p>
                <ol class="list-decimal list-inside text-sm text-slate-600 space-y-2 ml-2">
                    <li>Go to your Facebook profile’s <strong>Settings & Privacy &gt; Settings</strong>.</li>
                    <li>Click on <strong>Apps and Websites</strong> in the left sidebar menu.</li>
                    <li>Find <strong>{{ config('app.name', 'Coaching in Sikar') }}</strong> in the list of active apps.</li>
                    <li>Click <strong>Remove</strong>.</li>
                    <li>Optionally check the box to request deletion of all posts, videos, or events that this app may have published on your behalf, and confirm.</li>
                </ol>
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1">Option 2: Delete from the Application Dashboard</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    Within our application, navigate to the <strong>Facebook Pages</strong> tab and click <strong>Disconnect Page</strong>. This immediately removes stored page tokens, scheduled posts, and cached comments associated with that page from our database.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1">Option 3: Manual Data Deletion Request</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    If you wish to have all stored account information, access tokens, and chat records permanently erased from our servers, please send an email to:
                </p>
                <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-indigo-700">
                    support@coachingsinsikar.com
                </div>
                <p class="text-xs text-slate-500 leading-relaxed">
                    Please mention "Facebook Data Deletion Request" in the subject line and specify your Facebook User ID or Page Name. Our team will process your deletion request and confirm erasure within 48 business hours.
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
