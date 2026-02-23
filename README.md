# nplesa/infinitygrid

Infinity grid for Laravel 10+, with Bootstrap 5 and jQuery.  
Support: search global, columns filters, sort, pagination and dynamic column configuration.

## Instalation
```
composer require nplesa/infinitygrid

# Publicare JS, CSS, images
php artisan vendor:publish --provider="nplesa\InfinityGrid\InfinityGridServiceProvider" --tag=assets

# Publicare config
php artisan vendor:publish --provider="nplesa\InfinityGrid\InfinityGridServiceProvider" --tag=config

# Publicare views
php artisan vendor:publish --provider="nplesa\InfinityGrid\InfinityGridServiceProvider" --tag=views
```
## Using

```blade
@extends('layouts.app')

@section('content')
    {{-- include grid container from package --}}
    @include('infinitygrid::grid')
@endsection
```
