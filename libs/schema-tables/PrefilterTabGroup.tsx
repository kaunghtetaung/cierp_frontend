"use client";

import React, { useState, useMemo } from "react";
import { getLocalizedText } from "@repo/utils";
import { cn } from "@repo/utils";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { IconComponent } from "@repo/ui";
import { PrefilterText } from "./PrefilterText";
import { PrefilterSelect } from "./PrefilterSelect";
import { PrefilterDependentSelect } from "./PrefilterDependentSelect";
import { PrefilterTypeahead } from "./PrefilterTypeahead";
import { PrefilterYearRange } from "./PrefilterYearRange";
import { PrefilterSort } from "./PrefilterSort";
import type { PrefilterFieldGroup, PrefilterField } from "@repo/types";
import type { MultilingualText } from "@repo/types";

// Sort option interface matching PrefilterSort expectations
interface SortOption {
  field: string;
  label: MultilingualText;
}

interface PrefilterTabGroupProps {
  fieldGroups: PrefilterFieldGroup[];
  prefilterValues: Record<string, string | string[] | { from: string; to: string } | undefined>;
  onPrefilterChange: (fieldName: string, value: any, operator?: string) => void;
  onClearAll: () => void;
  currentLanguage: string;
  moduleSlug: string;
  // Sort props
  sortOptions?: SortOption[];
  currentSort?: string;
  currentOrder?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  // Total items for display
  totalItems?: number;
  // Active tab state (controlled from parent)
  activeTab?: string;
  onActiveTabChange?: (tabKey: string) => void;
  // Disabled tabs (for dashboard mode)
  disabledTabs?: string[];
  // Current view (dashboard or data)
  currentView?: 'dashboard' | 'data';
  // Pagination props
  currentPageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
}

export function PrefilterTabGroup({
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
  totalItems = 0,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  disabledTabs = [],
  currentView = 'data',
  currentPageSize = 10,
  onPageSizeChange,
}: PrefilterTabGroupProps) {
  // Use controlled state if provided, otherwise fall back to internal state
  const [internalActiveTab, setInternalActiveTab] = useState(fieldGroups[0]?.groupKey || "");

  // Determine which tab is active (controlled or internal)
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  // Handle tab change - notify parent if controlled, otherwise update internal state
  const handleTabChange = (tabKey: string) => {
    if (onActiveTabChange) {
      onActiveTabChange(tabKey);
    } else {
      setInternalActiveTab(tabKey);
    }
  };

  // Count active filters per group
  const filterCountPerGroup = useMemo(() => {
    const counts: Record<string, number> = {};

    fieldGroups.forEach((group) => {
      let count = 0;
      group.fields.forEach((field) => {
        const value = prefilterValues[field.fieldName];
        if (value !== undefined && value !== "" && value !== null) {
          // Check for empty arrays or objects
          if (Array.isArray(value) && value.length === 0) return;
          if (typeof value === "object" && !Array.isArray(value)) {
            const objValue = value as { from?: string; to?: string };
            if (!objValue.from && !objValue.to) return;
          }
          count++;
        }
      });
      counts[group.groupKey] = count;
    });

    return counts;
  }, [fieldGroups, prefilterValues]);

  // Total active filters count
  const totalActiveFilters = useMemo(() => {
    return Object.values(filterCountPerGroup).reduce((sum, count) => sum + count, 0);
  }, [filterCountPerGroup]);

  // Render a single prefilter field
  // Note: Child components have their own local interfaces that are subsets of PrefilterField
  // We use type assertion to bridge the centralized type with local component types
  const renderPrefilterField = (field: PrefilterField) => {
    const fieldKey = field.fieldName;

    if (field.type === "text") {
      return (
        <PrefilterText
          key={fieldKey}
          field={field as any}
          value={prefilterValues[field.fieldName] as string | undefined}
          operator={
            (prefilterValues[`${field.fieldName}_operator`] as string) ||
            field.searchOptions?.defaultOperator ||
            "$regex"
          }
          onChange={(value, operator) =>
            onPrefilterChange(field.fieldName, value, operator)
          }
          currentLanguage={currentLanguage}
        />
      );
    } else if (field.type === "yearRange") {
      return (
        <PrefilterYearRange
          key={fieldKey}
          field={field as any}
          value={
            prefilterValues[field.fieldName] as
              | string
              | { from: string; to: string }
              | undefined
          }
          operator={
            (prefilterValues[`${field.fieldName}_operator`] as string) ||
            field.yearRangeOptions?.defaultOperator ||
            "$eq"
          }
          onChange={(value, operator) =>
            onPrefilterChange(field.fieldName, value, operator)
          }
          currentLanguage={currentLanguage}
        />
      );
    } else if (field.type === "typeaheadDynamicSelect") {
      return (
        <PrefilterTypeahead
          key={fieldKey}
          field={field as any}
          value={prefilterValues[field.fieldName] as string | string[] | undefined}
          onChange={(value) => onPrefilterChange(field.fieldName, value)}
          currentLanguage={currentLanguage}
          moduleSlug={moduleSlug}
        />
      );
    } else if (field.type === "dependentSelect") {
      // Dependent select needs access to all prefilter values to watch the parent field
      return (
        <PrefilterDependentSelect
          key={fieldKey}
          field={field as any}
          value={prefilterValues[field.fieldName] as string | undefined}
          onChange={(value) => onPrefilterChange(field.fieldName, value)}
          currentLanguage={currentLanguage}
          moduleSlug={moduleSlug}
          prefilterValues={prefilterValues}
        />
      );
    } else {
      // select, dynamicSelect
      return (
        <PrefilterSelect
          key={fieldKey}
          field={field as any}
          value={prefilterValues[field.fieldName] as string | undefined}
          onChange={(value) => onPrefilterChange(field.fieldName, value)}
          currentLanguage={currentLanguage}
          moduleSlug={moduleSlug}
        />
      );
    }
  };

  // Get current active group
  const activeGroup = fieldGroups.find((g) => g.groupKey === activeTab);

  return (
    <div className="space-y-3">
      {/* Tab Header with Sort and Clear */}
      <div className="bg-muted/30 border border-border/50 rounded-lg">
        {/* Tabs Row */}
        <div className="flex items-center justify-between border-b border-border/50 px-2">
          {/* Tab Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {fieldGroups.map((group) => {
              const isActive = activeTab === group.groupKey;
              const filterCount = filterCountPerGroup[group.groupKey] || 0;
              const isDisabled = disabledTabs.includes(group.groupKey);

              return (
                <button
                  key={group.groupKey}
                  type="button"
                  onClick={() => !isDisabled && handleTabChange(group.groupKey)}
                  disabled={isDisabled}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                    isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                  )}
                >
                  {getLocalizedText(group.groupLabel, currentLanguage)}
                  {filterCount > 0 && (
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className={cn(
                        "ml-1 px-1.5 py-0 text-xs font-bold h-5 min-w-5 flex items-center justify-center",
                        isActive && "bg-primary-foreground/20 text-primary-foreground"
                      )}
                    >
                      {filterCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side: Sort + Clear */}
          <div className="flex items-center gap-2 py-1 pl-2 shrink-0">
            {/* Sort Controls */}
            {sortOptions.length > 0 && onSortChange && (
              <div className="min-w-[200px]">
                <PrefilterSort
                  sortOptions={sortOptions}
                  currentSort={currentSort}
                  currentOrder={currentOrder}
                  onChange={onSortChange}
                  currentLanguage={currentLanguage}
                />
              </div>
            )}

            {/* Divider */}
            {totalActiveFilters > 0 && sortOptions.length > 0 && (
              <div className="w-px h-6 bg-border" />
            )}

            {/* Clear All Button */}
            {totalActiveFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-8 px-3 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <IconComponent name="X" className="h-4 w-4 mr-1.5" />
                {currentLanguage === "mm" ? "အားလုံးရှင်း" : "Clear All"}
                <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                  {totalActiveFilters}
                </Badge>
              </Button>
            )}
          </div>
        </div>

        {/* Active Tab Content */}
        {activeGroup && activeGroup.groupKey === 'control' ? (
          /* Control Tab Content */
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sort By */}
              {sortOptions.length > 0 && onSortChange && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {currentLanguage === "mm" ? "အစီအစဉ်" : "Sort By"}
                  </label>
                  <select
                    value={currentSort}
                    onChange={(e) => onSortChange(e.target.value, currentOrder)}
                    aria-label={currentLanguage === "mm" ? "အစီအစဉ်" : "Sort By"}
                    className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">
                      {currentLanguage === "mm" ? "ရွေးချယ်ပါ..." : "Select..."}
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {currentLanguage === "mm" ? "အစီအစဉ်" : "Order"}
                  </label>
                  <select
                    value={currentOrder}
                    onChange={(e) => currentSort && onSortChange(currentSort, e.target.value as 'asc' | 'desc')}
                    disabled={!currentSort}
                    aria-label={currentLanguage === "mm" ? "အစီအစဉ်" : "Order"}
                    className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="asc">
                      {currentLanguage === "mm" ? "အတက်" : "Ascending"}
                    </option>
                    <option value="desc">
                      {currentLanguage === "mm" ? "အဆင်း" : "Descending"}
                    </option>
                  </select>
                </div>
              )}

              {/* Records Per Page */}
              {onPageSizeChange && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {currentLanguage === "mm" ? "တစ်စာမျက်နှာလျှင် မှတ်တမ်းများ" : "Records Per Page"}
                  </label>
                  <select
                    value={currentPageSize}
                    onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                    aria-label={currentLanguage === "mm" ? "တစ်စာမျက်နှာလျှင် မှတ်တမ်းများ" : "Records Per Page"}
                    className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        ) : activeGroup ? (
          /* Regular Filter Tab Content */
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeGroup.fields.map((field) => (
                <div key={field.fieldName} className="min-w-0">
                  {renderPrefilterField(field)}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Footer with Total Count */}
        <div className="px-4 py-2 border-t border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent
                name="Database"
                className="h-3.5 w-3.5 text-muted-foreground"
              />
              <span className="text-xs font-medium text-muted-foreground">
                {currentLanguage === "mm" ? "စုစုပေါင်း:" : "Total:"}
              </span>
              <Badge variant="outline" className="text-xs font-bold px-2 py-0.5">
                {totalItems.toLocaleString()}
              </Badge>
            </div>

            {/* Active filters summary */}
            {totalActiveFilters > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <IconComponent name="Filter" className="h-3.5 w-3.5" />
                <span>
                  {totalActiveFilters}{" "}
                  {currentLanguage === "mm"
                    ? "စစ်ထုတ်မှုများ အသုံးပြုထား"
                    : `filter${totalActiveFilters > 1 ? "s" : ""} active`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
