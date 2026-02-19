# nplesa/infinitygrid

Professional DataGrid pentru Laravel 10+, cu Bootstrap 5 și jQuery.  
Suportă: search global, filtre pe coloane, sortare, paginare Livewire, bulk delete și configurare dinamică a coloanelor.

## Instalare
composer require nplesa/infinitygrid
php artisan vendor:publish --provider="nplesa\InfinityGrid\InfinityGridServiceProvider" --tag=config
php artisan vendor:publish --provider="nplesa\InfinityGrid\InfinityGridServiceProvider" --tag=assets
php artisan vendor:publish --provider="nplesa\InfinityGrid\InfinityGridServiceProvider" --tag=views

## Folosire

<livewire:infinity-datagrid 
    :model="App\Models\User::class" 
    :columns="[
        Column::make('id','ID')->sortable(),
        Column::make('name','Name')->sortable(),
        Column::make('email','Email')->sortable(),
        Column::make('role','Role')->filter(['type'=>'select','options'=>['Admin','Editor','User']])
    ]"/>

