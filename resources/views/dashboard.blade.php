<!DOCTYPE html>
<html lang="en" class="h-full w-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="google-site-verification" content="T5VaJ-WYl09aUADf0hGF4FmF3rh-wElz2QvzRcZT8rk">
    <title>Prince Edu Hub - GBP Review Portal</title>
    <meta name="description" content="Official Google Business Profile management, live review sync, and customer engagement portal for Prince Edu Hub." />
    <meta property="og:title" content="Prince Edu Hub - GBP Review Portal" />
    <meta property="og:description" content="Official Google Business Profile management, live review sync, and customer engagement portal for Prince Edu Hub." />
    <meta name="theme-color" content="#4f46e5">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Prince Edu Hub">
    <link rel="apple-touch-icon" href="/icons/icon-192.png">
    <link rel="manifest" href="/manifest.json">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
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
            navigator.serviceWorker.register('/sw.js?v=3').then(function(reg) {
              console.log('[PWA] ServiceWorker registered successfully:', reg.scope);
            }).catch(function(err) {
              console.warn('[PWA] ServiceWorker registration failed:', err);
            });
          });
        }
      })();
    </script>
    @php
        try {
            $viteTags = app(\Illuminate\Foundation\Vite::class)(['resources/js/main.tsx']);
        } catch (\Throwable $e) {
            $viteTags = '';
            $buildAssetsDir = public_path('build/assets');
            if (is_dir($buildAssetsDir)) {
                $jsFiles = glob($buildAssetsDir . DIRECTORY_SEPARATOR . 'main-*.js');
                $cssFiles = glob($buildAssetsDir . DIRECTORY_SEPARATOR . 'main-*.css');
                if (!empty($jsFiles)) {
                    usort($jsFiles, fn($a, $b) => filemtime($b) - filemtime($a));
                    $latestJs = basename($jsFiles[0]);
                    $viteTags .= '<script type="module" src="' . asset("build/assets/{$latestJs}") . '"></script>' . PHP_EOL;
                }
                if (!empty($cssFiles)) {
                    usort($cssFiles, fn($a, $b) => filemtime($b) - filemtime($a));
                    $latestCss = basename($cssFiles[0]);
                    $viteTags .= '<link rel="stylesheet" href="' . asset("build/assets/{$latestCss}") . '">' . PHP_EOL;
                }
            }
        }
    @endphp
    {!! $viteTags !!}
</head>
<body class="bg-slate-50 text-slate-900 antialiased min-h-screen h-full w-full font-normal m-0 p-0 overflow-x-hidden font-sans">
    <div id="root" class="min-h-screen w-full flex flex-col"></div>
</body>
</html>
