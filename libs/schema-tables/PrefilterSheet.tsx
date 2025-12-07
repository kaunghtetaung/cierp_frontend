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
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold flex items-center gap-2">
              <IconComponent name="Filter" className="h-5 w-5 text-primary" />
              {currentLanguage === "mm" ? "စစ်ထုတ်မှုများ" : "Filters"}
              {totalActiveFilters > 0 && (
                <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground">
                  {totalActiveFilters}
                </Badge>
              )}
            </SheetTitle>
            {totalActiveFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-8 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <IconComponent name="X" className="h-4 w-4 mr-1" />
                {currentLanguage === "mm" ? "အားလုံးရှင်း" : "Clear All"}
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Body with Vertical Tabs */}
        <div className="flex flex-1 overflow-hidden">
          {/* Vertical Tab Sidebar */}
          <div className="w-48 border-r bg-muted/30 overflow-y-auto">
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
                      "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    <span className="truncate">
                      {getLocalizedText(group.groupLabel, currentLanguage)}
                    </span>
                    {filterCount > 0 && (
                      <Badge
                        variant={isActive ? "secondary" : "outline"}
                        className={cn(
                          "ml-2 h-5 min-w-5 px-1.5 text-xs font-bold flex items-center justify-center",
                          isActive
                            ? "bg-red-500 text-white border-0"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {filterCount}
                      </Badge>
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
              <div className="p-6">
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
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="px-6 py-3 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <IconComponent name="Database" className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground/80">
                {currentLanguage === "mm" ? "စုစုပေါင်း:" : "Total:"}
              </span>
              <Badge variant="outline" className="text-sm font-bold px-3 py-1 bg-background/80 border-primary/30 text-primary">
                {totalItems.toLocaleString()}
              </Badge>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
