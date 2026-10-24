<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Ensure essential storage directories exist before handling requests...
foreach ([
    __DIR__.'/../storage/framework/sessions',
    __DIR__.'/../storage/framework/views',
    __DIR__.'/../storage/framework/cache/data',
    __DIR__.'/../storage/framework/cache/locks',
    __DIR__.'/../storage/logs',
] as $storageDir) {
    if (! is_dir($storageDir)) {
        @mkdir($storageDir, 0777, true);
    }
}

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

// Safe Session Fallback: Hook into booting so config isn't overwritten by LoadConfiguration
$app->booting(function ($app) {
    $sessionDir = $app->storagePath('framework/sessions');
    $canWrite = false;
    if (! is_dir($sessionDir)) {
        @mkdir($sessionDir, 0777, true);
    }
    if (is_dir($sessionDir)) {
        $testFile = $sessionDir.'/.session_write_test_'.uniqid();
        if (@file_put_contents($testFile, '1') !== false) {
            @unlink($testFile);
            $canWrite = true;
        }
    }
    if (! $canWrite) {
        $app['config']->set('session.driver', 'cookie');
    }
});

$app->handleRequest(Request::capture());
