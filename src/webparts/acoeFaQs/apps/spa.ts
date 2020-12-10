import * as $ from 'jquery';
import '@progress/kendo-ui';
import { ds } from  './datasource';

export class ModelState extends kendo.data.ObservableObject {
    protected collapsed: string[] = [];

    constructor() {
        super();
    }
}

export class SPA {
    protected static tabStrip: kendo.ui.TabStrip;
    protected static faqGridOptions: kendo.ui.GridOptions;
    protected static faqGrid: kendo.ui.Grid;
    protected static categoriesGridOptions: kendo.ui.GridOptions;
    protected static categoriesGrid: kendo.ui.Grid;
    private static instance: SPA;

    constructor() {}

    public static getInstance(faqGuid: string, categoriesGuid: string, canEdit: boolean): SPA {
        this.tabStrip = null;
        this.faqGridOptions = null;
        this.faqGrid = null;
        this.categoriesGridOptions = null;
        this.categoriesGrid = null;
        const state = new ModelState();

        $(() => {
            this.tabStrip = $('#tabStrip').kendoTabStrip().data('kendoTabStrip');

            const dsFAQs = ds({ 
                guid: faqGuid,
                dsName: 'dsFAQs',
                schema: {
                    id: 'Id',
                    fields: {
                        Id: { type: 'number' },
                        Title: { type: 'string' },
                        Answer: { type: 'string' },
                        Category: { type: 'string' }
                    }
                },
                pageSize: 500,
                group: { field: 'Category', aggregates: [
                    { field: 'Category', aggregate: 'count' }
                ] }
            });
            
            const dsFAQCategories = ds({
                guid: categoriesGuid,
                dsName: 'dsFAQCategories',
                schema: {
                    id: 'Id',
                    fields: {
                        Id: { type: 'number' },
                        Title: { type: 'string' }
                    }
                }
            });
            dsFAQCategories.read()
            .then(_ => state.set('collapsed', dsFAQCategories.data().map(item => item['Title'])))
            .then(_ => {
                const Events = {
                    onDataBound: e => {
                        for (let category of state.get('collapsed')) {
                            this.faqGrid.collapseGroup('.k-grouping-row:contains("' + category + '")');
                        }
                    }
                };
    
                const Utils = {
                    rowGroupKey: (row, grid: kendo.ui.Grid) => {
                        let next: [] = row.nextUntil('[data-uid]').next(),
                            item: object = grid.dataItem(next.length ? next : row.next()),
                            groupIdx: number = row.children('.k-group-cell').length,
                            groups: [] = grid.dataSource.group(),
                            field: string = grid.dataSource.group()[groupIdx].field,
                            groupValue: string = (item[field] != null) ? item[field] : '';
                        
                        return groupValue;
                    }
                };
                
                if (canEdit) {
                    const Editors = {
                        editor: (container, options) => {
                            $('<textarea required name="' + options.field + '" rows="3" cols="25"></textarea>')
                            .appendTo(container)
                            .kendoEditor({ 
                                tools: ["bold","italic","underline","justifyLeft","justifyCenter","justifyRight","justifyFull","insertUnorderedList","insertOrderedList","indent","outdent","createLink","unlink","subscript","superscript","tableWizard","createTable","addRowAbove","addRowBelow","addColumnLeft","addColumnRight","deleteRow","deleteColumn","formatting","cleanFormatting","fontName","fontSize","foreColor"]
                            });
                        },
                        categories: (container, options) => {
                            $('<input required name="' + options.field + '"/>')
                            .appendTo(container)
                            .kendoDropDownList({
                                valuePrimitive: true,
                                optionLabel: 'Select a category...',
                                dataTextField: 'Title',
                                dataValueField: 'Title',
                                dataSource: dsFAQCategories
                            });
                        }
                    };
        
                    this.faqGridOptions = {
                        dataSource: dsFAQs,
                        columnMenu: true,
                        editable: 'popup',
                        pageable: {
                            pageSize: 10,
                            buttonCount: 5,
                            pageSizes: [10, 25, 'all'],
                            messages: {
                                display: 'Showing {0}-{1} from {2} FAQs',
                                empty: 'No FAQs found.',
                                itemsPerPage: 'FAQs per page'
                            }
                        },
                        sortable: true,
                        toolbar: [ 'create', 'search' ],
                        columns: [
                            { command: ['edit', 'destroy'], title: '' },
                            { field: 'Title', title: 'Question', template: '#= Title #', editor: Editors.editor },
                            { field: 'Answer', title: 'Answer', template: '#= Answer #', editor: Editors.editor },
                            { field: 'Category', title: 'Category', editor: Editors.categories, hidden: true, aggregates: [ 'count' ], groupHeaderTemplate: "#= value #: #= count #" }
                        ],
                        dataBound: Events.onDataBound
                    };
    
                    this.categoriesGridOptions = {
                        dataSource: dsFAQCategories,
                        columnMenu: true,
                        editable: 'inline',
                        pageable: false,
                        sortable: true,
                        toolbar: [ 'create', 'search' ],
                        columns: [
                            { command: ['edit', 'destroy'], title: '' },
                            { field: 'Title', title: 'Category Name' }
                        ]
                    };
    
                    this.categoriesGrid = $('#categoriesGrid').kendoGrid(this.categoriesGridOptions).data('kendoGrid');
                }
                else {
                    this.faqGridOptions = {
                        dataSource: dsFAQs,
                        columnMenu: true,
                        pageable: {
                            pageSize: 10,
                            buttonCount: 5,
                            pageSizes: [10, 25, 'all'],
                            messages: {
                                display: 'Showing {0}-{1} from {2} FAQs',
                                empty: 'No FAQs found.',
                                itemsPerPage: 'FAQs per page'
                            }
                        },
                        sortable: true,
                        toolbar: [ 'search' ],
                        columns: [
                            { field: 'Title', title: 'Question', template: '#= Title #' },
                            { field: 'Answer', title: 'Answer', template: '#= Answer #' },
                            { field: 'Category', title: 'Category', hidden: true, aggregates: [ 'count' ], groupHeaderTemplate: "#= value #: #= count #" }
                        ],
                        dataBound: Events.onDataBound
                    };
                }
    
                this.faqGrid = $('#faqGrid').kendoGrid(this.faqGridOptions).data('kendoGrid');
                // Add event to grid to toggle grouping
                this.faqGrid.table.on('click', '.k-grouping-row .k-i-collapse, .k-grouping-row .k-i-expand', e => {
                    let row = e.currentTarget.closest('tr');
                    let categoryName = Utils.rowGroupKey($(row), this.faqGrid);
    
                    let newCollapsed: string[] = null;
                    if ($(row).find('.k-i-collapse').length != 0) {
                        newCollapsed = state.get('collapsed').filter(item => item != categoryName);
                    } else {
                        newCollapsed = state.get('collapsed');
                        newCollapsed.push(categoryName);
                    }
                    state.set('collapsed', newCollapsed);
                });
            })
            .catch(err => console.log(err) );
    
            return SPA.instance;
        });
        return false;
    }
}