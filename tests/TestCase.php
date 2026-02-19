<?php

namespace nplesa\InfinityGrid\Tests;

use Orchestra\Testbench\TestCase as Orchestra;

class TestCase extends Orchestra
{
    protected function getPackageProviders($app)
    {
        return ['nplesa\InfinityGrid\InfinityGridServiceProvider'];
    }
}
