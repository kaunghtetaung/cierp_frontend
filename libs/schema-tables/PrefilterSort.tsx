"use client";

import React, { useState } from "react";
import { IconComponent } from "@repo/ui";
import { cn } from "@repo/utils";
import { getLocalizedText } from "@repo/utils";
import type { MultilingualText } from "@repo/types";

interface SortOption {
  field: string;
  label: MultilingualText;
}

interface PrefilterSortProps {
  sortOptions: SortOption[];
  currentSort?: string;
  currentOrder?: "asc" | "desc";
  onChange: (field: string, order: "asc" | "desc") => void;
  currentLanguage: string;
}

export function PrefilterSort({
  sortOptions,
  currentSort = "",
  currentOrder = "asc",
  onChange,
  currentLanguage,
}: PrefilterSortProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Find current sort label
  const currentSortOption = sortOptions.find(opt => opt.field === currentSort);
  const currentLabel = currentSortOption 
    ? getLocalizedText(currentSortOption.label, currentLanguage)
    : currentLanguage === "mm" ? "စီစဉ်ရန် ရွေးချယ်ပါ" : "Select sort";

  const handleSortSelect = (field: string) => {
    if (field === currentSort) {
      // Toggle order if same field
      onChange(field, currentOrder === "asc" ? "desc" : "asc");
    } else {
      // Default to ascending for new field
      onChange(field, "asc");
    }
    setIsOpen(false);
  };

  const toggleOrder = () => {
    if (currentSort) {
      onChange(currentSort, currentOrder === "asc" ? "desc" : "asc");
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
        {currentLanguage === "mm" ? "စီစဉ်မှု" : "Sort By"}
      </label>
      
      <div className="flex gap-1">
        {/* Sort field selector */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-full flex items-center justify-between",
              "px-4 py-2 text-sm border rounded-md",
              "bg-background hover:bg-accent/50",
              "transition-colors duration-200",
              currentSort ? "border-primary/50" : "border-input"
            )}
          >
            <span className={cn(
              "truncate",
              currentSort ? "text-foreground" : "text-muted-foreground"
            )}>
              {currentLabel}
            </span>
            <IconComponent
              name="ChevronDown"
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg">
                {sortOptions.map((option) => (
                  <button
                    key={option.field}
                    type="button"
                    onClick={() => handleSortSelect(option.field)}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm",
                      "hover:bg-accent transition-colors",
                      "flex items-center justify-between",
                      currentSort === option.field && "bg-accent"
                    )}
                  >
                    <span>{getLocalizedText(option.label, currentLanguage)}</span>
                    {currentSort === option.field && (
                      <IconComponent 
                        name={currentOrder === "asc" ? "ArrowUp" : "ArrowDown"} 
                        className="h-3 w-3 text-primary"
                      />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Order toggle button */}
        {currentSort && (
          <button
            type="button"
            onClick={toggleOrder}
            className={cn(
              "px-4 py-2 border rounded-md",
              "bg-background hover:bg-accent/50",
              "transition-colors duration-200",
              "flex items-center gap-1",
              "border-primary/50"
            )}
            title={currentOrder === "asc" 
              ? (currentLanguage === "mm" ? "အနိမ့်မှအမြင့်" : "Ascending") 
              : (currentLanguage === "mm" ? "အမြင့်မှအနိမ့်" : "Descending")}
          >
            <IconComponent
              name={currentOrder === "asc" ? "ArrowUpAZ" : "ArrowDownZA"}
              className="h-4 w-4 text-primary"
            />
          </button>
        )}
      </div>
    </div>
  );
}