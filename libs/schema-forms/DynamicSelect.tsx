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
import { cn } from "@repo/utils";
import { getModuleReferenceAction } from "@repo/app-modules/server-actions";
import type { FormField, QuickEntryConfig } from "@repo/types";
import type { MultilingualText } from "@repo/types";
import { QuickEntryDialog } from "./components/QuickEntryDialog";
import { submitQuickEntryForm } from "./server-actions/form-actions";

interface DynamicSelectProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  currentLanguage: string;
  watch?: any; // React Hook Form watch function for dependency tracking
  errors?: any; // React Hook Form validation errors
}

// Local SelectOption interface to resolve type conflicts
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

export function DynamicSelect({
  field,
  value,
  onChange,
  currentLanguage,
  watch,
  errors,
}: DynamicSelectProps) {
  // Generate a unique instance ID for debugging multiple renders
  const instanceId = useMemo(() => Math.random().toString(36).substr(2, 9), []);
  
  // Normalize value to handle both string IDs and object values
  const normalizedValue = useMemo(() => {
    if (!value) return value;
    
    // If it's an array, normalize each item
    if (Array.isArray(value)) {
      return value.map(v => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object') return v._id || v.id || v;
        return v;
      });
    }
    
    // Single value normalization
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') return value._id || value.id || value;
    return value;
  }, [value]);
  
  // Check if this should be a typeahead field and redirect if necessary
  const isTypeaheadField = Boolean(
    field.dataSource?.enableTypeahead || 
    field.dropdownConfig?.enableTypeahead
  );


  // Redirect to TypeaheadDynamicSelect if needed
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

  const [options, setOptions] = useState<LocalSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const dropdownConfig = field.dropdownConfig!;
  const isMultiple = dropdownConfig.multiple || field.fieldType === "multiSelect";
  
  // Get validation error for this field
  const validationError = errors?.[field.fieldName];

  // Watch dependency fields - use all dependency values to trigger re-renders
  const watchedFields = dropdownConfig.dependsOn?.map(fieldName => watch?.(fieldName)) || [];
  
  // Get current dependency values
  const dependencyValues = useMemo(() => {
    if (!dropdownConfig.dependsOn || !watch) return {};
    
    const values: Record<string, any> = {};
    dropdownConfig.dependsOn.forEach((fieldName) => {
      values[fieldName] = watch(fieldName);
    });
    
    
    return values;
  }, [dropdownConfig.dependsOn, watch, ...watchedFields]);

  // Check if all dependencies are satisfied
  const dependenciesSatisfied = useMemo(() => {
    if (!dropdownConfig.dependsOn) return true;
    
    const satisfied = dropdownConfig.dependsOn.every((fieldName) => {
      const value = dependencyValues[fieldName];
      const isValid = value !== null && value !== undefined && value !== "" && value !== 0;
      
      
      return isValid;
    });
    
    
    return satisfied;
  }, [dropdownConfig.dependsOn, dependencyValues, field.fieldName]);

  // Create stable dependency key to prevent infinite loops
  const dependencyKey = useMemo(() => {
    return JSON.stringify(dependencyValues);
  }, [dependencyValues]);


  // Refs to track state without causing re-renders
  const lastFetchedDependencyKey = useRef<string>("");
  const hasInitialized = useRef(false);
  const isFetching = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // Parse module from refPath (e.g., "/departments/ref" -> "departments", "/regions/ref?expect=district" -> "regions")
  const getModuleFromRefPath = (refPath: string): string => {
    // Split by '?' to separate path from query parameters
    const [basePath] = refPath.split('?');
    // Remove leading slash and trailing /ref
    const cleaned = basePath.replace(/^\//, '').replace(/\/ref$/, '');
    return cleaned;
  };

  // Extract label from API response using configured field
  const getApiLabel = (item: ApiOption, language: string, labelField?: string): string => {
    // If labelField is specified, try to use it first
    if (labelField) {
      const fieldValue = item[labelField];
      if (fieldValue) {
        // Handle string values
        if (typeof fieldValue === "string") {
          return fieldValue;
        }
        // Handle multilingual objects
        if (typeof fieldValue === "object") {
          return fieldValue[language] || fieldValue.en || fieldValue.mm || "";
        }
      }
    }
    
    // Fallback to default behavior if labelField not found
    // Handle string labels first (common case)
    if (item.label && typeof item.label === "string") {
      return item.label;
    }
    
    // Handle multilingual object labels
    if (item.label && typeof item.label === "object") {
      const labelText = item.label[language] || item.label.en || item.label.mm || "";
      if (labelText) return labelText;
    }
    
    // Try displayName (string first, then object)
    if (item.displayName && typeof item.displayName === "string") {
      return item.displayName;
    }
    
    if (item.displayName && typeof item.displayName === "object") {
      const displayText = item.displayName[language] || item.displayName.en || item.displayName.mm || "";
      if (displayText) return displayText;
    }
    
    // Try name (string first, then object)
    if (item.name && typeof item.name === "string") {
      return item.name;
    }
    
    if (item.name && typeof item.name === "object") {
      const nameText = item.name[language] || item.name.en || item.name.mm || "";
      if (nameText) return nameText;
    }
    
    // Final fallbacks
    const stringLabel = item.title || item._id || item.id || item.value || "";
    
    return String(stringLabel);
  };

  // Fetch options using proper backend integration
  const fetchOptions = useCallback(async () => {
    // Prevent concurrent requests
    if (isFetching.current || loading) {
      return;
    }

    
    // Mark as fetching to prevent concurrent calls
    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      // Extract module name from refPath
      const module = getModuleFromRefPath(dropdownConfig.refPath!);

      // Extract predefined query parameters from refPath
      const [, queryString] = dropdownConfig.refPath!.split('?');
      const predefinedParams: Record<string, string> = {};
      if (queryString) {
        const urlParams = new URLSearchParams(queryString);
        urlParams.forEach((value, key) => {
          predefinedParams[key] = value;
        });
      }

      // Build query parameters for dependent dropdowns, merging with predefined params
      const queryParams: Record<string, string> = { ...predefinedParams };

      // Add searchType parameter for dynamicDependentSelect fields (avoid conflict with dataSource.searchParam)
      if (field.fieldType === 'dynamicDependentSelect' || field.fieldType === 'multiDependentSelect') {
        queryParams.searchType = 'dynamicDependentSelect';
      }

      if (dropdownConfig.dependsOn && dropdownConfig.dependsOn.length > 0) {
        dropdownConfig.dependsOn.forEach((fieldName, index) => {
          // Use searchParam from dataSource if specified, otherwise use dependentFieldValue for backward compatibility
          const paramName = field.dataSource?.searchParam || "dependentFieldValue";
          const paramValue = dependencyValues[fieldName];

          if (paramValue) {
            // Convert to string to handle any type issues (e.g., objects, numbers)
            queryParams[paramName] = String(paramValue);
          }
        });
      }
      


      // Extract serviceName from dataSource or dropdownConfig
      const serviceName = field.dataSource?.serviceName || dropdownConfig?.serviceName;
      
      
      // Use server action instead of direct fetch
      const result = await getModuleReferenceAction<ApiOption>(module, queryParams, serviceName || undefined);
      
      if (!result.success) {
        const errorMsg = result.error || getLocalizedErrorMessage('DATA_LOAD_FAILED', currentLanguage as 'en' | 'mm');
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Handle different response formats
      const responseData = result.data as any;
      const data = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.data || responseData?.items || []);
      
      
      // Transform API response to LocalSelectOption format
      const transformedOptions: LocalSelectOption[] = data.map((item: ApiOption, index: number) => {
        // Use configured valueField and labelField from dropdownConfig or dataSource
        const valueField = dropdownConfig.valueField || field.dataSource?.valueField || 'id';
        const labelField = dropdownConfig.labelField || field.dataSource?.labelField || 'name';
        
        // Helper function to extract nested field values
        const getFieldValue = (obj: any, field: string): any => {
          // Handle dot notation for nested fields
          if (field.includes('.')) {
            const parts = field.split('.');
            let value = obj;
            for (const part of parts) {
              value = value?.[part];
              if (value === undefined) break;
            }
            return value;
          }
          return obj[field];
        };
        
        
        // Extract value using configured field (with support for nested paths)
        let itemValue = getFieldValue(item, valueField);
        
        // Special handling for multilingual fields
        if (!itemValue && item[valueField] && typeof item[valueField] === 'object') {
          // If the field is a multilingual object, use the English or Myanmar value
          const multilingualField = item[valueField];
          itemValue = multilingualField.en || multilingualField.mm || multilingualField[currentLanguage];
        }
        
        if (!itemValue) {
          // Fallback to common ID fields
          itemValue = item._id || item.id || item.value || `missing-id-${index}`;
          
        }
        
        const transformedOption = {
          value: String(itemValue),
          label: {
            en: getApiLabel(item, "en", labelField),
            mm: getApiLabel(item, "mm", labelField),
          },
        };
        
        return transformedOption;
      });
      
      // Deduplicate options based on value to prevent React key conflicts
      const uniqueOptions = transformedOptions.filter((option, index, array) =>
        array.findIndex(opt => opt.value === option.value) === index
      );

      setOptions(uniqueOptions);
      setError(null);
      lastFetchedDependencyKey.current = dependencyKey;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : getLocalizedErrorMessage('DATA_LOAD_FAILED', currentLanguage as 'en' | 'mm');
      setError(errorMsg);
      setOptions([]);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [dependencyKey, dropdownConfig.refPath, dropdownConfig.dependsOn, currentLanguage, field.fieldName, instanceId]);

  // Single useEffect to handle all option loading logic
  useEffect(() => {
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

    // Stop refetching if there are validation errors on this field
    if (validationError) {
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
      // Don't automatically clear the selected value - let user decide
      // This prevents onChange from triggering infinite loops
      lastFetchedDependencyKey.current = "";
      return;
    }

    // Determine if we need to fetch - only fetch when absolutely necessary
    const shouldFetch = (
      // First time initialization with no dependencies
      (!hasInitialized.current && !dropdownConfig.dependsOn) ||
      // First time initialization with satisfied dependencies  
      (!hasInitialized.current && dependenciesSatisfied) ||
      // Dependencies have changed (e.g., organization changed for department dropdown)
      (hasInitialized.current && lastFetchedDependencyKey.current !== dependencyKey && dependenciesSatisfied)
    );

    // Don't auto-retry if there's an error and we're trying the same dependency key
    const hasErrorForCurrentKey = error && lastFetchedDependencyKey.current === dependencyKey;

    if (shouldFetch && !isFetching.current && !loading && !hasErrorForCurrentKey) {
      
      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Add a larger delay to batch rapid changes and avoid multiple requests
      fetchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && !isFetching.current) {
          hasInitialized.current = true;
          fetchOptions();
        }
      }, 300); // Increased to 300ms delay to better batch updates
    }
  }, [
    // Only include stable dependencies that actually affect fetching logic
    dropdownConfig.type,
    dropdownConfig.refPath,
    dropdownConfig.dependsOn,
    dependenciesSatisfied,
    dependencyKey,
    loading,
    isMultiple,
    error,
    validationError
    // Note: Removed fetchOptions, value, and onChange to prevent unnecessary re-fetches
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      isFetching.current = false;
    };
  }, []);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm || !dropdownConfig.searchable) return options;
    
    return options.filter((option) => {
      const labelText = typeof option.label === 'string' ? option.label : getLocalizedText(option.label, currentLanguage);
      return labelText.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [options, searchTerm, currentLanguage, dropdownConfig.searchable]);

  // Get selected option(s) for display
  const selectedOptions = useMemo(() => {
    if (!normalizedValue) return [];
    
    const selectedValues = Array.isArray(normalizedValue) ? normalizedValue : [normalizedValue];
    return options.filter((option) => selectedValues.includes(option.value));
  }, [normalizedValue, options]);

  // Handle option selection
  const handleSelect = (optionValue: string) => {
    if (isMultiple) {
      const currentValues = Array.isArray(normalizedValue) ? normalizedValue : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setOpen(false);
    }
  };

  // Handle clear selection
  const handleClear = () => {
    onChange(isMultiple ? [] : "");
  };

  // Handle Quick Entry submission
  const handleQuickEntrySubmit = async (data: Record<string, unknown>) => {
    console.log('📝 QuickEntry Submit Started:', {
      fieldName: field.fieldName,
      data,
      timestamp: new Date().toISOString()
    })

    if (!field.quickEntry) return;

    const endpoint = field.quickEntry.endpoint || '';
    const result = await submitQuickEntryForm(endpoint, data, field.quickEntry.serviceName);

    console.log('✅ QuickEntry Submit Completed:', {
      fieldName: field.fieldName,
      success: result.success,
      timestamp: new Date().toISOString()
    })
    
    if (result.success && result.data) {
      // Get the configured label and value fields
      const labelField = dropdownConfig?.labelField || field.dataSource?.labelField || 'name';
      const valueField = dropdownConfig?.valueField || field.dataSource?.valueField || 'id';
      
      // Extract the ID (for value) and label from the returned data
      const newItemId = result.data[valueField] || result.data._id || result.data.id;
      const newItemLabel = result.data[labelField] || result.data.displayName || result.data.name;
      
      // Create a new option for the dropdown
      if (newItemId) {
        const newOption: LocalSelectOption = {
          value: String(newItemId),
          label: typeof newItemLabel === 'object' ? newItemLabel : {
            en: newItemLabel || newItemId,
            mm: newItemLabel || newItemId
          }
        };
        
        // Add the new option to the options list
        setOptions(prevOptions => [...prevOptions, newOption]);
        
        // Auto-select the newly created item if configured
        if (field.quickEntry.autoSelect !== false) {
          if (isMultiple) {
            const currentValues = Array.isArray(normalizedValue) ? normalizedValue : [];
            onChange([...currentValues, String(newItemId)]);
          } else {
            onChange(String(newItemId));
          }
        }
      }
      
      // Also refresh the full options list to ensure consistency
      lastFetchedDependencyKey.current = ""; // Force refetch
      fetchOptions();
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create');
    }
  };

  // Remove single item in multi-select
  const handleRemove = (optionValue: string) => {
    if (isMultiple && Array.isArray(normalizedValue)) {
      const newValues = normalizedValue.filter((v) => v !== optionValue);
      onChange(newValues);
    }
  };

  // Display text for the select trigger
  const getDisplayText = () => {
    if (!normalizedValue || (Array.isArray(normalizedValue) && normalizedValue.length === 0)) {
      return field.placeHolder || "Select option";
    }

    if (isMultiple && Array.isArray(normalizedValue)) {
      return `${normalizedValue.length} selected`;
    }

    // For single select, find the option with matching value (ID)
    const selectedOption = options.find((option) => option.value === normalizedValue);
    if (selectedOption) {
      const labelText = typeof selectedOption.label === 'string' ? selectedOption.label : getLocalizedText(selectedOption.label, currentLanguage);
      return labelText;
    }

    // If option not found but we have a value, show loading state or placeholder
    // This happens when form loads with existing data before options are fetched
    if (loading && normalizedValue) {
      return currentLanguage === "mm" ? "ရွေးချယ်ထားသည်..." : "Loading selection...";
    }

    // If not loading and no option found, show placeholder instead of raw ID
    return field.placeHolder || "Select option";
  };

  if (!dependenciesSatisfied) {
    return (
      <div className="w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground">
        {currentLanguage === "mm" 
          ? "ပထမဦးစွာ အပေါ်ရှိ အကွက်များကို ဖြည့်ပါ"
          : "Please fill in the fields above first"}
      </div>
    );
  }

  // Show error state
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
              disabled={loading}
              onClick={async () => {
                setError(null);
                lastFetchedDependencyKey.current = ""; // Force refetch

                // Clear any pending timeout to bypass the 300ms delay
                if (fetchTimeoutRef.current) {
                  clearTimeout(fetchTimeoutRef.current);
                }

                // Call fetchOptions directly for immediate response
                await fetchOptions();
              }}
            >
              <IconComponent
                name={loading ? "Loader2" : "RotateCcw"}
                className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              {loading
                ? (currentLanguage === "mm" ? "လုပ်နေသည်..." : "Loading...")
                : (currentLanguage === "mm" ? "ပြန်လုပ်" : "Retry")
              }
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-1 text-xs opacity-75">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      
      {/* Search input for searchable dropdowns */}
      {dropdownConfig.searchable && open && (
        <div className="mb-2">
          <Input
            placeholder={currentLanguage === "mm" ? "ရှာဖွေပါ..." : "Search..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setSearchTerm("");
                handleClear();
                setOpen(false);
              }
            }}
            className="h-8"
          />
        </div>
      )}

      {/* Compact single-line dropdown with integrated action buttons */}
      <div className={`relative flex items-center border rounded-md shadow-xs transition-[color,box-shadow] ${
        validationError
          ? "border-destructive focus-within:ring-destructive/20 dark:focus-within:ring-destructive/40 focus-within:border-destructive focus-within:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive"
          : "border-input focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]"
      }`}>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex-1 flex items-center justify-between px-3 h-9 text-sm bg-transparent hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none"
              disabled={field.readonly || loading}
            >
              <span className="truncate text-left">{getDisplayText()}</span>
              {loading ? (
                <IconComponent name="Loader2" className="ml-2 h-4 w-4 shrink-0 opacity-50 animate-spin" />
              ) : (
                <IconComponent name="ChevronDown" className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              )}
            </button>
          </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-[var(--radix-dropdown-menu-trigger-width)] w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto z-[100]"
          sideOffset={8}
          collisionPadding={16}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            // Prevent closing if clicking on content, scrollbar, or menu items
            if (target.closest('[data-radix-dropdown-menu-content]') ||
                target.closest('[role="menuitem"]') ||
                target.closest('[data-radix-dropdown-menu-viewport]')) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            // Prevent closing during any interaction with dropdown components
            if (target.closest('[data-radix-dropdown-menu-content]') ||
                target.closest('[role="menuitem"]') ||
                target.closest('[data-radix-dropdown-menu-viewport]')) {
              e.preventDefault();
            }
          }}
        >
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              {currentLanguage === "mm" ? "ရွေးချယ်စရာ မရှိပါ" : "No options found"}
            </div>
          ) : (
            filteredOptions.map((option) => {
              const labelText = typeof option.label === 'string' ? option.label : getLocalizedText(option.label, currentLanguage);
              
              return (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={(e) => {
                    // Prevent default close behavior for multi-select
                    if (isMultiple) {
                      e.preventDefault();
                    }
                    handleSelect(option.value);
                  }}
                  className="flex items-center cursor-pointer"
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
        </DropdownMenuContent>
      </DropdownMenu>

        {/* Action buttons inside the same box */}
        <div className="flex items-center border-l">
          {/* Clear button */}
          {dropdownConfig.clearable && value && !field.readonly && (
            <button
              type="button"
              className="flex items-center justify-center w-9 h-9 hover:bg-accent/50 transition-colors disabled:opacity-50"
              onClick={handleClear}
              title={currentLanguage === "mm" ? "ရှင်းလင်းမည်" : "Clear"}
            >
              <IconComponent name="X" className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}

          {/* Refresh button for dynamic dropdowns */}
          {dropdownConfig.type === "dynamic" && dropdownConfig.refPath && !field.readonly && dependenciesSatisfied && (
            <button
              type="button"
              className="flex items-center justify-center w-9 h-9 hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                lastFetchedDependencyKey.current = ""; // Force refetch
                fetchOptions();
              }}
              disabled={loading}
              title={currentLanguage === "mm" ? "ပြန်ရယူ" : "Refresh"}
            >
              <IconComponent
                name={loading ? "Loader2" : "RefreshCw"}
                className={`h-4 w-4 text-muted-foreground hover:text-foreground ${loading ? "animate-spin" : ""}`}
              />
            </button>
          )}

          {/* Quick Entry button */}
          {field.quickEntry?.enabled && (
            <button
              type="button"
              className="flex items-center justify-center w-9 h-9 hover:bg-accent/50 transition-colors disabled:opacity-50"
              onClick={() => setQuickEntryOpen(true)}
              disabled={field.readonly}
              title={currentLanguage === "mm" ? "အသစ်ထည့်ရန်" : "Add new"}
            >
              <IconComponent name="Plus" className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Entry Dialog */}
      {field.quickEntry?.enabled && (
        <QuickEntryDialog
          config={field.quickEntry}
          isOpen={quickEntryOpen}
          onClose={() => setQuickEntryOpen(false)}
          onSubmit={handleQuickEntrySubmit}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Multi-select selected items display */}
      {isMultiple && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="text-xs"
            >
              {typeof option.label === 'string' ? option.label : getLocalizedText(option.label, currentLanguage)}
              {!field.readonly && (
                <button
                  type="button"
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
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

      {/* Validation error display */}
      {validationError && (
        <p className="text-xs text-destructive mt-1 flex items-center">
          <IconComponent name="AlertCircle" className="w-3 h-3 mr-1" />
          {validationError?.message || getLocalizedErrorMessage('CLIENT_VALIDATION_FAILED', currentLanguage as 'en' | 'mm')}
        </p>
      )}

      {/* Schema error message */}
      {field.validationRule?.errorMessage && !validationError && (
        <p className="text-xs text-muted-foreground mt-1">
          {currentLanguage === "mm"
            ? field.validationRule?.errorMessage?.mm
            : field.validationRule?.errorMessage?.en}
        </p>
      )}
    </div>
  );
}