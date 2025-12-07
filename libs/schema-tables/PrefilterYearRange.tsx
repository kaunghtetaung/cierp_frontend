"use client";

import React, { useState, useEffect, useRef } from "react";
import { getLocalizedText } from "@repo/utils";
import { IconComponent } from "@repo/ui";
import { cn } from "@repo/utils";
import type { MultilingualText } from "@repo/types";

interface YearRangeOperator {
  value: string;
  label: MultilingualText;
}

interface PrefilterField {
  fieldName: string;
  label: MultilingualText;
  type: "yearRange";
  yearRangeOptions?: {
    operators?: YearRangeOperator[];
    defaultOperator?: string;
    minYear?: number;
    maxYear?: number;
    placeholder?: {
      "$eq"?: MultilingualText;
      "between"?: {
        from: MultilingualText;
        to: MultilingualText;
      };
    };
  };
}

interface PrefilterYearRangeProps {
  field: PrefilterField;
  value: string | { from: string; to: string } | undefined;
  operator: string;
  onChange: (value: string | { from: string; to: string } | undefined, operator: string) => void;
  currentLanguage: string;
}

export function PrefilterYearRange({
  field,
  value,
  operator,
  onChange,
  currentLanguage,
}: PrefilterYearRangeProps) {
  const options = field.yearRangeOptions || {};
  const minYear = options.minYear || 1900;
  const maxYear = options.maxYear || new Date().getFullYear();
  
  // Parse value based on operator
  const [yearValue, setYearValue] = useState("");
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [yearSearch, setYearSearch] = useState("");
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [selectedOperator, setSelectedOperator] = useState(
    operator || options.defaultOperator || "$eq"
  );
  const [isOperatorOpen, setIsOperatorOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);

  // Sync operator state with incoming props
  useEffect(() => {
    const newOperator = operator || options.defaultOperator || "$eq";
    setSelectedOperator(newOperator);
  }, [operator, options.defaultOperator]);

  // Initialize values from props
  useEffect(() => {
    if (selectedOperator === "between" && typeof value === "object" && value) {
      setFromYear(value.from || "");
      setToYear(value.to || "");
      setFromSearch(value.from || "");
      setToSearch(value.to || "");
    } else if (selectedOperator === "$eq" && typeof value === "string") {
      setYearValue(value);
      setYearSearch(value);
    }
  }, [value, selectedOperator]);

  // Get available operators
  const operators = options.operators || [
    { value: "$eq", label: { en: "Exact Year", mm: "အတိအကျ နှစ်" } },
    { value: "between", label: { en: "Between Years", mm: "နှစ်များအကြား" } }
  ];

  // Handle operator change
  const handleOperatorChange = (newOperator: string) => {
    setSelectedOperator(newOperator);
    setIsOperatorOpen(false);
    
    // Clear all values when switching operators
    setYearValue("");
    setFromYear("");
    setToYear("");
    setYearSearch("");
    setFromSearch("");
    setToSearch("");
    onChange(undefined, newOperator);
  };

  // Handle exact year change
  const handleExactYearChange = (newValue: string) => {
    setYearValue(newValue);
    if (newValue) {
      onChange(newValue, selectedOperator);
    } else {
      onChange(undefined, selectedOperator);
    }
  };

  // Handle range change
  const handleRangeChange = (from: string, to: string) => {
    setFromYear(from);
    setToYear(to);
    
    if (from || to) {
      onChange({ from, to }, selectedOperator);
    } else {
      onChange(undefined, selectedOperator);
    }
  };

  // Clear all values
  const handleClear = () => {
    setYearValue("");
    setFromYear("");
    setToYear("");
    setYearSearch("");
    setFromSearch("");
    setToSearch("");
    onChange(undefined, selectedOperator);
  };

  // Get current operator label
  const currentOperatorLabel = operators.find(op => op.value === selectedOperator);

  // Generate year options
  const generateYearOptions = () => {
    const years = [];
    for (let year = maxYear; year >= minYear; year--) {
      years.push(year.toString());
    }
    return years;
  };

  const allYears = generateYearOptions();

  // Filter years based on search
  const getFilteredYears = (search: string) => {
    if (!search) return allYears.slice(0, 20); // Show first 20 years when no search
    return allYears.filter(year => year.includes(search)).slice(0, 20);
  };

  // Handle year selection
  const handleYearSelect = (year: string) => {
    setYearValue(year);
    setYearSearch(year);
    setIsYearOpen(false);
    onChange(year, selectedOperator);
  };

  const handleFromSelect = (year: string) => {
    setFromYear(year);
    setFromSearch(year);
    setIsFromOpen(false);
    handleRangeChange(year, toYear);
  };

  const handleToSelect = (year: string) => {
    setToYear(year);
    setToSearch(year);
    setIsToOpen(false);
    handleRangeChange(fromYear, year);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
        {getLocalizedText(field.label, currentLanguage)}
      </label>
      
      <div className="flex flex-col gap-2">
        {/* Operator selector if multiple operators available */}
        {operators.length > 1 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOperatorOpen(!isOperatorOpen)}
              className={cn(
                "flex items-center gap-1 px-4 py-2 text-sm",
                "border rounded-md bg-background hover:bg-accent/50",
                "transition-colors duration-200 w-full justify-between"
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
                <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-md border bg-popover shadow-lg">
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

        {/* Year input based on operator */}
        {selectedOperator === "$eq" ? (
          // Exact year typeahead
          <div className="relative">
            <input
              type="text"
              value={yearSearch}
              onChange={(e) => {
                const val = e.target.value;
                // Only allow numbers
                if (/^\d*$/.test(val) && val.length <= 4) {
                  setYearSearch(val);
                  // Don't auto-update the value while typing
                }
              }}
              onFocus={() => {
                setIsYearOpen(true);
                if (!yearSearch && yearValue) {
                  setYearSearch(yearValue);
                }
              }}
              onBlur={() => {
                setTimeout(() => setIsYearOpen(false), 200);
                // Commit the typed value if valid
                if (yearSearch && yearSearch.length === 4) {
                  handleExactYearChange(yearSearch);
                } else if (!yearSearch) {
                  // Clear if empty
                  handleExactYearChange("");
                }
              }}
              placeholder={options.placeholder?.["$eq"] 
                ? getLocalizedText(options.placeholder["$eq"], currentLanguage)
                : "Type or select year"}
              className={cn(
                "w-full px-4 py-2 pr-8 text-sm border rounded-md",
                "bg-background hover:bg-accent/50",
                "transition-colors duration-200",
                yearValue ? "border-primary/50" : "border-input"
              )}
            />
            
            {/* Clear button */}
            {yearValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
              >
                <IconComponent name="X" className="h-3 w-3" />
              </button>
            )}

            {/* Dropdown */}
            {isYearOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg">
                {getFilteredYears(yearSearch).map((year) => (
                  <button
                    key={year}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleYearSelect(year);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm",
                      "hover:bg-accent transition-colors",
                      yearValue === year && "bg-accent"
                    )}
                  >
                    {year}
                  </button>
                ))}
                {getFilteredYears(yearSearch).length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No matching years
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Range typeahead inputs (between)
          <div className="flex gap-2 items-center">
            {/* From year typeahead */}
            <div className="relative flex-1">
              <input
                type="text"
                value={fromSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  // Only allow numbers
                  if (/^\d*$/.test(val) && val.length <= 4) {
                    setFromSearch(val);
                    // Don't auto-update while typing
                  }
                }}
                onFocus={() => {
                  setIsFromOpen(true);
                  if (!fromSearch && fromYear) {
                    setFromSearch(fromYear);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setIsFromOpen(false), 200);
                  // Commit the typed value if valid
                  if (fromSearch && fromSearch.length === 4) {
                    handleRangeChange(fromSearch, toYear);
                  } else if (!fromSearch) {
                    // Clear if empty
                    handleRangeChange("", toYear);
                  }
                }}
                placeholder={options.placeholder?.["between"]?.from
                  ? getLocalizedText(options.placeholder["between"].from, currentLanguage)
                  : "From year"}
                className={cn(
                  "w-full px-4 py-2 text-sm border rounded-md",
                  "bg-background hover:bg-accent/50",
                  "transition-colors duration-200",
                  fromYear ? "border-primary/50" : "border-input"
                )}
              />

              {/* From dropdown */}
              {isFromOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg">
                  {getFilteredYears(fromSearch).map((year) => (
                    <button
                      key={year}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleFromSelect(year);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm",
                        "hover:bg-accent transition-colors",
                        fromYear === year && "bg-accent"
                      )}
                    >
                      {year}
                    </button>
                  ))}
                  {getFilteredYears(fromSearch).length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No matching years
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <span className="text-xs text-muted-foreground">-</span>
            
            {/* To year typeahead */}
            <div className="relative flex-1">
              <input
                type="text"
                value={toSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  // Only allow numbers
                  if (/^\d*$/.test(val) && val.length <= 4) {
                    setToSearch(val);
                    // Don't auto-update while typing
                  }
                }}
                onFocus={() => {
                  setIsToOpen(true);
                  if (!toSearch && toYear) {
                    setToSearch(toYear);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setIsToOpen(false), 200);
                  // Commit the typed value if valid
                  if (toSearch && toSearch.length === 4) {
                    // Validate that to year is not less than from year
                    if (!fromYear || parseInt(toSearch) >= parseInt(fromYear)) {
                      handleRangeChange(fromYear, toSearch);
                    }
                  } else if (!toSearch) {
                    // Clear if empty
                    handleRangeChange(fromYear, "");
                  }
                }}
                placeholder={options.placeholder?.["between"]?.to
                  ? getLocalizedText(options.placeholder["between"].to, currentLanguage)
                  : "To year"}
                className={cn(
                  "w-full px-4 py-2 text-sm border rounded-md",
                  "bg-background hover:bg-accent/50",
                  "transition-colors duration-200",
                  toYear ? "border-primary/50" : "border-input"
                )}
              />

              {/* To dropdown */}
              {isToOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg">
                  {getFilteredYears(toSearch)
                    .filter(year => !fromYear || parseInt(year) >= parseInt(fromYear))
                    .map((year) => (
                      <button
                        key={year}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleToSelect(year);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm",
                          "hover:bg-accent transition-colors",
                          toYear === year && "bg-accent"
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  {getFilteredYears(toSearch).filter(year => !fromYear || parseInt(year) >= parseInt(fromYear)).length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No matching years
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Clear button */}
            {(fromYear || toYear) && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground"
              >
                <IconComponent name="X" className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}