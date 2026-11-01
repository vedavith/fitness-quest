<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DayFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    /** 2026-11-02 is a Monday: Chest + Triceps, 4 exercises. */
    private const START = '2026-11-02';

    private const MONDAY_EXERCISES = ['chestPress', 'inclineDbPress', 'pecDeck', 'tricepsPushdown'];

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-11-02 20:00:00');
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
        $this->putJson('/api/profile', ['start_date' => self::START])->assertOk();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function fullSets(): array
    {
        $done = [['done' => true, 'weight' => 20, 'reps' => 12], ['done' => true, 'weight' => 20, 'reps' => 10]];

        return array_fill_keys(self::MONDAY_EXERCISES, $done);
    }

    private function perfectDay(array $overrides = []): array
    {
        return [
            'sets' => $this->fullSets(),
            'steps' => 5400,
            'meals' => ['breakfast', 'fruit', 'lunch', 'snack', 'dinner'],
            'sleep_hours' => 7.5,
            ...$overrides,
        ];
    }

    public function test_profile_defaults_and_plan_day(): void
    {
        $this->getJson('/api/profile')
            ->assertOk()
            ->assertJson([
                'start_date' => self::START,
                'start_weight_kg' => 106,
                'goal_weight_kg' => 96,
                'long_goal_weight_kg' => 90,
                'today_plan_day' => 1,
            ]);
    }

    public function test_perfect_day_scores_100_then_120_after_finish(): void
    {
        $this->putJson('/api/days/1', $this->perfectDay())
            ->assertOk()
            ->assertJsonPath('xp.total', 100)
            ->assertJsonPath('xp.bonus', 0);

        $this->postJson('/api/days/1/finish')
            ->assertOk()
            ->assertJsonPath('day.xp.total', 120)
            ->assertJsonPath('total_xp', 120)
            ->assertJsonPath('already_finished', false)
            ->assertJsonPath('streak', 1);
    }

    public function test_finish_awards_xp_only_once(): void
    {
        $this->putJson('/api/days/1', $this->perfectDay());
        $this->postJson('/api/days/1/finish')->assertJsonPath('total_xp', 120);

        $this->postJson('/api/days/1/finish')
            ->assertOk()
            ->assertJsonPath('already_finished', true)
            ->assertJsonPath('total_xp', 120);

        $this->getJson('/api/summary')->assertJsonPath('total_xp', 120);
    }

    public function test_partial_workout_and_missing_items(): void
    {
        $sets = $this->fullSets();
        unset($sets['pecDeck'], $sets['tricepsPushdown']);

        $this->putJson('/api/days/1', ['sets' => $sets, 'steps' => 1000, 'meals' => ['breakfast'], 'sleep_hours' => 6])
            ->assertJsonPath('xp.workout', 20)
            ->assertJsonPath('xp.steps', 0)
            ->assertJsonPath('xp.meals', 5)
            ->assertJsonPath('xp.sleep', 0);

        $this->postJson('/api/days/1/finish')->assertJsonPath('day.xp.total', 25)->assertJsonPath('streak', 0);
    }

    public function test_client_cannot_write_xp(): void
    {
        $this->putJson('/api/days/1', ['xp_total' => 120, 'xp_bonus' => 20])
            ->assertOk()
            ->assertJsonPath('xp.total', 0);
    }

    public function test_recovery_target_lowers_but_never_raises(): void
    {
        $this->putJson('/api/days/1', ['steps' => 3000, 'recovery_step_target' => 3000])
            ->assertJsonPath('xp.steps', 20);

        $this->putJson('/api/days/1', ['steps' => 4000, 'recovery_step_target' => 9000])
            ->assertJsonPath('xp.steps', 0);
    }

    public function test_safety_stop_keeps_workout_xp(): void
    {
        $this->putJson('/api/days/1', ['stopped_for_safety' => true])->assertJsonPath('xp.workout', 40);
    }

    public function test_rest_day_check_in(): void
    {
        Carbon::setTestNow('2026-11-08 20:00:00'); // Sunday, day 7
        $this->putJson('/api/days/7', ['workout_done' => true])->assertJsonPath('xp.workout', 40);
    }

    public function test_stale_sync_is_ignored(): void
    {
        $this->putJson('/api/days/1', ['steps' => 5000, 'client_updated_at' => '2026-11-02T19:00:00Z']);

        $this->putJson('/api/days/1', ['steps' => 100, 'client_updated_at' => '2026-11-02T18:00:00Z'])
            ->assertJsonPath('stale', true)
            ->assertJsonPath('steps', 5000);

        $this->assertDatabaseCount('day_logs', 1);
    }

    public function test_cannot_finish_future_day(): void
    {
        $this->postJson('/api/days/2/finish')->assertStatus(422);
    }

    public function test_yesterday_can_be_finished_until_noon(): void
    {
        $this->putJson('/api/days/1', $this->perfectDay());

        Carbon::setTestNow('2026-11-03 11:59:00');
        $this->postJson('/api/days/1/finish')->assertOk()->assertJsonPath('day.xp.total', 120);
    }

    public function test_day_closes_at_noon_and_keeps_logged_xp(): void
    {
        $this->putJson('/api/days/1', $this->perfectDay());

        Carbon::setTestNow('2026-11-03 12:01:00');
        $this->postJson('/api/days/1/finish')->assertStatus(423);
        $this->putJson('/api/days/1', ['steps' => 9000])->assertStatus(423);

        // Closed without a Finish Day tap: logged XP counts, the bonus does not.
        $this->getJson('/api/summary')->assertJsonPath('total_xp', 100);
    }

    public function test_seven_day_streak_awards_bonus(): void
    {
        // Steps + all meals + sleep = 60 XP, the minimum for a streak day.
        $day60 = ['steps' => 5000, 'meals' => ['breakfast', 'fruit', 'lunch', 'snack', 'dinner'], 'sleep_hours' => 8];

        for ($day = 1; $day <= 7; $day++) {
            Carbon::setTestNow(Carbon::parse(self::START)->addDays($day - 1)->setTime(20, 0));
            $this->putJson("/api/days/$day", $day60)->assertJsonPath('xp.total', 60);
            $response = $this->postJson("/api/days/$day/finish")->assertOk();
        }

        $response->assertJsonPath('streak', 7)
            ->assertJsonPath('day.xp.streak', 50)
            ->assertJsonPath('total_xp', 7 * 60 + 50);
        $this->getJson('/api/summary')->assertJsonPath('current_streak', 7);
    }

    public function test_weight_check_in_awards_once_per_week(): void
    {
        $this->postJson('/api/check-ins', ['type' => 'weight', 'value' => 106])->assertCreated()->assertJsonPath('xp', 30);
        $this->postJson('/api/check-ins', ['type' => 'weight', 'value' => 105.5])->assertOk();
        $this->postJson('/api/check-ins', ['type' => 'waist', 'value' => 40])->assertCreated()->assertJsonPath('xp', 20);

        $this->getJson('/api/summary')->assertJsonPath('total_xp', 50);
        $this->assertDatabaseCount('check_ins', 2);
    }

    public function test_level_up_is_reported(): void
    {
        $this->user->checkIns()->create(['type' => 'weight', 'period' => 99, 'value' => 100, 'xp' => 250]);
        $this->user->checkIns()->create(['type' => 'waist', 'period' => 99, 'value' => 40, 'xp' => 200]);
        $this->putJson('/api/days/1', $this->perfectDay());

        $this->postJson('/api/days/1/finish')
            ->assertJsonPath('leveled_up', true)
            ->assertJsonPath('level.name', 'Walker');
    }

    public function test_days_require_auth_and_profile(): void
    {
        $other = User::factory()->create();
        Sanctum::actingAs($other);
        $this->getJson('/api/days/1')->assertStatus(409);
        $this->getJson('/api/days/91')->assertStatus(404);
    }
}
