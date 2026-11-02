<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Coaching In Sikar (GBP Live Sync)</title>
    <meta name="description" content="Privacy Policy and Google API User Data Policy disclosure for Coaching In Sikar GBP Live Sync Portal." />
    <meta name="google-site-verification" content="T5VaJ-WYl09aUADf0hGF4FmF3rh-wElz2QvzRcZT8rk">
    
    <link rel="icon" type="image/png" sizes="120x120" href="{{ asset('assets/branding/app-logo-120.png') }}">
    <link rel="icon" type="image/svg+xml" href="{{ asset('assets/branding/logo.svg') }}">

    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
        body { font-family: 'Plus Jakarta Sans', Inter, sans-serif; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col justify-between">

    <!-- Header Navigation -->
    <header class="bg-white border-b border-slate-200 py-4 shadow-2xs sticky top-0 z-50">
        <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
            <a href="/" class="flex items-center gap-2.5">
                <img src="{{ asset('assets/branding/logo.svg') }}" alt="Coaching In Sikar Logo" class="w-9 h-9 rounded-lg" />
                <div class="flex flex-col">
                    <span class="text-base font-extrabold text-slate-900 leading-tight">Prince Edu Hub</span>
                    <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">GBP Live Sync Portal</span>
                </div>
            </a>
            <div class="flex items-center gap-4 text-xs font-semibold">
                <a href="/" class="text-slate-600 hover:text-indigo-600">Home</a>
                <a href="/terms-of-service" class="text-slate-600 hover:text-indigo-600">Terms of Service</a>
                <a href="/dashboard" class="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">Staff Portal</a>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 py-10 flex-1 w-full">
        <div class="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-8">
            
            <!-- Document Header -->
            <div class="border-b border-slate-100 pb-6">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
                    Compliance & Data Protection
                </div>
                <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
                <p class="text-xs text-slate-500 mt-2">
                    Effective Date: October 2026 &bull; Last Updated: November 2, 2026
                </p>
                <p class="text-sm text-slate-600 leading-relaxed mt-4">
                    This Privacy Policy explains how <strong>Prince Eduhub</strong> &amp; <strong>Coaching In Sikar</strong> ("we", "our", or "us") collects, uses, protects, and discloses information when you use our multi-location Google Business Profile management portal ("Service", "Portal", "App"), accessible at <a href="https://gmb.princeeduhub.com/" class="text-indigo-600 underline font-semibold">https://gmb.princeeduhub.com/</a>.
                </p>
            </div>

            <!-- Notice Banner for Google Compliance -->
            <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-5 text-indigo-950 text-xs sm:text-sm leading-relaxed space-y-2">
                <div class="flex items-center gap-2 font-bold text-indigo-900">
                    <svg class="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    <span>Google API Services User Data Policy Compliance</span>
                </div>
                <p>
                    <strong>Coaching In Sikar's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" class="underline font-semibold text-indigo-800">Google API Services User Data Policy</a>, including the Limited Use requirements.</strong>
                </p>
            </div>

            <!-- Section 1 -->
            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">1. Google User Data We Collect</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    When you explicitly authorize our application via Google OAuth2, we access only the data necessary to provide our Google Business Profile synchronization, reporting, and review management features:
                </p>
                <ul class="list-disc list-inside text-sm text-slate-600 space-y-2 ml-2">
                    <li><strong>Google Account Information:</strong> Your primary Google email address, verified name, and profile photo (obtained via <code>https://www.googleapis.com/auth/userinfo.email</code> and <code>https://www.googleapis.com/auth/userinfo.profile</code>) to authenticate authorized administrators.</li>
                    <li><strong>Google Business Profile Data:</strong> Location IDs, business names, storefront addresses, phone numbers, operational hours, and business categories for verified institutional branches you manage (obtained via <code>https://www.googleapis.com/auth/business.manage</code>).</li>
                    <li><strong>Customer Reviews and Ratings:</strong> Public customer reviews, star ratings (1 to 5 stars), reviewer display names, reviewer profile photo URLs, review timestamps, and merchant review replies.</li>
                    <li><strong>Google Sheets Access (Optional):</strong> If you configure Google Sheets live reporting, our app requests permission (<code>https://www.googleapis.com/auth/spreadsheets</code>) strictly to append and update daily review summaries in the specific Google Spreadsheet you designate.</li>
                </ul>
            </section>

            <!-- Section 2 -->
            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">2. How We Use Google User Data</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    All data accessed through Google APIs is used exclusively to deliver the requested core functionalities to authenticated administrators:
                </p>
                <ul class="list-disc list-inside text-sm text-slate-600 space-y-2 ml-2">
                    <li><strong>Centralized Multi-Location Monitoring:</strong> Displaying real-time ratings and review volumes across authorized branches (such as PCP Piprali, Prince Hospital, Floreto World School, Prince Defence Academy, and Prince College).</li>
                    <li><strong>Publishing Authorized Merchant Responses:</strong> Allowing verified staff to compose and publish direct responses to customer reviews via Google's Business Profile API.</li>
                    <li><strong>Daily Review Reporting:</strong> Syncing daily review performance metrics and staff target achievements to administrative Google Sheets.</li>
                    <li><strong>Review Widgets for Official Websites:</strong> Generating responsive website embed widgets showing real-time verified customer reviews for specific branches.</li>
                </ul>
            </section>

            <!-- Section 3 -->
            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">3. Google API Limited Use & No Data Sale Guarantee</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    We maintain strict boundaries regarding your Google data:
                </p>
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs sm:text-sm text-slate-700">
                    <p><strong>&bull; No Sale of Data:</strong> We do <strong>not</strong> sell, rent, monetize, or lease Google user data, customer reviews, or personal information to third parties, data brokers, or advertising networks under any circumstances.</p>
                    <p><strong>&bull; No Advertising Targeting:</strong> Data obtained via Google OAuth is never used to serve targeted advertisements or build behavioral profiles.</p>
                    <p><strong>&bull; No Generalized AI Model Training:</strong> Google user data is never used to train generalized artificial intelligence or machine learning models.</p>
                    <p><strong>&bull; Limited Human Access:</strong> No humans read your Google data unless you explicitly request customer support, or where required by law.</p>
                </div>
            </section>

            <!-- Section 4 -->
            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">4. Data Storage, Security & Encryption</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    We implement rigorous industry-standard administrative, technical, and physical safeguards:
                </p>
                <ul class="list-disc list-inside text-sm text-slate-600 space-y-2 ml-2">
                    <li><strong>Encryption in Transit:</strong> All communications between your browser, our servers, and Google APIs are encrypted using TLS 1.3 / HTTPS.</li>
                    <li><strong>Encryption at Rest:</strong> OAuth tokens and sensitive credentials are encrypted using industry-standard AES-256 encryption.</li>
                    <li><strong>Role-Based Access Control:</strong> Only authorized administrative personnel with multi-factor authentication are permitted access to system databases.</li>
                </ul>
            </section>

            <!-- Section 5 -->
            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">5. Data Retention & Deletion Policy</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    We retain Google user data only for as long as your account remains connected and active:
                </p>
                <ul class="list-disc list-inside text-sm text-slate-600 space-y-2 ml-2">
                    <li><strong>Instant Disconnect:</strong> You may disconnect your Google Account at any time by clicking "Disconnect / Log Out" within the portal dashboard. This immediately invalidates stored access tokens.</li>
                    <li><strong>Google Account Permissions:</strong> You can revoke our application's access at any moment via your Google Account Security Settings at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" class="text-indigo-600 underline font-semibold">https://myaccount.google.com/permissions</a>.</li>
                    <li><strong>Complete Deletion Request:</strong> You may request complete erasure of all stored tokens and cached profile records by visiting our <a href="/data-deletion" class="text-indigo-600 underline font-semibold">User Data Deletion Instructions</a> or by emailing <a href="mailto:admin@coachingsinsikar.com" class="text-indigo-600 font-semibold">admin@coachingsinsikar.com</a>. Deletion is executed within 48 hours.</li>
                </ul>
            </section>

            <!-- Section 6 -->
            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">6. Third-Party Disclosures</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    We only transmit data to official third-party API providers directly authorized by you:
                </p>
                <ul class="list-disc list-inside text-sm text-slate-600 space-y-2 ml-2">
                    <li><strong>Google APIs (Google LLC):</strong> For managing Google Business Profile data and Google Sheets synchronization.</li>
                    <li><strong>Meta Platforms, Inc.:</strong> For optional Facebook Page comment moderation when explicitly enabled by administrators.</li>
                </ul>
            </section>

            <!-- Section 7 -->
            <section class="space-y-3">
                <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">7. Contact Information</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                    If you have questions, concerns, or requests regarding this Privacy Policy or our Google data handling practices, please contact our Data Protection Administrator:
                </p>
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-1">
                    <p class="font-bold text-slate-900">Coaching In Sikar &bull; Data Protection Office</p>
                    <p>Palwas Road & Piprali Road, Sikar, Rajasthan, India 332001</p>
                    <p>Email: <a href="mailto:admin@coachingsinsikar.com" class="text-indigo-600 font-semibold">admin@coachingsinsikar.com</a></p>
                    <p>Support: <a href="mailto:support@coachingsinsikar.com" class="text-indigo-600 font-semibold">support@coachingsinsikar.com</a></p>
                    <p>Phone: <a href="tel:+919799912938" class="text-indigo-600 font-semibold">+91 97999 12938</a></p>
                </div>
            </section>

            <!-- Cross-Link Banner -->
            <div class="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <span>Looking for our terms? Read our <a href="/terms-of-service" class="text-indigo-600 underline font-semibold">Terms of Service</a>.</span>
                <a href="/" class="text-indigo-600 hover:underline font-semibold">&larr; Return to Homepage</a>
            </div>

        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div class="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; {{ date('Y') }} Coaching In Sikar / Prince Eduhub. All rights reserved.</span>
            <div class="flex gap-4 font-medium">
                <a href="/" class="hover:underline">Home</a>
                <a href="/privacy-policy" class="hover:underline text-indigo-600">Privacy Policy</a>
                <a href="/terms-of-service" class="hover:underline">Terms of Service</a>
                <a href="/data-deletion" class="hover:underline">Data Deletion</a>
            </div>
        </div>
    </footer>

</body>
</html>
