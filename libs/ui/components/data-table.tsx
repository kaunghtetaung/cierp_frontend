"use client";

import * as React from "react";
import Link from "next/link";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import * as XLSX from 'xlsx';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { ChevronUp, ChevronDown, ChevronsUpDown, Columns3, Printer, Download, FileText, Plus, X } from "lucide-react";
import { FilterConfig } from "./table-filters";
import { TableFilterModal } from "./table-filter-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  initialColumnVisibility?: VisibilityState;
  printTitle?: string;
  moduleId?: string; // Module identifier for route-specific storage
  filterConfigs?: Record<string, FilterConfig>; // Column ID to filter config mapping
  showFilters?: boolean; // Toggle to show/hide filter row
  enablePagination?: boolean; // Enable client-side pagination
  pageSize?: number; // Initial page size for client-side pagination
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  onRowSelectionChange,
  initialColumnVisibility = {},
  printTitle = "Table Data",
  moduleId,
  filterConfigs = {},
  showFilters = true,
  enablePagination = false,
  pageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  
  // Title management state
  const [selectedTitle, setSelectedTitle] = React.useState<string>(printTitle);
  const [isTitleModalOpen, setIsTitleModalOpen] = React.useState(false);
  
  // Title form schema
  const titleFormSchema = z.object({
    newTitle: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  });
  
  // Title form
  const titleForm = useForm<z.infer<typeof titleFormSchema>>({
    resolver: zodResolver(titleFormSchema),
    defaultValues: {
      newTitle: "",
    },
  });
  
  // Generate storage keys based on module and column IDs for this table
  const storageKeys = React.useMemo(() => {
    const baseKey = moduleId || 'default';
    const columnIds = columns.map(col => 'id' in col ? col.id : '').filter(Boolean).sort();
    const tableIdentifier = columnIds.join('-');
    
    return {
      columnVisibility: `table-columns-${baseKey}-${tableIdentifier}`,
      sorting: `table-sorting-${baseKey}-${tableIdentifier}`,
      titles: `table-titles-${baseKey}`
    };
  }, [columns, moduleId]);

  // Load sorting from localStorage on mount
  const [sorting, setSorting] = React.useState<SortingState>(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(storageKeys.sorting);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load sorting from localStorage:', error);
    }
    return [];
  });

  // Load column visibility from localStorage on mount
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    if (typeof window === 'undefined') return initialColumnVisibility;
    
    try {
      const stored = localStorage.getItem(storageKeys.columnVisibility);
      if (stored) {
        const parsedStored = JSON.parse(stored);
        // Merge with initial visibility, giving priority to stored values
        return { ...initialColumnVisibility, ...parsedStored };
      }
    } catch (error) {
      console.warn('Failed to load column visibility from localStorage:', error);
    }
    return initialColumnVisibility;
  });
  
  const [rowSelection, setRowSelection] = React.useState({});

  // Title management functions
  const getTitlesFromStorage = React.useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(storageKeys.titles);
      if (stored) {
        const titles = JSON.parse(stored);
        return Array.isArray(titles) ? titles : [];
      }
    } catch (error) {
      console.warn('Failed to load titles from localStorage:', error);
    }
    return [];
  }, [storageKeys.titles]);

  const [savedTitles, setSavedTitles] = React.useState<string[]>(() => getTitlesFromStorage());

  const saveTitlesToStorage = React.useCallback((titles: string[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKeys.titles, JSON.stringify(titles));
      setSavedTitles(titles);
    } catch (error) {
      console.warn('Failed to save titles to localStorage:', error);
    }
  }, [storageKeys.titles]);

  const addTitle = React.useCallback((values: z.infer<typeof titleFormSchema>) => {
    const title = values.newTitle.trim();
    if (!title) return;
    
    const currentTitles = getTitlesFromStorage();
    if (!currentTitles.includes(title)) {
      const newTitles = [...currentTitles, title];
      saveTitlesToStorage(newTitles);
    }
    titleForm.reset();
  }, [getTitlesFromStorage, saveTitlesToStorage, titleForm]);

  const removeTitle = React.useCallback((titleToRemove: string) => {
    const currentTitles = getTitlesFromStorage();
    const newTitles = currentTitles.filter(title => title !== titleToRemove);
    saveTitlesToStorage(newTitles);
  }, [getTitlesFromStorage, saveTitlesToStorage]);

  // Load titles when storage keys change
  React.useEffect(() => {
    const titles = getTitlesFromStorage();
    setSavedTitles(titles);
  }, [getTitlesFromStorage]);

  // Save column visibility to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKeys.columnVisibility, JSON.stringify(columnVisibility));
    } catch (error) {
      console.warn('Failed to save column visibility to localStorage:', error);
    }
  }, [columnVisibility, storageKeys.columnVisibility]);

  // Save sorting to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKeys.sorting, JSON.stringify(sorting));
    } catch (error) {
      console.warn('Failed to save sorting to localStorage:', error);
    }
  }, [sorting, storageKeys.sorting]);

  // Update column visibility when initialColumnVisibility changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(storageKeys.columnVisibility);
      let storedVisibility = {};
      if (stored) {
        storedVisibility = JSON.parse(stored);
      }
      
      // Merge initial with stored, giving priority to stored values
      const mergedVisibility = { ...initialColumnVisibility, ...storedVisibility };
      const hasChanged = JSON.stringify(mergedVisibility) !== JSON.stringify(columnVisibility);
      
      if (hasChanged) {
        setColumnVisibility(mergedVisibility);
      }
    } catch (error) {
      console.warn('Failed to merge column visibility:', error);
      setColumnVisibility(initialColumnVisibility);
    }
  }, [JSON.stringify(initialColumnVisibility), storageKeys.columnVisibility]); // Use JSON.stringify for stable comparison

  // Custom column visibility change handler
  const handleColumnVisibilityChange = React.useCallback((updater: any) => {
    setColumnVisibility(prev => {
      const newVisibility = typeof updater === 'function' ? updater(prev) : updater;
      return newVisibility;
    });
  }, []);

  // Custom filter functions for different data types
  const filterFunctions = React.useMemo(() => {
    return {
      // Date range filter
      dateRange: (row: any, columnId: string, filterValue: any) => {
        const cellValue = row.getValue(columnId);
        if (!cellValue || !filterValue) return true;
        
        const cellDate = new Date(cellValue);
        if (isNaN(cellDate.getTime())) return true;
        
        switch (filterValue.type) {
          case 'before':
            return cellDate < new Date(filterValue.before);
          case 'after':
            return cellDate > new Date(filterValue.after);
          case 'between':
            const fromDate = new Date(filterValue.from);
            const toDate = new Date(filterValue.to);
            return cellDate >= fromDate && cellDate <= toDate;
          default:
            return true;
        }
      },
      
      // Number range filter
      numberRange: (row: any, columnId: string, filterValue: any) => {
        const cellValue = row.getValue(columnId);
        if (cellValue === null || cellValue === undefined || !filterValue) return true;
        
        const numValue = Number(cellValue);
        if (isNaN(numValue)) return true;
        
        switch (filterValue.type) {
          case 'equal':
            return numValue === filterValue.value;
          case 'less':
            return numValue < filterValue.value;
          case 'greater':
            return numValue > filterValue.value;
          case 'between':
            return numValue >= filterValue.min && numValue <= filterValue.max;
          default:
            return true;
        }
      },
      
      // Boolean filter
      booleanFilter: (row: any, columnId: string, filterValue: string) => {
        if (!filterValue) return true;
        const cellValue = row.getValue(columnId);
        return String(cellValue).toLowerCase() === filterValue.toLowerCase();
      },
      
      // Multi-select filter
      multiSelect: (row: any, columnId: string, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true;
        const cellValue = row.getValue(columnId);
        if (!cellValue) return false;
        return filterValue.includes(String(cellValue));
      },
    };
  }, []);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    ...(enablePagination && { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onRowSelectionChange: setRowSelection,
    filterFns: {
      dateRange: filterFunctions.dateRange,
      numberRange: filterFunctions.numberRange,
      booleanFilter: filterFunctions.booleanFilter,
      multiSelect: filterFunctions.multiSelect,
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      ...(enablePagination && {
        pagination: {
          pageSize: pageSize,
        },
      }),
    },
  });

  // Call onRowSelectionChange when row selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, onRowSelectionChange, table]);

  // Print functionality
  const handlePrint = React.useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get visible columns (excluding actions and select columns, but including sr column)
    const visibleColumns = table.getVisibleFlatColumns().filter(col => 
      col.id !== 'actions' && col.id !== 'select'
    );
    
    // Generate table HTML
    const tableHtml = `
      <html>
        <head>
          <title>${selectedTitle} - Print</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #000;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px 12px; 
              text-align: left; 
              font-size: 12px;
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold;
              text-align: center;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .print-date {
              text-align: right;
              font-size: 10px;
              color: #666;
              margin-bottom: 10px;
            }
            @media print {
              body { margin: 0; }
              .print-date { color: #000; }
            }
          </style>
        </head>
        <body>
          <div class="print-date">Printed on: ${new Date().toLocaleString()}</div>
          <div class="print-header">
            <h2>${selectedTitle}</h2>
          </div>
          <table>
            <thead>
              <tr>
                ${visibleColumns.map(column => {
                  let headerText = column.id;
                  if (typeof column.columnDef.header === 'function') {
                    try {
                      const headerResult = column.columnDef.header({ column, header: column, table } as any);
                      headerText = typeof headerResult === 'string' ? headerResult : 
                                  (headerResult?.props?.children || column.id);
                    } catch (e) {
                      headerText = column.id;
                    }
                  } else if (typeof column.columnDef.header === 'string') {
                    headerText = column.columnDef.header;
                  }
                  return `<th>${headerText}</th>`;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${table.getRowModel().rows.map(row => 
                `<tr>
                  ${visibleColumns.map(column => {
                    const cell = row.getVisibleCells().find(c => c.column.id === column.id);
                    if (!cell) return '<td>-</td>';
                    
                    // Handle serial number column specially
                    let textValue;
                    if (column.id === 'sr') {
                      // Get the current sorted row position for print
                      const sortedRows = table.getSortedRowModel().rows;
                      const sortedIndex = sortedRows.findIndex(r => r.id === row.id);
                      textValue = String(sortedIndex + 1);
                    } else {
                      // Get the raw data value first
                      const rowData = row.original as any;
                      const rawValue = column.accessorFn ? column.accessorFn(rowData, row.index) : rowData[column.id];
                      
                      // Convert different data types to readable text
                      if (rawValue === null || rawValue === undefined) {
                        textValue = '-';
                      } else if (typeof rawValue === 'boolean') {
                        textValue = rawValue ? 'Yes' : 'No';
                      } else if (typeof rawValue === 'number') {
                        textValue = rawValue.toLocaleString();
                      } else if (rawValue instanceof Date) {
                        textValue = rawValue.toLocaleDateString();
                      } else if (typeof rawValue === 'object') {
                        // Handle multilingual objects
                        if (rawValue.en || rawValue.mm) {
                          textValue = rawValue.en || rawValue.mm || '';
                        } else if (rawValue.displayName) {
                          textValue = typeof rawValue.displayName === 'object' 
                            ? (rawValue.displayName.en || rawValue.displayName.mm || '')
                            : rawValue.displayName;
                        } else if (rawValue.name) {
                          textValue = typeof rawValue.name === 'object'
                            ? (rawValue.name.en || rawValue.name.mm || '')
                            : rawValue.name;
                        } else {
                          textValue = String(rawValue);
                        }
                      } else {
                        textValue = String(rawValue);
                      }
                      
                      // Clean up the text value
                      textValue = textValue.replace(/\[object Object\]/g, '').trim() || '-';
                    }
                    
                    return `<td>${textValue}</td>`;
                  }).join('')}
                </tr>`
              ).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  }, [table, selectedTitle]);

  // Excel export functionality
  const handleExportToExcel = React.useCallback(() => {
    // Get visible columns (excluding actions and select columns, but including sr column)
    const visibleColumns = table.getVisibleFlatColumns().filter(col => 
      col.id !== 'actions' && col.id !== 'select'
    );

    // Prepare header row
    const headers = visibleColumns.map(column => {
      if (typeof column.columnDef.header === 'function') {
        try {
          const headerResult = column.columnDef.header({ column, header: column, table } as any);
          return typeof headerResult === 'string' ? headerResult : 
                 (headerResult?.props?.children || column.id);
        } catch (e) {
          return column.id;
        }
      } else if (typeof column.columnDef.header === 'string') {
        return column.columnDef.header;
      }
      return column.id;
    });

    // Prepare data rows
    const data = table.getSortedRowModel().rows.map(row => {
      return visibleColumns.map(column => {
        // Handle serial number column specially
        if (column.id === 'sr') {
          const sortedRows = table.getSortedRowModel().rows;
          const sortedIndex = sortedRows.findIndex(r => r.id === row.id);
          return sortedIndex + 1;
        }
        
        // Get the raw data value
        const rowData = row.original as any;
        const rawValue = column.accessorFn ? column.accessorFn(rowData, row.index) : rowData[column.id];
        
        // Convert different data types to readable text for Excel
        if (rawValue === null || rawValue === undefined) {
          return '';
        } else if (typeof rawValue === 'boolean') {
          return rawValue ? 'Yes' : 'No';
        } else if (typeof rawValue === 'object' && rawValue !== null) {
          // Handle objects (like multilingual text)
          if (rawValue.en || rawValue.mm) {
            return rawValue.en || rawValue.mm || '';
          }
          return JSON.stringify(rawValue);
        } else {
          return String(rawValue);
        }
      });
    });

    // Create worksheet
    const wsData = [headers, ...data];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-size columns
    const colWidths = headers.map((header, idx) => {
      const headerWidth = header.length;
      const maxDataWidth = Math.max(...data.map(row => String(row[idx] || '').length));
      return { wch: Math.min(Math.max(headerWidth, maxDataWidth, 10), 50) };
    });
    worksheet['!cols'] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Generate filename with module name, date, and time
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
    const filename = `${selectedTitle.replace(/\s+/g, '_').toLowerCase()}_${dateStr}_${timeStr}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);
  }, [table, selectedTitle]);

  return (
    <div className="w-full">
      <div className="flex items-center pt-4">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        )}
        <div className="flex items-center gap-2 ml-auto">
          {/* Select Title Button */}
          <Dialog open={isTitleModalOpen} onOpenChange={setIsTitleModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="default"
                size="sm"
                title="Select Title"
                className="bg-info hover:bg-info transition-all duration-200"
              >
                <FileText className="h-4 w-4 mr-2" />
                Select Title
              </Button>
            </DialogTrigger>
            <DialogContent className="!max-w-[280px] sm:!max-w-[280px]">
              <DialogHeader>
                <DialogTitle>Manage Titles</DialogTitle>
                <DialogDescription>
                  Select or add titles for print and export.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3 py-3">
                {/* Current Title Display */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Title:</label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {selectedTitle}
                  </div>
                </div>

                {/* Saved Titles */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Saved Titles:</label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {savedTitles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No saved titles yet</p>
                    ) : (
                      savedTitles.map((title, index) => (
                        <div key={index} className="flex items-center justify-between p-1.5 border rounded-md">
                          <button
                            onClick={() => {
                              setSelectedTitle(title);
                              setIsTitleModalOpen(false);
                            }}
                            className="flex-1 text-left text-sm hover:bg-muted px-1.5 py-1 rounded"
                          >
                            {title}
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTitle(title)}
                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add New Title */}
                <Form {...titleForm}>
                  <form onSubmit={titleForm.handleSubmit(addTitle)} className="space-y-2">
                    <FormField
                      control={titleForm.control}
                      name="newTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Add New Title:</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="Enter new title..."
                                {...field}
                                className="flex-1"
                              />
                            </FormControl>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={!titleForm.watch('newTitle')?.trim()}
                              className="shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsTitleModalOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Print Button */}
          <Button 
            variant="default"
            size="sm"
            onClick={handlePrint}
            title="Print Table"
            className="bg-success hover:bg-success transition-all duration-200"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>

          {/* Excel Export Button */}
          <Button 
            variant="default"
            size="sm"
            onClick={handleExportToExcel}
            title="Export to Excel"
            className="bg-success-dark hover:bg-success transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          
          {/* Column Visibility Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="default"
                size="sm"
                title="Show/Hide Columns"
                className="bg-secondary-dark hover:bg-secondary transition-all duration-200"
              >
                <Columns3 className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter Modal Button */}
          {showFilters && (
            <TableFilterModal
              table={table}
              filterConfigs={filterConfigs}
            />
          )}

          {/* Add New Button */}
          {moduleId && (
            <Link href={`/${moduleId}/new`}>
              <Button 
                variant="default"
                size="sm"
                title="Add New Record"
                className="bg-success hover:bg-success transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </Link>
          )}
        </div>
      </div>
      {/* Table Title - Only visible in print view */}
      {selectedTitle && (
        <div className="w-full mb-2 hidden print:block">
          <h3 className="text-lg font-semibold text-foreground print:text-black">{selectedTitle}</h3>
        </div>
      )}
      <div className="rounded-md border border-gray-200 overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center gap-2",
                              header.column.getCanSort() && "cursor-pointer select-none"
                            )}
                            onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <span className="ml-1">
                                {header.column.getIsSorted() === "desc" ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : header.column.getIsSorted() === "asc" ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {enablePagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <select
                className="h-8 w-[70px] rounded border border-input bg-background px-2 py-1 text-sm"
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                ⟪
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                ⟨
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                ⟩
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                ⟫
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}