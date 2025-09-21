"use client";

import React, { useState, useRef, useEffect } from "react";
import { getLocalizedText } from "@repo/utils";
import { IconComponent } from "@repo/ui";
import { cn } from "@repo/utils";
import type { MultilingualText } from "@repo/types";

interface SearchOperator {
  value: string;
  label: MultilingualText;
}

interface PrefilterField {
  fieldName: string;
  label: MultilingualText;
  type: "text";
  searchOptions?: {
    operators?: SearchOperator[];
    defaultOperator?: string;
    placeholder?: Record<string, MultilingualText>;
  };
}

interface PrefilterTextProps {
  field: PrefilterField;
  value: string | undefined;
  operator: string;
  onChange: (value: string | undefined, operator: string) => void;
  currentLanguage: string;
}

export function PrefilterText({
  field,
  value,
  operator,
  onChange,
  currentLanguage,
}: PrefilterTextProps) {
  const [searchValue, setSearchValue] = useState(value || "");
  const [selectedOperator, setSelectedOperator] = useState(
    operator || field.searchOptions?.defaultOperator || "$regex"
  );
  const [isOperatorOpen, setIsOperatorOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Get available operators
  const operators = field.searchOptions?.operators || [
    { value: "$regex", label: { en: "Contains", mm: "ပါဝင်" } },
    { value: "$eq", label: { en: "Exact", mm: "အတိအကျ" } }
  ];

  // Get placeholder based on operator
  const placeholder = field.searchOptions?.placeholder?.[selectedOperator]
    ? getLocalizedText(field.searchOptions.placeholder[selectedOperator], currentLanguage)
    : `Search ${getLocalizedText(field.label, currentLanguage)}...`;

  // Handle search with debounce
  const handleSearch = (newValue: string) => {
    setSearchValue(newValue);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      onChange(newValue || undefined, selectedOperator);
    }, 300);
  };

  // Handle operator change
  const handleOperatorChange = (newOperator: string) => {
    setSelectedOperator(newOperator);
    setIsOperatorOpen(false);
    // Immediately update with new operator
    onChange(searchValue || undefined, newOperator);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Get current operator label
  const currentOperatorLabel = operators.find(op => op.value === selectedOperator);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {getLocalizedText(field.label, currentLanguage)}
      </label>
      
      <div className="flex gap-1">
        {/* Operator selector if multiple operators available */}
        {operators.length > 1 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOperatorOpen(!isOperatorOpen)}
              className={cn(
                "flex items-center gap-1 px-2 py-1.5 text-xs",
                "border rounded-md bg-background hover:bg-accent/50",
                "transition-colors duration-200 min-w-[80px]"
              )}
            >
              <span className="truncate">
                {currentOperatorLabel 
                  ? getLocalizedText(currentOperatorLabel.label, currentLanguage)
                  : selectedOperator}
              </span>
              <IconComponent
                name="ChevronDown"
                className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  isOperatorOpen && "rotate-180"
                )}
              />
            </button>

            {/* Operator dropdown */}
            {isOperatorOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOperatorOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border bg-popover shadow-lg">
                  {operators.map((op) => (
                    <button
                      key={op.value}
                      type="button"
                      onClick={() => handleOperatorChange(op.value)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs",
                        "hover:bg-accent transition-colors",
                        selectedOperator === op.value && "bg-accent"
                      )}
                    >
                      {getLocalizedText(op.label, currentLanguage)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Text input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full px-3 py-1.5 pr-8 text-sm text-foreground font-medium border rounded-md",
              "bg-background hover:bg-accent/50",
              "transition-colors duration-200",
              searchValue ? "border-primary/50" : "border-input"
            )}
          />
          
          {/* Clear button */}
          {searchValue && (
            <button
              type="button"
              onClick={() => handleSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconComponent name="X" className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}