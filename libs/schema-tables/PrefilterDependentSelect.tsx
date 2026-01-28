"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getLocalizedText } from "@repo/utils";
import { IconComponent } from "@repo/ui";
import { cn } from "@repo/utils";
import { getModuleReferenceAction } from "@repo/app-modules/server-actions";
import type { MultilingualText } from "@repo/types";

interface PrefilterDependentField {
  fieldName: string;
  label: MultilingualText;
  type: "dependentSelect";
  dataSource?: {
    endpoint: string;
    method?: string;
    labelField?: string;
    valueField?: string;
    dependentField?: string; // e.g., "batches.academicYearId"
    dependentParam?: string; // e.g., "academicYearId"
    serviceName?: string;
    searchParam?: string;
  };
}

interface PrefilterDependentSelectProps {
  field: PrefilterDependentField;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  currentLanguage: string;
  moduleSlug: string;
  // All prefilter values to watch for dependent field
  prefilterValues: Record<string, string | string[] | { from: string; to: string } | undefined>;
}

interface ApiOption {
  _id?: string;
  id?: string;
  label?: any;
  displayName?: any;
  name?: any;
  value?: any;
  [key: string]: any;
}

export function PrefilterDependentSelect({
  field,
  value,
  onChange,
  currentLanguage,
  moduleSlug,
  prefilterValues,
}: PrefilterDependentSelectProps) {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Get the dependent field value from prefilterValues
  const dependentFieldName = field.dataSource?.dependentField;
  const dependentParamName = field.dataSource?.dependentParam;
  const dependentValue = dependentFieldName ? prefilterValues[dependentFieldName] : undefined;

  // Load options for dependent select - only when dependent value is available
  const loadOptions = useCallback(async () => {
    if (!field.dataSource) return;

    // If there's a dependent field but no value, clear options
    if (dependentFieldName && !dependentValue) {
      setOptions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Parse the endpoint to extract module and existing query params
      // e.g., "/regions/ref?expect=district&searchIn=state" -> module="regions", baseParams={expect:"district", searchIn:"state"}
      const [endpointPath, endpointQueryString] = field.dataSource.endpoint.split('?');
      const endpointParts = endpointPath.split('/').filter(Boolean);
      const referenceModule = endpointParts[0];

      // Parse existing query parameters from the endpoint
      const queryParams: Record<string, any> = {};
      if (endpointQueryString) {
        const urlParams = new URLSearchParams(endpointQueryString);
        urlParams.forEach((value, key) => {
          queryParams[key] = value;
        });
      }

      // Add the dependent value to query params
      // Two patterns supported:
      // 1. Batch pattern: uses dependentParam (e.g., "academicYearId") -> /batches/ref?academicYearId=<value>
      // 2. Region pattern: uses searchParam (e.g., "search") -> /regions/ref?expect=district&searchIn=state&search=<value>
      if (dependentValue) {
        if (dependentParamName) {
          // Pattern 1: Use dependentParam for the dependent relationship (e.g., "academicYearId")
          queryParams[dependentParamName] = dependentValue;
        } else if (field.dataSource?.searchParam) {
          // Pattern 2: Use searchParam for the dependent value (e.g., "search" for regions)
          queryParams[field.dataSource.searchParam] = dependentValue;
        } else {
          // Fallback: use the last part of dependentField as param name
          // e.g., "batches.academicYearId" -> "academicYearId"
          const fallbackParam = dependentFieldName?.split('.').pop() || "search";
          queryParams[fallbackParam] = dependentValue;
        }
      }

      console.log('🔍 PrefilterDependentSelect loadOptions:', {
        endpoint: field.dataSource.endpoint,
        referenceModule,
        queryParams,
        dependentValue,
        searchParam: field.dataSource?.searchParam,
        serviceName: field.dataSource.serviceName
      });

      // Call the API to get reference data with query params
      const response = await getModuleReferenceAction<ApiOption>(
        referenceModule,
        queryParams,
        field.dataSource.serviceName
      );

      if (response.success && response.data) {
        // Transform API response to options
        const transformedOptions = response.data.map((item: ApiOption) => {
          const itemId = item._id || item.id || "";

          // Extract label based on labelField configuration
          let label = "";
          const labelField = field.dataSource?.labelField || "name";

          // Smart valueField detection (same logic as PrefilterSelect):
          // 1. If fieldName contains dot notation (e.g., "catalogType.name"), ALWAYS use the part after the dot
          // 2. Otherwise, use dataSource.valueField if explicitly set
          // 3. Otherwise default to "_id"
          let valueField: string;
          if (field.fieldName.includes('.')) {
            // Extract the property name from dot notation (e.g., "catalogType.name" -> "name")
            const parts = field.fieldName.split('.');
            valueField = parts[parts.length - 1];
            console.log(`🔧 PrefilterDependentSelect: Auto-detected valueField from fieldName "${field.fieldName}" -> "${valueField}" (overriding dataSource.valueField: "${field.dataSource?.valueField}")`);
          } else {
            valueField = field.dataSource?.valueField || "_id";
          }

          const labelValue = item[labelField] || item.label || item.displayName || item.name;

          if (typeof labelValue === "object" && labelValue !== null) {
            label = labelValue[currentLanguage] || labelValue.en || itemId;
          } else if (labelValue) {
            label = String(labelValue);
          } else {
            label = itemId;
          }

          // Use valueField to determine what value to send for filtering
          let filterValue = itemId; // Fallback to ID

          // Try to get the value from the detected valueField
          let val = item[valueField];

          // If the valueField doesn't exist in the item, try common name fields
          // This handles cases where API returns "label" but we detected "name" from fieldName
          if (val === undefined && (valueField === 'name' || valueField === 'displayName')) {
            val = item['label'] || item['displayName'] || item['name'];
            console.log(`🔄 PrefilterDependentSelect: valueField "${valueField}" not found, using fallback:`, val);
          }

          if (val !== undefined) {
            if (typeof val === "object" && val !== null) {
              filterValue = val[currentLanguage] || val.en || itemId;
            } else {
              filterValue = String(val);
            }
          }

          console.log(`📋 PrefilterDependentSelect: Transformed option for ${field.fieldName}:`, {
            itemId,
            labelField,
            valueField,
            label,
            filterValue,
            detectedValueExists: item[valueField] !== undefined,
            rawItem: item
          });

          return {
            value: filterValue,
            label: label,
          };
        });

        setOptions(transformedOptions);
      }
    } catch (error) {
      console.error("Failed to load dependent prefilter options:", error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [field, currentLanguage, dependentValue, dependentFieldName, dependentParamName]);

  // Reload options when dependent value changes
  useEffect(() => {
    loadOptions();

    // Clear value if dependent value is cleared
    if (dependentFieldName && !dependentValue && value) {
      onChange(undefined);
    }
  }, [dependentValue, loadOptions, dependentFieldName]);

  const selectedLabel = options.find(opt => opt.value === value)?.label || "";

  // Determine if the field is disabled (no dependent value selected)
  const isDisabled = !!dependentFieldName && !dependentValue;
  const placeholderText = isDisabled
    ? `Select ${dependentFieldName?.split('.').pop()?.replace(/Id$/, '') || 'parent'} first`
    : `Select ${getLocalizedText(field.label, currentLanguage)}`;

  return (
    <div className="flex flex-col gap-2.5">
      <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
        {getLocalizedText(field.label, currentLanguage)}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => !isDisabled && setIsOpen(!isOpen)}
          disabled={isDisabled}
          className={cn(
            "w-full min-w-[180px] flex items-center justify-between",
            "px-4 py-2 text-sm border rounded-md",
            "transition-colors duration-200",
            isDisabled
              ? "bg-muted cursor-not-allowed opacity-60 border-input"
              : value
                ? "bg-background hover:bg-accent/50 border-primary/50"
                : "bg-background hover:bg-accent/50 border-input"
          )}
        >
          <span className={cn(
            "truncate",
            isDisabled
              ? "text-muted-foreground"
              : value
                ? "text-foreground font-medium"
                : "text-muted-foreground"
          )}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <IconComponent name="Loader2" className="h-3 w-3 animate-spin" />
                Loading...
              </span>
            ) : value ? (
              selectedLabel
            ) : (
              placeholderText
            )}
          </span>
          <div className="flex items-center gap-1">
            {value && !isDisabled && (
              <button
                type="button"
                title="Clear selection"
                aria-label="Clear selection"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
                }}
                className="hover:bg-accent rounded p-0.5"
              >
                <IconComponent name="X" className="h-3 w-3" />
              </button>
            )}
            <IconComponent
              name="ChevronDown"
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && !isLoading && !isDisabled && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-[300px] overflow-y-auto rounded-md border bg-popover shadow-lg">
              {options.length > 0 ? (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm",
                      "hover:bg-accent transition-colors",
                      value === option.value && "bg-accent"
                    )}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No options available
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}