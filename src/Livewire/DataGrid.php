<?php

namespace nplesa\InfinityGrid\Livewire;

use Livewire\Component;
use Livewire\WithPagination;
use Illuminate\Database\Eloquent\Builder;

class DataGrid extends Component
{
    use WithPagination;

    public $model;
    public $columns = [];
    public $search = '';
    public $filters = [];
    public $sortField = null;
    public $sortDirection = 'asc';
    public $selectedRows = [];
    public $perPage;

    protected $queryString = ['page','search'];
    protected $updatesQueryString = ['filters','sortField','sortDirection'];

    public function mount()
    {
        $this->perPage = config('infinity.per_page',10);
    }

    public function sort($field)
    {
        if($this->sortField === $field){
            $this->sortDirection = $this->sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            $this->sortField = $field;
            $this->sortDirection = 'asc';
        }
    }

    public function bulkDelete()
    {
        if(empty($this->selectedRows)) return;
        $query = $this->resolveQuery();
        $query->whereIn('id',$this->selectedRows)->delete();
        $this->selectedRows = [];
    }

    protected function resolveQuery(): Builder
    {
        if($this->model instanceof Builder){
            return $this->model;
        }

        if(is_string($this->model) && class_exists($this->model)){
            return $this->model::query();
        }

        throw new \Exception('Model property must be Eloquent class or Builder instance');
    }

    public function query(): Builder
    {
        $query = $this->resolveQuery();

        if($this->search){
            $terms = explode(' ', $this->search);
            foreach($terms as $term){
                $query->where(function($q) use ($term){
                    foreach($this->columns as $col){
                        if(str_contains($col->field, '.')){
                            [$rel,$fld] = explode('.',$col->field);
                            $q->orWhereHas($rel, fn($relQ)=>$relQ->where($fld,'like',"%{$term}%"));
                        } else {
                            $q->orWhere($col->field,'like',"%{$term}%");
                        }
                    }
                });
            }
        }

        foreach($this->filters as $field=>$val){
            if($val!==null && $val!==''){
                if(str_contains($field,'.')){
                    [$rel,$col] = explode('.',$field);
                    $query->whereHas($rel, fn($q)=>$q->where($col,$val));
                } else {
                    $query->where($field,$val);
                }
            }
        }

        if($this->sortField){
            $query->orderBy($this->sortField,$this->sortDirection);
        }

        return $query;
    }

    public function render()
    {
        $rows = $this->query()->paginate($this->perPage);
        return view('infinitygrid::livewire.datagrid',compact('rows'));
    }
}
