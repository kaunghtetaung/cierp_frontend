"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Filter, X, RotateCcw } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./dialog";
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";
import { Badge } from "./badge";
import { TableFilter, FilterConfig } from "./table-filters";

interface TableFilterModalProps<TData> {
  table: Table<TData>;
  filterConfigs?: Record<string, FilterConfig>;
}

export function TableFilterModal<TData>({ 
  table, 
  filterConfigs = {} 
}: TableFilterModalProps<TData>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showAllFilters, setShowAllFilters] = React.useState(false);
  
  const MAX_VISIBLE_FILTERS = 5;

  // Get all filterable columns
  const filterableColumns = React.useMemo(() => {
    return table.getAllColumns()
      .filter(column => 
        column.getCanFilter() && 
        column.id !== 'select' && 
        column.id !== 'actions' &&
        column.id !== 'sr' // Exclude serial number column
      );
  }, [table]);

  // Count active filters
  const activeFilterCount = React.useMemo(() => {
    return table.getState().columnFilters.length;
  }, [table]);

  // Clear all filters
  const handleClearAllFilters = React.useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  // Get column header text
  const getColumnHeader = React.useCallback((column: any) => {
    if (typeof column.columnDef.header === 'string') {
      return column.columnDef.header;
    }
    if (typeof column.columnDef.header === 'function') {
      try {
        const headerResult = column.columnDef.header({ column, header: column, table } as any);
        return typeof headerResult === 'string' ? headerResult : 
               ((headerResult as any)?.props?.children || column.id);
      } catch (e) {
        return column.id;
      }
    }
    return column.id;
  }, [table]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default"
          size="sm"
          title="Filter Table"
          className="relative bg-warning hover:bg-warning transition-all duration-200"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent 
        className="!w-[320px] !max-w-[320px] p-6" 
        style={{ width: '320px !important', maxWidth: '320px !important' }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base">Table Filters</DialogTitle>
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="h-8 px-2 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="px-2">
          <div className="space-y-4 py-2">
            {filterableColumns.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No filterable columns available
              </div>
            ) : (
              filterableColumns
                .slice(0, showAllFilters ? undefined : MAX_VISIBLE_FILTERS)
                .map((column) => {
                const columnHeader = getColumnHeader(column);
                const hasActiveFilter = !!column.getFilterValue();

                return (
                  <div key={column.id} className="w-full">
                    <div className="px-4">
                      <div className="relative">
                        <TableFilter
                          column={column}
                          filterConfig={filterConfigs[column.id]}
                          placeholder={columnHeader}
                        />
                        {hasActiveFilter && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => column.setFilterValue(undefined)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 z-10"
                            title={`Clear ${columnHeader} filter`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Show more/less button */}
            {filterableColumns.length > MAX_VISIBLE_FILTERS && (
              <div className="text-center pt-4 px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllFilters(!showAllFilters)}
                  className="text-xs h-8 w-full"
                >
                  {showAllFilters 
                    ? `Show less (${filterableColumns.length - MAX_VISIBLE_FILTERS} hidden)`
                    : `Show ${filterableColumns.length - MAX_VISIBLE_FILTERS} more filters`
                  }
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} of {table.getCoreRowModel().rows.length} rows shown
          </div>
          
          <div className="flex gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
              >
                Clear All Filters
              </Button>
            )}
            <Button 
              variant="default"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}