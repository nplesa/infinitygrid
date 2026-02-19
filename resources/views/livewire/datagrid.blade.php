<link rel="stylesheet" href="{{ asset('vendor/infinitygrid/css/infinitygrid.css') }}">
<script src="{{ asset('vendor/infinitygrid/js/infinitygrid.js') }}"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>

<div class="card" id="datagrid" data-search="{{ $search }}">
    <div class="card-header d-flex justify-content-between align-items-center">
        <div class="d-flex gap-2">
            <input type="text" wire:model.debounce.500ms="search" class="form-control form-control-sm" placeholder="Search...">

            @foreach($columns as $col)
                @if(isset($col->filter))
                    @if($col->filter['type'] === 'select')
                        <select wire:model="filters.{{ $col->field }}" class="form-select form-select-sm">
                            <option value="">All {{ $col->label }}</option>
                            @foreach($col->filter['options'] as $opt)
                                <option value="{{ $opt }}">{{ $opt }}</option>
                            @endforeach
                        </select>
                    @endif
                @endif
            @endforeach

            <select wire:model="perPage" class="form-select form-select-sm">
                @foreach([10,25,50,100] as $num)
                    <option value="{{ $num }}">{{ $num }} / page</option>
                @endforeach
            </select>
        </div>

        <div>
            <span class="text-muted small">
                Showing {{ $rows->firstItem() ?? 0 }} to {{ $rows->lastItem() ?? 0 }} of {{ $rows->total() }} entries
            </span>
        </div>
    </div>

    <div class="card-body p-0">
        <table class="table table-hover table-bordered mb-0">
            <thead class="table-light">
                <tr>
                    <th><input type="checkbox" id="select-all"></th>
                    @foreach($columns as $col)
                        <th>
                            @if($col->sortable)
                                <a href="#" wire:click.prevent="sort('{{ $col->field }}')">
                                    {{ $col->label }}
                                    @if($sortField===$col->field)
                                        @if($sortDirection==='asc') <i class="fas fa-sort-up"></i> @else <i class="fas fa-sort-down"></i> @endif
                                    @endif
                                </a>
                            @else
                                {{ $col->label }}
                            @endif
                        </th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @forelse($rows as $row)
                    <tr>
                        <td><input type="checkbox" wire:model="selectedRows" value="{{ $row->id }}"></td>
                        @foreach($columns as $col)
                            <td class="searchable">{{ data_get($row, $col->field) }}</td>
                        @endforeach
                    </tr>
                @empty
                    <tr>
                        <td colspan="{{ count($columns)+1 }}" class="text-center text-muted">No records found.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="card-footer d-flex justify-content-center align-items-center">
        {{ $rows->onEachSide(1)->links('pagination::bootstrap-5') }}
    </div>
</div>
