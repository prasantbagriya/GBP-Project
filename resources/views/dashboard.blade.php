<!DOCTYPE html>
<html lang="en" class="h-full w-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>GBP Live Sync</title>
    <meta name="description" content="Real-time Google Business Profile monitor that syncs reviews and updates directly to Google Sheets." />
    <meta property="og:title" content="GBP Live Sync" />
    <meta property="og:description" content="Real-time Google Business Profile monitor that syncs reviews and updates directly to Google Sheets." />
    <meta name="theme-color" content="#4f46e5">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="GBP Sync">
    <link rel="apple-touch-icon" href="/icons/icon-192.png">
    <link rel="manifest" href="/manifest.json">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,600;0,700;0,900;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <script>
      (function() {
        try {
          var _f = window.fetch;
          Object.defineProperty(window, 'fetch', {
            configurable: true,
            enumerable: true,
            get: function() { return _f; },
            set: function(v) { _f = v; }
          });
        } catch (_) {}

        if ('serviceWorker' in navigator) {
          window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js').then(function(reg) {
              console.log('[PWA] ServiceWorker registered successfully:', reg.scope);
            }).catch(function(err) {
              console.warn('[PWA] ServiceWorker registration failed:', err);
            });
          });
        }
      })();
    </script>
    @vite(['resources/js/main.tsx'])
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen h-full w-full font-normal m-0 p-0 overflow-x-hidden">
    <div id="root" class="min-h-screen w-full flex flex-col"></div>
</body>
</html>
