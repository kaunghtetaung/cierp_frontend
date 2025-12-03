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
import type { ReservationStatus } from "../types/reservation.types";

export interface ReservationFilterValues {
  status?: ReservationStatus | "all";
  searchQuery?: string;
  libraryCardNumber?: string;
  bookTitle?: string;
  startDate?: Date;
  endDate?: Date;
  expiringOnly?: boolean;
}

interface ReservationFiltersProps {
  onFilterChange: (filters: ReservationFilterValues) => void;
  onClose?: () => void;
  initialFilters?: ReservationFilterValues;
}

export function ReservationFilters({
  onFilterChange,
  onClose,
  initialFilters = {},
}: ReservationFiltersProps) {
  const [filters, setFilters] = useState<ReservationFilterValues>(initialFilters);

  const handleApplyFilters = () => {
    onFilterChange(filters);
    onClose?.();
  };

  const handleClearFilters = () => {
    const emptyFilters: ReservationFilterValues = {
      status: "all",
      searchQuery: "",
      libraryCardNumber: "",
      bookTitle: "",
      startDate: undefined,
      endDate: undefined,
      expiringOnly: undefined,
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== "" && v !== "all"
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
          value={filters.status || "all"}
          onValueChange={(value) =>
            setFilters({ ...filters, status: value as ReservationStatus | "all" })
          }
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="ready">Ready for Pickup</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Library Card Number Search */}
      <div className="space-y-2">
        <Label htmlFor="libraryCardNumber">Library Card Number</Label>
        <Input
          id="libraryCardNumber"
          placeholder="Enter library card number..."
          value={filters.libraryCardNumber || ""}
          onChange={(e) =>
            setFilters({ ...filters, libraryCardNumber: e.target.value })
          }
        />
      </div>

      {/* Book Title Search */}
      <div className="space-y-2">
        <Label htmlFor="bookTitle">Book Title</Label>
        <Input
          id="bookTitle"
          placeholder="Search by book title..."
          value={filters.bookTitle || ""}
          onChange={(e) =>
            setFilters({ ...filters, bookTitle: e.target.value })
          }
        />
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Reserved From</Label>
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
          <Label>Reserved To</Label>
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

      {/* Expiring Only Checkbox */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="expiringOnly"
          checked={filters.expiringOnly || false}
          onChange={(e) =>
            setFilters({ ...filters, expiringOnly: e.target.checked })
          }
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="expiringOnly" className="font-normal cursor-pointer">
          Show only expiring reservations (pickup deadline within 2 days)
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
        <Button onClick={handleApplyFilters}>Apply Filters</Button>
      </div>
    </div>
  );
}
