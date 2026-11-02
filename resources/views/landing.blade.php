<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prince Edu Hub - GBP Live Sync & Review Management Portal</title>
    <meta name="description" content="Official Google Business Profile management, live review sync, and customer engagement portal for Prince Edu Hub educational institutions." />
    
    <!-- Google Search Console Site Verification -->
    <meta name="google-site-verification" content="T5VaJ-WYl09aUADf0hGF4FmF3rh-wElz2QvzRcZT8rk" />

    <!-- Open Graph / Meta -->
    <meta property="og:title" content="Prince Edu Hub - GBP Live Sync Portal" />
    <meta property="og:description" content="Centralized multi-location Google Business Profile management, reviews monitoring, and AI-assisted responses." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="{{ url('/') }}" />
    <meta property="og:image" content="{{ asset('assets/branding/app-logo-512.png') }}" />

    <link rel="icon" type="image/png" sizes="120x120" href="{{ asset('assets/branding/app-logo-120.png') }}">
    <link rel="icon" type="image/svg+xml" href="{{ asset('assets/branding/logo.svg') }}">

    <!-- Google Fonts & Tailwind CDN -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
                    },
                    colors: {
                        brand: {
                            50: '#eef2ff',
                            100: '#e0e7ff',
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
        .gradient-text {
            background: linear-gradient(135deg, #4f46e5 0%, #2563eb 50%, #0284c7 100%);
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
<body class="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white">

    <!-- Top Navigation Bar (PUBLIC - NO LOGIN BARRIER) -->
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <!-- Brand Logo & Name -->
            <a href="/" class="flex items-center gap-3 group">
                <img src="{{ asset('assets/branding/logo.svg') }}" alt="Prince Edu Hub Logo" class="w-11 h-11 rounded-xl shadow-xs group-hover:scale-105 transition-transform" />
                <div class="flex flex-col">
                    <span class="text-lg font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Prince Edu Hub
                    </span>
                    <span class="text-[11px] font-bold text-indigo-600 tracking-wider uppercase">
                        GBP Live Sync Portal
                    </span>
                </div>
            </a>

            <!-- Navigation Links -->
            <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                <a href="#features" class="hover:text-indigo-600 transition-colors">Features</a>
                <a href="#branches" class="hover:text-indigo-600 transition-colors">Institutions</a>
                <a href="#compliance" class="hover:text-indigo-600 transition-colors">Data Safety</a>
                <a href="/privacy-policy" class="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                <a href="/terms-of-service" class="hover:text-indigo-600 transition-colors">Terms of Service</a>
            </nav>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3">
                <a href="/privacy-policy" class="hidden sm:inline-flex text-xs font-bold text-slate-600 hover:text-indigo-600 px-3 py-2">
                    Privacy
                </a>
                <a href="/login" class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <span>Staff Login</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                </a>
            </div>
        </div>
    </header>

    <main class="flex-1">
        <!-- Hero Section -->
        <section class="hero-pattern pt-16 pb-20 border-b border-slate-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <!-- Badge -->
                <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Verified Multi-Branch Google Business Management
                </div>

                <!-- Main Headline -->
                <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
                    Real-Time Google Business Profile Sync & <span class="gradient-text">Reviews Management</span>
                </h1>

                <!-- Subheadline -->
                <p class="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
                    A centralized operations portal for Prince Edu Hub educational branches to monitor Google reviews, publish verified responses, and sync performance analytics.
                </p>

                <!-- CTA Row -->
                <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <a href="/login" class="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all text-sm sm:text-base">
                        <span>Staff Login & Dashboard</span>
                        <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </a>
                    <a href="/privacy-policy" class="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl shadow-xs transition-all text-sm sm:text-base">
                        <span>Read Privacy Policy</span>
                    </a>
                </div>

                <!-- Key Trust Metrics -->
                <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
                    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div class="text-2xl sm:text-3xl font-extrabold text-indigo-600">11+</div>
                        <div class="text-xs sm:text-sm font-semibold text-slate-500 mt-1">Managed Branches</div>
                    </div>
                    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div class="text-2xl sm:text-3xl font-extrabold text-indigo-600">4.7★</div>
                        <div class="text-xs sm:text-sm font-semibold text-slate-500 mt-1">Network Average</div>
                    </div>
                    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div class="text-2xl sm:text-3xl font-extrabold text-indigo-600">Live</div>
                        <div class="text-xs sm:text-sm font-semibold text-slate-500 mt-1">Google Sheets Sync</div>
                    </div>
                    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div class="text-2xl sm:text-3xl font-extrabold text-indigo-600">100%</div>
                        <div class="text-xs sm:text-sm font-semibold text-slate-500 mt-1">Official OAuth API</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section id="features" class="py-20 bg-white border-b border-slate-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center max-w-3xl mx-auto mb-16">
                    <h2 class="text-xs font-bold uppercase tracking-wider text-indigo-600">Platform Capabilities</h2>
                    <h3 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">Built for Educational Excellence</h3>
                    <p class="text-slate-600 mt-4 text-base">
                        Everything needed to oversee Google Business Profiles, respond to student and parent inquiries, and preserve verified public reputation.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <!-- Feature 1 -->
                    <div class="p-8 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                        <div class="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mb-6">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                            </svg>
                        </div>
                        <h4 class="text-xl font-bold text-slate-900">Multi-Profile Review Sync</h4>
                        <p class="text-slate-600 text-sm mt-3 leading-relaxed">
                            Monitor incoming customer reviews across PCP Piprali, Prince Hospital, Floreto World School, Prince Defence Academy, and all affiliated campuses in one real-time dashboard.
                        </p>
                    </div>

                    <!-- Feature 2 -->
                    <div class="p-8 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                        <div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-6">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                            </svg>
                        </div>
                        <h4 class="text-xl font-bold text-slate-900">Official Merchant Replies</h4>
                        <p class="text-slate-600 text-sm mt-3 leading-relaxed">
                            Draft and publish direct merchant responses to Google reviews using the authorized Google Business Profile API v4, ensuring prompt parent and student communication.
                        </p>
                    </div>

                    <!-- Feature 3 -->
                    <div class="p-8 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                        <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-6">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                        </div>
                        <h4 class="text-xl font-bold text-slate-900">Google Sheets Integration</h4>
                        <p class="text-slate-600 text-sm mt-3 leading-relaxed">
                            Automatically export verified review targets, daily ratings, and wing member progress into authorized Google Spreadsheets for administrative reporting.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Managed Institutions Section -->
        <section id="branches" class="py-20 bg-slate-50 border-b border-slate-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center max-w-3xl mx-auto mb-14">
                    <h2 class="text-xs font-bold uppercase tracking-wider text-indigo-600">Network Overview</h2>
                    <h3 class="text-3xl font-extrabold text-slate-900 mt-2">Affiliated Campuses & Business Profiles</h3>
                    <p class="text-slate-600 mt-3 text-sm">
                        Centralized profile oversight across Sikar and Jaipur educational divisions.
                    </p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    @php
                    $branches = [
                        ['title' => 'Prince Hospital & Medical Center', 'area' => 'Bajor, Sikar', 'category' => 'Healthcare & Medical'],
                        ['title' => 'PCP Sikar (Prime Branch / Piprali)', 'area' => 'Palwas & Piprali Road, Sikar', 'category' => 'NEET & IIT-JEE Coaching'],
                        ['title' => 'Floreto World School', 'area' => 'NH-52, Palwas Road, Sikar', 'category' => 'International K-12 School'],
                        ['title' => 'Prince Defence Academy (PDA)', 'area' => 'Palwas Road, Sikar', 'category' => 'NDA, Airforce, Navy Training'],
                        ['title' => 'Prince College Sikar', 'area' => 'Didwana Road, Sikar', 'category' => 'UG / PG Higher Education'],
                        ['title' => 'Prince Academy of Higher Education', 'area' => 'Palwas Road, Sikar', 'category' => 'CBSE Affiliated Senior Secondary'],
                        ['title' => 'Prince RBSE Senior Secondary School', 'area' => 'Palwas Campus, Sikar', 'category' => 'RBSE Board Education'],
                        ['title' => 'Prince Sainik School', 'area' => 'Palwas Road, Sikar', 'category' => 'Military & Sainik School Prep'],
                        ['title' => 'PCP Jaipur Campus', 'area' => 'Jaipur, Rajasthan', 'category' => 'Pre-Medical & Engineering'],
                    ];
                    @endphp

                    @foreach($branches as $b)
                    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-start gap-4">
                        <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                            ★
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-900 text-sm">{{ $b['title'] }}</h4>
                            <p class="text-xs text-slate-500 mt-0.5">{{ $b['area'] }}</p>
                            <span class="inline-block mt-2 text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {{ $b['category'] }}
                            </span>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
        </section>

        <!-- Compliance & Google User Data Protection Section -->
        <section id="compliance" class="py-20 bg-white border-b border-slate-200">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white shadow-xl space-y-6">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-black tracking-tight">Security & Google API Compliance</h3>
                    </div>

                    <p class="text-slate-300 text-sm leading-relaxed">
                        Prince Edu Hub strictly adheres to all Google API Services User Data Policies, including the Limited Use requirements.
                    </p>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                        <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                            <span class="font-bold text-white block mb-1">Encrypted OAuth Credentials</span>
                            Tokens are encrypted using AES-256 and transmitted exclusively via TLS 1.3 encryption.
                        </div>
                        <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                            <span class="font-bold text-white block mb-1">No Data Selling or Advertising</span>
                            User data is never sold, leased, or transferred to third-party data brokers or advertisers.
                        </div>
                        <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                            <span class="font-bold text-white block mb-1">Strict Access Limitation</span>
                            Data access is restricted solely to authorized administrative staff managing institutional profiles.
                        </div>
                        <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                            <span class="font-bold text-white block mb-1">Revocation & Deletion</span>
                            Users may revoke Google access anytime via their Google Security Settings or request instant deletion.
                        </div>
                    </div>

                    <div class="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                        <span class="text-xs text-slate-400">
                            Read our full policy:
                        </span>
                        <div class="flex gap-4 text-xs font-bold text-indigo-400">
                            <a href="/privacy-policy" class="hover:underline">Privacy Policy &rarr;</a>
                            <a href="/terms-of-service" class="hover:underline">Terms of Service &rarr;</a>
                            <a href="/data-deletion" class="hover:underline">Data Deletion Policy &rarr;</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Public Footer with Required Legal Links -->
    <footer class="bg-white border-t border-slate-200 py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-200">
                <!-- Col 1: About -->
                <div class="space-y-3">
                    <div class="flex items-center gap-3">
                        <img src="{{ asset('assets/branding/logo.svg') }}" alt="Prince Edu Hub Logo" class="w-8 h-8 rounded-lg" />
                        <span class="font-extrabold text-slate-900 text-base">Prince Edu Hub</span>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed">
                        Official Google Business Profile management & review synchronization portal for Prince Edu Hub educational branches.
                    </p>
                </div>

                <!-- Col 2: Navigation -->
                <div>
                    <h5 class="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Portal Links</h5>
                    <ul class="space-y-2 text-xs text-slate-600 font-medium">
                        <li><a href="/" class="hover:text-indigo-600">Homepage</a></li>
                        <li><a href="/login" class="hover:text-indigo-600 font-bold text-indigo-700">Staff Portal Login</a></li>
                        <li><a href="#features" class="hover:text-indigo-600">Platform Features</a></li>
                        <li><a href="#branches" class="hover:text-indigo-600">Our Institutions</a></li>
                    </ul>
                </div>

                <!-- Col 3: Compliance & Legal (Mandatory for Google/Meta) -->
                <div>
                    <h5 class="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Legal & Compliance</h5>
                    <ul class="space-y-2 text-xs text-slate-600 font-medium">
                        <li><a href="/privacy-policy" class="hover:text-indigo-600 font-semibold text-indigo-700">Privacy Policy</a></li>
                        <li><a href="/terms-of-service" class="hover:text-indigo-600 font-semibold text-indigo-700">Terms of Service</a></li>
                        <li><a href="/data-deletion" class="hover:text-indigo-600">User Data Deletion</a></li>
                        <li><a href="/terms" class="hover:text-indigo-600">Terms (Short URL)</a></li>
                        <li><a href="/privacy" class="hover:text-indigo-600">Privacy (Short URL)</a></li>
                    </ul>
                </div>

                <!-- Col 4: Contact & Identity -->
                <div>
                    <h5 class="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Contact Support</h5>
                    <div class="text-xs text-slate-500 space-y-1.5 leading-relaxed">
                        <p class="font-medium text-slate-700">Prince Edu Hub Administrative Office</p>
                        <p>Palwas Road & Piprali Road, Sikar, Rajasthan, India 332001</p>
                        <p class="pt-1">
                            Email: <a href="mailto:admin@gmb.princeeduhub.com" class="text-indigo-600 hover:underline">admin@gmb.princeeduhub.com</a>
                        </p>
                        <p>
                            Phone: <a href="tel:+919799912938" class="text-indigo-600 hover:underline">+91 97999 12938</a>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Bottom Copyright -->
            <div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <p>&copy; {{ date('Y') }} Prince Edu Hub. All rights reserved.</p>
                <div class="flex items-center gap-6 font-medium">
                    <a href="/privacy-policy" class="hover:underline">Privacy Policy</a>
                    <a href="/terms-of-service" class="hover:underline">Terms of Service</a>
                    <a href="/data-deletion" class="hover:underline">Data Deletion</a>
                </div>
            </div>
        </div>
    </footer>

</body>
</html>
