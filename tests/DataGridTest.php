<?php

namespace nplesa\InfinityGrid\Tests;

use nplesa\InfinityGrid\Tests\Models\UserTest;
use Livewire\Livewire;

class DataGridTest extends TestCase
{
    public function test_grid_renders()
    {
        $user = UserTest::factory()->create();
        Livewire::test('infinity-datagrid', ['model'=>UserTest::class])
            ->assertSee($user->name);
    }
}
