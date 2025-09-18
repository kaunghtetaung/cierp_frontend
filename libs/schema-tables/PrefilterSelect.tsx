"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getLocalizedText } from "@repo/utils";
import { IconComponent } from "@repo/ui";
import { cn } from "@repo/utils";
import { getModuleReferenceAction } from "@repo/app-modules/server-actions";
import type { MultilingualText } from "@repo/types";

interface PrefilterField {
  fieldName: string;
  label: MultilingualText;
  type: "dynamicSelect" | "select" | "text";
  dataSource?: {
    endpoint: string;
    method?: string;
    labelField?: string;
    valueField?: string;
    serviceName?: string;
  };
  options?: Array<{
    value: string;
    label: MultilingualText | string;
  }>;
}

interface PrefilterSelectProps {
  field: PrefilterField;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
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

export function PrefilterSelect({
  field,
  value,
  onChange,
  currentLanguage,
  moduleSlug,
}: PrefilterSelectProps) {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load options for dynamic select
  const loadOptions = useCallback(async () => {
    if (field.type !== "dynamicSelect" || !field.dataSource) return;

    setIsLoading(true);
    try {
      // Extract module name from endpoint (e.g., "/catalog-types/ref" -> "catalog-types")
      const endpointParts = field.dataSource.endpoint.split('/').filter(Boolean);
      const referenceModule = endpointParts[0];
      
      // Call the API to get reference data
      const response = await getModuleReferenceAction<ApiOption>(
        referenceModule,
        {},
        field.dataSource.serviceName
      );

      if (response.success && response.data) {
        // Transform API response to options
        const transformedOptions = response.data.map((item: ApiOption) => {
          const itemId = item._id || item.id || "";
          
          // Extract label based on labelField configuration
          let label = "";
          let filterValue = "";
          const labelField = field.dataSource?.labelField || "name";
          
          const labelValue = item[labelField] || item.label || item.displayName || item.name;
          
          if (typeof labelValue === "object" && labelValue !== null) {
            label = labelValue[currentLanguage] || labelValue.en || itemId;
            // For multilingual, use the specific language value as filter
            filterValue = labelValue[currentLanguage] || labelValue.en || itemId;
          } else if (labelValue) {
            label = String(labelValue);
            filterValue = String(labelValue);
          } else {
            label = itemId;
            filterValue = itemId;
          }

          return {
            value: filterValue, // Use the actual field value for filtering
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
  }, [field, currentLanguage]);

  // Load options on mount and when dependencies change
  useEffect(() => {
    if (field.type === "dynamicSelect") {
      loadOptions();
    } else if (field.type === "select" && field.options) {
      // For static select, transform options
      const transformedOptions = field.options.map(opt => ({
        value: opt.value,
        label: typeof opt.label === "object" 
          ? (opt.label[currentLanguage as keyof MultilingualText] || opt.label.en || opt.value)
          : opt.label
      }));
      setOptions(transformedOptions);
    }
  }, [field, currentLanguage, loadOptions]);

  const selectedLabel = options.find(opt => opt.value === value)?.label || "";

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {getLocalizedText(field.label, currentLanguage)}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full min-w-[180px] flex items-center justify-between",
            "px-3 py-1.5 text-sm border rounded-md",
            "bg-background hover:bg-accent/50",
            "transition-colors duration-200",
            value ? "border-primary/50" : "border-input"
          )}
        >
          <span className={cn(
            "truncate",
            value ? "text-foreground" : "text-muted-foreground"
          )}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <IconComponent name="Loader2" className="h-3 w-3 animate-spin" />
                Loading...
              </span>
            ) : value ? (
              selectedLabel
            ) : (
              `Select ${getLocalizedText(field.label, currentLanguage)}`
            )}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <button
                type="button"
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
        {isOpen && !isLoading && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg">
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
                      "w-full text-left px-3 py-1.5 text-sm",
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