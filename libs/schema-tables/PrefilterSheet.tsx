"use client";

import React, { useState } from "react";
import { getLocalizedText } from "@repo/utils";
import { cn } from "@repo/utils";
import { IconComponent } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@repo/ui/components/sheet";
import { PrefilterText } from "./PrefilterText";
import { PrefilterSelect } from "./PrefilterSelect";
import { PrefilterDependentSelect } from "./PrefilterDependentSelect";
import { PrefilterTypeahead } from "./PrefilterTypeahead";
import { PrefilterYearRange } from "./PrefilterYearRange";
import type { PrefilterFieldGroup, PrefilterField } from "@repo/types";
import type { MultilingualText } from "@repo/types";

// Sort option interface
interface SortOption {
  field: string;
  label: MultilingualText;
}

interface PrefilterSheetProps {
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
  // Sheet open state (controlled from parent)
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Disabled tabs (for dashboard mode)
  disabledTabs?: string[];
}

export function PrefilterSheet({
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
  isOpen,
  onOpenChange,
  disabledTabs = [],
}: PrefilterSheetProps) {
  // Active tab state
  const [activeTab, setActiveTab] = useState(fieldGroups[0]?.groupKey || "");

  // Calculate filter counts per group
  const filterCountPerGroup: Record<string, number> = {};
  fieldGroups.forEach((group) => {
    let count = 0;
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
    filterCountPerGroup[group.groupKey] = count;
  });

  // Total active filters
  const totalActiveFilters = Object.values(filterCountPerGroup).reduce((sum, count) => sum + count, 0);

  // Render prefilter field based on type
  const renderPrefilterField = (field: PrefilterField) => {
    const value = prefilterValues[field.fieldName];
    const operatorValue = prefilterValues[`${field.fieldName}_operator`];
    const operator = typeof operatorValue === "string" ? operatorValue : undefined;

    switch (field.type) {
      case "text":
        return (
          <PrefilterText
            field={field}
            value={typeof value === "string" ? value : undefined}
            operator={operator || "$regex"}
            onChange={(val, op) => onPrefilterChange(field.fieldName, val, op)}
            currentLanguage={currentLanguage}
          />
        );

      case "select":
      case "dynamicSelect":
        return (
          <PrefilterSelect
            field={field}
            value={typeof value === "string" ? value : undefined}
            onChange={(val) => onPrefilterChange(field.fieldName, val)}
            currentLanguage={currentLanguage}
            moduleSlug={moduleSlug}
          />
        );

      case "dependentSelect":
        return (
          <PrefilterDependentSelect
            field={field}
            value={typeof value === "string" ? value : undefined}
            onChange={(val) => onPrefilterChange(field.fieldName, val)}
            currentLanguage={currentLanguage}
            moduleSlug={moduleSlug}
            prefilterValues={prefilterValues}
          />
        );

      case "typeaheadDynamicSelect":
        return (
          <PrefilterTypeahead
            field={field}
            value={value}
            onChange={(val) => onPrefilterChange(field.fieldName, val)}
            currentLanguage={currentLanguage}
            moduleSlug={moduleSlug}
          />
        );

      case "yearRange":
        return (
          <PrefilterYearRange
            field={field}
            value={typeof value === "object" || typeof value === "string" ? value : undefined}
            operator={operator || "$eq"}
            onChange={(val, op) => onPrefilterChange(field.fieldName, val, op)}
            currentLanguage={currentLanguage}
          />
        );

      default:
        return null;
    }
  };

  // Get current active group
  const activeGroup = fieldGroups.find((g) => g.groupKey === activeTab);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!w-full sm:!max-w-none md:!w-1/2 xl:!w-1/2 p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-muted/10 via-transparent to-muted/10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold flex items-center gap-2">
              <IconComponent name="Filter" className="h-5 w-5 text-primary" />
              {currentLanguage === "mm" ? "စစ်ထုတ်မှုများ" : "Filters"}
              {totalActiveFilters > 0 && (
                <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground font-bold">
                  {totalActiveFilters}
                </Badge>
              )}
            </SheetTitle>
            {totalActiveFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-9 px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 rounded-lg font-medium"
              >
                <IconComponent name="X" className="h-4 w-4 mr-2" />
                {currentLanguage === "mm" ? "အားလုံးရှင်း" : "Clear All"}
                <Badge
                  variant="secondary"
                  className="ml-2 text-xs px-2 py-0.5 bg-destructive/20 text-destructive border-0 font-bold"
                >
                  {totalActiveFilters}
                </Badge>
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Body with Vertical Tabs */}
        <div className="flex flex-1 overflow-hidden">
          {/* Vertical Tab Sidebar */}
          <div className="w-48 border-r border-border/60 bg-gradient-to-b from-muted/20 via-muted/10 to-muted/20 overflow-y-auto">
            <div className="p-2 space-y-1">
              {fieldGroups.map((group) => {
                const isActive = activeTab === group.groupKey;
                const filterCount = filterCountPerGroup[group.groupKey] || 0;
                const isDisabled = disabledTabs.includes(group.groupKey);

                return (
                  <button
                    key={group.groupKey}
                    type="button"
                    onClick={() => !isDisabled && setActiveTab(group.groupKey)}
                    disabled={isDisabled}
                    className={cn(
                      "relative w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ease-in-out",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60 hover:shadow-sm",
                      isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground hover:shadow-none scale-100"
                    )}
                  >
                    <span className={cn("relative z-10 truncate", isActive && "text-primary-foreground")}>
                      {getLocalizedText(group.groupLabel, currentLanguage)}
                    </span>
                    {filterCount > 0 && (
                      <Badge
                        variant={isActive ? "secondary" : "outline"}
                        className={cn(
                          "ml-0.5 px-2 py-0.5 text-xs font-bold h-5 min-w-5 flex items-center justify-center transition-all duration-200",
                          isActive
                            ? "bg-red-500 text-white shadow-sm"
                            : "bg-muted text-muted-foreground border-border/50"
                        )}
                      >
                        {filterCount}
                      </Badge>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/10 to-primary/0 rounded-lg animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {activeGroup && activeGroup.groupKey === "control" ? (
              /* Control Tab Content */
              <div className="p-6 bg-gradient-to-b from-muted/5 to-transparent">
                <div className="space-y-6">
                  {/* Sort By */}
                  {sortOptions.length > 0 && onSortChange && (
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        <IconComponent name="ArrowUpDown" className="h-4 w-4 text-primary" />
                        {currentLanguage === "mm" ? "အစီအစဉ်" : "Sort By"}
                      </label>
                      <select
                        value={currentSort}
                        onChange={(e) => onSortChange(e.target.value, currentOrder)}
                        className="w-full h-10 px-4 py-2 text-sm font-medium border-2 border-border/60 bg-background/80 backdrop-blur-sm rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:border-border shadow-sm"
                      >
                        <option value="">
                          {currentLanguage === "mm" ? "ရွေးချယ်ပါ..." : "Select field..."}
                        </option>
                        {sortOptions.map((option) => (
                          <option key={option.field} value={option.field}>
                            {getLocalizedText(option.label, currentLanguage)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Order (ASC/DESC) */}
                  {sortOptions.length > 0 && onSortChange && (
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        <IconComponent name="ArrowDownUp" className="h-4 w-4 text-primary" />
                        {currentLanguage === "mm" ? "အစီအစဉ်" : "Order"}
                      </label>
                      <select
                        value={currentOrder}
                        onChange={(e) => currentSort && onSortChange(currentSort, e.target.value as "asc" | "desc")}
                        disabled={!currentSort}
                        className="w-full h-10 px-4 py-2 text-sm font-medium border-2 border-border/60 bg-background/80 backdrop-blur-sm rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:border-border shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border/60"
                      >
                        <option value="asc">
                          ↑ {currentLanguage === "mm" ? "အတက်" : "Ascending"}
                        </option>
                        <option value="desc">
                          ↓ {currentLanguage === "mm" ? "အဆင်း" : "Descending"}
                        </option>
                      </select>
                    </div>
                  )}

                  {/* Records Per Page */}
                  {onPageSizeChange && (
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        <IconComponent name="ListFilter" className="h-4 w-4 text-primary" />
                        {currentLanguage === "mm" ? "တစ်စာမျက်နှာလျှင် မှတ်တမ်းများ" : "Records Per Page"}
                      </label>
                      <select
                        value={currentPageSize}
                        onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                        className="w-full h-10 px-4 py-2 text-sm font-medium border-2 border-border/60 bg-background/80 backdrop-blur-sm rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:border-border shadow-sm"
                      >
                        <option value="10">10 {currentLanguage === "mm" ? "မှတ်တမ်း" : "records"}</option>
                        <option value="25">25 {currentLanguage === "mm" ? "မှတ်တမ်း" : "records"}</option>
                        <option value="50">50 {currentLanguage === "mm" ? "မှတ်တမ်း" : "records"}</option>
                        <option value="100">100 {currentLanguage === "mm" ? "မှတ်တမ်း" : "records"}</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ) : activeGroup ? (
              /* Regular Filter Tab Content */
              <div className="p-6 bg-gradient-to-b from-muted/5 to-transparent">
                <div className="grid grid-cols-1 gap-6">
                  {activeGroup.fields.map((field) => (
                    <div key={field.fieldName} className="min-w-0">
                      {renderPrefilterField(field)}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/60 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 ml-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10">
                <IconComponent
                  name="Database"
                  className="h-4 w-4 text-primary"
                />
              </div>
              <span className="text-sm font-semibold text-foreground/80">
                {currentLanguage === "mm" ? "စုစုပေါင်း:" : "Total:"}
              </span>
              <Badge
                variant="outline"
                className="text-sm font-bold px-3 py-1 bg-background/80 border-primary/30 text-primary shadow-sm"
              >
                {totalItems.toLocaleString()}
              </Badge>
            </div>

            {/* Active filters summary */}
            {totalActiveFilters > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20 mr-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/15">
                  <IconComponent name="Filter" className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground/80">
                  {totalActiveFilters}{" "}
                  {currentLanguage === "mm"
                    ? "စစ်ထုတ်မှုများ အသုံးပြုထား"
                    : `filter${totalActiveFilters > 1 ? "s" : ""} active`}
                </span>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
