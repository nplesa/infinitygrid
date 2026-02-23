class InfinityGrid {
    _version = '1.0';
    _navigator = {};
    _timeout = null;
    _uuid = null;
    constructor(elem, options) {
        this._elem = document.querySelectorAll(elem);
        this._defaults = this.getDefaults();
        this.updateDefaults(this._defaults, options)
        this._options = this._defaults;
        this._events = null;
        this._navigator = navigator;
        this._live = {};
        if(this._options.hasOwnProperty('live')) {
            this._live.active = this._options.live.active;
            this._live.interval = this._options.live.interval;
            if(this._options.live.active) {
                let self = this;
                if(this._options.live.tool === 'ajax') {
                    setInterval(function () {
                        console.log('start internal timer... 5sec...');
                        if((self._options.dataSource.ajax !== null)) {
                            self._options.dataSource.ajax.params = Object.assign({}, self._options.dataSource.ajax.params, {
                                page: (document.querySelector('li.active') === null) ? 1 :document.querySelector('li.active').dataset.page,
                                size : self._options.pagination.pages.size,
                                filterName : self._options.columnKeys[self._options.filter],
                                filterValue : (document.getElementById('grid_filters_' + self._uuid) === null) ? 1 : document.getElementById('grid_filters_' + self._uuid).value,
                                filterTextField : (document.querySelector(".btn-search-by:first-child") === null) ? '' : document.querySelector(".btn-search-by:first-child").value,
                                filterTextValue : (document.getElementById('search_item_' + self._uuid) === null) ? '' : document.getElementById('search_item_' + self._uuid).value

                            });
                            self.getAjaxData(self._options.dataSource.ajax).then(function(result) {
                                self.initGrid(self._elem, result);
                                let ul = document.getElementById('columns-selector_' + self._uuid);
                                if(ul!== null) {
                                    let text = ul.querySelector('a[data-field="'+ result.filters.textField +'"]').innerText;                                document.getElementById('grid_filters_' + self._uuid).value = result.filters.value;
                                    document.getElementById('search_item_' + self._uuid).value = result.filters.textValue;
                                    self._elem[0].querySelector(".btn-search-by").innerText = text;
                                    document.getElementById('search_item_' + self._uuid).focus();
                                }
                            })
                        }
                        else {
                            self.initGrid(self._elem, []);
                        }
                    }, this._live.interval);
                }
                else {
                    if(this._options.live.tool === 'socket') {

                        let channel = window.laravelEcho.connector.channels['presence-' + this._options.live.channel];
                        if(!channel.subscribed) {
                            channel.subscribe();
                        }
                        channel.subscription.bind("pusher:subscription_succeeded", () => {
                            window.laravelEcho.connector.channels['public'].subscription.emit(this._options.live.eventName, { msg: JSON.stringify(this._options.dataSource.ajax.params) } );
                        });

                        // get from backend
                        window.laravelEcho.channel(this._options.live.channel).listen("." + this._options.live.eventName, function (e) {
                            let results = JSON.parse(e.msg);
                            console.log(results);
                        });
                    }
                    else {
                        console.log('Unresolved Live option...')
                    }
                }
            }
        }
        this._navigator._isMobile = this.detectMobile();
        if(this._options.hasOwnProperty('events')) {
            this._events = this._options.events;
        }
        if((this._options.dataSource.ajax !== null)) {
            let self = this;
            this._options.dataSource.ajax.params = Object.assign({}, this._options.dataSource.ajax.params, {
                page: 1,
                size : this._options.pagination.pages.size,
                filterName : this._options.columnKeys[this._options.filter],
                filterValue : "-1"
            });
            this.getAjaxData(this._options.dataSource.ajax).then(function(result) {
                self.initGrid(self._elem, result);
                // if(result.total > 0) {
                //     document.getElementById('grid_filters_' + self._uuid).value = "-1";
                //     if(self._events['onRecordsEvent'] !== undefined) {
                //         self._events.onRecordsEvent(result);
                //     }
                // }
                // else {
                //     self.initGrid(self._elem, result);
                //     // document.getElementById('grid_filters_' + self._uuid).value = "-1";
                //     if(self._events.hasOwnProperty('emptyDataSourceEvent')) {
                //         self._events.emptyDataSourceEvent();
                //     }
                // }
            })
        }
        else {
            this.initGrid(self._elem, []);
        }
    }
    detectMobile() {
        const toMatch = [
            /Android/i,
            /webOS/i,
            /iPhone/i,
            /iPad/i,
            /iPod/i,
            /BlackBerry/i,
            /Windows Phone/i
        ];

        return toMatch.some((toMatchItem) => {
            return navigator.userAgent.match(toMatchItem);
        });
    }
    updateDefaults(targetObject, obj) {
        let self = this;
        Object.keys(obj).forEach(function (key) {

            // delete property if set to undefined or null
            if ( undefined === obj[key] || null === obj[key] ) {
                delete targetObject[key]
            }

            // property value is object, so recurse
            else if (
                'object' === typeof obj[key]
                && !Array.isArray(obj[key])
            ) {

                // target property not object, overwrite with empty object
                if (
                    !('object' === typeof targetObject[key]
                        && !Array.isArray(targetObject[key]))
                ) {
                    targetObject[key] = {}
                }

                // recurse
                self.updateDefaults(targetObject[key], obj[key])
            }

            // set target property to update property
            else {
                targetObject[key] = obj[key]
            }
        })
    }
    getDefaults() {
        return {
            css : {
                width : '100%',
                height : 'auto',
            },
            dataSource : {

            },
            footer : false,
            live : false,
            caseSensitiveSearch : true,
            pagination : {
                active : true,
                css : {
                    height : 'auto',
                },
                pages : {
                    size: 100,
                    sizes : [5, 10, 25, 50, 100, 500],
                    rules : [
                        {
                            active : true,
                            name: 'moreThan',
                            target: 'pages',
                            value : 10,
                            action : {
                                showPagesFirst : 4,
                                showPagesLast: 4,
                                showMiddle : '...',
                            }
                        }
                    ],
                },
            },
            actionColumn : false,
        };
    }
    getAjaxData(ajx) {
        return $.ajax({
            url: ajx.url,
            method : ajx.method,
            data : ajx.params
        });
    }
    createEvents(item, events) {
        for(let i = 0; i < events.length; i++) {
            let event = new CustomEvent(events[i], {
                detail: {
                    target : item
                },
                bubbles: true,
                cancelable: true,
                composed: false,
            });
            document.querySelector(item).dispatchEvent(event);
            document.querySelector(item).addEventListener(event, self._events[events[i]]);
        }
    }
    noRecords() {
        let table = this.getTableElement();
        if (!table.classList.contains('empty-table')) {
            table.classList.add('empty-table');
            table.classList.add('hv-center');
            table.classList.add('w-100');
            let tr = document.createElement('tr');
            tr.style.height = '46px';
            tr.innerHTML = "<td colspan='" + this._options.columnNames.length + "' class='text-center'>No records found...</td>";
            table.querySelector('tbody').append(tr);
        }
    }
    initGrid(elem, data) {
        let self = this;
        // if(data.data.length === 0) {
        //     let countCols = self._options.columnNames.length;
        //     if(self._options.actionColumn) {
        //         countCols += 1;
        //     }
        //     this.getTableElement().querySelector("tbody").innerHTML = '<tr><td colSpan="' + countCols + '" class="text-center">No data found...</td></tr>';
        //     return false;
        // }
        return elem.forEach(function(item, index) {
            item.dataset.count = data.total;
            if(item.dataset.hasOwnProperty('uuid')) {
                self._uuid = item.dataset.uuid;
            }
            else {
                item.dataset.uuid = self.generateUUID();
                self._uuid = item.dataset.uuid;
            }

            self.createEvents(item, self._events);

            if(self._events.hasOwnProperty('beforeInit')) {
                self._events.beforeInit();
            }
            self.applyCSSDefaults(item);
            if(item.tagName.toLowerCase() === 'table') {
                self.customizeGrid(item);
                self.addLiveOrNot(item);

                self.buildTableHeader(item, self._options, data);
                self.buildTableBody(item, self._options, data);
                self.buildTableFooter(item, self._options, data);
                self.addPagination(item, data);
                self.addExtraElements(item, data);

                if(Object.keys(data.data).length === 0) {
                    self.noRecords();
                    if(self._events.hasOwnProperty('emptyDataSourceEvent')) {
                        self._events.emptyDataSourceEvent();
                    }
                    console.log('NO data available!!!');
                }
                self.addSortable(item);
            }
            if(item.tagName.toLowerCase() === 'div') {
                let card = null;
                if(document.getElementById('grid_card_' + self._uuid) === null) {
                    card = self.buildGridByTypeOn(item);
                }
                let table = self.getTableElement();
                if(table !== undefined) {
                    self.customizeGrid(table);
                    self.addLiveOrNot(table);

                    self.buildTableHeader(table, self._options, data);
                    self.buildTableBody(table, self._options, data);
                    self.buildTableFooter(table, self._options, data);
                    self.addPagination(table, data);
                    self.addExtraElements(table, data);

                    if(Object.keys(data.data).length === 0) {
                        self.noRecords();
                        if(self._events.hasOwnProperty('emptyDataSourceEvent')) {
                            self._events.emptyDataSourceEvent();
                        }
                        console.log('NO data available!!!');
                    }
                    self.addSortable(table);
                }
            }
            if(self._events.hasOwnProperty('afterInit')) {
                self._events.afterInit();
            }
        });
    }
    generateUUID() {
        let d = new Date().getTime();//Timestamp
        let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random() * 16;//random number between 0 and 16
            if(d > 0){//Use timestamp until depleted
                r = (d + r)%16 | 0;
                d = Math.floor(d/16);
            } else {//Use microseconds since page-load if supported
                r = (d2 + r)%16 | 0;
                d2 = Math.floor(d2/16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
    getTableElement() {
        return document.getElementById('internalContainer_' + this._uuid);
    }
    buildGridByTypeOn(elem) {
        if(this._options.gridType === 'card') {
            let card = document.createElement('div');
            card.setAttribute('id','grid_card_' + this._uuid);
            card.className= 'card';
            let showHeader = false;
            let showFooter = false;
            if(this._options.hasOwnProperty('showHeader')) {
                showHeader = this._options.showHeader;
            }
            if(this._options.hasOwnProperty('showHFooter')) {
                showFooter = this._options.showFooter;
            }
            showHeader = showHeader ? '':'d-none';
            showFooter = showFooter ? '':'d-none';
            let internalTable = '<table id="internalContainer_' + this._uuid + '" class="table table-striped" style="width:100%">\n' +
                '                                        <thead>\n' +
                '                                        </thead>\n' +
                '                                        <tbody>\n' +
                '                                        </tbody>\n' +
                '                                        <tfoot>\n' +
                '                                        </tfoot>\n' +
                '                                    </table>';
            card.innerHTML = '<div class="card-header text-center ' + showHeader + '" style="padding: 0;">\n' +
                '            </div>\n' +
                '            <div class="card-body" style="padding: 5px;">\n' + internalTable +
                '            </div>\n' +
                '            <div class="card-footer ' + showFooter + '">&nbsp</div>';
            elem.append(card);
            return card;
        }
    }
    applyCSSDefaults(elem) {
        let defaultCSS = this._options.css;
        for (let key in defaultCSS) {
            elem.style[key] = defaultCSS[key];
        }
    }
    buildTableHeader(el, opt, data) {
        if(el.getElementsByTagName('thead')[0].getElementsByTagName('tr').length > 0) {
            return;
        }
        let _header = '<tr>';
        if(opt.hasOwnProperty('columnNames')) {
            for(let key in opt.columnNames) {
                if(opt.hasOwnProperty('hideCols')) {
                    if(opt.hideCols.indexOf(parseInt(key)) < 0) {
                        if(opt.hasOwnProperty('columnAlignment')) {
                            _header += '<th style="cursor:pointer;" class="column-' + key + ' text-' + opt.columnAlignment[key] + '"><span class="header-cell-text">' + opt.columnNames[key] + '</span></div></th>';
                        }
                        else {
                            _header += '<th style="cursor:pointer;" class="column-' + key + ' text-center"><span class="header-cell-text">' + opt.columnNames[key] + '</span></th>';
                        }
                    }
                    else {
                        if(opt.hasOwnProperty('columnAlignment')) {
                            _header += '<th style="cursor:pointer;" class="column-' + key + ' d-none text-' + opt.columnAlignment[key] + '"><span class="header-cell-text">' + opt.columnNames[key] + '</span></div></th>';
                        }
                        else {
                            _header += '<th style="cursor:pointer;" class="column-' + key + ' d-none text-center"><span class="header-cell-text">' + opt.columnNames[key] + '</span></th>';
                        }
                    }
                }
                else {
                    if(opt.hasOwnProperty('columnAlignment')) {
                        _header += '<th style="cursor:pointer;" class="column-' + key + ' text-' + opt.columnAlignment[key] + '"><span class="header-cell-text">' + opt.columnNames[key] + '</span></th>';
                    }
                    else {
                        _header += '<th style="cursor:pointer;" class="column-' + key + ' text-center"><span class="header-cell-text">' + opt.columnNames[key] + '</span></th>';
                    }
                }
            }
        }
        else {
            let xdata = data.data;
            if(xdata.length > 0) {
                let tmp = xdata[0];
                let cols = Object.keys(tmp);
                for(let key in cols) {
                    if(opt.hasOwnProperty('hideCols')) {
                        if(opt.hideCols.indexOf(parseInt(key)) < 0) {
                            if(opt.hasOwnProperty('columnAlignment')) {
                                _header += '<th style="cursor:pointer;" class="column-' + key + ' text-' + opt.columnAlignment[key] + '">' + cols[key] + '</th>';
                            }
                            else {
                                _header += '<th style="cursor:pointer;" class="column-' + key + ' text-center">' + cols[key] + '</th>';
                            }
                        }
                        else {
                            if(opt.hasOwnProperty('columnAlignment')) {
                                _header += '<th style="cursor:pointer;" class="column-' + key + ' d-none text-' + opt.columnAlignment[key] + '">' + cols[key] + '</th>';
                            }
                            else {
                                _header += '<th style="cursor:pointer;" class="column-' + key + ' d-none text-center">' + cols[key] + '</th>';
                            }
                        }
                    }
                    else {
                        if(opt.hasOwnProperty('columnAlignment')) {
                            _header += '<th style="cursor:pointer;" class="column-' + key + ' text-' + opt.columnAlignment[key] + '">' + cols[key] + '</th>';
                        }
                        else {
                            _header += '<th style="cursor:pointer;" class="column-' + key + ' text-center">' + cols[key] + '</th>';
                        }
                    }
                }
            }
            else {
                console.log('No data available');
            }
        }
        if(opt.actionColumn) {
            _header += '<th class="action text-center text-uppercase">Actions</th>';
        }
        _header += '</tr>';
        el.children[0].innerHTML = _header;
        el.children[0].style.borderBottom = "1px solid #2f3235";
        let ths = this.getTableElement().querySelectorAll("thead > tr > th");
        let self = this;
        ths.forEach(function(item, index) {
            item.dataset.index = index;
            if(self._events.hasOwnProperty('thDraw')) {
                self._events.thDraw(item, 0, item.cellIndex, item.parentElement, item.innerText);
            }
            item.addEventListener('click', function(e) {
                let th = this;
                let all_th = th.parentNode.children;
                for(let i = 0; i < all_th.length;i++) {
                    if(all_th[i].cellIndex !== th.cellIndex) {
                        self.setSortDirection(all_th[i], null);
                    }
                }
                let indicatorsContainer = th.children[1];
                if(el.classList.contains('.action')) {
                    return;
                }
                let table = self.getTableElement(); //this.parentNode.parentNode.parentElement;
                let tbody = table.getElementsByTagName('tbody')[0];
                let rows = Array.prototype.slice.call( tbody.getElementsByTagName('tr'), 0 ).sort(self.comparer(
                    $(this).index()
                ));
                this.asc = !this.asc
                if (!this.asc) {
                    rows = rows.reverse()
                }
                for (let i = 0; i < rows.length; i++) {
                    tbody.append(rows[i]);
                }
                self.setSortDirection(indicatorsContainer, this.asc);
            })
        })
    }
    setSortDirection(container, direction) {
        let sortableDirections = container.getElementsByClassName('grid-sort');
        let selected = null;
        for(let i = 0; i < sortableDirections.length;i++) {
            if(direction === null) {
                selected = 'no-sort';
            }
            else {
                if(direction) {
                    selected = 'sort-ascending';
                }
                else {
                    selected = 'sort-descending';
                }
            }
            if(sortableDirections[i].classList.contains(selected)) {
                sortableDirections[i].classList.remove('d-none');
            }
            else {
                if(!sortableDirections[i].classList.contains('d-none')) {
                    sortableDirections[i].classList.add('d-none');
                }
            }
        }
    }
    validator(str) {
        return !/[^\u0000-\u00ff]/g.test(str);
    }
    toBinaryStr(str) {
        let encoder = new TextEncoder();
        let charCodes = encoder.encode(str);
        return String.fromCharCode(...charCodes);
    }
    buildTableBody(el, opt, data) {
        el.getElementsByTagName('tbody')[0].innerHTML = '';
        let from = data.from;
        let records = data.data;
        let field = null;
        let extra = '';
        if(opt.hasOwnProperty('columnNames')) {
            let tbody = document.getElementById('internalContainer_' + this._uuid).getElementsByTagName('tbody')[0];
            for(let i = from; i < (parseInt(opt.pagination.pages.size) + from); i++) {
                if(i < data.total) {
                    let uuid = this.generateUUID();
                    let text = this.validator(JSON.stringify(records[i])) ? JSON.stringify(records[i]) : this.toBinaryStr(JSON.stringify(records[i]));
                    let explain = btoa(text);
                    let _body = '<tr data-id="' + records[i].id + '" data-index="' + i + '" data-uuid="' + uuid + '" data-explain="' + explain + '" style="vertical-align: middle;">';
                    for(let key in opt.columnNames) {
                        if(opt.hasOwnProperty('hideCols')) {
                            if(opt.hideCols.indexOf(parseInt(key)) < 0) {
                                if(opt.hasOwnProperty('columnAlignment')) {
                                    _body += '<td class="column-' + key + ' text-' + opt.columnAlignment[key] + '"><div class="column-content">' + records[i][opt.columnKeys[key]] + '</div></td>';
                                }
                                else {
                                    _body += '<td class="column-' + key + ' text-center"><div class="column-content">' + records[i][opt.columnKeys[key]] + '</div></td>';
                                }
                            }
                            else {
                                if(opt.hasOwnProperty('columnAlignment')) {
                                    _body += '<td class="column-' + key + ' text-' + opt.columnAlignment[key] + ' d-none"><div class="column-content">' + records[i][opt.columnKeys[key]] + '</div></td>';
                                }
                                else {
                                    _body += '<td class="column-' + key + ' text-center d-none"><div class="column-content">' + records[i][opt.columnKeys[key]] + '</div></td>';
                                }
                            }
                        }
                        else {
                            if(opt.hasOwnProperty('columnAlignment')) {
                                _body += '<td class="column-' + key + ' text-' + opt.columnAlignment[key] + '"><div class="column-content">' + records[i][opt.columnKeys[key]] + '</div></td>';
                            }
                            else {
                                _body += '<td class="column-' + key + ' text-center"><div class="column-content">' + records[i][opt.columnKeys[key]] + '</div></td>';
                            }
                        }
                    }
                    if(opt.actionColumn) {
                        field = null;
                        extra = '';
                        if(this._options.hasOwnProperty('actionBased')) {
                            if(this._options.actionBased.hasOwnProperty('field')) {
                                field = this._options.actionBased.field;
                                if(records[i].hasOwnProperty(field)) {
                                    extra = 'data-id="' + records[i][field] + '"';
                                }
                            }
                        }
                        let alignment = this.setColumnAlignment(this._options.actionBased.alignment);
                        _body += '<td class="action text-' + alignment + ' text-uppercase" style="padding: 1px;">';
                        if(this._options.actionBased.grouping) {
                            _body += '<div class="btn-group" role="group" aria-label="column">\n';
                        }
                        if(!this._options.actionBased.custom) {
                            _body += '  <button type="button" class="btn btn-danger remove-record"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">\n' +
                            '  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>\n' +
                            '</svg></button>\n' +
                            '  <button type="button" class="btn btn-warning edit-record"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">\n' +
                            '  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>\n' +
                            '</svg></button>\n' +
                            '  <button type="button" class="btn btn-primary info-record"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">\n' +
                            '  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>\n' +
                            '  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>\n' +
                            '</svg></button>\n';
                        }
                        else
                        {
                            let btns = this._options.actionBased.buttons;
                            for(let i = 0 ; i < btns.length; i++) {
                                if(btns[i].icon.length === 0) {
                                    if(btns[i].hasOwnProperty('type')) {
                                        _body += '<' + btns[i].type + extra + ' class="' + btns[i].className + '" title="' + btns[i].caption + '"></' + btns[i].type + '>';
                                    }
                                    else {
                                        _body += '<button ' + extra + ' class="' + btns[i].className + '" title="' + btns[i].caption + '"></button>';
                                    }
                                }
                                else {
                                    if(btns[i].hasOwnProperty('type')) {
                                        _body += '<' + btns[i].type + ' ' + extra + ' class="' + btns[i].className + '" title="' + btns[i].caption + '">' + btns[i].icon + '</' + btns[i].type + '>';
                                    }
                                    else {
                                        _body += '<button ' + extra + ' class="' + btns[i].className + '" title="' + btns[i].caption + '">' + btns[i].icon + '</button>';
                                    }
                                }
                            }
                        }
                        if(this._options.actionBased.grouping) {
                            _body += '</div>';
                        }
                        _body += '</td>';
                    }
                    _body += '</tr>';
                    let tr = tbody.insertRow();
                    tr.outerHTML = _body;
                }
            }
        }
        else {
            let cols = Object.keys(records[from]);
            let tbody = document.getElementById('internalContainer_' + this._uuid).getElementsByTagName('tbody')[0];
            for(let i = from; i < (parseInt(opt.pagination.pages.size) + from); i++) {
                if(i < data.total) {
                    let uuid = this.generateUUID();
                    let explain = btoa(JSON.stringify(records[i]));
                    let _body = '<tr data-id="' + records[i].id + '" data-index="' + i + '" data-uuid="' + uuid + '" data-explain="' + explain + '" style="vertical-align: middle;">';
                    for(let key in cols) {
                        let detectObj = (typeof (records[i][cols[key]]) === 'object');
                        let detectValue = null;
                        let detectExplain = null;
                        let detectFieldType = null;
                        if(opt.hasOwnProperty('hideCols')) {
                            if(opt.hideCols.indexOf(parseInt(key)) < 0) {
                                if(opt.hasOwnProperty('columnAlignment')) {
                                    _body += '<td class="column-' + key + ' text-' + opt.columnAlignment[key] + '"><div class="column-content">' + records[i][cols[key]] + '</div></td>';
                                }
                                else {
                                    _body += '<td class="column-' + key + ' text-center"><div class="column-content">' + records[i][cols[key]] + '</div></td>';
                                }
                            }
                        }
                        else {
                            if(opt.hasOwnProperty('columnAlignment')) {
                                _body += '<td class="column-' + key + ' text-' + opt.columnAlignment[key] + '"><div class="column-content">' + records[i][cols[key]] + '</div></td>';
                            }
                            else {
                                _body += '<td class="column-' + key + ' text-center"><div class="column-content">' + records[i][cols[key]] + '</div></td>';
                            }
                        }
                    }
                    if(opt.actionColumn) {
                        field = null;
                        extra = '';
                        if(this._options.hasOwnProperty('actionBased')) {
                            if(this._options.actionBased.hasOwnProperty('field')) {
                                field = this._options.actionBased.field;
                                if(records[i].hasOwnProperty(field)) {
                                    extra = 'data-id="' + records[i][field] + '"';
                                }
                            }
                        }
                        let alignment = this.setColumnAlignment(this._options.actionBased.alignment);
                        _body += '<td class="action text-' + alignment + ' text-uppercase" style="padding: 1px;"> <div class="btn-group" role="group" aria-label="Basic mixed styles example">\n' +
                            '  <button ' + extra + ' type="button" class="btn btn-danger remove-record"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">\n' +
                            '  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>\n' +
                            '</svg></button>\n' +
                            '  <button ' + extra + ' type="button" class="btn btn-warning edit-record"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">\n' +
                            '  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>\n' +
                            '</svg></button>\n' +
                            '  <button ' + extra + ' type="button" class="btn btn-primary info-record"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">\n' +
                            '  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>\n' +
                            '  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>\n' +
                            '</svg></button>\n' +
                            '</div> </td>';
                    }
                    _body += '</tr>';
                    let tr = tbody.insertRow();
                    tr.outerHTML = _body;
                }
            }
        }
        let self = this;
        let table = this.getTableElement();
        let tr = table.children[1].getElementsByTagName("tr");
        for (let row = 0; row < tr.length; row++) {
            let td = tr[row].getElementsByTagName("td");
            if(this._events.hasOwnProperty('trDraw')) {
                this._events.trDraw(tr[row], row);
            }
            for(let col = 0; col < td.length; col++) {
                if(this._events.hasOwnProperty('tdDraw')) {
                    this._events.tdDraw(td[col], row, col, tr[row], td[col].innerText);
                }
            }
        }
    }
    setColumnAlignment(setting) {
        let align = null;
        if(this._options.actionBased.hasOwnProperty('alignment')) {
            if(setting === 'left') {
                align = 'start';
            }
            else {
                if(setting === 'right') {
                    align = 'end';
                }
                else {
                    align = 'center';
                }
            }
        }
        else {
            align = 'left';
        }
        return align;
    }
    buildTableFooter(el, opt, data) {
        if(el.getElementsByTagName('tfoot')[0].getElementsByTagName('tr').length > 0) {
            return;
        }
        let _footer = '<tr>';
        if(opt.hasOwnProperty('columnNames')) {
            for(let key in opt.columnNames) {
                if(opt.hasOwnProperty('hideCols')) {
                    if(opt.hideCols.indexOf(parseInt(key)) < 0) {
                        if(opt.hasOwnProperty('columnAlignment')) {
                            _footer += '<td class="column-' + key + ' text-' + opt.columnAlignment[key] + '">' + opt.columnNames[key].toUpperCase() + '</td>';
                        }
                        else {
                            _footer += '<td class="column-' + key + ' text-center">' + opt.columnNames[key].toUpperCase() + '</td>';
                        }
                    }
                    else {
                        if(opt.hasOwnProperty('columnAlignment')) {
                            _footer += '<td class="column-' + key + ' d-none text-' + opt.columnAlignment[key] + '">' + opt.columnNames[key].toUpperCase() + '</td>';
                        }
                        else {
                            _footer += '<td class="column-' + key + ' d-none text-center">' + opt.columnNames[key].toUpperCase() + '</td>';
                        }
                    }
                }
                else {
                    if(opt.hasOwnProperty('columnAlignment')) {
                        _footer += '<td class="column-' + key + ' text-' + opt.columnAlignment[key] + '">' + opt.columnNames[key].toUpperCase() + '</td>';
                    }
                    else {
                        _footer += '<td class="column-' + key + ' text-center">' + opt.columnNames[key].toUpperCase() + '</td>';
                    }
                }
            }
        }
        else {
            let xdata = data.data;
            if(xdata.length > 0) {
                let tmp = xdata[0];
                let cols = Object.keys(tmp);
                for(let key in cols) {
                    if(opt.hasOwnProperty('hideCols')) {
                        if(opt.hideCols.indexOf(parseInt(key)) < 0) {
                            if(opt.hasOwnProperty('columnAlignment')) {
                                _footer += '<td class="column-' + key + ' text-' + opt.columnAlignment[key] + '">' + cols[key].toUpperCase() + '</td>';
                            }
                            else {
                                _footer += '<td class="column-' + key + ' text-center">' + cols[key].toUpperCase() + '</td>';
                            }
                        }
                    }
                    else {
                        if(opt.hasOwnProperty('columnAlignment')) {
                            _footer += '<td class="column-' + key + ' text-' + opt.columnAlignment[key] + '">' + cols[key].toUpperCase() + '</td>';
                        }
                        else {
                            _footer += '<td class="column-' + key + ' text-center">' + cols[key].toUpperCase() + '</td>';
                        }
                    }
                }
            }
            else {
                console.log('No data available');
            }
        }
        if(opt.actionColumn) {
            _footer += '<td class="action text-center text-uppercase">Actions</td>';
        }
        _footer += '</tr>';
        if(opt.footer) {
            el.children[2].innerHTML = _footer;
        }
    }
    customizeGrid(el) {
        if(!el.classList.contains('infinity-grid-table')) {
            el.classList.add('infinity-grid-table');
        }
    }
    addExtraElements(el, data) {
        let id = 'grid_search_and_filter_' + this._uuid;
        if(document.getElementById(id) !== null) {
            document.getElementById(id).closest('tr').remove();
        }
        let colsNumber = 0;
        if(this._options.hasOwnProperty('columnNames')) {
            colsNumber = this._options.columnNames.length + 1;
        }
        else {
            if(Object.keys(data.data).length === 0) {
                return;
            }
            colsNumber = Object.keys(data.data[data.from]).length;
        }
        if(this._options.actionColumn) {
            colsNumber += 1;
        }
        el.querySelector('thead').insertAdjacentHTML("afterbegin", '<tr><td style="padding: 0;" colspan="' + colsNumber + '"><div id="' + id + '" class="grid-search-filter container" style="height: auto;padding-top:5px;padding-bottom:10px;"><div class="row"></div></div></td></tr>');
        this.buildFilterElement(id, data);
        this.buildMidElement(id);
        this.buildSearchElement(id);
    }
    buildFilterElement(id, data) {
        let cid = 'grid_filters_' + this._uuid;
        let target = document.getElementById(id).children[0];
        let filterContainer = document.createElement('div');
        filterContainer.className ='extra-filter-container col-md-4 col-12 mt-2';
        filterContainer.innerHTML = '<div class="">\n' +
            '  <select id="' + cid + '" class="form-select" aria-label="Filter select">\n' +
            '  <option value="-1" selected>Choose a group...</option>\n' +
            '</select>\n' +
            '</div>';
        target.append(filterContainer);
        if(this._options.hasOwnProperty('filter')) {
            if(this._options.filter === false) {
                document.getElementById(cid).parentElement.style.display = 'none';
            }
            else {
                this.loadFilter(cid, data);
                let self = this;
                document.getElementById(cid).addEventListener('change', function(e) {
                    self._options.dataSource.ajax.params = Object.assign({}, self._options.dataSource.ajax.params, {
                        page: 1,
                        size : self._options.pagination.pages.size,
                        filterName : self._options.columnKeys[self._options.filter],
                        filterValue : e.target.value
                    });
                    self.getAjaxData(self._options.dataSource.ajax).then(function(result) {
                        self.initGrid(self._elem, result);
                        document.getElementById(cid).value = result.filters.value;
                    })
                })
            }
        }
        else {
            document.getElementById(id).style.display = 'none';
        }
    }
    parseColumnValues(colIndex) {
        let result = [];
        let table, tr, td, i, txtValue;
        table = this.getTableElement();
        tr = table.children[1].getElementsByTagName("tr");
        for (i = 0; i < tr.length; i++) {
            td = tr[i].getElementsByTagName("td")[colIndex];
            if (td) {
                txtValue = td.textContent || td.innerText;
                if(result.indexOf(txtValue) < 0) {
                    result.push(txtValue);
                }
            }
        }
        return result.sort();
    }
    loadFilter(id, data) {
        let target = document.getElementById(id);

        if(data.filters.data.length > 0) {
            let results = data.filters.data;
            for(let i = 0; i < results.length; i++) {
                let newOption = document.createElement('option');
                let optionText = document.createTextNode(results[i]);
                newOption.appendChild(optionText);
                newOption.setAttribute('value', results[i]);
                target.appendChild(newOption);
            }
        }
        else {
            let columnIndex = this._options.filter;
            let results = this.parseColumnValues(columnIndex);
            for(let i = 0; i < results.length; i++) {
                let newOption = document.createElement('option');
                let optionText = document.createTextNode(results[i]);
                newOption.appendChild(optionText);
                newOption.setAttribute('value', results[i]);
                target.appendChild(newOption);
            }
        }
    }
    generateMiddleButtonsContent(buttonObj) {
        return '<button type="button" class="' + buttonObj.className + '" title="' + buttonObj.caption + '">' + buttonObj.icon + '</button>';
    }
    buildMidElement(id) {
        let target = document.getElementById(id).children[0];
        let content = '';
        if(this._options.hasOwnProperty('middleContent')) {
            if(this._options.middleContent.hasOwnProperty('buttons')) {
                let buttons = this._options.middleContent.buttons;
                for(let i = 0; i < buttons.length; i++) {
                    content += this.generateMiddleButtonsContent(buttons[i]);
                }
            }
        }
        let midContainer = document.createElement('div');
        midContainer.className ='extra-middle-container col-md-4 col-12 mt-2';
        midContainer.innerHTML = '<div class="mb-md-1 mb-3 middle-actions d-flex flex-row justify-content-center">\n' +
            content +
            '  \n' +
            '</div>';
        target.append(midContainer);
    }
    enableSelectFeature(el) {
        let ul = document.getElementById("columns-selector_" + this._uuid);
        let li = ul.getElementsByTagName("li");
        for(let i = 0; i < li.length; i++) {
            let ca = li[i].querySelector('a');
            if(el.className === ca.className) {
                ca.classList.add('d-none');
            }
            else {
                ca.classList.remove('d-none');
            }
        }
    }
    getSearchGridColumnsByDelimiter(delimiter) {
        let result = [];
        let cols = this._options.searchable.columns;
        for(let i = 0; i < cols.length; i++) {
            let tmp = cols[i];
            result.push(this._options.columnKeys[tmp]);
        }
        if(this._options.searchable.hasOwnProperty('addCustomSearch')) {
            let more = this._options.searchable.addCustomSearch;
            for(let i = 0; i < more.length; i++) {
                result.push(more[i].value)
            }
        }
        return result.join(delimiter);
    }
    buildSearchElement(id) {
        let target = document.getElementById(id).children[0];
        let searchContainer = document.createElement('div');
        searchContainer.className ='extra-search-container col-md-4 col-12 mt-2';
        let fields = '';
        let getColsNames = this.getSearchGridColumnsByDelimiter(',');
        if(this._options.searchable.columns.length > 0) {
            fields += '  <ul id="columns-selector_' + this._uuid + '" class="dropdown-menu search-text-by">\n';
            fields += '<li><a data-field="' + getColsNames + '" class="dropdown-item search-text-by-unselected d-none">Select Column</a></li>';
            for(let i = 0; i < this._options.searchable.columns.length; i++) {
                let colIndex = this._options.searchable.columns[i];
                let colName = this._options.columnNames[colIndex];
                let colKey  = this._options.columnKeys[colIndex];
                fields += '    <li><a data-field="' + colKey + '" class="dropdown-item ' + 'search-text-by-' + colKey + '">' + colName + '</a></li>\n';
            }
            if(this._options.searchable.hasOwnProperty('addCustomSearch')) {
                let more = this._options.searchable.addCustomSearch;
                for(let i = 0; i < more.length; i++) {
                    let item = more[i];
                    fields += '    <li><a data-field="' + item.value + '" class="dropdown-item ' + 'search-text-by-' + item.value + '">' + item.caption + '</a></li>\n';
                }
            }
            fields += '  </ul>\n';
        }
        if(this._options.searchable.minSearchLength === undefined) {
            this._options.searchable.minSearchLength = 4;
        }
        searchContainer.innerHTML = '<div class="input-group">\n' +
            '  <button value="' + getColsNames + '" class="btn btn-outline-secondary dropdown-toggle btn-search-by" type="button" data-bs-toggle="dropdown" aria-expanded="false">Select Column</button>\n' +
            fields +
            '  <input minlength="' + this._options.searchable.minSearchLength + '" type="text" class="form-control" id="search_item_' + this._uuid + '" placeholder="Text for search...">\n' +
            '  <button class="btn btn-outline-secondary search-combined" type="button" aria-expanded="false"><i class="fa-solid fa-magnifying-glass"></i></button>\n' +
            '</div>';
        target.append(searchContainer);
        let self = this;
        document.getElementById("columns-selector_" + this._uuid).querySelectorAll("li a").forEach(function(item, index) {
            item.addEventListener('click', function(e) {
                self.enableSelectFeature(this);
                self._elem[0].querySelector(".btn-search-by:first-child").innerText = item.innerText;
                self._elem[0].querySelector(".btn-search-by:first-child").value = item.dataset.field;
                let searchText = document.getElementById('search_item_' + self._uuid).value;
                if(self._options.columnKeys.indexOf(item.dataset.field) === 0) {
                    if(["", "0"].indexOf(searchText) >= 0) {
                        Swal.fire({
                            title: "Warning!",
                            text: "Invalid value for selected column.",
                            icon: "warning"
                        })
                        return false;
                    }
                }
                if(searchText.length> 0) {
                    self._options.dataSource.ajax.params = Object.assign({}, self._options.dataSource.ajax.params, {
                        page: 1,
                        size : document.getElementById('records_on_page_' + self._uuid).value,
                        filterName : self._options.columnKeys[self._options.filter],
                        filterValue : document.getElementById('grid_filters_' + self._uuid).value,
                        filterTextField : item.dataset.field,
                        filterTextValue : searchText
                    });
                    self.getAjaxData(self._options.dataSource.ajax).then(function(result) {
                        self.initGrid(self._elem, result);
                        let ul = document.getElementById('columns-selector_' + self._uuid);
                        let text = ul.querySelector('a[data-field="'+ result.filters.textField +'"]').innerText;
                        self._elem[0].querySelector(".btn-search-by").value = result.filters.textField;
                        let getColsNames = self.getSearchGridColumnsByDelimiter(',');
                        let sli = ul.querySelector('a[data-field="' + result.filters.textField + '"]');

                        self.enableSelectFeature(sli);

                        self._elem[0].querySelector(".btn-search-by").innerText = text;
                        document.getElementById('search_item_' + self._uuid).value = result.filters.textValue;
                        document.getElementById('search_item_' + self._uuid).focus();
                        document.getElementById('grid_filters_' + self._uuid).value = result.filters.value;
                    })
                }
            })
        });
        // document.getElementById('search_item').addEventListener('keyup', function(e) {
        //     if(this.value.length < parseInt(this.getAttribute('minlength'))) {
        //         return false;
        //     }
        //     let filterTextField = '';
        //     if (document.querySelector(".btn-search-by:first-child").value !== '') {
        //         filterTextField = document.querySelector(".btn-search-by:first-child").value;
        //     }
        //     else {
        //         if(self._options.searchable.columns.length > 0) {
        //             for(let i = 0; i < self._options.searchable.columns.length; i++) {
        //                 let colIndex = self._options.searchable.columns[i];
        //                 let colName = self._options.columnNames[colIndex];
        //                 let colKey  = self._options.columnKeys[colIndex];
        //                 filterTextField += colKey;
        //                 if(i <  (self._options.searchable.columns.length - 1)) {
        //                     filterTextField += ',';
        //                 }
        //             }
        //         }
        //     }
        //     self._options.dataSource.ajax.params = Object.assign({}, self._options.dataSource.ajax.params, {
        //         page: 1,
        //         size : document.getElementById('records_on_page').value,
        //         filterName : self._options.columnKeys[self._options.filter],
        //         filterValue : document.getElementById('grid_filters').value,
        //         filterTextField : filterTextField,
        //         filterTextValue : this.value
        //     });
        //     self.getAjaxData(self._options.dataSource.ajax).then(function(result) {
        //         self.initGrid(self._elem, result);
        //         document.getElementById('grid_filters').value = result.filters.value;
        //         let text = $("ul#columns-selector").find("a[data-field='" + result.filters.textField + "']").text();
        //         document.querySelector(".btn-search-by").value = result.filters.textField;
        //         document.getElementById('search_item').value = result.filters.textValue;
        //         document.getElementById('search_item').focus();
        //     })
        // })
        document.getElementById('search_item_' + self._uuid).addEventListener('keyup', function(e) {
            let el = this;
            if(self._options.searchable.hasOwnProperty('debounce')) {
                if(self._options.searchable.debounce.active) {
                    if(self._timeout !== null) {
                        clearTimeout(self._timeout);
                    }
                    self._timeout = setTimeout(function() {
                        clearTimeout(self._timeout);
                        self.getSearchResults(self, el);
                    }, self._options.searchable.debounce.timeout);
                }
                else {
                    self.getSearchResults(self, this);
                }
            }
            else {
                self.getSearchResults(self, this);
            }
        })
    }
    getSearchResults(component, el) {
        if(el.value.length < parseInt(el.getAttribute('minlength'))) {
            return false;
        }
        let searchBy = this._elem[0].querySelector(".btn-search-by").value;
        if(this._options.columnKeys.indexOf(searchBy) === 0) {
            if(["", "0"].indexOf(el.value) >= 0) {
                Swal.fire({
                    title: "Warning!",
                    text: "Invalid value for selected column.",
                    icon: "warning"
                })
                return false;
            }
        }

        let filterTextField = '';
        if (this._elem[0].querySelector(".btn-search-by:first-child").value !== '') {
            filterTextField = this._elem[0].querySelector(".btn-search-by:first-child").value;
        }
        else {
            if(component._options.searchable.columns.length > 0) {
                for(let i = 0; i < component._options.searchable.columns.length; i++) {
                    let colIndex = component._options.searchable.columns[i];
                    let colName = component._options.columnNames[colIndex];
                    let colKey  = component._options.columnKeys[colIndex];
                    filterTextField += colKey;
                    if(i <  (component._options.searchable.columns.length - 1)) {
                        filterTextField += ',';
                    }
                }
            }
            if(this._options.searchable.hasOwnProperty('addCustomSearch')) {
                let more = this._options.searchable.addCustomSearch;
                for(let i = 0; i < more.length; i++) {
                    filterTextField += ',' + more[i].value;
                }
            }
        }
        component._options.dataSource.ajax.params = Object.assign({}, component._options.dataSource.ajax.params, {
            page: 1,
            customSearch : component._options.searchable.addCustomSearch,
            size : document.getElementById('records_on_page_' + component._uuid).value,
            filterName : component._options.columnKeys[component._options.filter],
            filterValue : document.getElementById('grid_filters_' + component._uuid).value,
            filterTextField : filterTextField,
            filterTextValue : el.value
        });
        component.getAjaxData(this._options.dataSource.ajax).then(function(result) {
            component.initGrid(component._elem, result);
            document.getElementById('grid_filters_' + component._uuid).value = result.filters.value;
            let ul = document.getElementById('columns-selector_' + component._uuid);
            let text = ul.querySelector('a[data-field="'+ result.filters.textField +'"]').innerText;
            component._elem[0].querySelector(".btn-search-by").value = result.filters.textField;

            let getColsNames = component.getSearchGridColumnsByDelimiter(',');
            let sli = ul.querySelector('a[data-field="' + result.filters.textField + '"]');
            component.enableSelectFeature(sli);


            component._elem[0].querySelector(".btn-search-by").innerText = text;
            document.getElementById('search_item_' + component._uuid).value = result.filters.textValue;
            document.getElementById('search_item_' + component._uuid).focus();
        })
    }
    addPagination(el, data) {
        let id = 'grid_pagination_' + this._uuid;
        if(document.getElementById(id) !== null) {
            document.getElementById(id).closest('tr').remove();
        }
        if(this._options.pagination.active) {
            let paginationStyle = '';
            for(let key in this._options.pagination.css) {
                paginationStyle += key + ':' + this._options.pagination.css[key] + ';';
            }
            let colsNumber = 0;
            if(this._options.hasOwnProperty('columnNames')) {
                colsNumber = this._options.columnNames.length + 1;
            }
            else {
                if(Object.keys(data.data).length === 0) {
                    return;
                }
                colsNumber = Object.keys(data.data[data.from]).length;
            }
            if(this._options.actionColumn) {
                colsNumber += 1;
            }
            el.querySelector('tfoot').insertAdjacentHTML("afterbegin", '<tr><td style="padding: 0;" colspan="' + colsNumber + '"><div id="' + id + '" class="grid-pagination" style="' + paginationStyle + '"><div class="row" style="padding-left: 5px;padding-right: 5px;"></div></div></td></tr>');
            this.buildPaginationRow(id, data);
        }
    }
    buildRecordsOnPageElement(el) {
        let id = 'records_on_page_' + this._uuid;
        let container = document.createElement('div');
        container.className = 'col-md-3 col-12';
        container.innerHTML = '<div class="col-12 mt-2 mb-2 text-center">\n' +
            '<select  id="' + id + '" class="form-select" aria-label="Default select"></select>\n' +
            '</div>';
        el.children[0].append(container);
        let target = document.getElementById(id);
        let sizes = this._options.pagination.pages.sizes;
        for(let i = 0; i < sizes.length; i++) {
            let tmp = sizes[i];
            let newOption = document.createElement('option');
            let optionText = document.createTextNode(tmp);
            newOption.appendChild(optionText);
            newOption.setAttribute('value',tmp);
            target.appendChild(newOption);
        }
        target.value = this._options.pagination.pages.size;
        let self = this;
        document.getElementById(id).addEventListener('change', function(e) {
            self._options.dataSource.ajax.params = Object.assign({}, self._options.dataSource.ajax.params, {
                page: 1,
                size : this.value,
                filterName : self._options.columnKeys[self._options.filter],
                filterValue : document.getElementById('grid_filters_' + self._uuid).value
            });
            self._options.pagination.pages.size = this.value;
            self.getAjaxData(self._options.dataSource.ajax).then(function(result) {
                self.initGrid(self._elem, result);
                document.getElementById('grid_filters_' + self._uuid).value = result.filters.value;
            })
        })
    }
    generatePagesLink(data) {
        let links = '';
        let rules = null;
        let records = data.data;
        if(this._options.pagination.pages.rules.length > 0) {
            rules = this._options.pagination.pages.rules;
            for(let i = 0; i < rules.length; i++) {
                if(rules[i].name === 'moreThan') {
                    if(rules[i].target === 'pages') {
                        if(data.last_page > rules[i].value) {
                            let first = rules[i].action.showPagesFirst;
                            let last = rules[i].action.showPagesLast;
                            let garbage = rules[i].action.showMiddle;
                            for(let j = 0; j< first; j++) {
                                let tmpPage = parseInt(j) + 1;
                                let active = (data.current_page === tmpPage) ? 'active' : '';
                                links += '    <li data-page="' + tmpPage + '" class="page-item ' + active + '"><a class="page-link" href="#">' + tmpPage + '</a></li>\n';
                            }
                            links += garbage;
                            for(let k = data.last_page - last; k < data.last_page; k++) {
                                let tmpPage = parseInt(k) + 1;
                                let active = (data.current_page === tmpPage) ? 'active' : '';
                                links += '    <li data-page="' + tmpPage + '" class="page-item ' + active + '"><a class="page-link" href="#">' + tmpPage + '</a></li>\n';
                            }
                        }
                        else {
                            for(let j = 0; j < data.last_page; j++) {
                                let tmpPage = parseInt(j) + 1;
                                let active = (data.current_page === tmpPage) ? 'active' : '';
                                links += '    <li data-page="' + tmpPage + '" class="page-item ' + active + '"><a class="page-link" href="#">' + tmpPage + '</a></li>\n';
                            }
                        }
                    }
                }
            }
        }
        else {
            for(let k = 0; k < data.last_page; k++) {
                let tmpPage = parseInt(k) + 1;
                let active = (data.current_page === tmpPage) ? 'active' : '';
                links += '    <li data-page="' + tmpPage + '" class="page-item ' + active + '"><a class="page-link" href="#">' + tmpPage + '</a></li>\n';
            }
        }
        return links;
    }
    buildPagesElement(el, data) {
        let id = 'pages_parent_' + this._uuid;
        document.getElementById('records_on_page_' + this._uuid).value = data.per_page;
        let container = document.createElement('div');
        let disabledPrev = (data.prev_page_url === null) ? 'disabled' : '';
        let disabledNext = (data.next_page_url === null) ? 'disabled' : '';
        let nextPageNo = parseInt(data.current_page) + 1;
        let prevPageNo = parseInt(data.current_page) - 1;
        container.className = 'col-md-9 col-12';
        container.innerHTML = '<div class="mt-2 mb-2 text-center">\n' +
            '<nav aria-label="Page navigation example">\n' +
            '  <ul id="' + id + '" class="pagination justify-content-center">\n' +
            '    <li data-page="' + prevPageNo + '" class="page-item ' + disabledPrev + '">\n' +
            '      <a class="page-link">Previous</a>\n' +
            '    </li>\n' +
            this.generatePagesLink(data) +
            '    <li data-page="' + nextPageNo + '" class="page-item ' + disabledNext +'">\n' +
            '      <a class="page-link" href="#">Next</a>\n' +
            '    </li>\n' +
            '  </ul>\n' +
            '</nav>' +
            '\n' +
            '</div>';
        el.children[0].append(container);
        let pages_els = document.getElementById(id).children;
        for(let key in pages_els) {
            let pel = pages_els[key];
            if(pel.offsetLeft > 0) {
                let self = this;
                pel.addEventListener('click', function(e) {
                    let cpage = this.dataset.page;
                    let csize = document.getElementById('records_on_page_' + self._uuid).value;
                    self._options.dataSource.ajax.params = Object.assign({}, self._options.dataSource.ajax.params, {
                        page: cpage,
                        size : csize,
                        filterName : self._options.columnKeys[self._options.filter],
                        filterValue : document.getElementById('grid_filters_' + self._uuid).value
                    });
                    self.getAjaxData(self._options.dataSource.ajax).then(function(result) {
                        self.initGrid(self._elem, result);
                        document.getElementById('grid_filters_' + self._uuid).value = result.filters.value;
                    })
                })
            }
        }
    }
    buildPaginationRow(id, data) {
        let el = document.getElementById(id);
        this.buildRecordsOnPageElement(el);
        this.buildPagesElement(el, data);
    }
    addSortable(el) {
        if(this._options.sortable) {
            let ths = this.getTableElement().querySelectorAll("thead > tr > th"); //el.children[0].children[0].children;
            let countThs = ths.length;
            for(let key in ths) {
                if(parseInt(key) < countThs) {
                    if(document.getElementById('column_' + key + '_sortable_' + this._uuid) !== null) {
                        return;
                    }
                    let th = ths[key];
                    if(th.classList.contains('action')) {
                        return
                    }
                    let sortContainer = document.createElement('div');
                    let containerData = '';

                    if(this._options.sortable.hasOwnProperty('except')) {
                        if(this._options.sortable.except.indexOf(parseInt(key))< 0) {
                            sortContainer.className ='sortable-column-container';
                            sortContainer.setAttribute('id', 'column_' + key + '_sortable_' + this._uuid);
                            containerData += '<span class="grid-sort no-sort"><i class="fa-solid fa-arrows-up-down"></i></span>';
                            containerData += '<span class="grid-sort sort-ascending d-none" style="opacity: 0.5;"><i class="fa-solid fa-arrow-up"></i></span>';
                            containerData += '<span class="grid-sort sort-descending d-none" style="opacity: 0.5;"><i class="fa-solid fa-arrow-down"></i></span>';
                            sortContainer.innerHTML = containerData;
                            sortContainer.style.display = 'initial';
                            sortContainer.style.marginLeft = '5px';
                            sortContainer.style.cursor = 'pointer';
                            th.append(sortContainer);
                        }
                    }
                    else {
                        sortContainer.className ='sortable-column-container';
                        sortContainer.setAttribute('id', 'column_' + key + '_sortable_' + this._uuid);
                        containerData += '<span class="grid-sort no-sort"><i class="fa-solid fa-arrows-up-down"></i></span>';
                        containerData += '<span class="grid-sort sort-ascending d-none" style="opacity: 0.5;"><i class="fa-solid fa-arrow-up"></i></span>';
                        containerData += '<span class="grid-sort sort-descending d-none" style="opacity: 0.5;"><i class="fa-solid fa-arrow-down"></i></span>';
                        sortContainer.innerHTML = containerData;
                        sortContainer.style.display = 'initial';
                        sortContainer.style.marginLeft = '5px';
                        sortContainer.style.cursor = 'pointer';
                        th.append(sortContainer);
                    }
                }
            }
        }
    }
    addLiveOrNot (el) {
        let id = 'live_events_indicator_' + this._uuid;
        if(document.getElementById(id) === null) {
            el.closest('.card').querySelector('.card-header').innerHTML = '<div style="margin-bottom: 10px;width: 70px;height: 30px;\n' +
                '    float: right;margin-right: 5px;" id="' + id + '" class="grid-live-events row"><div class="col-12 full-line"></div></div>';
            if(this._options.live.active) {
                let liveImagePath = "resources/images/live.gif";
                document.getElementById(id).querySelector('.full-line').innerHTML = '<img alt="Live Image" style="width:64px;margin-top:5px;" src="' + liveImagePath + '">';
            }
            else {
                document.getElementById(id).innerHTML = '';
                console.log('is not live events');
            }
        }
    }
    comparer(index) {
        let self = this;
        return function(a, b) {
            let valA = self.getCellValue(a, index), valB = self.getCellValue(b, index)
            return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB)
        }
    }
    getCellValue(row, index) {
        return $(row).children('td').eq(index).text();
    }
    rebuildStripe(table) {
        this.getTableElement().querySelectorAll('tr:nth-child(odd)').forEach(function(item, key) {
            item.classList.remove('even');
            item.classList.add('odd');
        })
        this.getTableElement().querySelectorAll('tr:nth-child(even)').forEach(function(item, key) {
            item.classList.add('even');
            item.classList.remove('odd');
        })
    }
    refreshGrid() {
        this._options.dataSource.ajax.params = Object.assign({}, this._options.dataSource.ajax.params, {
            page: document.querySelector('li.active').dataset.page,
            size : this._options.pagination.pages.size,
            filterName : this._options.columnKeys[this._options.filter],
            filterValue : document.getElementById('grid_filters_' + this._uuid).value,
            filterTextField : document.querySelector(".btn-search-by:first-child").value,
            filterTextValue : document.getElementById('search_item_' + this._uuid).value

        });
        let self = this;
        this.getAjaxData(this._options.dataSource.ajax).then(function(result) {
            self.initGrid(self._elem, result);
            let ul = document.getElementById('columns-selector_' + self._uuid);
            let text = ul.querySelector('a[data-field="'+ result.filters.textField +'"]').innerText;                                document.getElementById('grid_filters_' + self._uuid).value = result.filters.value;
            document.getElementById('search_item_' + self._uuid).value = result.filters.textValue;
            self._elem[0].querySelector(".btn-search-by").innerText = text;
            document.getElementById('search_item_' + self._uuid).focus();
        })
    }
}





