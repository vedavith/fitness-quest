<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_login_and_logout(): void
    {
        $this->postJson('/api/register', ['name' => 'Deepthi', 'email' => 'd@example.com', 'password' => 'secret-pass'])
            ->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

        $this->assertNotSame('secret-pass', User::first()->password);

        $token = $this->postJson('/api/login', ['email' => 'd@example.com', 'password' => 'secret-pass'])
            ->assertOk()
            ->json('token');

        $this->withToken($token)->postJson('/api/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 1); // the register token remains
    }

    public function test_wrong_password_is_rejected(): void
    {
        User::factory()->create(['email' => 'd@example.com', 'password' => 'right-pass']);

        $this->postJson('/api/login', ['email' => 'd@example.com', 'password' => 'wrong-pass'])->assertUnprocessable();
    }

    public function test_api_requires_token(): void
    {
        $this->getJson('/api/summary')->assertUnauthorized();
    }
}
