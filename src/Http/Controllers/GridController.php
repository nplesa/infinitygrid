<?php

namespace nplesa\InfinityGrid\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use nplesa\InfinityGrid\Services\GridEngine;
use Illuminate\Support\Facades\DB;

class GridController extends Controller
{
    public function index(Request $request, GridEngine $grid)
    {
        $source = $request->get('source', 'eloquent'); // 'array', 'eloquent', 'query'
        $model  = $request->get('model');              // pentru Eloquent
        $query  = $request->get('query');              // pentru DB Builder
        $records = [];

        switch($source) {
            case 'array':
                $records = $request->get('records', []);
                break;
            case 'eloquent':
                if (!$model || !class_exists($model)) {
                    return response()->json(['error' => 'Invalid model class'], 400);
                }
                $records = $model::query();
                break;
            case 'query':
                if (!$query) return response()->json(['error' => 'Query required'], 400);
                $records = DB::table($query);
                break;
            default:
                return response()->json(['error' => 'Invalid source type'], 400);
        }

        return response()->json(
            $grid->build($records, $request->all(), config('app.url'), $request->path())
        );
    }
}