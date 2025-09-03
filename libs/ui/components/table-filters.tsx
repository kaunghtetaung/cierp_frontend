"use client";

import * as React from "react";
import { Column } from "@tanstack/react-table";
import { format } from "date-fns";
import { ChevronDown, X, Search } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { DatePicker } from "./date-picker";
import { Separator } from "./separator";
import { Badge } from "./badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "./form";

// Define filter data types
export type FilterDataType = 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'multiselect';

export interface FilterConfig {
  dataType: FilterDataType;
  options?: string[]; // For select/multiselect types
  getSuggestions?: (value: string) => Promise<string[]>; // For text typeahead
}

interface TableFilterProps<TData> {
  column: Column<TData, unknown>;
  filterConfig?: FilterConfig;
  placeholder?: string;
}

// Date range filter component
interface DateRangeFilterProps<TData> {
  column: Column<TData, unknown>;
  isDateTime?: boolean;
  placeholder?: string;
}

function DateRangeFilter<TData>({ column, isDateTime = false, placeholder }: DateRangeFilterProps<TData>) {
  const [filterType, setFilterType] = React.useState<'all' | 'before' | 'after' | 'between'>('all');
  const [beforeDate, setBeforeDate] = React.useState<Date | undefined>();
  const [afterDate, setAfterDate] = React.useState<Date | undefined>();
  const [fromDate, setFromDate] = React.useState<Date | undefined>();
  const [toDate, setToDate] = React.useState<Date | undefined>();

  const applyFilter = React.useCallback(() => {
    const filterValue: any = { type: filterType };
    
    switch (filterType) {
      case 'before':
        if (beforeDate) {
          filterValue.before = beforeDate;
          column.setFilterValue(filterValue);
        } else {
          column.setFilterValue(undefined);
        }
        break;
      case 'after':
        if (afterDate) {
          filterValue.after = afterDate;
          column.setFilterValue(filterValue);
        } else {
          column.setFilterValue(undefined);
        }
        break;
      case 'between':
        if (fromDate && toDate) {
          filterValue.from = fromDate;
          filterValue.to = toDate;
          column.setFilterValue(filterValue);
        } else {
          column.setFilterValue(undefined);
        }
        break;
      case 'all':
      default:
        column.setFilterValue(undefined);
        break;
    }
  }, [column, filterType, beforeDate, afterDate, fromDate, toDate]);

  React.useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const clearFilter = () => {
    setFilterType('all');
    setBeforeDate(undefined);
    setAfterDate(undefined);
    setFromDate(undefined);
    setToDate(undefined);
    column.setFilterValue(undefined);
  };

  return (
    <div className="space-y-3 w-full">
      <Select value={filterType} onValueChange={(value) => setFilterType(value as typeof filterType)}>
        <SelectTrigger className="h-8 w-full">
          <SelectValue placeholder={placeholder ? `Filter ${placeholder}...` : `Select ${isDateTime ? 'date & time' : 'date'} filter...`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Show All</SelectItem>
          <SelectItem value="before">Before</SelectItem>
          <SelectItem value="after">After</SelectItem>
          <SelectItem value="between">Between</SelectItem>
        </SelectContent>
      </Select>

      {filterType === 'before' && (
        <DatePicker
          date={beforeDate}
          onDateChange={setBeforeDate}
          placeholder="Select before date"
        />
      )}

      {filterType === 'after' && (
        <DatePicker
          date={afterDate}
          onDateChange={setAfterDate}
          placeholder="Select after date"
        />
      )}

      {filterType === 'between' && (
        <div className="space-y-2">
          <DatePicker
            date={fromDate}
            onDateChange={setFromDate}
            placeholder="From date"
          />
          <DatePicker
            date={toDate}
            onDateChange={setToDate}
            placeholder="To date"
          />
        </div>
      )}
      
      {!!column.getFilterValue() && (
        <Button variant="ghost" size="sm" onClick={clearFilter} className="h-7 px-2 text-xs">
          <X className="h-3 w-3 mr-1" />
          Clear Filter
        </Button>
      )}
    </div>
  );
}

// Number filter component
interface NumberFilterProps<TData> {
  column: Column<TData, unknown>;
  placeholder?: string;
}

// Number Filter Schema
const numberFilterSchema = z.object({
  filterType: z.enum(['all', 'equal', 'less', 'greater', 'between']),
  equalValue: z.string(),
  lessValue: z.string(),
  greaterValue: z.string(),
  minValue: z.string(),
  maxValue: z.string(),
});

function NumberFilter<TData>({ column, placeholder }: NumberFilterProps<TData>) {
  const form = useForm<z.infer<typeof numberFilterSchema>>({
    resolver: zodResolver(numberFilterSchema),
    defaultValues: {
      filterType: 'all',
      equalValue: '',
      lessValue: '',
      greaterValue: '',
      minValue: '',
      maxValue: '',
    },
  });

  const filterType = form.watch("filterType");
  const equalValue = form.watch("equalValue");
  const lessValue = form.watch("lessValue");
  const greaterValue = form.watch("greaterValue");
  const minValue = form.watch("minValue");
  const maxValue = form.watch("maxValue");

  const applyFilter = React.useCallback(() => {
    const filterValue: any = { type: filterType };
    
    switch (filterType) {
      case 'equal':
        if (equalValue && !isNaN(Number(equalValue))) {
          filterValue.value = Number(equalValue);
          column.setFilterValue(filterValue);
        } else {
          column.setFilterValue(undefined);
        }
        break;
      case 'less':
        if (lessValue && !isNaN(Number(lessValue))) {
          filterValue.value = Number(lessValue);
          column.setFilterValue(filterValue);
        } else {
          column.setFilterValue(undefined);
        }
        break;
      case 'greater':
        if (greaterValue && !isNaN(Number(greaterValue))) {
          filterValue.value = Number(greaterValue);
          column.setFilterValue(filterValue);
        } else {
          column.setFilterValue(undefined);
        }
        break;
      case 'between':
        if (minValue && maxValue && !isNaN(Number(minValue)) && !isNaN(Number(maxValue))) {
          filterValue.min = Number(minValue);
          filterValue.max = Number(maxValue);
          column.setFilterValue(filterValue);
        } else {
          column.setFilterValue(undefined);
        }
        break;
      case 'all':
      default:
        column.setFilterValue(undefined);
        break;
    }
  }, [column, filterType, equalValue, lessValue, greaterValue, minValue, maxValue]);

  React.useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const clearFilter = () => {
    form.setValue("filterType", 'all');
    form.setValue("equalValue", '');
    form.setValue("lessValue", '');
    form.setValue("greaterValue", '');
    form.setValue("minValue", '');
    form.setValue("maxValue", '');
    column.setFilterValue(undefined);
  };

  return (
    <Form {...form}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed w-full justify-start">
            {filterType === 'all' ? (placeholder ? `Filter ${placeholder}...` : 'Select number filter...') :
             filterType === 'equal' ? `Equal to ${equalValue}` :
             filterType === 'less' ? `Less than ${lessValue}` :
             filterType === 'greater' ? `Greater than ${greaterValue}` :
             filterType === 'between' ? `Between ${minValue} - ${maxValue}` :
             'Select filter...'}
            {!!column.getFilterValue() && (
              <Badge variant="secondary" className="ml-auto rounded-sm px-1 font-normal">
                Active
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{placeholder ? `Filter ${placeholder}` : 'Filter by Number'}</h4>
              {!!column.getFilterValue() && (
                <Button variant="ghost" size="sm" onClick={clearFilter} className="h-8 px-2">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="filterType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select value={field.value} onValueChange={(value) => form.setValue("filterType", value as typeof filterType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Show All</SelectItem>
                        <SelectItem value="equal">Equal to</SelectItem>
                        <SelectItem value="less">Less than</SelectItem>
                        <SelectItem value="greater">Greater than</SelectItem>
                        <SelectItem value="between">Between</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {filterType === 'equal' && (
              <FormField
                control={form.control}
                name="equalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {filterType === 'less' && (
              <FormField
                control={form.control}
                name="lessValue"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter maximum value"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {filterType === 'greater' && (
              <FormField
                control={form.control}
                name="greaterValue"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter minimum value"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {filterType === 'between' && (
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="minValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Minimum value"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Maximum value"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </Form>
  );
}

// Boolean filter component
interface BooleanFilterProps<TData> {
  column: Column<TData, unknown>;
  placeholder?: string;
}

// Boolean Filter Schema
const booleanFilterSchema = z.object({
  value: z.string(),
});

function BooleanFilter<TData>({ column, placeholder }: BooleanFilterProps<TData>) {
  const form = useForm<z.infer<typeof booleanFilterSchema>>({
    resolver: zodResolver(booleanFilterSchema),
    defaultValues: {
      value: (column.getFilterValue() as string) || 'all',
    },
  });

  React.useEffect(() => {
    form.setValue("value", (column.getFilterValue() as string) || 'all');
  }, [column.getFilterValue, form]);
  
  const handleFilterChange = (value: string) => {
    form.setValue("value", value);
    if (value === 'all') {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue(value);
    }
  };

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="value"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select value={field.value} onValueChange={handleFilterChange}>
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder={placeholder || "All"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All values</SelectItem>
                  <SelectItem value="true">True only</SelectItem>
                  <SelectItem value="false">False only</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}

// Text filter with typeahead
interface TextFilterProps<TData> {
  column: Column<TData, unknown>;
  getSuggestions?: (value: string) => Promise<string[]>;
  placeholder?: string;
}

// Text Filter Schema
const textFilterSchema = z.object({
  value: z.string(),
});

function TextFilter<TData>({ column, getSuggestions, placeholder }: TextFilterProps<TData>) {
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof textFilterSchema>>({
    resolver: zodResolver(textFilterSchema),
    defaultValues: {
      value: (column.getFilterValue() as string) || "",
    },
  });

  const value = form.watch("value");

  React.useEffect(() => {
    form.setValue("value", (column.getFilterValue() as string) || "");
  }, [column.getFilterValue, form]);

  const debouncedGetSuggestions = React.useMemo(
    () => {
      if (!getSuggestions) return null;
      
      let timeoutId: NodeJS.Timeout;
      return (searchValue: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (searchValue.length > 0) {
            setIsLoading(true);
            try {
              const results = await getSuggestions(searchValue);
              setSuggestions(results);
            } catch (error) {
              console.error('Error fetching suggestions:', error);
              setSuggestions([]);
            } finally {
              setIsLoading(false);
            }
          } else {
            setSuggestions([]);
          }
        }, 300);
      };
    },
    [getSuggestions]
  );

  const handleValueChange = (newValue: string) => {
    form.setValue("value", newValue);
    column.setFilterValue(newValue || undefined);
    
    if (debouncedGetSuggestions && newValue.length > 0) {
      debouncedGetSuggestions(newValue);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    form.setValue("value", suggestion);
    column.setFilterValue(suggestion);
    setIsOpen(false);
  };

  if (getSuggestions) {
    return (
      <Form {...form}>
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        placeholder={placeholder || "Search..."}
                        value={field.value}
                        onChange={(e) => handleValueChange(e.target.value)}
                        className="h-8 w-full"
                      />
                      {field.value && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-0 h-8 w-8 px-0"
                          onClick={() => handleValueChange('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandList>
                        {isLoading && (
                          <CommandEmpty>Loading suggestions...</CommandEmpty>
                        )}
                        {!isLoading && suggestions.length === 0 && field.value && (
                          <CommandEmpty>No suggestions found.</CommandEmpty>
                        )}
                        {suggestions.length > 0 && (
                          <CommandGroup>
                            {suggestions.map((suggestion, index) => (
                              <CommandItem
                                key={index}
                                onSelect={() => handleSuggestionSelect(suggestion)}
                              >
                                {suggestion}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    );
  }

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="value"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="relative">
                <Input
                  placeholder={placeholder || "Search..."}
                  value={field.value}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="h-8 w-full"
                />
                {field.value && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-0 h-8 w-8 px-0"
                    onClick={() => handleValueChange('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}

// Select/Multi-select filter
interface SelectFilterProps<TData> {
  column: Column<TData, unknown>;
  options: string[];
  multiple?: boolean;
  placeholder?: string;
}

// Select Filter Schema
const selectFilterSchema = z.object({
  selectedValues: z.array(z.string()),
});

function SelectFilter<TData>({ column, options, multiple = false, placeholder }: SelectFilterProps<TData>) {
  const filterValue = column.getFilterValue();
  
  const form = useForm<z.infer<typeof selectFilterSchema>>({
    resolver: zodResolver(selectFilterSchema),
    defaultValues: {
      selectedValues: React.useMemo(() => {
        if (multiple) {
          return Array.isArray(filterValue) ? filterValue : [];
        } else {
          return filterValue ? [filterValue] : [];
        }
      }, [filterValue, multiple]),
    },
  });

  const selectedValues = form.watch("selectedValues");

  React.useEffect(() => {
    const newSelectedValues = React.useMemo(() => {
      if (multiple) {
        return Array.isArray(filterValue) ? filterValue : [];
      } else {
        return filterValue ? [filterValue] : [];
      }
    }, [filterValue, multiple]);
    form.setValue("selectedValues", newSelectedValues);
  }, [filterValue, multiple, form]);

  const handleSelectionChange = (option: string, checked: boolean) => {
    let newSelection: string[];
    if (multiple) {
      if (checked) {
        newSelection = [...selectedValues, option];
      } else {
        newSelection = selectedValues.filter(value => value !== option);
      }
    } else {
      newSelection = checked ? [option] : [];
    }
    
    form.setValue("selectedValues", newSelection);
    column.setFilterValue(newSelection.length > 0 ? (multiple ? newSelection : newSelection[0]) : undefined);
  };

  const clearSelection = () => {
    form.setValue("selectedValues", []);
    column.setFilterValue(undefined);
  };

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="selectedValues"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-dashed w-full justify-start">
                    {selectedValues.length === 0 ? 
                      (placeholder ? `Select ${placeholder}...` : `Select ${multiple ? 'categories' : 'category'}...`) :
                      selectedValues.length === 1 ? 
                        selectedValues[0] :
                        `${selectedValues.length} selected`
                    }
                    {selectedValues.length > 0 && (
                      <Badge variant="secondary" className="ml-auto rounded-sm px-1 font-normal">
                        {selectedValues.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="start">
                  <Command>
                    <CommandInput placeholder={placeholder ? `Search ${placeholder}...` : `Search ${multiple ? 'categories' : 'category'}...`} />
                    <CommandList>
                      <CommandEmpty>No options found.</CommandEmpty>
                      <CommandGroup>
                        {options.map((option) => {
                          const isSelected = selectedValues.includes(option);
                          return (
                            <CommandItem
                              key={option}
                              onSelect={() => handleSelectionChange(option, !isSelected)}
                            >
                              <div className="flex items-center space-x-2">
                                <input
                                  type={multiple ? "checkbox" : "radio"}
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="rounded border-gray-300"
                                />
                                <span>{option}</span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                    {selectedValues.length > 0 && (
                      <>
                        <Separator />
                        <CommandGroup>
                          <CommandItem onSelect={clearSelection} className="justify-center text-center">
                            Clear selections
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}

// Main filter component that renders the appropriate filter based on data type
export function TableFilter<TData>({ column, filterConfig, placeholder }: TableFilterProps<TData>) {
  if (!filterConfig) {
    return (
      <TextFilter column={column} placeholder={placeholder} />
    );
  }

  switch (filterConfig.dataType) {
    case 'date':
      return <DateRangeFilter column={column} placeholder={placeholder} />;
    case 'datetime':
      return <DateRangeFilter column={column} isDateTime placeholder={placeholder} />;
    case 'number':
      return <NumberFilter column={column} placeholder={placeholder} />;
    case 'boolean':
      return <BooleanFilter column={column} placeholder={placeholder} />;
    case 'select':
      return <SelectFilter column={column} options={filterConfig.options || []} placeholder={placeholder} />;
    case 'multiselect':
      return <SelectFilter column={column} options={filterConfig.options || []} multiple placeholder={placeholder} />;
    case 'text':
    default:
      return <TextFilter column={column} getSuggestions={filterConfig.getSuggestions} placeholder={placeholder} />;
  }
}