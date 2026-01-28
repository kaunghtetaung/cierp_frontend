"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { getLocalizedText } from "@repo/utils";
import { IconComponent } from "@repo/ui";
import { Badge } from "@repo/ui";
import { cn } from "@repo/utils";
import { getModuleReferenceAction } from "@repo/app-modules/server-actions";
import type { MultilingualText } from "@repo/types";

interface PrefilterField {
  fieldName: string;
  label: MultilingualText;
  type: "typeaheadDynamicSelect";
  dataSource?: {
    endpoint: string;
    method?: string;
    labelField?: string;
    valueField?: string;
    serviceName?: string;
    enableTypeahead?: boolean;
    minSearchLength?: number;
    debounceMs?: number;
    searchParam?: string;
    showEmptyMessage?: boolean;
    emptyMessage?: MultilingualText;
  };
  multiple?: boolean;
}

interface PrefilterTypeaheadProps {
  field: PrefilterField;
  value: string[] | string | undefined;
  onChange: (value: string[] | string | undefined) => void;
  currentLanguage: string;
  moduleSlug: string;
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

export function PrefilterTypeahead({
  field,
  value,
  onChange,
  currentLanguage,
  moduleSlug,
}: PrefilterTypeaheadProps) {
  const [options, setOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize value to always be an array for easier handling
  const selectedValues = React.useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }, [value]);

  // Load options with search
  const loadOptions = useCallback(
    async (search: string = "") => {
      if (!field.dataSource) return;

      // Check minimum search length for typeahead
      const minLength = field.dataSource.minSearchLength || 2;
      if (field.dataSource.enableTypeahead && search.length < minLength) {
        setOptions([]);
        return;
      }

      setIsLoading(true);
      try {
        // Extract module name from endpoint
        const endpointParts = field.dataSource.endpoint
          .split("/")
          .filter(Boolean);
        const referenceModule = endpointParts[0];

        // Build query params with search
        const queryParams: any = {};
        if (search && field.dataSource.searchParam) {
          queryParams[field.dataSource.searchParam] = search;
        }

        // Call the API
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
            // 3. Otherwise default to labelField
            let valueField: string;
            if (field.fieldName.includes(".")) {
              // Extract the property name from dot notation (e.g., "catalogType.name" -> "name")
              const parts = field.fieldName.split(".");
              valueField = parts[parts.length - 1];
              console.log(
                `🔧 PrefilterTypeahead: Auto-detected valueField from fieldName "${field.fieldName}" -> "${valueField}" (overriding dataSource.valueField: "${field.dataSource?.valueField}")`
              );
            } else {
              valueField = field.dataSource?.valueField || labelField;
            }

            const labelValue =
              item[labelField] || item.label || item.displayName || item.name;

            if (typeof labelValue === "object" && labelValue !== null) {
              label = labelValue[currentLanguage] || labelValue.en || itemId;
            } else if (labelValue) {
              label = String(labelValue);
            } else {
              label = itemId;
            }

            // Extract filterValue from the determined valueField
            let filterValue = itemId; // Fallback to ID

            // Try to get the value from the detected valueField
            let val = item[valueField];

            // If the valueField doesn't exist in the item, try common name fields
            // This handles cases where API returns "label" but we detected "name" from fieldName
            if (
              val === undefined &&
              (valueField === "name" || valueField === "displayName")
            ) {
              val = item["label"] || item["displayName"] || item["name"];
              console.log(
                `🔄 PrefilterTypeahead: valueField "${valueField}" not found, using fallback:`,
                val
              );
            }

            if (val !== undefined) {
              if (typeof val === "object" && val !== null) {
                filterValue = val[currentLanguage] || val.en || itemId;
              } else {
                filterValue = String(val);
              }
            }

            console.log(
              `📋 PrefilterTypeahead: Transformed option for ${field.fieldName}:`,
              {
                itemId,
                labelField,
                valueField,
                label,
                filterValue,
                detectedValueExists: item[valueField] !== undefined,
                rawItem: item,
              }
            );

            return {
              value: filterValue,
              label: label,
            };
          });

          setOptions(transformedOptions);
        }
      } catch (error) {
        console.error("Failed to load prefilter options:", error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [field, currentLanguage]
  );

  // Handle search with debounce
  const handleSearch = useCallback(
    (search: string) => {
      setSearchTerm(search);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      const debounceMs = field.dataSource?.debounceMs || 300;
      searchTimeoutRef.current = setTimeout(() => {
        loadOptions(search);
      }, debounceMs);
    },
    [field.dataSource?.debounceMs, loadOptions]
  );

  // Load initial options if not typeahead
  useEffect(() => {
    if (!field.dataSource?.enableTypeahead) {
      loadOptions();
    }
  }, [field.dataSource?.enableTypeahead, loadOptions]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle selection
  const handleSelect = (optionValue: string) => {
    if (field.multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      console.log("🔍 PrefilterTypeahead handleSelect:", {
        fieldName: field.fieldName,
        optionValue,
        newValues,
        containsSpaces: optionValue.includes(" "),
      });
      onChange(newValues.length > 0 ? newValues : undefined);
    } else {
      console.log("🔍 PrefilterTypeahead handleSelect (single):", {
        fieldName: field.fieldName,
        optionValue,
        containsSpaces: optionValue.includes(" "),
      });
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  // Handle remove value
  const handleRemove = (valueToRemove: string) => {
    if (field.multiple) {
      const newValues = selectedValues.filter((v) => v !== valueToRemove);
      onChange(newValues.length > 0 ? newValues : undefined);
    } else {
      onChange(undefined);
    }
  };

  // Handle clear all values (for ESC key)
  const handleClear = () => {
    onChange(undefined);
    setSearchTerm("");
    setIsOpen(false);
  };

  // Handle key down events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClear();
    }
  };

  // Get labels for selected values
  const selectedLabels = selectedValues.map((val) => {
    const option = options.find((opt) => opt.value === val);
    return option?.label || val;
  });

  // Show empty message
  const showEmptyMessage =
    field.dataSource?.showEmptyMessage &&
    field.dataSource?.enableTypeahead &&
    searchTerm.length < (field.dataSource?.minSearchLength || 2);

  return (
    <div className="flex flex-col gap-2.5">
      <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
        {getLocalizedText(field.label, currentLanguage)} aa
      </label>

      {/* Selected values for multiple selection */}
      {field.multiple && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedLabels.map((label, index) => (
            <Badge
              key={selectedValues[index]}
              variant="secondary"
              className="text-xs"
            >
              {label}
              <button
                type="button"
                onClick={() => handleRemove(selectedValues[index])}
                className="ml-1 hover:text-destructive"
              >
                <IconComponent name="X" className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        {/* Input field */}
        {field.dataSource?.enableTypeahead ? (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder={
                field.multiple || !selectedValues.length
                  ? `Search ${getLocalizedText(field.label, currentLanguage)}`
                  : selectedLabels[0]
              }
              className={cn(
                "w-full min-w-[180px] px-4 py-2 text-sm text-foreground font-medium border rounded-md",
                "bg-background hover:bg-accent/50",
                "transition-colors duration-200",
                selectedValues.length > 0 ? "border-primary/50" : "border-input"
              )}
            />
            {isLoading && (
              <IconComponent
                name="Loader2"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin"
              />
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-full min-w-[180px] flex items-center justify-between",
              "px-4 py-2 text-sm border rounded-md",
              "bg-background hover:bg-accent/50",
              "transition-colors duration-200",
              selectedValues.length > 0 ? "border-primary/50" : "border-input"
            )}
          >
            <span
              className={cn(
                "truncate",
                selectedValues.length > 0
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {!field.multiple && selectedValues.length > 0
                ? selectedLabels[0]
                : `Select ${getLocalizedText(field.label, currentLanguage)}`}
            </span>
            <IconComponent
              name="ChevronDown"
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
        )}

        {/* Dropdown */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setIsOpen(false);
                setSearchTerm("");
              }}
            />
            <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-[300px] overflow-y-auto rounded-md border bg-popover shadow-lg">
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                  <IconComponent
                    name="Loader2"
                    className="h-3 w-3 animate-spin"
                  />
                  Loading...
                </div>
              ) : showEmptyMessage ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {field.dataSource?.emptyMessage
                    ? getLocalizedText(
                        field.dataSource.emptyMessage,
                        currentLanguage
                      )
                    : `Type at least ${
                        field.dataSource?.minSearchLength || 2
                      } characters to search...`}
                </div>
              ) : options.length > 0 ? (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm",
                      "hover:bg-accent transition-colors",
                      "flex items-center justify-between",
                      selectedValues.includes(option.value) && "bg-accent"
                    )}
                  >
                    <span>{option.label}</span>
                    {field.multiple &&
                      selectedValues.includes(option.value) && (
                        <IconComponent name="Check" className="h-3 w-3" />
                      )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No options found
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
