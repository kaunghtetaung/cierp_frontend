"use client";

import React, { useState } from "react";
import { IconComponent } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/utils";
import { PrefilterSheet } from "./PrefilterSheet";
import type { PrefilterFieldGroup } from "@repo/types";
import type { MultilingualText } from "@repo/types";

// Sort option interface
interface SortOption {
  field: string;
  label: MultilingualText;
}

interface PrefilterSheetTriggerProps {
  fieldGroups: PrefilterFieldGroup[];
  prefilterValues: Record<string, string | string[] | { from: string; to: string } | undefined>;
  onPrefilterChange: (fieldName: string, value: any, operator?: string) => void;
  onClearAll: () => void;
  currentLanguage: string;
  moduleSlug: string;
  // Sort and pagination
  sortOptions?: SortOption[];
  currentSort?: string;
  currentOrder?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  currentPageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  // Total items for display
  totalItems?: number;
  // Disabled tabs (for dashboard mode)
  disabledTabs?: string[];
  // Custom trigger button (optional)
  triggerButton?: React.ReactNode;
}

export function PrefilterSheetTrigger({
  fieldGroups,
  prefilterValues,
  onPrefilterChange,
  onClearAll,
  currentLanguage,
  moduleSlug,
  sortOptions = [],
  currentSort = "",
  currentOrder = "asc",
  onSortChange,
  currentPageSize = 10,
  onPageSizeChange,
  totalItems = 0,
  disabledTabs = [],
  triggerButton,
}: PrefilterSheetTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate total active filters
  const totalActiveFilters = React.useMemo(() => {
    let count = 0;
    fieldGroups.forEach((group) => {
      group.fields.forEach((field) => {
        const value = prefilterValues[field.fieldName];
        if (value !== undefined && value !== "" && value !== null) {
          if (Array.isArray(value)) {
            if (value.length > 0) count++;
          } else if (typeof value === "object") {
            if (value.from || value.to) count++;
          } else {
            count++;
          }
        }
      });
    });
    return count;
  }, [fieldGroups, prefilterValues]);

  return (
    <>
      {/* Trigger Button */}
      {triggerButton ? (
        <div onClick={() => setIsOpen(true)}>{triggerButton}</div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className={cn(
            "h-10 px-4 gap-2 transition-all duration-200",
            totalActiveFilters > 0 && "border-primary/50 bg-primary/5 hover:bg-primary/10"
          )}
        >
          <IconComponent name="Filter" className="h-4 w-4" />
          <span className="font-medium">
            {currentLanguage === "mm" ? "စစ်ထုတ်မှုများ" : "Filters"}
          </span>
          {totalActiveFilters > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-2 bg-primary text-primary-foreground font-bold">
              {totalActiveFilters}
            </Badge>
          )}
        </Button>
      )}

      {/* Filter Sheet */}
      <PrefilterSheet
        fieldGroups={fieldGroups}
        prefilterValues={prefilterValues}
        onPrefilterChange={onPrefilterChange}
        onClearAll={onClearAll}
        currentLanguage={currentLanguage}
        moduleSlug={moduleSlug}
        sortOptions={sortOptions}
        currentSort={currentSort}
        currentOrder={currentOrder}
        onSortChange={onSortChange}
        currentPageSize={currentPageSize}
        onPageSizeChange={onPageSizeChange}
        totalItems={totalItems}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        disabledTabs={disabledTabs}
      />
    </>
  );
}
