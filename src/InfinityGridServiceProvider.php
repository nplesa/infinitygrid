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
        // ----------------------------
        // Publicare config
        // ----------------------------
        // Fișierul config se află în src/config
        $this->publishes([
            __DIR__.'/config/infinitygrid.php' => config_path('infinitygrid.php'),
        ], 'config');

        // ----------------------------
        // Publicare JS, CSS și images
        // ----------------------------
        // Folderele JS și CSS se află în src/resources/assets
        // Folderul images se află în src/resources/images
        $this->publishes([
            __DIR__.'/resources/assets/js'     => public_path('vendor/nplesa/infinitygrid/js'),
            __DIR__.'/resources/assets/css'    => public_path('vendor/nplesa/infinitygrid/css'),
            __DIR__.'/resources/images'        => public_path('vendor/nplesa/infinitygrid/images'),
        ], 'assets');

        // ----------------------------
        // Publicare views
        // ----------------------------
        // Folderele view se află în src/resources/views
        $this->publishes([
            __DIR__.'/resources/views' => resource_path('views/vendor/infinitygrid'),
        ], 'views');

        // ----------------------------
        // Încarcă rutele package-ului
        // ----------------------------
        // Rutele se află în src/routes/web.php
        $this->loadRoutesFrom(__DIR__.'/routes/web.php');

        // ----------------------------
        // Încarcă view-urile cu namespace
        // ----------------------------
        $this->loadViewsFrom(__DIR__.'/resources/views', 'infinitygrid');
    }

    /**
     * Register the application services.
     */
    public function register()
    {
        // Înregistrare singleton GridEngine pentru dependency injection
        $this->app->singleton('grid.engine', function () {
            return new GridEngine();
        });
    }
}