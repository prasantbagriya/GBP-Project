<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prince Edu Hub - Google Business Profile Portal</title>
    <meta name="description" content="Official Google Business Profile management, live review sync, and customer engagement portal for Prince Edu Hub educational institutions." />
    
    <!-- Google Search Console Site Verification -->
    <meta name="google-site-verification" content="T5VaJ-WYl09aUADf0hGF4FmF3rh-wElz2QvzRcZT8rk" />

    <!-- Open Graph / Meta -->
    <meta property="og:title" content="Prince Edu Hub - Google Business Profile Portal" />
    <meta property="og:description" content="Multi-branch Google Business Profile management, reviews monitoring, and official responses." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="{{ url('/') }}" />
    <meta property="og:image" content="{{ asset('assets/branding/app-logo-512.png') }}" />

    <link rel="icon" type="image/png" sizes="120x120" href="{{ asset('assets/branding/app-logo-120.png') }}">
    <link rel="icon" type="image/svg+xml" href="{{ asset('assets/branding/logo.svg') }}">

    <!-- Google Fonts & Tailwind CDN -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                        mono: ['"JetBrains Mono"', 'monospace'],
                    },
                    colors: {
                        brand: {
                            50: '#eef2ff',
                            100: '#e0e7ff',
                            200: '#c7d2fe',
                            500: '#6366f1',
                            600: '#4f46e5',
                            700: '#4338ca',
                            800: '#3730a3',
                            900: '#1e1b4b',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .gradient-text {
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #0284c7 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .hero-pattern {
            background-color: #f8fafc;
            background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
            background-size: 24px 24px;
        }
    </style>
    <!-- PWA Standalone Direct-to-Login Handler -->
    <script>
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            window.location.replace('/login');
        }
    </script>
    <link rel="manifest" href="/manifest.json">
</head>
<body class="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen flex flex-col justify-between selection:bg-indigo-600 selection:text-white">

    <!-- Top Navigation Bar -->
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <!-- Brand Logo & Name -->
            <a href="/" class="flex items-center gap-3">
                <img src="{{ asset('assets/branding/logo.svg') }}" alt="Prince Edu Hub Logo" class="w-9 h-9 rounded-lg" />
                <div class="flex flex-col">
                    <span class="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                        Prince Edu Hub
                    </span>
                    <span class="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
                        GBP sync portal
                    </span>
                </div>
            </a>

            <!-- Navigation Links -->
            <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                <a href="#features" class="hover:text-indigo-600 transition-colors">Features</a>
                <a href="#branches" class="hover:text-indigo-600 transition-colors">Institutions</a>
                <a href="#compliance" class="hover:text-indigo-600 transition-colors">Data safety</a>
                <a href="/privacy-policy" class="hover:text-indigo-600 transition-colors">Privacy policy</a>
                <a href="/terms-of-service" class="hover:text-indigo-600 transition-colors">Terms of service</a>
            </nav>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3">
                <a href="/privacy-policy" class="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-indigo-600 px-2 py-1">
                    Privacy
                </a>
                <a href="/login" class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-xs">
                    <span>Staff login</span>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                    </svg>
                </a>
            </div>
        </div>
    </header>

    <main class="flex-1">
        <!-- Hero Section -->
        <section class="hero-pattern pt-16 pb-20 border-b border-slate-200">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                <!-- Status Tag -->
                <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-2xs">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Official multi-branch Google Business sync</span>
                </div>

                <!-- Main Headline -->
                <h1 class="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight">
                    Real-time Google Business Profile sync and <span class="gradient-text">reviews management</span>
                </h1>

                <!-- Subheadline -->
                <p class="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
                    A centralized operations portal for Prince Edu Hub branches to monitor Google reviews, publish verified responses, and sync performance analytics.
                </p>

                <!-- Actions -->
                <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <a href="/login" class="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm">
                        <span>Staff portal login</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                        </svg>
                    </a>
                    <a href="/privacy-policy" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-lg text-sm transition-colors shadow-2xs">
                        <span>Privacy policy</span>
                    </a>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section id="features" class="py-16 bg-slate-50 border-b border-slate-200">
            <div class="max-w-6xl mx-auto px-4 sm:px-6">
                <div class="max-w-2xl mb-12">
                    <p class="text-xs font-bold uppercase tracking-wider text-indigo-600">Platform capabilities</p>
                    <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">Built for educational oversight</h2>
                    <p class="text-slate-600 mt-2 text-sm leading-relaxed">
                        Everything needed to oversee Google Business Profiles, respond to student and parent inquiries, and preserve verified public reputation.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Feature 1 -->
                    <div class="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs hover:shadow-sm transition-all">
                        <div class="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                            </svg>
                        </div>
                        <h3 class="text-base font-bold text-slate-900">Multi-profile review sync</h3>
                        <p class="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
                            Monitor incoming reviews across PCP Piprali, Prince Hospital, Floreto World School, Prince Defence Academy, and all affiliated campuses in one real-time dashboard.
                        </p>
                    </div>

                    <!-- Feature 2 -->
                    <div class="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs hover:shadow-sm transition-all">
                        <div class="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.018z"/>
                            </svg>
                        </div>
                        <h3 class="text-base font-bold text-slate-900">Official merchant replies</h3>
                        <p class="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
                            Draft and publish direct merchant responses to Google reviews using the authorized Google Business Profile API, ensuring timely parent and student communication.
                        </p>
                    </div>

                    <!-- Feature 3 -->
                    <div class="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs hover:shadow-sm transition-all">
                        <div class="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"/>
                            </svg>
                        </div>
                        <h3 class="text-base font-bold text-slate-900">Google Sheets integration</h3>
                        <p class="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
                            Automatically export verified review targets, daily ratings, and team progress into authorized Google Spreadsheets for administrative reporting.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Managed Institutions Section -->
        <section id="branches" class="py-16 bg-white border-b border-slate-200">
            <div class="max-w-6xl mx-auto px-4 sm:px-6">
                <div class="max-w-2xl mb-12">
                    <p class="text-xs font-bold uppercase tracking-wider text-indigo-600">Network overview</p>
                    <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">Affiliated campuses and business profiles</h2>
                    <p class="text-slate-600 mt-2 text-sm leading-relaxed">
                        Centralized profile oversight across Sikar and Jaipur educational divisions.
                    </p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    @php
                    $branches = [
                        ['title' => 'Prince Hospital & Medical Center', 'area' => 'Bajor, Sikar', 'category' => 'Healthcare & Medical'],
                        ['title' => 'PCP Sikar (Prime Branch / Piprali)', 'area' => 'Palwas & Piprali Road, Sikar', 'category' => 'NEET & IIT-JEE Coaching'],
                        ['title' => 'Floreto World School', 'area' => 'NH-52, Palwas Road, Sikar', 'category' => 'International K-12 School'],
                        ['title' => 'Prince Defence Academy (PDA)', 'area' => 'Palwas Road, Sikar', 'category' => 'NDA, Airforce, Navy Training'],
                        ['title' => 'Prince College Sikar', 'area' => 'Didwana Road, Sikar', 'category' => 'UG / PG Higher Education'],
                        ['title' => 'Prince Academy of Higher Education', 'area' => 'Palwas Road, Sikar', 'category' => 'CBSE Senior Secondary'],
                        ['title' => 'Prince RBSE Senior Secondary School', 'area' => 'Palwas Campus, Sikar', 'category' => 'RBSE Board Education'],
                        ['title' => 'Prince Sainik School', 'area' => 'Palwas Road, Sikar', 'category' => 'Military & Sainik School Prep'],
                        ['title' => 'PCP Jaipur Campus', 'area' => 'Jaipur, Rajasthan', 'category' => 'Pre-Medical & Engineering'],
                    ];
                    @endphp

                    @foreach($branches as $b)
                    <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-200 flex items-start gap-3 hover:bg-white hover:shadow-2xs transition-all">
                        <div class="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                            </svg>
                        </div>
                        <div class="min-w-0 flex-1">
                            <h4 class="font-bold text-slate-900 text-sm truncate">{{ $b['title'] }}</h4>
                            <p class="text-xs text-slate-500 mt-0.5">{{ $b['area'] }}</p>
                            <span class="inline-block mt-2 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                                {{ $b['category'] }}
                            </span>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
        </section>

        <!-- Compliance & Security Section -->
        <section id="compliance" class="py-16 bg-slate-50 border-b border-slate-200">
            <div class="max-w-4xl mx-auto px-4 sm:px-6">
                <div class="p-6 sm:p-8 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-6">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-slate-900">Security and Google API compliance</h3>
                            <p class="text-xs text-slate-500">Adhering to Google API Services User Data Policies and Limited Use requirements</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                        <div class="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                            <span class="font-bold text-slate-900 block mb-1">Encrypted OAuth credentials</span>
                            Tokens are encrypted with AES-256 and transmitted exclusively via TLS 1.3 encryption.
                        </div>
                        <div class="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                            <span class="font-bold text-slate-900 block mb-1">No data transfer to brokers</span>
                            User data is never sold, leased, or transferred to third-party data brokers or advertisers.
                        </div>
                        <div class="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                            <span class="font-bold text-slate-900 block mb-1">Role-based access limitation</span>
                            Data access is restricted solely to authorized administrative staff managing institutional profiles.
                        </div>
                        <div class="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                            <span class="font-bold text-slate-900 block mb-1">Revocation and deletion</span>
                            Users may revoke Google access anytime via their Google account settings or request immediate deletion.
                        </div>
                    </div>

                    <div class="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                        <span class="text-slate-500">Detailed legal policies:</span>
                        <div class="flex gap-4 font-semibold text-indigo-600">
                            <a href="/privacy-policy" class="hover:underline">Privacy policy &rarr;</a>
                            <a href="/terms-of-service" class="hover:underline">Terms of service &rarr;</a>
                            <a href="/data-deletion" class="hover:underline">Data deletion policy &rarr;</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Public Footer -->
    <footer class="bg-white border-t border-slate-200 py-10">
        <div class="max-w-6xl mx-auto px-4 sm:px-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-200">
                <!-- Col 1: About -->
                <div class="space-y-2">
                    <div class="flex items-center gap-2">
                        <img src="{{ asset('assets/branding/logo.svg') }}" alt="Prince Edu Hub Logo" class="w-7 h-7 rounded-lg" />
                        <span class="font-bold text-slate-900 text-sm">Prince Edu Hub</span>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                        Official Google Business Profile management and review synchronization portal for Prince Edu Hub educational branches.
                    </p>
                </div>

                <!-- Col 2: Navigation -->
                <div>
                    <h5 class="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Portal links</h5>
                    <ul class="space-y-2 text-xs text-slate-600 font-medium">
                        <li><a href="/" class="hover:text-indigo-600 transition-colors">Homepage</a></li>
                        <li><a href="/login" class="text-indigo-600 hover:text-indigo-800 font-bold">Staff portal login</a></li>
                        <li><a href="#features" class="hover:text-indigo-600 transition-colors">Platform features</a></li>
                        <li><a href="#branches" class="hover:text-indigo-600 transition-colors">Institutions</a></li>
                    </ul>
                </div>

                <!-- Col 3: Compliance & Legal -->
                <div>
                    <h5 class="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Legal and compliance</h5>
                    <ul class="space-y-2 text-xs text-slate-600 font-medium">
                        <li><a href="/privacy-policy" class="hover:text-indigo-600 transition-colors">Privacy policy</a></li>
                        <li><a href="/terms-of-service" class="hover:text-indigo-600 transition-colors">Terms of service</a></li>
                        <li><a href="/data-deletion" class="hover:text-indigo-600 transition-colors">Data deletion</a></li>
                    </ul>
                </div>

                <!-- Col 4: Contact -->
                <div>
                    <h5 class="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Contact administration</h5>
                    <div class="text-xs text-slate-500 space-y-1 leading-relaxed font-medium">
                        <p class="text-slate-800 font-semibold">Prince Edu Hub Administrative Office</p>
                        <p>Palwas Road & Piprali Road, Sikar, Rajasthan 332001</p>
                        <p class="pt-1">
                            Email: <a href="mailto:admin@gmb.princeeduhub.com" class="text-indigo-600 font-bold hover:underline">admin@gmb.princeeduhub.com</a>
                        </p>
                        <p>
                            Phone: <a href="tel:+919799912938" class="text-slate-800 hover:text-indigo-600 font-semibold">+91 97999 12938</a>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Bottom Copyright -->
            <div class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
                <p>&copy; {{ date('Y') }} Prince Edu Hub. All rights reserved.</p>
                <div class="flex items-center gap-6">
                    <a href="/privacy-policy" class="hover:text-indigo-600 transition-colors">Privacy policy</a>
                    <a href="/terms-of-service" class="hover:text-indigo-600 transition-colors">Terms of service</a>
                    <a href="/data-deletion" class="hover:text-indigo-600 transition-colors">Data deletion</a>
                </div>
            </div>
        </div>
    </footer>

</body>
</html>
