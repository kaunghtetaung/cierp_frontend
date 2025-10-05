"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { IconComponent } from "@repo/ui";
import { getModuleReferenceAction } from "@repo/app-modules/server-actions";

interface Option {
  label: string;
  value: string;
}

interface DependentSelectForPublicWebProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  serviceName: string;
  endpoint: string;
  labelField?: string;
  valueField?: string;
  dependsOn: string[]; // Array of field names to watch
  className?: string;
  disabled?: boolean;
}

export function DependentSelectForPublicWeb({
  value,
  onChange,
  placeholder = "Select option",
  serviceName,
  endpoint,
  labelField = "name",
  valueField = "_id",
  dependsOn,
  className = "",
  disabled = false
}: DependentSelectForPublicWebProps) {
  const { watch } = useFormContext();
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Watch all dependent fields
  const dependentFieldValues = dependsOn.map(fieldName => watch(fieldName));
  const dependencyKeyString = dependentFieldValues.join('|');

  // Get the selected option's label
  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : "";

  // Fetch options when dependencies change
  useEffect(() => {
    const fetchOptions = async () => {
      // Don't load if no dependent values are selected
      if (!dependentFieldValues.some(val => val !== undefined && val !== '')) {
        setOptions([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Extract module name from endpoint
        const match = endpoint.match(/\/([^\/]+)\/ref/);
        const module = match ? match[1] : serviceName;

        // Build params - use the first dependent value as the search parameter
        const params: Record<string, any> = {};
        if (dependentFieldValues[0]) {
          params[dependsOn[0]] = dependentFieldValues[0];
        }

        const result = await getModuleReferenceAction(module, params);

        if (result.success && result.data) {
          const mappedOptions = result.data.map((item: any) => ({
            label: item[labelField] || item.label || "",
            value: String(item[valueField] || item.value || "")
          }));
          setOptions(mappedOptions);
        } else {
          setError(result.error || "Failed to load options");
          setOptions([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load options");
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [dependencyKeyString, endpoint, labelField, valueField, serviceName]);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside
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

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showDropdown) {
        setShowDropdown(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showDropdown]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showDropdown]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setShowDropdown(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  const handleToggle = () => {
    if (!disabled && !loading && dependentFieldValues.some(val => val !== undefined && val !== '')) {
      setShowDropdown(!showDropdown);
    }
  };

  // Show message if no dependent values selected
  if (!dependentFieldValues.some(val => val !== undefined && val !== '')) {
    const dependencyNames = dependsOn.map(name => name.replace(/Id$/, '')).join(', ');
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          disabled={true}
          className={`block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed transition-all ${className}`}
        >
          <span className="block truncate text-left">
            Please select {dependencyNames} first
          </span>
        </button>
      </div>
    );
  }

  const inputClass = `block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
    disabled ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"
  } ${className}`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || loading}
        className={inputClass}
      >
        <span className="flex items-center justify-between">
          <span className="block truncate text-left">
            {loading ? "Loading..." : displayValue || placeholder}
          </span>
          <span className="flex items-center gap-1 flex-shrink-0 ml-2">
            {value && !loading && !disabled && (
              <IconComponent
                name="X"
                className="w-4 h-4 text-gray-400 hover:text-gray-600"
                onClick={handleClear}
              />
            )}
            {loading ? (
              <IconComponent name="Loader2" className="w-4 h-4 text-gray-400 animate-spin" />
            ) : (
              <IconComponent
                name={showDropdown ? "ChevronUp" : "ChevronDown"}
                className="w-4 h-4 text-gray-400"
              />
            )}
          </span>
        </span>
      </button>

      {showDropdown && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <IconComponent
                name="Search"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {error ? (
              <div className="p-3 text-sm text-red-600 flex items-center gap-2">
                <IconComponent name="AlertCircle" className="w-4 h-4" />
                {error}
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    option.value === value ? "bg-blue-50 text-blue-600" : "text-gray-900"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
