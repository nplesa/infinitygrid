<?php

namespace nplesa\InfinityGrid;

use Illuminate\Support\ServiceProvider;
use nplesa\InfinityGrid\Services\GridEngine;

class InfinityGridServiceProvider extends ServiceProvider
{
    public function boot()
    {
        // Publicare config
        $this->publishes([
            __DIR__.'/../config/infinitygrid.php' => config_path('infinitygrid.php'),
        ], 'config');

        // Publicare JS, CSS, images
        $this->publishes([
            __DIR__.'/../resources/js'     => public_path('vendor/nplesa/infinitygrid/js'),
            __DIR__.'/../resources/css'    => public_path('vendor/nplesa/infinitygrid/css'),
            __DIR__.'/../resources/images' => public_path('vendor/nplesa/infinitygrid/images'),
        ], 'assets');

        $this->publishes([
            __DIR__.'/../resources/views' => resource_path('views/vendor/infinitygrid'),
        ], 'views');

        // Încarcă rutele și view-urile package-ului
        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'infinitygrid');
    }

    public function register()
    {
        $this->app->singleton('grid.engine', function () {
            return new GridEngine();
        });
    }
}