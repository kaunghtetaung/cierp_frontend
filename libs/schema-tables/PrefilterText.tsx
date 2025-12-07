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

  // Get available operators
  const operators = field.searchOptions?.operators || [
    { value: "$regex", label: { en: "Contains", mm: "ပါဝင်" } },
    { value: "$eq", label: { en: "Exact", mm: "အတိအကျ" } }
  ];

  // Get placeholder based on operator
  const placeholder = field.searchOptions?.placeholder?.[selectedOperator]
    ? getLocalizedText(field.searchOptions.placeholder[selectedOperator], currentLanguage)
    : `Search ${getLocalizedText(field.label, currentLanguage)}...`;

  // Handle input value change (no automatic search)
  const handleInputChange = (newValue: string) => {
    setSearchValue(newValue);
  };

  // Handle manual search execution
  const handleSearch = () => {
    onChange(searchValue || undefined, selectedOperator);
  };

  // Handle Enter key press and ESC key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  // Handle clear search
  const handleClear = () => {
    setSearchValue("");
    onChange(undefined, selectedOperator);
  };

  // Handle operator change
  const handleOperatorChange = (newOperator: string) => {
    setSelectedOperator(newOperator);
    setIsOperatorOpen(false);
    // Immediately update with new operator
    onChange(searchValue || undefined, newOperator);
  };

  // Get current operator label
  const currentOperatorLabel = operators.find(op => op.value === selectedOperator);

  return (
    <div className="flex flex-col gap-2.5">
      <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
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
                "flex items-center gap-1 px-4 py-2 text-sm",
                "border rounded-md bg-background hover:bg-accent/50",
                "transition-colors duration-200 min-w-[120px]"
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
                        "w-full text-left px-4 py-2 text-xs",
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
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "w-full px-4 py-2 pr-16 text-sm text-foreground font-medium border rounded-md",
              "bg-background hover:bg-accent/50",
              "transition-colors duration-200",
              searchValue ? "border-primary/50" : "border-input"
            )}
          />

          {/* Action buttons */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Search/Confirm button */}
            {searchValue && (
              <button
                type="button"
                onClick={handleSearch}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Search (Enter)"
              >
                <IconComponent name="Search" className="h-3 w-3" />
              </button>
            )}

            {/* Clear button */}
            {searchValue && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Clear"
              >
                <IconComponent name="X" className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}