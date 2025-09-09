'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, X, Search, Loader2 } from 'lucide-react';

interface TypeaheadOption {
  id: string | number;
  name: string;
  code?: string;
  description?: string;
}

interface TypeaheadSelectProps {
  name: string;
  value?: string | number | null;
  onChange: (value: string | number | null) => void;
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
}

export function TypeaheadSelect({
  name,
  value,
  onChange,
  onSearch,
  placeholder = 'Search and select...',
  disabled = false,
  error,
  required = false,
  debounceMs = 300,
  minSearchLength = 2,
  emptyMessage = 'No results found',
  loadingMessage = 'Searching...',
  className = '',
  displayFormat
}: TypeaheadSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<TypeaheadOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<TypeaheadOption | null>(null);
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

  // Load initial value if provided
  useEffect(() => {
    if (value && !selectedOption) {
      // Attempt to load the selected value
      onSearch('').then(results => {
        const found = results.find(opt => 
          String(opt.id) === String(value)
        );
        if (found) {
          setSelectedOption(found);
        }
      }).catch(console.error);
    }
  }, [value, selectedOption, onSearch]);

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

  // Handle option selection
  const handleSelect = useCallback((option: TypeaheadOption) => {
    setSelectedOption(option);
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm('');
    setOptions([]);
  }, [onChange]);

  // Handle clear selection
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    onChange(null);
    setSearchTerm('');
    setOptions([]);
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
          handleSelect(options[highlightedIndex]);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setOptions([]);
        break;
    }
  }, [isOpen, options, highlightedIndex, handleSelect]);

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
      <button
        type="button"
        className={`
          w-full flex items-center justify-between px-3 py-2 
          border rounded-md bg-white text-left
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
          ${error ? 'border-red-500' : 'border-gray-300'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-required={required}
        aria-invalid={!!error}
      >
        <span className={`block truncate ${!selectedOption ? 'text-gray-500' : ''}`}>
          {selectedOption ? formatDisplay(selectedOption) : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selectedOption && !disabled && (
            <X
              className="h-4 w-4 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

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
              <ul role="listbox">
                {options.map((option, index) => (
                  <li
                    key={option.id}
                    role="option"
                    aria-selected={selectedOption?.id === option.id}
                    className={`
                      px-3 py-2 cursor-pointer text-sm
                      ${highlightedIndex === index ? 'bg-blue-50' : ''}
                      ${selectedOption?.id === option.id ? 'bg-blue-100' : ''}
                      hover:bg-gray-50
                    `}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="font-medium">{formatDisplay(option)}</div>
                    {option.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                    )}
                  </li>
                ))}
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

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={selectedOption?.id || ''}
      />
    </div>
  );
}