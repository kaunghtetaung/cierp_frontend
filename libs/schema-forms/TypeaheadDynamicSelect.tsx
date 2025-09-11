"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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
  // Defensive value processing: ensure we handle objects properly from the start
  const processedValue = useMemo(() => {
    // Case 1: Array for multi-select (process each item)
    if (Array.isArray(value)) {
      return value.map((item: any) => {
        // If array item is an object with id/name, extract ID
        if (item && typeof item === 'object' && (item.id || item._id) && item.name) {
          return String(item.id || item._id);
        }
        return String(item);
      });
    }
    
    // Case 2: Single object with id/name (bibliography format), extract ID for form handling
    if (value && typeof value === 'object' && !Array.isArray(value) && (value.id || value._id) && value.name) {
      return String(value.id || value._id);
    }
    
    // Case 3: Return as-is (string, null, undefined)
    return value;
  }, [value]);
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
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  
  const dropdownConfig = field.dropdownConfig || {} as any;
  const dataSource = field.dataSource || {} as any;
  const isMultiple = dropdownConfig.multiple || field.multiple || field.fieldType === "multiSelect";
  const validationError = errors?.[field.fieldName];

  // Notify parent of processed value if it changed (to fix validation)
  // NOTE: Only notify for single-select fields to convert {id,name} objects to strings
  useEffect(() => {
    // Only process single object conversion for single-select fields
    if (!isMultiple && processedValue !== value && processedValue !== undefined && !Array.isArray(value)) {
      onChange(processedValue);
    }
  }, [processedValue, value, onChange, isMultiple]);
  
  // Typeahead configuration
  const enableTypeahead = dropdownConfig.enableTypeahead || dataSource.enableTypeahead;

  const minSearchLength = dropdownConfig.minSearchLength || dataSource.minSearchLength || 2;
  const debounceMs = dropdownConfig.debounceMs || dataSource.debounceMs || 300;
  const searchParam = dropdownConfig.searchParam || dataSource.searchParam || 'search';
  const emptyMessage = dropdownConfig.emptyMessage || dataSource.emptyMessage;
  
  // Refs for debouncing and focus
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Parse module from refPath
  const getModuleFromRefPath = (refPath: string): string => {
    const cleaned = refPath.replace(/^\//, '').replace(/\/ref$/, '');
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
      const position = calculateDropdownPosition();
      setDropdownPosition(position);
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
  }, [minSearchLength, debounceMs, fetchOptions, calculateDropdownPosition]);

  // Handle initial value for edit scenarios
  useEffect(() => {
    if (!value) return;

    // Case 1: Array of objects for multi-select edit (bibliography edit format)
    if (Array.isArray(value) && value.length > 0 && isMultiple) {
      const hasObjectsWithIdName = value.some(item => 
        item && typeof item === 'object' && (item.id || item._id) && item.name
      );
      
      if (hasObjectsWithIdName) {
        // Transform array of {id, name} objects to our standard format
        const transformedOptions = value
          .filter(item => item && typeof item === 'object' && (item.id || item._id) && item.name)
          .map(item => ({
            value: String(item.id || item._id),
            label: {
              en: String(item.name),
              mm: String(item.name)
            }
          }));
        
        // Set options to include the initial values - IMPORTANT: This ensures names are displayed in badges
        setOptions(prevOptions => {
          const existingValues = prevOptions.map(opt => opt.value);
          const newOptions = transformedOptions.filter(opt => !existingValues.includes(opt.value));
          return [...prevOptions, ...newOptions];
        });
        
        // Update form with array of ID strings for proper form submission
        const idValues = transformedOptions.map(opt => opt.value);
        onChange(idValues);
        
        // Set display for multi-select (will show as badges with names)
        setDisplayValue("");
        return;
      }
    }

    // Case 2: Value is an object with label (standard format)
    if (typeof value === 'object' && !Array.isArray(value) && value.label && selectedOption) return;
    if (typeof value === 'object' && !Array.isArray(value) && value.label) {
      setSelectedOption(value);
      const labelText = typeof value.label === 'string' ? value.label : getLocalizedText(value.label, currentLanguage);
      setDisplayValue(labelText);
      return;
    }

    // Case 3: Single object with id and name (bibliography edit format)
    if (typeof value === 'object' && !Array.isArray(value) && (value.id || value._id) && value.name) {
      // Transform to our standard format
      const transformedOption = {
        value: String(value.id || value._id),
        label: {
          en: String(value.name),
          mm: String(value.name)
        }
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
      
      // Set display value to the name
      setDisplayValue(String(value.name));
      
      // IMPORTANT: Update the form with just the ID string to prevent validation errors
      const idValue = String(value.id || value._id);
      if (idValue !== value) {
        onChange(idValue);
      }
      return;
    }

    // Case 4: Array of string IDs for multi-select (existing data)
    if (Array.isArray(value) && value.length > 0 && isMultiple) {
      const hasObjectsWithIdName = value.some(item => 
        item && typeof item === 'object' && (item.id || item._id) && item.name
      );
      
      if (!hasObjectsWithIdName) {
        // For existing array of string IDs (browser storage restoration), fetch names for badge display
        const fetchOptionsForIds = async () => {
          try {
            // Check if all values already exist in options
            const missingIds = value.filter((id: string) => !options.find(opt => opt.value === id));
            
            if (missingIds.length > 0) {
              // Fetch options to get the names for display
              const module = getModuleFromRefPath(dropdownConfig.refPath || dataSource.endpoint || "");
              const result = await getModuleReferenceAction<ApiOption>(module, {});
              
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
              }
            }
          } catch (error) {
            console.error('Failed to fetch options for multi-select browser storage restoration:', error);
          }
        };

        fetchOptionsForIds();
        setDisplayValue("");
        return;
      }
    }

    // Case 5: Simple string value (browser storage restoration - should fetch name for display)
    if (typeof value === 'string' && !selectedOption && value.trim() !== '') {
      // For browser storage restoration, we need to fetch the option to display the name
      // This prevents showing just the ID in the textbox
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
          const result = await getModuleReferenceAction<ApiOption>(module, {});
          
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
            
            // Update options array with fetched data
            setOptions(transformedOptions);
            
            // Find the specific option that matches our value
            const matchingOption = transformedOptions.find(opt => opt.value === value);
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
      return;
    }
  }, [value, selectedOption, currentLanguage, isMultiple, onChange, options, dropdownConfig.refPath, dataSource.endpoint]);

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
      const currentValues = Array.isArray(processedValue) ? processedValue : [];
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
      setDropdownPosition(null);
      setSearchTerm("");
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
    // Open dropdown when focusing
    if (searchTerm.length >= minSearchLength) {
      const position = calculateDropdownPosition();
      setDropdownPosition(position);
      setOpen(true);
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
          onClick={handleInputClick}
          disabled={false}
          readOnly={false}
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
          {processedValue && !isSearching && (
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

      {/* Multi-select badges */}
      {isMultiple && Array.isArray(processedValue) && processedValue.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {processedValue.map((val) => {
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