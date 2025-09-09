'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, X, Search, Loader2, Check } from 'lucide-react';

interface TypeaheadOption {
  id: string | number;
  name: string;
  code?: string;
  description?: string;
}

interface TypeaheadMultiSelectProps {
  name: string;
  value?: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  onSearch: (searchTerm: string) => Promise<TypeaheadOption[]>;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  debounceMs?: number;
  minSearchLength?: number;
  emptyMessage?: string;
  loadingMessage?: string;
  className?: string;
  displayFormat?: (option: TypeaheadOption) => string;
  maxItems?: number;
}

export function TypeaheadMultiSelect({
  name,
  value = [],
  onChange,
  onSearch,
  placeholder = 'Search and select multiple...',
  disabled = false,
  error,
  required = false,
  debounceMs = 300,
  minSearchLength = 2,
  emptyMessage = 'No results found',
  loadingMessage = 'Searching...',
  className = '',
  displayFormat,
  maxItems
}: TypeaheadMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<TypeaheadOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<TypeaheadOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Format display text for an option
  const formatDisplay = useCallback((option: TypeaheadOption): string => {
    if (displayFormat) {
      return displayFormat(option);
    }
    return option.code ? `${option.code} - ${option.name}` : option.name;
  }, [displayFormat]);

  // Load initial values if provided
  useEffect(() => {
    if (value.length > 0 && selectedOptions.length === 0) {
      // Attempt to load the selected values
      onSearch('').then(results => {
        const found = results.filter(opt => 
          value.includes(opt.id)
        );
        if (found.length > 0) {
          setSelectedOptions(found);
        }
      }).catch(console.error);
    }
  }, [value, selectedOptions.length, onSearch]);

  // Debounced search
  const performSearch = useCallback(async (term: string) => {
    if (term.length < minSearchLength) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await onSearch(term);
      setOptions(results);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [onSearch, minSearchLength]);

  // Handle search input change with debouncing
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(term);
    }, debounceMs);
  }, [performSearch, debounceMs]);

  // Check if option is selected
  const isSelected = useCallback((option: TypeaheadOption) => {
    return selectedOptions.some(selected => selected.id === option.id);
  }, [selectedOptions]);

  // Handle option toggle
  const handleToggle = useCallback((option: TypeaheadOption) => {
    const isCurrentlySelected = isSelected(option);
    
    if (isCurrentlySelected) {
      // Remove from selection
      const newSelected = selectedOptions.filter(s => s.id !== option.id);
      setSelectedOptions(newSelected);
      onChange(newSelected.map(s => s.id));
    } else {
      // Add to selection if not at max
      if (maxItems && selectedOptions.length >= maxItems) {
        return;
      }
      const newSelected = [...selectedOptions, option];
      setSelectedOptions(newSelected);
      onChange(newSelected.map(s => s.id));
    }
  }, [selectedOptions, isSelected, onChange, maxItems]);

  // Handle remove single item
  const handleRemove = useCallback((optionId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = selectedOptions.filter(s => s.id !== optionId);
    setSelectedOptions(newSelected);
    onChange(newSelected.map(s => s.id));
  }, [selectedOptions, onChange]);

  // Handle clear all
  const handleClearAll = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOptions([]);
    onChange([]);
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          handleToggle(options[highlightedIndex]);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setOptions([]);
        break;
    }
  }, [isOpen, options, highlightedIndex, handleToggle]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main select button */}
      <div
        className={`
          w-full px-3 py-2 
          border rounded-md bg-white
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${!disabled ? 'hover:bg-gray-50' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-required={required}
        aria-invalid={!!error}
      >
        {selectedOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedOptions.map(option => (
              <span
                key={option.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
              >
                {formatDisplay(option)}
                {!disabled && (
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-blue-600"
                    onClick={(e) => handleRemove(option.id, e)}
                  />
                )}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        
        <div className="flex items-center gap-1 mt-1">
          {selectedOptions.length > 0 && !disabled && (
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={handleClearAll}
            >
              Clear all
            </button>
          )}
          {maxItems && (
            <span className="text-xs text-gray-500 ml-auto">
              {selectedOptions.length}/{maxItems} selected
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ml-auto ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={`Type at least ${minSearchLength} characters to search...`}
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {loadingMessage}
              </div>
            ) : options.length > 0 ? (
              <ul role="listbox" aria-multiselectable="true">
                {options.map((option, index) => {
                  const selected = isSelected(option);
                  const isDisabled = !selected && maxItems && selectedOptions.length >= maxItems;
                  
                  return (
                    <li
                      key={option.id}
                      role="option"
                      aria-selected={selected}
                      className={`
                        px-3 py-2 text-sm flex items-center justify-between
                        ${highlightedIndex === index ? 'bg-blue-50' : ''}
                        ${selected ? 'bg-blue-100' : ''}
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
                      `}
                      onClick={() => !isDisabled && handleToggle(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <div>
                        <div className="font-medium">{formatDisplay(option)}</div>
                        {option.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                        )}
                      </div>
                      {selected && <Check className="h-4 w-4 text-blue-600" />}
                    </li>
                  );
                })}
              </ul>
            ) : searchTerm.length >= minSearchLength ? (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                {emptyMessage}
              </div>
            ) : (
              <div className="px-3 py-4 text-center text-gray-400 text-sm">
                Start typing to search...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden inputs for form submission */}
      {selectedOptions.map(option => (
        <input
          key={option.id}
          type="hidden"
          name={`${name}[]`}
          value={option.id}
        />
      ))}
    </div>
  );
}