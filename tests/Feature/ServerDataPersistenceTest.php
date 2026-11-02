<?php

namespace Tests\Feature;

use App\Http\Controllers\GoogleBusinessController;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Tests\TestCase;

class ServerDataPersistenceTest extends TestCase
{
    public function test_server_data_is_not_written_to_disk_while_running_tests(): void
    {
        $key = 'test-server-data-'.Str::uuid();
        $data = ['profile' => 'Test Profile'];

        app(GoogleBusinessController::class)->saveServerData($key, $data);

        $this->assertSame($data, Cache::get($key));
        $this->assertFalse(File::exists(storage_path('app/gbp_data/'.md5($key).'.json')));
    }
}
