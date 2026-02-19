$(document).ready(function(){
    $('#select-all').on('click', function(){
        let checked = $(this).is(':checked');
        $('input[name="selectedRows[]"]').each(function(){
            $(this).prop('checked', checked).trigger('change');
        });
    });

    $('#bulk-delete').click(function(){
        if(confirm('Are you sure?')){
            Livewire.emit('bulkDelete');
        }
    });

    let search = $('#datagrid').data('search');
    if(search){
        $('.searchable').each(function(){
            let html = $(this).html();
            let regex = new RegExp(search, 'gi');
            $(this).html(html.replace(regex, '<mark>$&</mark>'));
        });
    }
});