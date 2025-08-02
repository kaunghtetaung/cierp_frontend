"use client";

import React, { useState, useCallback } from "react";
import { useLanguage } from "@repo/language";
import { getLocalizedText } from "@repo/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconComponent } from "@repo/ui/components/icons";
import type { QueryAllowedField } from "@repo/types/access-policy-types";

interface DynamicSearchProps {
  queryAllowedFields?: QueryAllowedField[];
  onFiltersChange: (filters: Record<string, Record<string, any>>) => void;
  className?: string;
}

interface FilterState {
  [fieldName: string]: {
    operator: string;
    value: string;
  };
}

const getOperatorLabel = (operator: string): string => {
  const operatorLabels: Record<string, string> = {
    '$eq': 'Equals',
    '$regex': 'Contains',
    '$ne': 'Not equals',
    '$gt': 'Greater than',
    '$gte': 'Greater than or equal',
    '$lt': 'Less than',
    '$lte': 'Less than or equal',
    '$in': 'In list',
    '$nin': 'Not in list',
  };
  return operatorLabels[operator] || operator;
};

const getFieldTypeInput = (
  fieldName: string,
  fieldType: string,
  value: string,
  onChange: (value: string) => void
) => {
  const inputProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    placeholder: `Enter ${fieldName}...`,
    className: "h-9"
  };

  switch (fieldType.toLowerCase()) {
    case 'number':
    case 'integer':
      return <Input {...inputProps} type="number" />;
    case 'date':
      return <Input {...inputProps} type="date" />;
    case 'boolean':
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    default:
      return <Input {...inputProps} type="text" />;
  }
};

export function DynamicSearch({ queryAllowedFields, onFiltersChange, className }: DynamicSearchProps) {
  const { currentLanguage } = useLanguage();
  const [filters, setFilters] = useState<FilterState>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = useCallback((fieldName: string, operator: string, value: string) => {
    const newFilters = {
      ...filters,
      [fieldName]: { operator, value }
    };
    setFilters(newFilters);

    // Convert to the format expected by the backend
    const backendFilters: Record<string, Record<string, any>> = {};
    Object.entries(newFilters).forEach(([field, config]) => {
      if (config.value.trim()) {
        backendFilters[field] = {
          [config.operator]: config.value
        };
      }
    });

    onFiltersChange(backendFilters);
  }, [filters, onFiltersChange]);

  const clearFilter = useCallback((fieldName: string) => {
    const newFilters = { ...filters };
    delete newFilters[fieldName];
    setFilters(newFilters);

    // Convert and update
    const backendFilters: Record<string, Record<string, any>> = {};
    Object.entries(newFilters).forEach(([field, config]) => {
      if (config.value.trim()) {
        backendFilters[field] = {
          [config.operator]: config.value
        };
      }
    });

    onFiltersChange(backendFilters);
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    onFiltersChange({});
  }, [onFiltersChange]);

  if (!queryAllowedFields || queryAllowedFields.length === 0) {
    return null;
  }

  const hasActiveFilters = Object.values(filters).some(f => f.value.trim());

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Quick Search - Show first field with regex operator by default */}
      {queryAllowedFields.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            {(() => {
              const firstField = queryAllowedFields[0];
              const regexOperator = firstField.operators.includes('$regex') ? '$regex' : firstField.operators[0];
              const currentFilter = filters[firstField.fieldName];
              
              return getFieldTypeInput(
                firstField.fieldName,
                firstField.fieldType,
                currentFilter?.value || '',
                (value) => updateFilter(firstField.fieldName, regexOperator, value)
              );
            })()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="h-9"
          >
            <IconComponent name="Filter" className="w-4 h-4 mr-1" />
            {currentLanguage === 'mm' ? 'အဆင့်မြင့်' : 'Advanced'}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="h-9"
            >
              <IconComponent name="Trash" className="w-4 h-4 mr-1" />
              {currentLanguage === 'mm' ? 'ရှင်းလင်း' : 'Clear'}
            </Button>
          )}
        </div>
      )}

      {/* Advanced Search */}
      {showAdvanced && (
        <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {currentLanguage === 'mm' ? 'အဆင့်မြင့် ရှာဖွေမှု' : 'Advanced Search'}
            </h3>
          </div>

          <div className="grid gap-4">
            {queryAllowedFields.map((field) => {
              const currentFilter = filters[field.fieldName];
              const currentOperator = currentFilter?.operator || field.operators[0];
              const currentValue = currentFilter?.value || '';

              return (
                <div key={field.fieldName} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <Label htmlFor={`field-${field.fieldName}`} className="text-xs">
                      {field.fieldName}
                    </Label>
                  </div>
                  
                  <div className="col-span-3">
                    <Select
                      value={currentOperator}
                      onValueChange={(operator) => updateFilter(field.fieldName, operator, currentValue)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {field.operators.map((operator) => (
                          <SelectItem key={operator} value={operator}>
                            {getOperatorLabel(operator)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-5">
                    {getFieldTypeInput(
                      field.fieldName,
                      field.fieldType,
                      currentValue,
                      (value) => updateFilter(field.fieldName, currentOperator, value)
                    )}
                  </div>
                  
                  <div className="col-span-1">
                    {currentValue && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFilter(field.fieldName)}
                        className="h-9 w-9 p-0"
                      >
                        <IconComponent name="Minus" className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}