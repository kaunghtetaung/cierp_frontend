"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { getLocalizedText } from "@repo/utils";
import { Input } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { Badge } from "@repo/ui";
import { cn } from "@repo/ui";
import { getModuleReferenceAction } from "@repo/app-modules/server-actions";
import type { FormField, QuickEntryConfig } from "@repo/types";
import type { MultilingualText } from "@repo/types";
import { QuickEntryDialog } from "./components/QuickEntryDialog";
import { submitQuickEntryForm } from "./server-actions/form-actions";
import { Button } from "@repo/ui";

interface TypeaheadDynamicSelectProps {
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
  fullName?: any;
  value?: any;
  code?: string;
  [key: string]: any;
}

export function TypeaheadDynamicSelect({
  field,
  value,
  onChange,
  currentLanguage,
  watch,
  errors,
}: TypeaheadDynamicSelectProps) {
  // Convert object values to appropriate format
  const normalizedValue = useMemo(() => {
    // Single-select: convert object to string
    if (!field.multiple && !Array.isArray(value)) {
      if (value && typeof value === 'object') {
        // Support both {id, name} and {id, label, value} formats
        const idValue = value.id || value._id || value.value;
        if (idValue) {
          return String(idValue);
        }
      }
      return value;
    }
    
    // Multi-select: convert array of objects to array of strings for validation
    if (Array.isArray(value)) {
      return value.map((item: any) => {
        if (item && typeof item === 'object') {
          // Store the label in localStorage when we encounter an object
          const itemId = String(item.id || item._id || item.value || '');
          const itemLabel = String(item.name || item.label || '');
          if (typeof window !== 'undefined' && field.fieldName && itemId && itemLabel) {
            const cacheKey = `typeahead_label_${field.fieldName}_${itemId}`;
            localStorage.setItem(cacheKey, itemLabel);
          }
          return itemId;
        }
        return String(item || '');
      });
    }
    
    return value;
  }, [value, field.fieldName]);
  
  // Call onChange if we need to update the value
  useEffect(() => {
    // Convert objects to proper format for validation
    if (value !== normalizedValue && normalizedValue !== undefined) {
      // For single-select: convert object to string
      if (!field.multiple && typeof value === 'object' && !Array.isArray(value)) {
        onChange(normalizedValue);
      }
      // For multi-select: convert array of objects to array of strings
      else if (field.multiple && Array.isArray(value) && value.length > 0 && 
               typeof value[0] === 'object') {
        onChange(normalizedValue);
      }
    }
  }, [normalizedValue, field.multiple, value]);
  
  // Use normalized value for all operations
  const processedValue = normalizedValue;
  const [options, setOptions] = useState<LocalSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [selectedOption, setSelectedOption] = useState<LocalSelectOption | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const hasProcessedInitialValue = useRef(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  
  const dropdownConfig = field.dropdownConfig || {} as any;
  const dataSource = field.dataSource || {} as any;
  const isMultiple = dropdownConfig.multiple || field.multiple || field.fieldType === "multiSelect";
  const validationError = errors?.[field.fieldName];

  // No need for auto-conversion since we're using localStorage for label caching
  
  // Typeahead configuration
  const enableTypeahead = dropdownConfig.enableTypeahead || dataSource.enableTypeahead;

  const minSearchLength = dropdownConfig.minSearchLength || dataSource.minSearchLength || 2;
  const debounceMs = dropdownConfig.debounceMs || dataSource.debounceMs || 800; // Increased to 800ms for better debouncing
  const searchParam = dropdownConfig.searchParam || dataSource.searchParam || 'search';
  const emptyMessage = dropdownConfig.emptyMessage || dataSource.emptyMessage;
  
  // Refs for debouncing and focus
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>();
  const lastSearchRef = useRef<string>("");
  const requestInProgressRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Parse module from refPath (e.g., "/departments/ref" -> "departments", "/regions/ref?expect=district" -> "regions")
  const getModuleFromRefPath = (refPath: string): string => {
    // Split by '?' to separate path from query parameters
    const [basePath] = refPath.split('?');
    // Remove leading slash and trailing /ref
    const cleaned = basePath.replace(/^\//, '').replace(/\/ref$/, '');
    return cleaned;
  };

  // Calculate dropdown position for portal
  const calculateDropdownPosition = useCallback(() => {
    if (!inputContainerRef.current) return null;
    
    const rect = inputContainerRef.current.getBoundingClientRect();
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    
    return {
      top: rect.bottom + scrollY + 4, // 4px gap below input
      left: rect.left + scrollX,
      width: rect.width
    };
  }, []);

  // Extract label from API response
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
    
    // Handle fullName for authors
    if (item.fullName && typeof item.fullName === "string") {
      return item.fullName;
    }
    
    // Handle code + name format
    if (item.code && item.name) {
      const nameStr = typeof item.name === "object" 
        ? (item.name[language] || item.name.en || item.name.mm || "")
        : item.name;
      return `${item.code} - ${nameStr}`;
    }
    
    // Handle label
    if (item.label && typeof item.label === "string") {
      return item.label;
    }
    
    if (item.label && typeof item.label === "object") {
      const labelText = item.label[language] || item.label.en || item.label.mm || "";
      if (labelText) return labelText;
    }
    
    // Handle displayName
    if (item.displayName && typeof item.displayName === "string") {
      return item.displayName;
    }
    
    if (item.displayName && typeof item.displayName === "object") {
      const displayText = item.displayName[language] || item.displayName.en || item.displayName.mm || "";
      if (displayText) return displayText;
    }
    
    // Handle name
    if (item.name && typeof item.name === "string") {
      return item.name;
    }
    
    if (item.name && typeof item.name === "object") {
      const nameText = item.name[language] || item.name.en || item.name.mm || "";
      if (nameText) return nameText;
    }
    
    // Final fallbacks
    return String(item.title || item._id || item.id || item.value || "");
  };

  // Fetch options with search support
  const fetchOptions = useCallback(async (search: string = "") => {
    // For typeahead mode, REQUIRE search input - don't fetch all data
    if (enableTypeahead) {
      if (!search || search.length < minSearchLength) {
        setOptions([]);
        return;
      }
    }

    // Skip if this is the same search as last time
    if (search === lastSearchRef.current && options.length > 0) {
      return;
    }
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Skip if a request is already in progress
    if (requestInProgressRef.current) {
      return;
    }
    
    lastSearchRef.current = search;
    requestInProgressRef.current = true;
    abortControllerRef.current = new AbortController();

    setIsSearching(true);
    setError(null);

    try {
      const module = getModuleFromRefPath(dropdownConfig.refPath || dataSource.endpoint || "");
      
      // Extract predefined query parameters from endpoint
      const endpoint = dropdownConfig.refPath || dataSource.endpoint || "";
      const [, queryString] = endpoint.split('?');
      const predefinedParams: Record<string, string> = {};
      if (queryString) {
        const urlParams = new URLSearchParams(queryString);
        urlParams.forEach((value, key) => {
          predefinedParams[key] = value;
        });
      }

      // Build query parameters, merging with predefined params
      const queryParams: Record<string, string> = { ...predefinedParams };

      // Add search parameter for typeahead
      if (enableTypeahead && search) {
        queryParams[searchParam] = search;
      }

      // Add searchType parameter for dynamicDependentSelect fields (avoid conflict with search param)
      if ((field.fieldType === 'dynamicDependentSelect' || field.fieldType === 'multiDependentSelect') &&
          (!enableTypeahead || !search)) {
        queryParams.searchType = 'dynamicDependentSelect';
      }

      // Add dependency values if any
      if (dropdownConfig.dependsOn && watch) {
        // Use searchParam from dataSource if specified, otherwise use dependentFieldValue for backward compatibility
        const paramName = dataSource?.searchParam || "dependentFieldValue";
        dropdownConfig.dependsOn.forEach((fieldName: string) => {
          const value = watch(fieldName);
          if (value) {
            queryParams[paramName] = String(value);
          }
        });
      }


      // Pass serviceName if specified in dataSource or dropdownConfig
      const serviceName = dataSource?.serviceName || dropdownConfig?.serviceName;
      
      console.log('🔍 TypeaheadDynamicSelect - API call config:', {
        fieldName: field.fieldName,
        dataSource,
        dropdownConfig,
        serviceName,
        module,
        endpoint: dropdownConfig.refPath || dataSource.endpoint,
        hasDropdownConfig: !!dropdownConfig,
        hasDataSource: !!dataSource,
        dropdownServiceName: dropdownConfig?.serviceName,
        dataSourceServiceName: dataSource?.serviceName
      });
      
      const result = await getModuleReferenceAction<ApiOption>(module, queryParams, serviceName || undefined);
      
      if (!result.success) {
        const errorMsg = result.error || 'Failed to load options';
        setError(errorMsg);
        setOptions([]);
        return;
      }

      const responseData = result.data as any;
      const data = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.data || responseData?.items || []);
      
      // Use configured valueField and labelField from dropdownConfig or dataSource
      const valueField = dropdownConfig.valueField || dataSource.valueField || 'id';
      const labelField = dropdownConfig.labelField || dataSource.labelField || 'name';
      
      const transformedOptions: LocalSelectOption[] = data.map((item: ApiOption, index: number) => {
        // Extract value using configured field
        let itemValue = item[valueField];
        if (!itemValue) {
          // Fallback to common ID fields
          itemValue = item._id || item.id || item.value || `missing-id-${index}`;
        }
        
        return {
          value: String(itemValue),
          label: {
            en: getApiLabel(item, "en", labelField),
            mm: getApiLabel(item, "mm", labelField),
          },
        };
      });

      // Deduplicate options based on value to prevent React key conflicts
      const uniqueOptions = transformedOptions.filter((option, index, array) =>
        array.findIndex(opt => opt.value === option.value) === index
      );

      setOptions(uniqueOptions);
      
    } catch (error: any) {
      // Don't show error for aborted requests
      if (error?.name !== 'AbortError') {
        const errorMsg = error instanceof Error ? error.message : "Failed to load options";
        setError(errorMsg);
        setOptions([]);
      }
    } finally {
      setIsSearching(false);
      requestInProgressRef.current = false;
      abortControllerRef.current = null;
    }
  }, [currentLanguage, dropdownConfig, dataSource, enableTypeahead, minSearchLength, searchParam, watch]); // Removed options.length to prevent loops

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setDisplayValue(value);
    setHighlightedIndex(-1);
    
    // Clear existing timer FIRST
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = undefined;
    }

    // If value is too short, close dropdown and don't search
    if (value.length < minSearchLength) {
      setOpen(false);
      setOptions([]);
      return;
    }
    
    // Show dropdown when typing
    const position = calculateDropdownPosition();
    setDropdownPosition(position);
    setOpen(true);

    // Set new timer for search
    debounceTimerRef.current = setTimeout(() => {
      fetchOptions(value);
    }, debounceMs) as unknown as NodeJS.Timeout;
  }, [minSearchLength, debounceMs, fetchOptions, calculateDropdownPosition]);

  // Handle initial value for edit scenarios
  useEffect(() => {
    // Use normalizedValue instead of raw value
    if (!normalizedValue) {
      hasProcessedInitialValue.current = false;
      return;
    }
    
    // Skip if we've already processed this value to prevent loops
    if (hasProcessedInitialValue.current) return;
    
    // If the original value was an object, we need to handle display
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Support both {id, name} and {id, label} formats
      let displayText = value.label || value.name || value.title;
      
      // Special handling for language objects with code
      if (value.code && value.name) {
        displayText = `${value.code} - ${value.name}`;
      }
      
      if (displayText) {
        const labelText = typeof displayText === 'string' ? displayText : getLocalizedText(displayText, currentLanguage);
        setDisplayValue(labelText);
        
        // Create option for display
        const optionToAdd = {
          value: normalizedValue,
          label: typeof displayText === 'string' ? {
            en: displayText,
            mm: displayText
          } : displayText
        };
        
        setSelectedOption(optionToAdd);
        setOptions(prev => {
          if (!prev.find(opt => opt.value === normalizedValue)) {
            return [...prev, optionToAdd];
          }
          return prev;
        });
        
        // Save to localStorage
        if (typeof window !== 'undefined' && field.fieldName && normalizedValue) {
          const cacheKey = `typeahead_label_${field.fieldName}_${normalizedValue}`;
          localStorage.setItem(cacheKey, labelText);
        }
      }
      hasProcessedInitialValue.current = true;
      return;
    }

    // Case 1: Array of objects for multi-select edit (original value check)
    if (Array.isArray(value) && value.length > 0 && isMultiple) {
      const hasObjectsWithIdName = value.some(item => 
        item && typeof item === 'object' && (item.id || item._id) && (item.name || item.label)
      );
      
      if (hasObjectsWithIdName) {
        // Transform array of {id, name} or {id, label} objects to our standard format
        const transformedOptions = value
          .filter(item => item && typeof item === 'object' && (item.id || item._id) && (item.name || item.label))
          .map(item => ({
            value: String(item.id || item._id || item.value),
            label: {
              en: String(item.name || item.label || ''),
              mm: String(item.name || item.label || '')
            }
          }));
        
        // Set options to include the initial values - IMPORTANT: This ensures names are displayed in badges
        setOptions(prevOptions => {
          const existingValues = prevOptions.map(opt => opt.value);
          const newOptions = transformedOptions.filter(opt => !existingValues.includes(opt.value));
          return [...prevOptions, ...newOptions];
        });
        
        // Store labels in localStorage for each item
        if (typeof window !== 'undefined' && field.fieldName) {
          value.forEach((item: any) => {
            if (item && typeof item === 'object') {
              const itemId = String(item.id || item._id || item.value);
              const itemLabel = String(item.name || item.label || '');
              if (itemId && itemLabel) {
                const cacheKey = `typeahead_label_${field.fieldName}_${itemId}`;
                localStorage.setItem(cacheKey, itemLabel);
              }
            }
          });
        }
        
        // Set display for multi-select (will show as badges with names)
        setDisplayValue("");
        hasProcessedInitialValue.current = true;
        return;
      }
    }

    // Case 2: Value is an object with label (API format from backend)
    if (typeof value === 'object' && !Array.isArray(value) && value.label && selectedOption) {
      hasProcessedInitialValue.current = true;
      return;
    }
    if (typeof value === 'object' && !Array.isArray(value) && value.label) {
      // Extract the ID from the object
      const idValue = String(value.id || value._id || value.value || "");
      
      // Create standard option format
      const transformedOption = {
        value: idValue,
        label: value.label
      };
      
      setSelectedOption(transformedOption);
      const labelText = typeof value.label === 'string' ? value.label : getLocalizedText(value.label, currentLanguage);
      setDisplayValue(labelText);
      
      // Store label in localStorage for future use
      if (typeof window !== 'undefined' && field.fieldName && idValue) {
        const cacheKey = `typeahead_label_${field.fieldName}_${idValue}`;
        localStorage.setItem(cacheKey, labelText);
      }
      
      // IMPORTANT: Convert to string ID for form validation
      if (idValue) {
        onChange(idValue);
      }
      
      hasProcessedInitialValue.current = true;
      return;
    }

    // Case 3: Single object with id and label (old cache format - convert to string)
    if (typeof value === 'object' && !Array.isArray(value) && (value.id || value._id) && (value.label || value.name)) {
      // This is an old cached object, convert it to string ID
      const idValue = String(value.id || value._id || value.value);
      const displayText = value.label || value.name;
      
      // Transform to our standard format
      const transformedOption = {
        value: idValue,
        label: typeof displayText === 'string' ? {
          en: displayText,
          mm: displayText
        } : displayText
      };
      
      // Set the option and ensure it's added to options list for consistency
      setSelectedOption(transformedOption);
      setOptions(prevOptions => {
        const existingOption = prevOptions.find(opt => opt.value === transformedOption.value);
        if (!existingOption) {
          return [...prevOptions, transformedOption];
        }
        return prevOptions;
      });
      
      // Set display value
      const labelText = typeof displayText === 'string' 
        ? displayText 
        : getLocalizedText(displayText, currentLanguage);
      setDisplayValue(labelText);
      
      // Convert the object to string ID for form validation
      onChange(idValue);
      
      hasProcessedInitialValue.current = true;
      return;
    }

    // Case 4: Array of string IDs for multi-select (existing data)
    if (Array.isArray(value) && value.length > 0 && isMultiple) {
      const hasObjectsWithIdName = value.some(item => 
        item && typeof item === 'object' && (item.id || item._id) && (item.name || item.label)
      );
      
      if (!hasObjectsWithIdName) {
        // For array of string IDs, labels will be retrieved from localStorage or fetched
        // when displaying badges
        setDisplayValue("");
        hasProcessedInitialValue.current = true;
        
        // For non-typeahead mode, fetch options to get labels
        if (!enableTypeahead) {
          const fetchOptionsForIds = async () => {
            try {
              // Check if all values already exist in options
              const missingIds = value.filter((id: string) => !options.find(opt => opt.value === id));
              
              if (missingIds.length > 0) {
                // Fetch options to get the names for display
                const module = getModuleFromRefPath(dropdownConfig.refPath || dataSource.endpoint || "");

                // Extract predefined query parameters
                const endpoint = dropdownConfig.refPath || dataSource.endpoint || "";
                const [, queryString] = endpoint.split('?');
                const predefinedParams: Record<string, string> = {};
                if (queryString) {
                  const urlParams = new URLSearchParams(queryString);
                  urlParams.forEach((value, key) => {
                    predefinedParams[key] = value;
                  });
                }

                const serviceName = dataSource?.serviceName || undefined;
                const result = await getModuleReferenceAction<ApiOption>(module, predefinedParams, serviceName);
              
              if (result.success) {
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
                
                // Merge with existing options, avoiding duplicates
                setOptions(prevOptions => {
                  const existingValues = prevOptions.map(opt => opt.value);
                  const newOptions = transformedOptions.filter(opt => !existingValues.includes(opt.value));
                  return [...prevOptions, ...newOptions];
                });
                  // Store labels in localStorage for fetched options
                  if (typeof window !== 'undefined' && field.fieldName) {
                    transformedOptions.forEach(opt => {
                      if (value.includes(opt.value)) {
                        const labelText = typeof opt.label === 'string' 
                          ? opt.label 
                          : getLocalizedText(opt.label, currentLanguage);
                        const cacheKey = `typeahead_label_${field.fieldName}_${opt.value}`;
                        localStorage.setItem(cacheKey, labelText);
                      }
                    });
                  }
                }
              }
            } catch (error) {
              console.error('Failed to fetch options for multi-select browser storage restoration:', error);
            }
          };

          fetchOptionsForIds();
        }
        return;
      }
    }

    // Case 5: Simple string value (standard format from form)
    if (typeof value === 'string' && !selectedOption && value.trim() !== '') {
      // Try to get cached label from localStorage
      if (typeof window !== 'undefined' && field.fieldName) {
        const cacheKey = `typeahead_label_${field.fieldName}_${value}`;
        const cachedLabel = localStorage.getItem(cacheKey);
        if (cachedLabel) {
          setDisplayValue(cachedLabel);
          const transformedOption = {
            value: value,
            label: { en: cachedLabel, mm: cachedLabel }
          };
          setSelectedOption(transformedOption);
          hasProcessedInitialValue.current = true;
          return;
        }
      }
      
      // For typeahead mode, just show the ID if no cached label
      if (enableTypeahead) {
        setDisplayValue(value);
        hasProcessedInitialValue.current = true;
        return;
      }
      
      // For non-typeahead mode, fetch the option to display the name
      const fetchOptionForId = async () => {
        try {
          // First check if the option already exists in our options array
          const existingOption = options.find(opt => opt.value === value);
          if (existingOption) {
            setSelectedOption(existingOption);
            const labelText = typeof existingOption.label === 'string' ? existingOption.label : getLocalizedText(existingOption.label, currentLanguage);
            setDisplayValue(labelText);
            return;
          }

          // If not found in options, fetch all options to find this specific ID
          const module = getModuleFromRefPath(dropdownConfig.refPath || dataSource.endpoint || "");

          // Extract predefined query parameters
          const endpoint = dropdownConfig.refPath || dataSource.endpoint || "";
          const [, queryString] = endpoint.split('?');
          const predefinedParams: Record<string, string> = {};
          if (queryString) {
            const urlParams = new URLSearchParams(queryString);
            urlParams.forEach((value, key) => {
              predefinedParams[key] = value;
            });
          }

          const serviceName = dataSource?.serviceName || undefined;
          const result = await getModuleReferenceAction<ApiOption>(module, predefinedParams, serviceName);
          
          if (result.success) {
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

            // Deduplicate options based on value to prevent React key conflicts
            const uniqueOptions = transformedOptions.filter((option, index, array) =>
              array.findIndex(opt => opt.value === option.value) === index
            );

            // Update options array with fetched data
            setOptions(uniqueOptions);
            
            // Find the specific option that matches our value
            const matchingOption = uniqueOptions.find(opt => opt.value === value);
            if (matchingOption) {
              setSelectedOption(matchingOption);
              const labelText = typeof matchingOption.label === 'string' ? matchingOption.label : getLocalizedText(matchingOption.label, currentLanguage);
              setDisplayValue(labelText);
            } else {
              // If still not found, show the ID but mark it as potentially invalid
              setDisplayValue(String(value));
            }
          } else {
            // If fetch fails, fallback to showing the ID
            setDisplayValue(String(value));
          }
        } catch (error) {
          console.error('Failed to fetch option for browser storage restoration:', error);
          // Fallback to showing the ID
          setDisplayValue(String(value));
        }
      };

      fetchOptionForId();
      hasProcessedInitialValue.current = true;
      return;
    }
    
    // Mark as processed for any other value types
    hasProcessedInitialValue.current = true;
  }, [value, normalizedValue, currentLanguage, isMultiple, field.fieldName]); // Added normalizedValue to dependencies

  // Update display value when selected option changes
  useEffect(() => {
    if (selectedOption && !isFocused) {
      const labelText = typeof selectedOption.label === 'string' ? selectedOption.label : getLocalizedText(selectedOption.label, currentLanguage);
      setDisplayValue(labelText);
    }
  }, [selectedOption, currentLanguage, isFocused]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Filter options locally for display
  const filteredOptions = useMemo(() => {
    return options;
  }, [options]);

  // Handle selection
  const handleSelect = (optionValue: string) => {
    const selected = options.find(opt => opt.value === optionValue);
    
    if (isMultiple) {
      // For multi-select, manage array of strings and store labels separately
      const currentValues = Array.isArray(processedValue) ? processedValue : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v: string) => v !== optionValue)
        : [...currentValues, optionValue];
      
      onChange(newValues);
      
      // Store/remove label in localStorage
      if (selected && typeof window !== 'undefined' && field.fieldName) {
        const labelText = typeof selected.label === 'string' 
          ? selected.label 
          : getLocalizedText(selected.label, currentLanguage);
        const cacheKey = `typeahead_label_${field.fieldName}_${optionValue}`;
        
        if (currentValues.includes(optionValue)) {
          // Removing - delete from localStorage
          localStorage.removeItem(cacheKey);
        } else {
          // Adding - save to localStorage  
          localStorage.setItem(cacheKey, labelText);
        }
      }
    } else {
      // For single select, pass just the ID string for validation
      onChange(optionValue);
      if (selected) {
        setSelectedOption(selected);
        const labelText = typeof selected.label === 'string' 
          ? selected.label 
          : getLocalizedText(selected.label, currentLanguage);
        setDisplayValue(labelText);
        
        // Store the label in localStorage separately for display purposes
        if (typeof window !== 'undefined' && field.fieldName) {
          const cacheKey = `typeahead_label_${field.fieldName}_${optionValue}`;
          localStorage.setItem(cacheKey, labelText);
        }
      }
      setOpen(false);
      setDropdownPosition(null);
      setSearchTerm("");
    }
  };

  // Handle Quick Entry submission
  const handleQuickEntrySubmit = async (data: Record<string, unknown>) => {
    if (!field.quickEntry) return;
    
    const endpoint = field.quickEntry.endpoint || '';
    const result = await submitQuickEntryForm(endpoint, data, field.quickEntry.serviceName);
    
    if (result.success && result.data) {
      // Get the configured label and value fields
      const labelField = dropdownConfig.labelField || field.dataSource?.labelField || 'name';
      const valueField = dropdownConfig.valueField || field.dataSource?.valueField || 'id';
      
      // Extract the ID (for value) and label from the returned data
      const newItemId = result.data[valueField] || result.data._id || result.data.id;
      const newItemLabel = result.data[labelField] || result.data.displayName || result.data.name;
      
      if (newItemId) {
        // Create properly formatted label
        const formattedLabel = typeof newItemLabel === 'object' ? newItemLabel : {
          en: newItemLabel || newItemId,
          mm: newItemLabel || newItemId
        };
        
        // For typeahead, search for the new item to add it to options
        const searchTerm = typeof newItemLabel === 'object' 
          ? newItemLabel[currentLanguage] || newItemLabel.en || String(newItemId)
          : newItemLabel || String(newItemId);
        
        // Create new option
        const newOption: LocalSelectOption = {
          value: String(newItemId),
          label: formattedLabel
        };
        
        // Add to options
        setOptions(prevOptions => {
          // Check if option already exists
          const exists = prevOptions.some(opt => opt.value === String(newItemId));
          if (!exists) {
            return [...prevOptions, newOption];
          }
          return prevOptions;
        });
        
        // Auto-select the newly created item if configured
        if (field.quickEntry.autoSelect !== false) {
          if (isMultiple) {
            const currentValues = Array.isArray(processedValue) ? processedValue : [];
            onChange([...currentValues, String(newItemId)]);
            
            // Cache the label for multi-select badge display
            if (typeof window !== 'undefined' && field.fieldName) {
              const displayText = typeof formattedLabel === 'string' 
                ? formattedLabel 
                : formattedLabel[currentLanguage] || formattedLabel.en || String(newItemId);
              const cacheKey = `typeahead_label_${field.fieldName}_${String(newItemId)}`;
              localStorage.setItem(cacheKey, displayText);
            }
          } else {
            // Set the value (ID)
            onChange(String(newItemId));
            // Set display value (label)
            const displayText = typeof formattedLabel === 'string' 
              ? formattedLabel 
              : formattedLabel[currentLanguage] || formattedLabel.en || String(newItemId);
            setDisplayValue(displayText);
            setSelectedOption(newOption);
            
            // Cache the label for single select
            if (typeof window !== 'undefined' && field.fieldName) {
              const cacheKey = `typeahead_label_${field.fieldName}_${String(newItemId)}`;
              localStorage.setItem(cacheKey, displayText);
            }
          }
        }
        
        // Also fetch options with search term to ensure the new item appears
        await fetchOptions(searchTerm);
      }
      
      setOpen(false);
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create');
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          const position = calculateDropdownPosition();
          setDropdownPosition(position);
        }
        setOpen(true);
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open) {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setDropdownPosition(null);

        // Clear the entire selection (both single and multi-select)
        if (isMultiple && Array.isArray(processedValue) && processedValue.length > 0) {
          // Clear all cached labels for multi-select
          if (typeof window !== 'undefined' && field.fieldName) {
            processedValue.forEach((val: string) => {
              const cacheKey = `typeahead_label_${field.fieldName}_${val}`;
              localStorage.removeItem(cacheKey);
            });
          }
          onChange([]);
        } else if (!isMultiple && processedValue) {
          // Clear single select
          if (typeof window !== 'undefined' && field.fieldName && processedValue) {
            const cacheKey = `typeahead_label_${field.fieldName}_${processedValue}`;
            localStorage.removeItem(cacheKey);
          }
          onChange(null);
        }

        setSelectedOption(null);
        setDisplayValue("");
        setSearchTerm("");
        break;
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    // Clear display to allow typing for typeahead
    if (enableTypeahead) {
      setDisplayValue("");
      setSearchTerm("");
    } else if (searchTerm) {
      setDisplayValue(searchTerm);
    }
    // Only open dropdown if we have valid search for typeahead
    if (!enableTypeahead || (searchTerm.length >= minSearchLength)) {
      const position = calculateDropdownPosition();
      setDropdownPosition(position);
      if (!enableTypeahead) {
        setOpen(true);
      }
    }
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    // Delay to allow click on dropdown items
    setTimeout(() => {
      if (!open) {
        if (selectedOption) {
          const labelText = typeof selectedOption.label === 'string' ? selectedOption.label : getLocalizedText(selectedOption.label, currentLanguage);
      setDisplayValue(labelText);
        } else {
          setDisplayValue("");
        }
        setSearchTerm("");
      }
    }, 200);
  };
  
  // Handle input click - ensure it's focusable
  const handleInputClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      requestInProgressRef.current = false;
    };
  }, []);

  // Handle click outside and position updates
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputContainerRef.current && !inputContainerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setDropdownPosition(null);
        if (selectedOption) {
          const labelText = typeof selectedOption.label === 'string' ? selectedOption.label : getLocalizedText(selectedOption.label, currentLanguage);
          setDisplayValue(labelText);
        } else {
          setDisplayValue("");
        }
        setSearchTerm("");
      }
    };

    const handleScroll = () => {
      if (open && inputContainerRef.current) {
        const position = calculateDropdownPosition();
        setDropdownPosition(position);
      }
    };

    const handleResize = () => {
      if (open && inputContainerRef.current) {
        const position = calculateDropdownPosition();
        setDropdownPosition(position);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, selectedOption, currentLanguage, calculateDropdownPosition]);

  // Get empty message
  const getEmptyMessage = () => {
    if (emptyMessage) {
      return typeof emptyMessage === "object" 
        ? (emptyMessage[currentLanguage] || emptyMessage.en || "No results found")
        : emptyMessage;
    }
    
    if (enableTypeahead && searchTerm.length > 0 && searchTerm.length < minSearchLength) {
      return `Type at least ${minSearchLength} characters to search...`;
    }
    
    if (enableTypeahead && searchTerm.length === 0) {
      return "Start typing to search...";
    }
    
    return "No results found";
  };

  return (
    <div className="relative" ref={inputContainerRef}>
      {/* Display selected items as badges for multi-select */}
      {isMultiple && Array.isArray(processedValue) && processedValue.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {processedValue.map((itemId: string, index: number) => {
            // Item is always a string ID now
            let label = itemId;
            
            // Try to get cached label
            if (typeof window !== 'undefined' && field.fieldName) {
              const cacheKey = `typeahead_label_${field.fieldName}_${itemId}`;
              const cachedLabel = localStorage.getItem(cacheKey);
              if (cachedLabel) {
                label = cachedLabel;
              }
            }
            
            // If not in cache, try to find in options
            if (label === itemId) {
              const option = options.find(opt => opt.value === itemId);
              if (option) {
                label = typeof option.label === 'string' 
                  ? option.label 
                  : getLocalizedText(option.label, currentLanguage);
              }
            }
            
            return (
              <Badge key={itemId || index} variant="secondary" className="gap-1">
                {label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Remove from selection
                    const newValues = processedValue.filter((v: string) => v !== itemId);
                    onChange(newValues);
                    
                    // Remove from localStorage
                    if (typeof window !== 'undefined' && field.fieldName) {
                      const cacheKey = `typeahead_label_${field.fieldName}_${itemId}`;
                      localStorage.removeItem(cacheKey);
                    }
                  }}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <IconComponent name="X" className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
      
      {/* Search Input - Always visible */}
      <div className={field.quickEntry?.enabled ? "flex gap-2" : ""}>
        <div className={field.quickEntry?.enabled ? "relative flex-1" : "relative"}>
          <Input
          ref={searchInputRef}
          type="text"
          placeholder={
            selectedOption && !isFocused
              ? ""
              : `Type to search ${field.label ? getLocalizedText(field.label, currentLanguage).toLowerCase() : 'options'}...`
          }
          value={displayValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleInputClick}
          disabled={false}
          readOnly={false}
          autoFocus={false}
          className={cn(
            "w-full pr-10 cursor-text",
            validationError && "border-destructive",
            !processedValue && "text-muted-foreground"
          )}
          aria-label={field.label ? getLocalizedText(field.label, currentLanguage) : "Search"}
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
          autoComplete="off"
        />
        
        {/* Icons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          {isSearching && (
            <IconComponent name="Loader2" className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {((isMultiple && Array.isArray(processedValue) && processedValue.length > 0) || 
           (!isMultiple && processedValue)) && !isSearching && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Clear all cached labels for multi-select
                if (isMultiple && Array.isArray(processedValue) && typeof window !== 'undefined' && field.fieldName) {
                  processedValue.forEach((val: string) => {
                    const cacheKey = `typeahead_label_${field.fieldName}_${val}`;
                    localStorage.removeItem(cacheKey);
                  });
                }
                
                onChange(isMultiple ? [] : null);
                setSelectedOption(null);
                setDisplayValue("");
                setSearchTerm("");
                setOptions([]);
              }}
              className="p-0.5 hover:bg-accent rounded pointer-events-auto"
            >
              <IconComponent name="X" className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
          <IconComponent 
            name="ChevronDown" 
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </div>
      
        {/* Quick Entry button */}
        {field.quickEntry?.enabled && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setQuickEntryOpen(true)}
            disabled={field.readonly}
            title={currentLanguage === "mm" ? "အသစ်ထည့်ရန်" : "Add new"}
          >
            <IconComponent name="Plus" className="h-4 w-4" />
          </Button>
        )}
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

      {/* Options Dropdown - Rendered as Portal */}
      {open && dropdownPosition && typeof window !== 'undefined' && 
        createPortal(
          <div 
            ref={dropdownRef}
            className="fixed z-[9999] bg-popover border rounded-md shadow-md"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            <div className="max-h-[300px] overflow-auto p-1">
              {isSearching && searchTerm.length >= minSearchLength ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <IconComponent name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </div>
              ) : error ? (
                <div className="py-6 text-center text-sm text-destructive">
                  {error}
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {getEmptyMessage()}
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={
                      isMultiple 
                        ? Array.isArray(processedValue) && processedValue.includes(option.value)
                        : processedValue === option.value
                    }
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                      highlightedIndex === index && "bg-accent text-accent-foreground",
                      (isMultiple && Array.isArray(processedValue) && processedValue.includes(option.value)) ||
                      (!isMultiple && processedValue === option.value) 
                        ? "font-medium" 
                        : ""
                    )}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <IconComponent
                      name="Check"
                      className={cn(
                        "mr-2 h-4 w-4",
                        (isMultiple && Array.isArray(processedValue) && processedValue.includes(option.value)) ||
                        (!isMultiple && processedValue === option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span>{typeof option.label === 'string' ? option.label : getLocalizedText(option.label, currentLanguage)}</span>
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )
      }

      
      {validationError && (
        <p className="mt-1 text-sm text-destructive">
          {typeof validationError === 'string' 
            ? validationError 
            : (validationError?.message || "This field is required")}
        </p>
      )}
    </div>
  );
}