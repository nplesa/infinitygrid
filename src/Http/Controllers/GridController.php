<?php

namespace nplesa\InfinityGrid\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use nplesa\InfinityGrid\Services\GridEngine;

class GridController extends Controller
{
    public function index(Request $request, GridEngine $grid)
    {
        $modelClass = $request->get('model');

        if (!$modelClass || !class_exists($modelClass)) {
            return response()->json([
                'error' => 'Invalid model class'
            ], 400);
        }

        $records = $modelClass::all()->toArray();

        return response()->json(
            $grid->build(
                $records,
                $request->all(),
                config('app.url'),
                $request->path()
            )
        );
    }
}