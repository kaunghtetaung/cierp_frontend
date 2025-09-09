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
  // IMPORTANT: Redirect typeaheadSelect fields to TypeaheadDynamicSelect
  if ((field.fieldType as string) === 'typeaheadSelect' || (field.dropdownConfig as any)?.enableTypeahead || field.dataSource?.enableTypeahead) {
    console.warn(`⚠️ DynamicSelect received typeaheadSelect field "${field.fieldName}". This should use TypeaheadDynamicSelect instead!`);
    // Dynamically import and render TypeaheadDynamicSelect
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`👀 DynamicSelect "${field.fieldName}" dependency values updated:`, {
        dependsOn: dropdownConfig.dependsOn,
        values
      });
    }
    
    return values;
  }, [dropdownConfig.dependsOn, watch, ...watchedFields]);

  // Check if all dependencies are satisfied
  const dependenciesSatisfied = useMemo(() => {
    if (!dropdownConfig.dependsOn) return true;
    
    const satisfied = dropdownConfig.dependsOn.every((fieldName) => {
      const value = dependencyValues[fieldName];
      const isValid = value !== null && value !== undefined && value !== "" && value !== 0;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 DynamicSelect "${field.fieldName}" dependency check:`, {
          fieldName,
          value,
          isValid,
          type: typeof value
        });
      }
      
      return isValid;
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 DynamicSelect "${field.fieldName}" dependencies satisfied:`, {
        satisfied,
        dependsOn: dropdownConfig.dependsOn,
        dependencyValues
      });
    }
    
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

  // Parse module from refPath (e.g., "/departments/ref" -> "departments")
  const getModuleFromRefPath = (refPath: string): string => {
    // Remove leading slash and trailing /ref
    const cleaned = refPath.replace(/^\//, '').replace(/\/ref$/, '');
    return cleaned;
  };

  // Extract label from API response
  const getApiLabel = (item: ApiOption, language: string): string => {
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 DynamicSelect: getApiLabel for ${language}:`, {
        item,
        result: stringLabel,
        labelType: typeof item.label
      });
    }
    
    return String(stringLabel);
  };

  // Fetch options using proper backend integration
  const fetchOptions = useCallback(async () => {
    // Prevent concurrent requests
    if (isFetching.current || loading) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏸️ DynamicSelect: Already loading, skipping for "${field.fieldName}"`);
      }
      return;
    }

    // Mark as fetching to prevent concurrent calls
    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      // Extract module name from refPath
      const module = getModuleFromRefPath(dropdownConfig.refPath!);
      
      // Build query parameters for dependent dropdowns
      const queryParams: Record<string, string> = {};
      
      if (dropdownConfig.dependsOn && dropdownConfig.dependsOn.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 DynamicSelect: Building query params for "${field.fieldName}":`, {
            dependsOn: dropdownConfig.dependsOn,
            dependencyValues
          });
        }
        
        dropdownConfig.dependsOn.forEach((fieldName, index) => {
          // Use dependentFieldValue as the parameter name for backend compatibility
          const paramName = "dependentFieldValue";
          const paramValue = dependencyValues[fieldName];
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 DynamicSelect: Processing dependency "${fieldName}":`, {
              fieldName,
              index,
              paramName,
              paramValue,
              paramValueType: typeof paramValue,
              hasValue: !!paramValue
            });
          }
          
          if (paramValue) {
            // Convert to string to handle any type issues (e.g., objects, numbers)
            queryParams[paramName] = String(paramValue);
          }
        });
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 DynamicSelect: Final query params for "${field.fieldName}":`, queryParams);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 DynamicSelect: Fetching "${field.fieldName}" from module "${module}" with params:`, queryParams);
      }

      // Use server action instead of direct fetch
      const result = await getModuleReferenceAction<ApiOption>(module, queryParams);
      
      if (!result.success) {
        const errorMsg = result.error || getLocalizedErrorMessage('DATA_LOAD_FAILED', currentLanguage as 'en' | 'mm');
        setError(errorMsg);
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ DynamicSelect: Server action failed for "${field.fieldName}":`, {
            error: result.error,
            module,
            queryParams
          });
        }
        throw new Error(errorMsg);
      }

      // Handle different response formats
      const responseData = result.data as any;
      const data = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.data || responseData?.items || []);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ DynamicSelect: Loaded ${data.length} options for "${field.fieldName}"`, data);
      }
      
      // Transform API response to LocalSelectOption format
      const transformedOptions: LocalSelectOption[] = data.map((item: ApiOption, index: number) => {
        const transformedOption = {
          value: String(item._id || item.id || item.value || `missing-id-${index}`),
          label: {
            en: getApiLabel(item, "en"),
            mm: getApiLabel(item, "mm"),
          },
        };
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 DynamicSelect: Transformed option for "${field.fieldName}":`, {
            original: item,
            transformed: transformedOption
          });
        }
        
        return transformedOption;
      });
      
      setOptions(transformedOptions);
      setError(null);
      lastFetchedDependencyKey.current = dependencyKey;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : getLocalizedErrorMessage('DATA_LOAD_FAILED', currentLanguage as 'en' | 'mm');
      setError(errorMsg);
      if (process.env.NODE_ENV === 'development') {
        console.error(`💥 DynamicSelect: Error fetching options for "${field.fieldName}":`, {
          error,
          module: dropdownConfig.refPath ? getModuleFromRefPath(dropdownConfig.refPath) : 'unknown',
          fieldConfig: dropdownConfig
        });
      }
      setOptions([]);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [dependencyValues, dependencyKey, dropdownConfig, field.fieldName]);

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
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏸️ DynamicSelect "${field.fieldName}": Dependencies not satisfied, clearing options and value`);
      }
      if (options.length > 0) {
        setOptions([]);
      }
      // Clear the selected value when dependencies are not satisfied
      if (value && (value !== "" && value !== null && value !== undefined)) {
        onChange(isMultiple ? [] : "");
      }
      lastFetchedDependencyKey.current = "";
      return;
    }

    // Determine if we need to fetch - only fetch when absolutely necessary
    const shouldFetch = (
      // First time initialization
      !hasInitialized.current ||
      // Dependencies have changed (e.g., organization changed for department dropdown)
      lastFetchedDependencyKey.current !== dependencyKey
    );

    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 DynamicSelect "${field.fieldName}" fetch decision:`, {
        shouldFetch,
        hasInitialized: hasInitialized.current,
        preloadData: dropdownConfig.preloadData,
        dependencyChanged: lastFetchedDependencyKey.current !== dependencyKey,
        lastKey: lastFetchedDependencyKey.current,
        currentKey: dependencyKey,
        hasValueNoOptions: value && options.length === 0,
        isFetching: isFetching.current
      });
    }

    if (shouldFetch && !isFetching.current) {
      hasInitialized.current = true;
      fetchOptions();
    }
  }, [
    // Only include stable dependencies that actually affect fetching logic
    dropdownConfig.type,
    dropdownConfig.refPath,
    dependenciesSatisfied,
    dependencyKey,
    fetchOptions
  ]);

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
    if (!value) return [];
    
    const selectedValues = Array.isArray(value) ? value : [value];
    return options.filter((option) => selectedValues.includes(option.value));
  }, [value, options]);

  // Handle option selection
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

  // Handle clear selection
  const handleClear = () => {
    onChange(isMultiple ? [] : "");
  };

  // Remove single item in multi-select
  const handleRemove = (optionValue: string) => {
    if (isMultiple && Array.isArray(value)) {
      const newValues = value.filter((v) => v !== optionValue);
      onChange(newValues);
    }
  };

  // Display text for the select trigger
  const getDisplayText = () => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return field.placeHolder || "Select option";
    }

    if (isMultiple && Array.isArray(value)) {
      return `${value.length} selected`;
    }

    // For single select, find the option with matching value (ID)
    const selectedOption = options.find((option) => option.value === value);
    if (selectedOption) {
      const labelText = typeof selectedOption.label === 'string' ? selectedOption.label : getLocalizedText(selectedOption.label, currentLanguage);
      return labelText;
    }

    // If option not found but we have a value, show loading state or placeholder
    // This happens when form loads with existing data before options are fetched
    if (loading) {
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
              onClick={() => {
                setError(null);
                lastFetchedDependencyKey.current = ""; // Force refetch
                fetchOptions();
              }}
            >
              <IconComponent name="RotateCcw" className="h-3 w-3 mr-1" />
              {currentLanguage === "mm" ? "ပြန်လုပ်" : "Retry"}
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

  // Ref for search input focus management
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current && dropdownConfig.searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open, dropdownConfig.searchable]);

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
          {/* Search input for searchable dropdowns - now inside dropdown */}
          {dropdownConfig.searchable && (
            <div className="p-2 border-b">
              <Input
                ref={searchInputRef}
                placeholder={currentLanguage === "mm" ? "ရှာဖွေပါ..." : "Search..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  // Prevent dropdown from closing on certain keys
                  if (e.key === 'Enter' || e.key === 'Space') {
                    e.stopPropagation();
                  }
                }}
                className="h-8"
                autoFocus
              />
            </div>
          )}
          
          {/* Options list with scrollable container */}
          <div className="max-h-[300px] overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                {currentLanguage === "mm" ? "ရွေးချယ်စရာ မရှိပါ" : "No options found"}
              </div>
            ) : (
              filteredOptions.map((option) => {
              const labelText = typeof option.label === 'string' ? option.label : getLocalizedText(option.label, currentLanguage);
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`🎨 DynamicSelect: Rendering option for "${field.fieldName}":`, {
                  value: option.value,
                  originalLabel: option.label,
                  labelText,
                  currentLanguage
                });
              }
              
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
            ? field.validationRule.errorMessage.mm
            : field.validationRule.errorMessage.en}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-1 mt-1">
        {/* Clear button */}
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
        
        {/* Refresh button for dynamic dropdowns */}
        {dropdownConfig.type === "dynamic" && dropdownConfig.refPath && !field.readonly && dependenciesSatisfied && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              lastFetchedDependencyKey.current = ""; // Force refetch
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