"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { SearchBoxProps } from "./types";
import { useSearch } from "./context";

/**
 * Search Box Component
 * Handles search input and submission
 */
export function SearchBox({
  variant = "default",
  placeholder = "Search...",
  expandOnMobile = true,
  showSearchIcon = true,
  autoFocus = false,
  className = "",
  onSubmit,
  onFocus,
  onBlur,
}: SearchBoxProps) {
  const { search, clearSearch, isLoading } = useSearch();
  const [localQuery, setLocalQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus when requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = localQuery.trim();

    if (query) {
      await search(query);

      if (onSubmit) {
        onSubmit(query);
      } else {
        // Default behavior: navigate to search page
        const searchUrl = new URL("/search", window.location.origin);
        searchUrl.searchParams.set("q", query);
        window.location.href = searchUrl.toString();
      }
    }
  };

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  /**
   * Handle input focus
   */
  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
  };

  /**
   * Handle input blur
   */
  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) {
      onBlur();
    }
  };

  /**
   * Clear search
   */
  const handleClear = () => {
    setLocalQuery("");
    clearSearch();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Placeholder only variant
  if (variant === "placeholderOnly") {
    return (
      <form onSubmit={handleSubmit} className={`relative ${className}`}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          />

          {showSearchIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <Search className="h-4 w-4" />
            </div>
          )}

          {localQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className={`relative ${className}`}>
        <div className="flex items-center bg-white border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 bg-transparent border-0 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          />

          <button
            type="submit"
            className="px-3 py-2 text-gray-500 hover:text-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !localQuery.trim()}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>
    );
  }

  // Default variant
  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="flex items-center bg-white border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`w-full px-4 py-2 bg-transparent border-0 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
              showSearchIcon ? "pl-10" : "pl-4"
            }`}
            disabled={isLoading}
          />

          {showSearchIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <Search className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 px-2">
          {localQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none rounded"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            type="submit"
            className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !localQuery.trim()}
          >
            Search
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="absolute top-full left-0 mt-2 flex items-center text-sm text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
          Searching...
        </div>
      )}
    </form>
  );
}

export default SearchBox;
