# nplesa/infinitygrid

Infinity grid pentru Laravel 10+, cu Bootstrap 5 și jQuery.  
Suportă: search global, filtre pe coloane, sortare, paginare Livewire, bulk delete și configurare dinamică a coloanelor.

## Instalare
```
composer require nplesa/infinitygrid
php artisan vendor:publish --provider="nplesa\InfinityGrid\InfinityGridServiceProvider" --tag=config
php artisan vendor:publish --provider="nplesa\InfinityGrid\InfinityGridServiceProvider" --tag=assets
php artisan vendor:publish --provider="nplesa\InfinityGrid\InfinityGridServiceProvider" --tag=views
```
## Folosire

```blade
@extends('layouts.app')

@section('content')
    {{-- Include containerul grid-ului din package --}}
    @include('infinitygrid::grid')
@endsection
```
