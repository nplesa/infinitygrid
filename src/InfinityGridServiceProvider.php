<?php

namespace nplesa\InfinityGrid;

use Illuminate\Support\ServiceProvider;
use nplesa\InfinityGrid\Services\GridEngine;

class InfinityGridServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap the application services.
     */
    public function boot()
    {
        // Publicare config
        $this->publishes([
            __DIR__.'/config/infinitygrid.php' => config_path('infinitygrid.php'),
        ], 'config');

        // Publicare JS, CSS și images
        $this->publishes([
            __DIR__.'/resources/assets/js'     => public_path('vendor/nplesa/infinitygrid/js'),
            __DIR__.'/resources/assets/css'    => public_path('vendor/nplesa/infinitygrid/css'),
            __DIR__.'/resources/images'        => public_path('vendor/nplesa/infinitygrid/images'),
        ], 'assets');

        // Publicare views
        $this->publishes([
            __DIR__.'/resources/views' => resource_path('views/vendor/infinitygrid'),
        ], 'views');

        // Încarcă rutele package-ului
        $this->loadRoutesFrom(__DIR__.'/routes/web.php');

        // Încarcă view-urile package-ului cu namespace
        $this->loadViewsFrom(__DIR__.'/resources/views', 'infinitygrid');
    }

    /**
     * Register the application services.
     */
    public function register()
    {
        $this->app->singleton('grid.engine', function () {
            return new GridEngine();
        });
    }
}