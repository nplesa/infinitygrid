<?php

namespace nplesa\InfinityGrid;

use Illuminate\Support\ServiceProvider;
use Livewire\Livewire;
use nplesa\InfinityGrid\Livewire\DataGrid;

class InfinityGridServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->publishes([
            __DIR__.'/../config/infinity.php' => config_path('infinity.php'),
        ], 'config');

        $this->publishes([
            __DIR__.'/../resources/assets/js' => public_path('vendor/infinitygrid/js'),
            __DIR__.'/../resources/assets/css' => public_path('vendor/infinitygrid/css'),
        ], 'assets');

        $this->loadViewsFrom(__DIR__.'/../resources/views', 'infinitygrid');
        $this->publishes([
            __DIR__.'/../resources/views' => resource_path('views/vendor/infinitygrid'),
        ], 'views');

        Livewire::component('infinity-datagrid', DataGrid::class);
    }

    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/infinity.php', 'infinity');
    }
}
