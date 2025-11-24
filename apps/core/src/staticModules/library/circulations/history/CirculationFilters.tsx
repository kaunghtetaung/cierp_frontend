"use client";

import { useState } from "react";
import { Button, Input, Label } from "@repo/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { Calendar } from "@repo/ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@repo/ui/lib/utils";
import type { CirculationStatus } from "../types/circulation.types";

export interface CirculationFilterValues {
  status?: CirculationStatus | 'all';
  borrowerSearch?: string;
  accessionNo?: string;
  startDate?: Date;
  endDate?: Date;
  overdue?: boolean;
}

interface CirculationFiltersProps {
  onFilterChange: (filters: CirculationFilterValues) => void;
  onClose?: () => void;
  initialFilters?: CirculationFilterValues;
}

export function CirculationFilters({
  onFilterChange,
  onClose,
  initialFilters = {},
}: CirculationFiltersProps) {
  const [filters, setFilters] = useState<CirculationFilterValues>(initialFilters);

  const handleApplyFilters = () => {
    onFilterChange(filters);
    onClose?.();
  };

  const handleClearFilters = () => {
    const emptyFilters: CirculationFilterValues = {
      status: 'all',
      borrowerSearch: '',
      accessionNo: '',
      startDate: undefined,
      endDate: undefined,
      overdue: undefined,
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFilterCount = Object.values(filters).filter(v =>
    v !== undefined && v !== '' && v !== 'all'
  ).length;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Advanced Filters</h3>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            setFilters({ ...filters, status: value as CirculationStatus | 'all' })
          }
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="checked_out">Active</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="checked_in">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Accession Number Search */}
      <div className="space-y-2">
        <Label htmlFor="accessionNo">Accession Number</Label>
        <Input
          id="accessionNo"
          placeholder="Search by accession number..."
          value={filters.accessionNo || ''}
          onChange={(e) =>
            setFilters({ ...filters, accessionNo: e.target.value })
          }
        />
      </div>

      {/* Borrower Search */}
      <div className="space-y-2">
        <Label htmlFor="borrowerSearch">Borrower</Label>
        <Input
          id="borrowerSearch"
          placeholder="Search by name or card number..."
          value={filters.borrowerSearch || ''}
          onChange={(e) =>
            setFilters({ ...filters, borrowerSearch: e.target.value })
          }
        />
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? (
                  format(filters.startDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(date) =>
                  setFilters({ ...filters, startDate: date })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? (
                  format(filters.endDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(date) =>
                  setFilters({ ...filters, endDate: date })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Overdue Only Checkbox */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="overdueOnly"
          checked={filters.overdue || false}
          onChange={(e) =>
            setFilters({ ...filters, overdue: e.target.checked })
          }
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="overdueOnly" className="font-normal cursor-pointer">
          Show only overdue books
        </Label>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleClearFilters}
          disabled={activeFilterCount === 0}
        >
          Clear All
          {activeFilterCount > 0 && (
            <span className="ml-2 rounded-full bg-destructive/20 px-2 py-0.5 text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Button onClick={handleApplyFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
