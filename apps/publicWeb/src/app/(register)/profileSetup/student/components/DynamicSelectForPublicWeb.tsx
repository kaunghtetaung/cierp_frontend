"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { IconComponent } from "@repo/ui";
import { getModuleReferenceAction } from "@repo/app-modules/server-actions";

interface DynamicSelectForPublicWebProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  serviceName: string;
  endpoint: string;
  labelField?: string;
  valueField?: string;
  className?: string;
  disabled?: boolean;
  fieldName?: string; // Unique identifier for localStorage
}

interface Option {
  _id?: string;
  id?: string;
  name?: string;
  label?: string;
  [key: string]: any;
}

export function DynamicSelectForPublicWeb({
  value,
  onChange,
  placeholder = "Select option",
  serviceName,
  endpoint,
  labelField = "name",
  valueField = "_id",
  className = "",
  disabled = false,
  fieldName
}: DynamicSelectForPublicWebProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cachedLabel, setCachedLabel] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load cached label from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && fieldName && value) {
      const storageKey = `studentRegistration_${fieldName}_label`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCachedLabel(saved);
      }
    }
  }, [fieldName, value]);

  // Get the display text for selected value
  const getDisplayText = useCallback(() => {
    if (!value) return placeholder;

    // First check if we have the option in current options
    const selectedOption = options.find(opt =>
      (opt[valueField] || opt._id || opt.id) === value
    );
    if (selectedOption) {
      const label = selectedOption[labelField] || selectedOption.name || selectedOption.label;
      const displayLabel = typeof label === 'string' ? label : (label?.en || label?.mm || '');
      return displayLabel || placeholder;
    }

    // Fallback to cached label from localStorage
    if (cachedLabel) {
      return cachedLabel;
    }

    return placeholder;
  }, [value, options, placeholder, labelField, valueField, cachedLabel]);

  // Fetch options from API
  const fetchOptions = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Extract module name from endpoint (e.g., "/subjects/ref" -> "subjects")
      const module = endpoint.replace(/^\//, '').split('/')[0];

      const queryParams: Record<string, string> = {};
      if (search && search.length >= 2) {
        queryParams.search = search;
      }

      const result = await getModuleReferenceAction<Option>(
        module,
        queryParams,
        serviceName
      );

      if (!result.success) {
        setError(result.error || "Failed to load options");
        setOptions([]);
        return;
      }

      const responseData = result.data as any;
      const data = Array.isArray(responseData)
        ? responseData
        : (responseData?.data || responseData?.items || []);

      setOptions(data);
    } catch (err) {
      console.error("Error fetching options:", err);
      setError("Failed to load options");
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, serviceName]);

  // Fetch options on mount and when dropdown opens
  useEffect(() => {
    if (showDropdown && options.length === 0) {
      fetchOptions();
    }
  }, [showDropdown, fetchOptions, options.length]);

  // Debounced search
  useEffect(() => {
    if (!showDropdown) return;

    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        fetchOptions(searchTerm);
      } else if (searchTerm.length === 0) {
        fetchOptions();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, showDropdown, fetchOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSearchTerm("");
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showDropdown]);

  // Filter options based on search term (always use client-side filtering)
  const filteredOptions = searchTerm.length > 0
    ? options.filter(option => {
        const label = option[labelField] || option.name || option.label || '';
        const labelText = typeof label === 'string' ? label : (label.en || label.mm || '');
        return labelText.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : options;

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);

    // Save label to localStorage for future restoration
    if (typeof window !== 'undefined' && fieldName && selectedValue) {
      const selectedOption = options.find(opt =>
        (opt[valueField] || opt._id || opt.id) === selectedValue
      );
      if (selectedOption) {
        const label = selectedOption[labelField] || selectedOption.name || selectedOption.label;
        const displayLabel = typeof label === 'string' ? label : (label?.en || label?.mm || '');

        const storageKey = `studentRegistration_${fieldName}_label`;
        localStorage.setItem(storageKey, displayLabel);
        setCachedLabel(displayLabel);
      }
    }

    setShowDropdown(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onChange("");
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button matching input field styling */}
      <button
        type="button"
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
        disabled={disabled}
        className={`block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-left flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="hover:text-gray-700"
            >
              <IconComponent name="X" className="h-4 w-4" />
            </button>
          )}
          {loading ? (
            <IconComponent name="Loader2" className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <IconComponent name="ChevronDown" className={`h-4 w-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          )}
        </div>
      </button>

      {/* Dropdown menu */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowDropdown(false);
                  setSearchTerm("");
                }
              }}
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-48">
            {error && (
              <div className="px-3 py-2 text-sm text-red-600">
                {error}
                <button
                  type="button"
                  onClick={() => fetchOptions(searchTerm)}
                  className="ml-2 text-blue-600 hover:underline"
                >
                  Retry
                </button>
              </div>
            )}

            {loading && options.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                <IconComponent name="Loader2" className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            )}

            {!loading && !error && filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchTerm ? "No results found" : "No options available"}
              </div>
            )}

            {filteredOptions.map((option) => {
              const optionValue = option[valueField] || option._id || option.id || '';
              const optionLabel = option[labelField] || option.name || option.label || '';
              const displayLabel = typeof optionLabel === 'string'
                ? optionLabel
                : (optionLabel.en || optionLabel.mm || '');

              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => handleSelect(optionValue)}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-blue-50 transition-colors ${
                    value === optionValue ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-900'
                  }`}
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
