"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { getLocalizedText } from "@repo/utils";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { getLocalizedErrorMessage } from "@repo/api/messages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui";
import { Badge } from "@repo/ui";
import { cn } from "@repo/ui";
import { getModuleReferenceAction } from "@repo/app-modules/server-actions";
import type { FormField } from "@repo/types";
import type { MultilingualText } from "@repo/types";

interface DynamicSelectProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  currentLanguage: string;
  watch?: any;
  errors?: any;
}

interface LocalSelectOption {
  value: string;
  label: MultilingualText | string;
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

/**
 * DynamicSelect Component - Following SOLID Principles
 * 
 * Single Responsibility: Handles ONLY regular dropdown functionality
 * Open/Closed: Redirects to TypeaheadDynamicSelect for typeahead behavior
 * Liskov Substitution: Can be replaced with TypeaheadDynamicSelect transparently
 * Interface Segregation: Uses minimal interfaces for what it needs
 * Dependency Inversion: Depends on abstractions (FormField interface)
 */
export function DynamicSelect({
  field,
  value,
  onChange,
  currentLanguage,
  watch,
  errors,
}: DynamicSelectProps) {
  // SOLID Principle: Single Responsibility
  // Check if this should be a typeahead field and redirect if necessary
  const isTypeaheadField = Boolean(
    field.dataSource?.enableTypeahead || 
    field.dropdownConfig?.enableTypeahead
  );

  // SOLID Principle: Open/Closed - Extend behavior through composition
  if (isTypeaheadField) {
    const TypeaheadDynamicSelect = require('./TypeaheadDynamicSelect').TypeaheadDynamicSelect;
    return (
      <TypeaheadDynamicSelect
        field={field}
        value={value}
        onChange={onChange}
        currentLanguage={currentLanguage}
        watch={watch}
        errors={errors}
      />
    );
  }

  // State management - kept minimal for Single Responsibility
  const [options, setOptions] = useState<LocalSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const dropdownConfig = field.dropdownConfig!;
  const isMultiple = dropdownConfig.multiple || field.fieldType === "multiSelect";
  const validationError = errors?.[field.fieldName];

  // Dependency tracking
  const watchedFields = dropdownConfig.dependsOn?.map(fieldName => watch?.(fieldName)) || [];
  
  const dependencyValues = useMemo(() => {
    if (!dropdownConfig.dependsOn || !watch) return {};
    
    const values: Record<string, any> = {};
    dropdownConfig.dependsOn.forEach((fieldName) => {
      values[fieldName] = watch(fieldName);
    });
    return values;
  }, [dropdownConfig.dependsOn, watch, ...watchedFields]);

  const dependenciesSatisfied = useMemo(() => {
    if (!dropdownConfig.dependsOn) return true;
    
    return dropdownConfig.dependsOn.every((fieldName) => {
      const value = dependencyValues[fieldName];
      return value !== null && value !== undefined && value !== "" && value !== 0;
    });
  }, [dropdownConfig.dependsOn, dependencyValues]);

  const dependencyKey = useMemo(() => {
    return JSON.stringify(dependencyValues);
  }, [dependencyValues]);

  // Refs for state tracking
  const lastFetchedDependencyKey = useRef<string>("");
  const hasInitialized = useRef(false);
  const isFetching = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Utility: Extract module from refPath
  const getModuleFromRefPath = (refPath: string): string => {
    return refPath.replace(/^\//, '').replace(/\/ref$/, '');
  };

  // Utility: Extract label from API response
  const getApiLabel = (item: ApiOption, language: string): string => {
    // Try different label fields in order of preference
    const fields = ['label', 'displayName', 'name', 'title'];
    
    for (const field of fields) {
      const value = item[field];
      if (!value) continue;
      
      if (typeof value === "string") return value;
      
      if (typeof value === "object") {
        const text = value[language] || value.en || value.mm || "";
        if (text) return text;
      }
    }
    
    return String(item._id || item.id || item.value || "");
  };

  // Core functionality: Fetch options from API
  const fetchOptions = useCallback(async () => {
    // SOLID: Single Responsibility - Only fetch when appropriate
    if (isFetching.current || loading) return;
    
    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      const module = getModuleFromRefPath(dropdownConfig.refPath!);
      const queryParams: Record<string, string> = {};
      
      // Handle dependent field parameters
      if (dropdownConfig.dependsOn && dropdownConfig.dependsOn.length > 0) {
        dropdownConfig.dependsOn.forEach((fieldName) => {
          const paramValue = dependencyValues[fieldName];
          if (paramValue) {
            queryParams["dependentFieldValue"] = String(paramValue);
          }
        });
      }

      // Fetch data from server
      const result = await getModuleReferenceAction<ApiOption>(module, queryParams);
      
      if (!result.success) {
        throw new Error(result.error || getLocalizedErrorMessage('DATA_LOAD_FAILED', currentLanguage as 'en' | 'mm'));
      }

      // Transform response data
      const responseData = result.data as any;
      const data = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.data || responseData?.items || []);
      
      const transformedOptions: LocalSelectOption[] = data.map((item: ApiOption) => ({
        value: String(item._id || item.id || item.value || ""),
        label: {
          en: getApiLabel(item, "en"),
          mm: getApiLabel(item, "mm"),
        },
      }));
      
      setOptions(transformedOptions);
      setError(null);
      lastFetchedDependencyKey.current = dependencyKey;
      
    } catch (error) {
      const errorMsg = error instanceof Error 
        ? error.message 
        : getLocalizedErrorMessage('DATA_LOAD_FAILED', currentLanguage as 'en' | 'mm');
      setError(errorMsg);
      setOptions([]);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [dependencyValues, dependencyKey, dropdownConfig, currentLanguage]);

  // Effect: Handle option loading for regular dropdowns ONLY
  useEffect(() => {
    // IMPORTANT: Skip ALL fetching if typeahead is enabled
    // This was the core issue - we were fetching even for typeahead fields
    if (isTypeaheadField) {
      return;
    }

    // Handle static options
    if (dropdownConfig.type === "static") {
      if (!hasInitialized.current) {
        const staticOptions: LocalSelectOption[] = (dropdownConfig.options || []).map(opt => ({
          value: String(opt.value),
          label: opt.label
        }));
        setOptions(staticOptions);
        hasInitialized.current = true;
      }
      return;
    }

    // Must have a data source for dynamic options
    if (!dropdownConfig.refPath) {
      if (!hasInitialized.current) {
        setOptions([]);
        hasInitialized.current = true;
      }
      return;
    }

    // For dependent dropdowns, wait for dependencies
    if (!dependenciesSatisfied) {
      if (options.length > 0) {
        setOptions([]);
      }
      if (value) {
        onChange(isMultiple ? [] : "");
      }
      lastFetchedDependencyKey.current = "";
      return;
    }

    // Fetch data for regular dropdowns that should preload
    const shouldFetch = (
      !hasInitialized.current ||
      lastFetchedDependencyKey.current !== dependencyKey
    );

    if (shouldFetch && !isFetching.current) {
      hasInitialized.current = true;
      fetchOptions();
    }
  }, [
    isTypeaheadField, // Add this dependency
    dropdownConfig.type,
    dropdownConfig.refPath,
    dependenciesSatisfied,
    dependencyKey,
    fetchOptions,
    field.fieldName,
    isMultiple,
    onChange,
    options.length,
    value
  ]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchTerm || !dropdownConfig.searchable) return options;
    
    return options.filter((option) => {
      const labelText = typeof option.label === 'string' 
        ? option.label 
        : getLocalizedText(option.label, currentLanguage);
      return labelText.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [options, searchTerm, currentLanguage, dropdownConfig.searchable]);

  // Get selected options for display
  const selectedOptions = useMemo(() => {
    if (!value) return [];
    const selectedValues = Array.isArray(value) ? value : [value];
    return options.filter((option) => selectedValues.includes(option.value));
  }, [value, options]);

  // Event handlers
  const handleSelect = (optionValue: string) => {
    if (isMultiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange(isMultiple ? [] : "");
  };

  const handleRemove = (optionValue: string) => {
    if (isMultiple && Array.isArray(value)) {
      const newValues = value.filter((v) => v !== optionValue);
      onChange(newValues);
    }
  };

  // Display text for the trigger button
  const getDisplayText = () => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return field.placeHolder || "Select option";
    }

    if (isMultiple && Array.isArray(value)) {
      return `${value.length} selected`;
    }

    const selectedOption = options.find((option) => option.value === value);
    if (selectedOption) {
      const labelText = typeof selectedOption.label === 'string' 
        ? selectedOption.label 
        : getLocalizedText(selectedOption.label, currentLanguage);
      return labelText;
    }

    if (loading) {
      return currentLanguage === "mm" ? "ရွေးချယ်ထားသည်..." : "Loading selection...";
    }

    return field.placeHolder || "Select option";
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current && dropdownConfig.searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open, dropdownConfig.searchable]);

  // Render: Disabled state for unmet dependencies
  if (!dependenciesSatisfied) {
    return (
      <div className="w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground">
        {currentLanguage === "mm" 
          ? "ပထမဦးစွာ အပေါ်ရှိ အကွက်များကို ဖြည့်ပါ"
          : "Please fill in the fields above first"}
      </div>
    );
  }

  // Render: Error state
  if (error && !loading) {
    return (
      <div className="w-full">
        <div className="px-3 py-2 border border-destructive rounded-md bg-destructive/10 text-destructive text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <IconComponent name="AlertCircle" className="h-4 w-4 mr-2" />
              <span>
                {currentLanguage === "mm" 
                  ? "ဒေတာ ရယူရာတွင် အမှားရှိသည်"
                  : "Failed to load options"}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:bg-destructive/20"
              onClick={() => {
                setError(null);
                lastFetchedDependencyKey.current = "";
                fetchOptions();
              }}
            >
              <IconComponent name="RotateCcw" className="h-3 w-3 mr-1" />
              {currentLanguage === "mm" ? "ပြန်လုပ်" : "Retry"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render: Main dropdown component
  return (
    <div className="w-full">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-between ${
              validationError 
                ? "border-destructive focus:ring-destructive bg-destructive/5" 
                : ""
            }`}
            disabled={field.readonly || loading}
          >
            <span className="truncate">{getDisplayText()}</span>
            {loading ? (
              <IconComponent name="Loader2" className="ml-2 h-4 w-4 shrink-0 opacity-50 animate-spin" />
            ) : (
              <IconComponent name="ChevronDown" className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="min-w-[var(--radix-dropdown-menu-trigger-width)] w-[var(--radix-dropdown-menu-trigger-width)]"
          sideOffset={4}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Search input for searchable dropdowns */}
          {dropdownConfig.searchable && (
            <div className="p-2 border-b">
              <Input
                ref={searchInputRef}
                placeholder={currentLanguage === "mm" ? "ရှာဖွေပါ..." : "Search..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Space') {
                    e.stopPropagation();
                  }
                }}
                className="h-8"
                autoFocus
              />
            </div>
          )}
          
          {/* Options list */}
          <div className="max-h-[300px] overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                {currentLanguage === "mm" ? "ရွေးချယ်စရာ မရှိပါ" : "No options found"}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const labelText = typeof option.label === 'string' 
                  ? option.label 
                  : getLocalizedText(option.label, currentLanguage);
                
                return (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="flex items-center"
                  >
                    <IconComponent
                      name="Check"
                      className={cn(
                        "mr-2 h-4 w-4",
                        (isMultiple && Array.isArray(value) && value.includes(option.value)) ||
                        (!isMultiple && value === option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span className="flex-1 truncate">
                      {labelText || option.value}
                    </span>
                  </DropdownMenuItem>
                );
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Multi-select badges */}
      {isMultiple && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="text-xs"
            >
              {typeof option.label === 'string' 
                ? option.label 
                : getLocalizedText(option.label, currentLanguage)}
              {!field.readonly && (
                <button
                  type="button"
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRemove(option.value);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleRemove(option.value)}
                  aria-label="Remove option"
                >
                  <IconComponent name="X" className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <p className="text-xs text-destructive mt-1 flex items-center">
          <IconComponent name="AlertCircle" className="w-3 h-3 mr-1" />
          {validationError?.message || getLocalizedErrorMessage('CLIENT_VALIDATION_FAILED', currentLanguage as 'en' | 'mm')}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-1 mt-1">
        {dropdownConfig.clearable && value && !field.readonly && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleClear}
          >
            <IconComponent name="X" className="h-3 w-3 mr-1" />
            {currentLanguage === "mm" ? "ရှင်းလင်းမည်" : "Clear"}
          </Button>
        )}
        
        {dropdownConfig.type === "dynamic" && dropdownConfig.refPath && !field.readonly && dependenciesSatisfied && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              lastFetchedDependencyKey.current = "";
              fetchOptions();
            }}
            disabled={loading}
          >
            <IconComponent 
              name={loading ? "Loader2" : "RefreshCw"} 
              className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} 
            />
            {currentLanguage === "mm" ? "ပြန်ရယူ" : "Refresh"}
          </Button>
        )}
      </div>
    </div>
  );
}