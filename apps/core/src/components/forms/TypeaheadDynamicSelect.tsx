"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { getLocalizedText } from "@repo/utils";
import { Input } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { Badge } from "@repo/ui";
import { cn } from "@repo/ui";
import { getModuleReferenceAction } from "@repo/app-modules/server-actions";
import type { FormField } from "@repo/types";
import type { MultilingualText } from "@repo/types";

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
  
  const dropdownConfig = field.dropdownConfig || {} as any;
  const dataSource = field.dataSource || {} as any;
  const isMultiple = dropdownConfig.multiple || field.fieldType === "multiSelect";
  const validationError = errors?.[field.fieldName];
  
  // Typeahead configuration
  const enableTypeahead = dropdownConfig.enableTypeahead || dataSource.enableTypeahead || true;
  const minSearchLength = dropdownConfig.minSearchLength || dataSource.minSearchLength || 2;
  const debounceMs = dropdownConfig.debounceMs || dataSource.debounceMs || 300;
  const searchParam = dropdownConfig.searchParam || dataSource.searchParam || 'search';
  const emptyMessage = dropdownConfig.emptyMessage || dataSource.emptyMessage;
  
  // Refs for debouncing and focus
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse module from refPath
  const getModuleFromRefPath = (refPath: string): string => {
    const cleaned = refPath.replace(/^\//, '').replace(/\/ref$/, '');
    return cleaned;
  };

  // Extract label from API response
  const getApiLabel = (item: ApiOption, language: string): string => {
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
    // For typeahead, don't fetch if search is too short
    if (enableTypeahead && search.length > 0 && search.length < minSearchLength) {
      setOptions([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const module = getModuleFromRefPath(dropdownConfig.refPath || dataSource.endpoint || "");
      
      // Build query parameters
      const queryParams: Record<string, string> = {};
      
      // Add search parameter for typeahead
      if (enableTypeahead && search) {
        queryParams[searchParam] = search;
      }
      
      // Add dependency values if any
      if (dropdownConfig.dependsOn && watch) {
        dropdownConfig.dependsOn.forEach((fieldName: string) => {
          const value = watch(fieldName);
          if (value) {
            queryParams.dependentFieldValue = String(value);
          }
        });
      }

      console.log(`🔍 TypeaheadDynamicSelect: Fetching with params:`, { module, queryParams });

      const result = await getModuleReferenceAction<ApiOption>(module, queryParams);
      
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
      
      const transformedOptions: LocalSelectOption[] = data.map((item: ApiOption) => ({
        value: String(item._id || item.id || item.value || ""),
        label: {
          en: getApiLabel(item, "en"),
          mm: getApiLabel(item, "mm"),
        },
      }));
      
      setOptions(transformedOptions);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to load options";
      setError(errorMsg);
      setOptions([]);
    } finally {
      setIsSearching(false);
    }
  }, [currentLanguage, dropdownConfig, dataSource, enableTypeahead, minSearchLength, searchParam, watch]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setDisplayValue(value);
    setHighlightedIndex(-1);
    
    // Show dropdown when typing
    if (value.length >= minSearchLength) {
      setOpen(true);
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      fetchOptions(value);
    }, debounceMs);
  }, [minSearchLength, debounceMs, fetchOptions]);

  // IMPORTANT: For typeahead fields, DO NOT fetch data for initial values
  // The whole point of typeahead is to only fetch when user types
  // If we have a value, just show it as text without fetching options
  useEffect(() => {
    if (value && !selectedOption) {
      // For typeahead fields, NEVER fetch data automatically
      // Just display the value ID if we don't have the label
      // The proper label will be fetched when user starts typing
      
      if (typeof value === 'object' && value.label) {
        setSelectedOption(value);
        const labelText = typeof value.label === 'string' ? value.label : getLocalizedText(value.label, currentLanguage);
        setDisplayValue(labelText);
      } else if (value) {
        // Don't fetch! Just show the ID temporarily
        // When user focuses and types, we'll fetch the proper options
        console.log(`📝 TypeaheadDynamicSelect: Showing value "${value}" without fetching for field "${field.fieldName}"`);
        setDisplayValue(String(value));
      }
    }
  }, [value]);

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
    if (isMultiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v: string) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      const selected = options.find(opt => opt.value === optionValue);
      setSelectedOption(selected || null);
      if (selected) {
        const labelText = typeof selected.label === 'string' ? selected.label : getLocalizedText(selected.label, currentLanguage);
        setDisplayValue(labelText);
      }
      setOpen(false);
      setSearchTerm("");
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
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
        // Restore display value to selected option
        if (selectedOption) {
          const labelText = typeof selectedOption.label === 'string' ? selectedOption.label : getLocalizedText(selectedOption.label, currentLanguage);
      setDisplayValue(labelText);
        } else {
          setDisplayValue("");
        }
        setSearchTerm("");
        break;
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(searchTerm);
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

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        if (selectedOption) {
          const labelText = typeof selectedOption.label === 'string' ? selectedOption.label : getLocalizedText(selectedOption.label, currentLanguage);
      setDisplayValue(labelText);
        } else {
          setDisplayValue("");
        }
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption, currentLanguage]);

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
    <div className="relative" ref={dropdownRef}>
      {/* Search Input - Always visible */}
      <div className="relative">
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
          className={cn(
            "w-full pr-10",
            validationError && "border-destructive",
            !value && "text-muted-foreground"
          )}
          aria-label={field.label ? getLocalizedText(field.label, currentLanguage) : "Search"}
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
        />
        
        {/* Icons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <IconComponent name="Loader2" className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {value && !isSearching && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(isMultiple ? [] : null);
                setSelectedOption(null);
                setDisplayValue("");
                setSearchTerm("");
                setOptions([]);
              }}
              className="p-0.5 hover:bg-accent rounded"
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

      {/* Options Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
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
                      ? Array.isArray(value) && value.includes(option.value)
                      : value === option.value
                  }
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                    highlightedIndex === index && "bg-accent text-accent-foreground",
                    (isMultiple && Array.isArray(value) && value.includes(option.value)) ||
                    (!isMultiple && value === option.value) 
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
                      (isMultiple && Array.isArray(value) && value.includes(option.value)) ||
                      (!isMultiple && value === option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <span>{typeof option.label === 'string' ? option.label : getLocalizedText(option.label, currentLanguage)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Multi-select badges */}
      {isMultiple && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((val) => {
            const option = options.find(opt => opt.value === val);
            if (!option) return null;
            return (
              <Badge
                key={val}
                variant="secondary"
                className="text-xs"
              >
                {typeof option.label === 'string' ? option.label : getLocalizedText(option.label, currentLanguage)}
                <button
                  type="button"
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(val);
                  }}
                >
                  <IconComponent name="X" className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
      
      {validationError && (
        <p className="mt-1 text-sm text-destructive">
          {validationError.message || "This field is required"}
        </p>
      )}
    </div>
  );
}