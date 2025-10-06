"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input, Label } from "@repo/ui";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@repo/utils";
import { searchRegions, type Region } from "@/actions/student-registration";

interface PlaceOfBirthTypeAheadProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function PlaceOfBirthTypeAhead({
  value = "",
  onChange,
  error,
  disabled = false
}: PlaceOfBirthTypeAheadProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Update input when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search regions with debounce
  const handleInputChange = async (searchValue: string) => {
    setInputValue(searchValue);
    onChange(searchValue);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        console.log("🔍 Searching regions with query:", searchValue);
        const result = await searchRegions(searchValue, 10, 1);
        console.log("📍 Search regions result:", result);

        if (result.success && result.data) {
          console.log("✅ Found regions:", result.data.length);
          setSuggestions(result.data);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } else {
          console.log("❌ No regions found or error:", result.error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("💥 Error searching regions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: Region) => {
    setInputValue(suggestion.fullName);
    onChange(suggestion.fullName);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle ESC key
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();

      if (showSuggestions) {
        // Close suggestions if open
        setShowSuggestions(false);
        setSelectedIndex(-1);
      } else if (inputValue) {
        // Clear field if suggestions are closed
        setInputValue("");
        onChange("");
      }
      return;
    }

    // Handle other keys only when suggestions are shown
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        Place of Birth
      </Label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>

        <Input
          type="text"
          placeholder="Search place (e.g., Insein, Yangon)"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "pl-10 border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
            error && "border-red-300 focus:border-red-500"
          )}
        />

        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={cn(
                "w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors",
                index === selectedIndex && "bg-[#4C67E1]/10/20",
                index === 0 && "rounded-t-lg",
                index === suggestions.length - 1 && "rounded-b-lg"
              )}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#19184A]">{suggestion.name}</span>
                  <span className="text-xs text-gray-500">{suggestion.fullName}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showSuggestions && !isLoading && suggestions.length === 0 && inputValue.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">No places found</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
