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
      <div className="bg-gradient-to-br from-background via-muted/20 to-muted/30 border border-border/60 rounded-xl shadow-sm">
        {/* Tabs Row */}
        <div className="flex items-center justify-between border-b border-border/40 px-3 bg-gradient-to-r from-muted/10 via-transparent to-muted/10">
          {/* Tab Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide">
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
                    "relative flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all duration-300 ease-in-out",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60 hover:shadow-sm",
                    isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground hover:shadow-none scale-100"
                  )}
                >
                  <span className={cn("relative z-10", isActive && "text-primary-foreground")}>{getLocalizedText(group.groupLabel, currentLanguage)}</span>
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

          {/* Right side: Clear All */}
          <div className="flex items-center gap-3 py-1 pl-3 shrink-0">
            {/* Clear All Button */}
            {totalActiveFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-9 px-4 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 rounded-lg font-medium"
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
        </div>

        {/* Active Tab Content */}
        {activeGroup && activeGroup.groupKey === 'control' ? (
          /* Control Tab Content */
          <div className="p-6 bg-gradient-to-b from-muted/5 to-transparent">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    aria-label={currentLanguage === "mm" ? "အစီအစဉ်" : "Sort By"}
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
                    onChange={(e) => currentSort && onSortChange(currentSort, e.target.value as 'asc' | 'desc')}
                    disabled={!currentSort}
                    aria-label={currentLanguage === "mm" ? "အစီအစဉ်" : "Order"}
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
                    aria-label={currentLanguage === "mm" ? "တစ်စာမျက်နှာလျှင် မှတ်တမ်းများ" : "Records Per Page"}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activeGroup.fields.map((field) => (
                <div key={field.fieldName} className="min-w-0">
                  {renderPrefilterField(field)}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Footer with Total Count */}
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
      </div>
    </div>
  );
}
