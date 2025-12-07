"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toastSuccess, toastError } from "@repo/utils";
import { getLocalizedText } from "@repo/utils";
import { useLanguage } from "@repo/language";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { DataTable, FilterConfig } from "@repo/ui";
import { Checkbox } from "@repo/ui";
import { useSidebar } from "@repo/ui";
import { Badge } from "@repo/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { CheckCircle, XCircle } from "lucide-react";
import {
  useDeleteModuleItem,
  useHardDeleteModuleItem,
  useBulkModuleOperation,
  useDeletedModuleCount,
} from "@repo/schema-hooks";
import { Pagination } from "@repo/ui";
// Import from apps/core since ExtraActionModal is app-specific (uses ExtraActionFormRouter)
import { ExtraActionModal } from "../../apps/core/src/components/extraAction";
import { generateZodSchema } from "@repo/schema-utils";
import { ConfirmationDialog } from "@repo/ui";
import { PrefilterSelect } from "./PrefilterSelect";
import { PrefilterTypeahead } from "./PrefilterTypeahead";
import { PrefilterText } from "./PrefilterText";
import { PrefilterYearRange } from "./PrefilterYearRange";
import { PrefilterSort } from "./PrefilterSort";
import { PrefilterTabGroup } from "./PrefilterTabGroup";
import { RecycleBinDialog } from "./RecycleBinDialog";
import type { ModuleSchema, TableColumn, ExtraAction, PrefilterFieldGroup, PrefilterField } from "@repo/types";
import { isMultilingualText } from "@repo/types";
import type { ColumnDef } from "@tanstack/react-table";

interface ModuleDataTableProps {
  module: ModuleSchema;
  data: any[];
  totalItems?: number;
  totalPages?: number;
  currentLanguage?: string;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  currentPage?: number;
  pageSize?: number;
  onSort?: (sortField: string) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isLoading?: boolean;
  onRefresh?: () => void;
  showMonthlySelector?: boolean; // New prop for monthly reports
  onMonthChange?: (year: number, month: number) => void; // Callback for month selection
  selectedYear?: number;
  selectedMonth?: number;
  showRecycleBin?: boolean; // Show recycle bin button in toolbar
  hidePrefilters?: boolean; // Hide prefilters when they're rendered externally (e.g., in dashboard wrapper)
  userPermissions?: any; // User permissions for the module
}

export function ModuleDataTable({
  module,
  data,
  totalItems = data.length,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  currentPage,
  pageSize,
  onSort,
  sortBy,
  sortOrder,
  isLoading,
  onRefresh,
  showMonthlySelector = false,
  onMonthChange,
  selectedYear = new Date().getFullYear(),
  selectedMonth = new Date().getMonth() + 1,
  showRecycleBin = true,
  hidePrefilters = false,
  userPermissions,
}: Omit<ModuleDataTableProps, "currentLanguage">) {
  const { currentLanguage } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { state: sidebarState } = useSidebar();

  // Monthly selector helper functions
  const getMonthName = (monthNum: number) => {
    const months = {
      en: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ],
      mm: [
        "ဇန်နဝါရီ", "ဖေဖေါ်ဝါရီ", "မတ်", "ဧပြီ", "မေ", "ဇွန်",
        "ဇူလိုင်", "သြဂုတ်", "စက်တင်ဘာ", "အောက်တိုဘာ", "နိုဝင်ဘာ", "ဒီဇင်ဘာ"
      ]
    };
    return months[currentLanguage === "mm" ? "mm" : "en"][monthNum - 1];
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  const generateMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: getMonthName(i + 1)
    }));
  };

  const handleMonthChange = (year: number, month: number) => {
    if (onMonthChange) {
      onMonthChange(year, month);
    }
  };

  // Helper to get all prefilter fields for initialization (supports both legacy fields and fieldGroups)
  const getPrefilterFieldsForInit = (): any[] => {
    const prefilters = module.dataTableSchema?.prefilters;
    if (!prefilters) return [];

    // If using new fieldGroups structure
    if (prefilters.fieldGroups && prefilters.fieldGroups.length > 0) {
      return prefilters.fieldGroups.flatMap((group: PrefilterFieldGroup) => group.fields || []);
    }

    // Legacy: use fields array directly
    return prefilters.fields || [];
  };

  // Prefilter state management - includes operators for text fields
  // Supports both legacy fields array and new fieldGroups structure
  const [prefilterValues, setPrefilterValues] = useState<Record<string, string | string[]>>(() => {
    const values: Record<string, string | string[]> = {};
    const allFields = getPrefilterFieldsForInit();

    allFields.forEach((field: any) => {
      // For text fields, check for operator-based params
      if (field.type === 'text') {
        // Check for different operators in URL
        const operators = field.searchOptions?.operators || [{ value: '$regex' }, { value: '$eq' }];
        for (const op of operators) {
          const paramValue = searchParams.get(`${field.fieldName}[${op.value}]`);
          if (paramValue) {
            values[field.fieldName] = paramValue;
            values[`${field.fieldName}_operator`] = op.value;
            break;
          }
        }
      } else if (field.type === 'yearRange') {
        // Check for year range params
        const exactValue = searchParams.get(`${field.fieldName}`) || searchParams.get(`${field.fieldName}[$eq]`);
        if (exactValue) {
          values[field.fieldName] = exactValue;
          values[`${field.fieldName}_operator`] = '$eq';
        } else {
          // Check for range operators
          const fromValue = searchParams.get(`${field.fieldName}[$gte]`);
          const toValue = searchParams.get(`${field.fieldName}[$lte]`);
          if (fromValue || toValue) {
            values[field.fieldName] = { from: fromValue || '', to: toValue || '' };
            values[`${field.fieldName}_operator`] = 'between';
          }
        }
      } else {
        // For other field types, use direct fieldName
        const paramValue = searchParams.get(field.fieldName);
        if (paramValue) {
          // Handle multiple values (pipe-separated)
          // Using pipe instead of comma to support values containing commas
          if (field.multiple && paramValue.includes('|')) {
            const splitValues = paramValue.split('|').map(v => v.trim());
            console.log('🔍 PrefilterTypeahead split debug:', {
              fieldName: field.fieldName,
              paramValue,
              splitValues,
              separator: '|',
              containsSpaces: splitValues.some(v => v.includes(' '))
            });
            values[field.fieldName] = splitValues;
          } else {
            values[field.fieldName] = paramValue;
          }
        }
      }
    });
    return values;
  });

  // Sync prefilterValues with URL params when searchParams change
  // This ensures filter values persist in form fields after server submission
  useEffect(() => {
    const newValues: Record<string, string | string[]> = {};
    const allFields = getPrefilterFieldsForInit();

    allFields.forEach((field: any) => {
      if (field.type === 'text') {
        const operators = field.searchOptions?.operators || [{ value: '$regex' }, { value: '$eq' }];
        for (const op of operators) {
          const paramValue = searchParams.get(`${field.fieldName}[${op.value}]`);
          if (paramValue) {
            newValues[field.fieldName] = paramValue;
            newValues[`${field.fieldName}_operator`] = op.value;
            break;
          }
        }
      } else if (field.type === 'yearRange') {
        const exactValue = searchParams.get(`${field.fieldName}`) || searchParams.get(`${field.fieldName}[$eq]`);
        if (exactValue) {
          newValues[field.fieldName] = exactValue;
          newValues[`${field.fieldName}_operator`] = '$eq';
        } else {
          const fromValue = searchParams.get(`${field.fieldName}[$gte]`);
          const toValue = searchParams.get(`${field.fieldName}[$lte]`);
          if (fromValue || toValue) {
            newValues[field.fieldName] = { from: fromValue || '', to: toValue || '' };
            newValues[`${field.fieldName}_operator`] = 'between';
          }
        }
      } else {
        const paramValue = searchParams.get(field.fieldName);
        if (paramValue) {
          if (field.multiple && paramValue.includes('|')) {
            newValues[field.fieldName] = paramValue.split('|').map((v: string) => v.trim());
          } else {
            newValues[field.fieldName] = paramValue;
          }
        }
      }
    });

    setPrefilterValues(newValues);
  }, [searchParams]);

  // Helper to get all prefilter fields (supports both legacy fields and fieldGroups)
  const getPrefilterFields = (): any[] => {
    const prefilters = module.dataTableSchema?.prefilters;
    if (!prefilters) return [];

    // If using new fieldGroups structure
    if (prefilters.fieldGroups && prefilters.fieldGroups.length > 0) {
      return prefilters.fieldGroups.flatMap((group: PrefilterFieldGroup) => group.fields || []);
    }

    // Legacy: use fields array directly
    return prefilters.fields || [];
  };

  // Handle prefilter changes - now with operator support for text fields
  // Works with both legacy fields array and new fieldGroups structure
  const handlePrefilterChange = (fieldName: string, value: string | string[] | { from: string; to: string } | undefined, operator?: string) => {
    const newValues = { ...prefilterValues };

    if (value !== undefined && (Array.isArray(value) ? value.length > 0 : value)) {
      newValues[fieldName] = value;
      if (operator) {
        newValues[`${fieldName}_operator`] = operator;
      }
    } else {
      delete newValues[fieldName];
      delete newValues[`${fieldName}_operator`];
    }
    setPrefilterValues(newValues);

    // Update URL with prefilter params
    const newSearchParams = new URLSearchParams(searchParams.toString());

    // Get all fields (from both legacy fields and fieldGroups)
    const allFields = getPrefilterFields();

    // Remove all existing prefilter params
    allFields.forEach((field: any) => {
      if (field.type === 'text') {
        // Clear all operator-based params for text fields
        const operators = field.searchOptions?.operators || [{ value: '$regex' }, { value: '$eq' }];
        operators.forEach((op: any) => {
          newSearchParams.delete(`${field.fieldName}[${op.value}]`);
        });
      } else if (field.type === 'yearRange') {
        // Clear year range params
        newSearchParams.delete(field.fieldName);
        newSearchParams.delete(`${field.fieldName}[$eq]`);
        newSearchParams.delete(`${field.fieldName}[$gte]`);
        newSearchParams.delete(`${field.fieldName}[$lte]`);
        newSearchParams.delete(`${field.fieldName}[$gt]`);
        newSearchParams.delete(`${field.fieldName}[$lt]`);
      } else {
        newSearchParams.delete(field.fieldName);
      }
    });

    // Add new prefilter params
    Object.entries(newValues).forEach(([key, val]) => {
      // Skip operator keys (they're handled with their corresponding field)
      if (key.endsWith('_operator')) return;

      const field = allFields.find((f: any) => f.fieldName === key);
      if (field?.type === 'text' && newValues[`${key}_operator`]) {
        // For text fields, use operator-based param (e.g., title[$eq]=value)
        const op = newValues[`${key}_operator`] as string;
        newSearchParams.set(`${key}[${op}]`, val as string);
      } else if (field?.type === 'yearRange' && newValues[`${key}_operator`]) {
        const op = newValues[`${key}_operator`] as string;
        if (op === 'between' && typeof val === 'object' && val && 'from' in val && 'to' in val) {
          // For range, use $gte and $lte
          if (val.from) newSearchParams.set(`${key}[$gte]`, val.from);
          if (val.to) newSearchParams.set(`${key}[$lte]`, val.to);
        } else if (op === '$eq' && typeof val === 'string') {
          // For exact match
          newSearchParams.set(`${key}`, val);
        }
      } else if (Array.isArray(val)) {
        // For multiple values, join with pipe (|) separator
        // Using pipe instead of comma to support values containing commas
        const joinedValue = val.join('|');
        console.log('🔍 PrefilterTypeahead join debug:', {
          key,
          originalArray: val,
          joinedValue,
          separator: '|',
          containsSpaces: val.some(v => String(v).includes(' '))
        });
        newSearchParams.set(key, joinedValue);
      } else {
        newSearchParams.set(key, val as string);
      }
    });

    // Reset to page 1 when prefilters change
    newSearchParams.set('page', '1');

    // Navigate with new params
    router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
  };

  // Clear all prefilters - handles both legacy fields and fieldGroups
  const handleClearAllPrefilters = () => {
    setPrefilterValues({});

    const newSearchParams = new URLSearchParams(searchParams.toString());
    const allFields = getPrefilterFields();

    allFields.forEach((field: any) => {
      if (field.type === 'text') {
        const operators = field.searchOptions?.operators || [{ value: '$regex' }, { value: '$eq' }];
        operators.forEach((op: any) => {
          newSearchParams.delete(`${field.fieldName}[${op.value}]`);
        });
      } else if (field.type === 'yearRange') {
        newSearchParams.delete(field.fieldName);
        newSearchParams.delete(`${field.fieldName}[$eq]`);
        newSearchParams.delete(`${field.fieldName}[$gte]`);
        newSearchParams.delete(`${field.fieldName}[$lte]`);
        newSearchParams.delete(`${field.fieldName}[$gt]`);
        newSearchParams.delete(`${field.fieldName}[$lt]`);
      } else {
        newSearchParams.delete(field.fieldName);
      }
    });

    newSearchParams.set('page', '1');
    router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
    // Keep advanced filters panel open after clearing
  };

  // Check if prefilters are enabled and available
  const hasPrefilters = module.dataTableSchema?.prefilters?.enabled &&
                        ((module.dataTableSchema?.prefilters?.fields?.length ?? 0) > 0 ||
                         (module.dataTableSchema?.prefilters?.fieldGroups?.length ?? 0) > 0);

  // Helper function to get all prefilter fields (supports both legacy fields array and new fieldGroups)
  const getAllPrefilterFields = (): PrefilterField[] => {
    const prefilters = module.dataTableSchema?.prefilters;
    if (!prefilters) return [];

    // If using new fieldGroups structure
    if (prefilters.fieldGroups && prefilters.fieldGroups.length > 0) {
      return prefilters.fieldGroups.flatMap((group: PrefilterFieldGroup) => group.fields || []);
    }

    // Legacy: use fields array directly
    return (prefilters.fields || []) as PrefilterField[];
  };

  // Check if we should use tabs display
  const useTabsDisplay = module.dataTableSchema?.prefilters?.displayMode === 'tabs' &&
                         (module.dataTableSchema?.prefilters?.fieldGroups?.length ?? 0) > 0;

  // State for active prefilter tab - persists across filter changes via URL
  const [activePrefilterTab, setActivePrefilterTab] = useState<string>(() => {
    // First try to get from URL params
    const urlTab = searchParams.get('_prefilterTab');
    if (urlTab) return urlTab;
    // Otherwise initialize with the first group's key if available
    return module.dataTableSchema?.prefilters?.fieldGroups?.[0]?.groupKey || '';
  });

  // Update URL when active tab changes
  const handleActiveTabChange = (tabKey: string) => {
    setActivePrefilterTab(tabKey);
    // Update URL with the new active tab
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('_prefilterTab', tabKey);
    router.push(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false });
  };

  // State for showing/hiding advanced filters - auto-open if there are active filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(Object.keys(prefilterValues).filter(k => !k.endsWith('_operator')).length > 0);
  
  // Generate filter summary
  const getFilterSummary = () => {
    const summaryParts: string[] = [];
    
    if (!module.dataTableSchema?.prefilters?.fields) return null;
    
    module.dataTableSchema.prefilters.fields.forEach((field: any) => {
      const value = prefilterValues[field.fieldName];
      const operator = prefilterValues[`${field.fieldName}_operator`];
      
      if (value) {
        const fieldLabel = getLocalizedText(field.label, currentLanguage);
        
        if (field.type === 'text' && operator) {
          const opLabel = operator === '$eq' ? '=' : '~';
          summaryParts.push(`${fieldLabel} ${opLabel} "${value}"`);
        } else if (field.type === 'yearRange') {
          if (typeof value === 'object' && 'from' in value && 'to' in value) {
            if (value.from && value.to) {
              summaryParts.push(`${fieldLabel}: ${value.from}-${value.to}`);
            } else if (value.from) {
              summaryParts.push(`${fieldLabel} ≥ ${value.from}`);
            } else if (value.to) {
              summaryParts.push(`${fieldLabel} ≤ ${value.to}`);
            }
          } else {
            summaryParts.push(`${fieldLabel}: ${value}`);
          }
        } else if (Array.isArray(value)) {
          summaryParts.push(`${fieldLabel}: ${value.join(', ')}`);
        } else {
          summaryParts.push(`${fieldLabel}: ${value}`);
        }
      }
    });
    
    return summaryParts.length > 0 ? summaryParts : null;
  };
  
  const filterSummary = getFilterSummary();
  
  // Get sort options from schema
  const getSortOptions = () => {
    const options: { field: string; label: any }[] = [];
    
    // Add sortable fields from sortAllowedFieldList or columns
    if (module.dataTableSchema?.sorting?.sortAllowedFieldList) {
      // Use allowed fields list if available
      module.dataTableSchema.sorting.sortAllowedFieldList.forEach((field: string) => {
        // Find matching column for label
        const column = module.dataTableSchema.columns.find(
          (col: TableColumn) => col.fieldName === field
        );
        if (column) {
          options.push({
            field: field,
            label: column.label
          });
        } else {
          // Create label from field name if column not found
          const label = field.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() || field;
          options.push({
            field: field,
            label: { en: label, mm: label }
          });
        }
      });
    } else {
      // Fallback to sortable columns
      module.dataTableSchema?.columns?.forEach((column: TableColumn) => {
        if (column.sortable) {
          options.push({
            field: column.fieldName,
            label: column.label
          });
        }
      });
    }
    
    // Add common sort options if not already included
    const commonFields = [
      { field: 'createdAt', label: { en: 'Created Date', mm: 'ဖန်တီးသည့်ရက်' } },
      { field: 'updatedAt', label: { en: 'Updated Date', mm: 'ပြင်ဆင်သည့်ရက်' } }
    ];
    
    commonFields.forEach(common => {
      if (!options.find(opt => opt.field === common.field)) {
        options.push(common);
      }
    });
    
    return options;
  };
  
  const sortOptions = getSortOptions();
  
  // Handle sort change
  const handleSortChange = (field: string, order: "asc" | "desc") => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('sortBy', field);
    newSearchParams.set('sortOrder', order);
    router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
  };

  // Generate print title with monthly information
  const getPrintTitle = () => {
    const baseTitle = getLocalizedText(module.name, currentLanguage);
    if (showMonthlySelector) {
      const monthName = getMonthName(selectedMonth);
      return `${baseTitle} - ${monthName} ${selectedYear} ${currentLanguage === "mm" ? "လစဉ်အစီရင်ခံစာ" : "Monthly Report"}`;
    }
    return baseTitle;
  };

  // React Query mutations for delete operations
  const deleteItemMutation = useDeleteModuleItem(module.slug);
  const hardDeleteItemMutation = useHardDeleteModuleItem(module.slug);
  const bulkOperationMutation = useBulkModuleOperation(module.slug);

  // Deleted count for recycle bin badge
  const { data: deletedCount = 0, isLoading: isDeletedCountLoading, error: deletedCountError } = useDeletedModuleCount(module.slug, {
    enabled: showRecycleBin,
  });

  // Debug: Log recycle bin status
  console.log("🗑️ [ModuleDataTable] Recycle bin status:", {
    showRecycleBin,
    deletedCount,
    isDeletedCountLoading,
    deletedCountError,
    moduleSlug: module.slug,
  });

  // Debug: Log the actions configuration
  console.log("ModuleDataTable actions config:", {
    hasActions: !!module.dataTableSchema.actions,
    actions: module.dataTableSchema.actions,
    edit: module.dataTableSchema.actions?.edit,
    delete: module.dataTableSchema.actions?.delete,
    view: module.dataTableSchema.actions?.view,
  });
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [activeExtraAction, setActiveExtraAction] =
    useState<ExtraAction | null>(null);
  const [isExtraActionModalOpen, setIsExtraActionModalOpen] = useState(false);
  const [rowActionItem, setRowActionItem] = useState<any>(null); // For row-specific actions

  // Confirmation dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [extraActionConfirmOpen, setExtraActionConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Recycle bin state
  const [recycleBinOpen, setRecycleBinOpen] = useState(false);

  // Debug state
  const [debugLogs, setDebugLogs] = useState<Array<{
    timestamp: string;
    type: 'FETCH' | 'DELETE' | 'BULK_OP' | 'DATA_RECEIVED';
    url?: string;
    method?: string;
    params?: any;
    response?: any;
    dataCount?: number;
  }>>([]);
  const [showDebug, setShowDebug] = useState(true);

  // Helper to add debug log
  const addDebugLog = (type: 'FETCH' | 'DELETE' | 'BULK_OP' | 'DATA_RECEIVED', logData: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, { timestamp, type, ...logData }]);
  };
  const [pendingDeleteType, setPendingDeleteType] = useState<"soft" | "hard">(
    "soft"
  );
  const [bulkDeleteType, setBulkDeleteType] = useState<"soft" | "hard">("soft");
  const [pendingExtraAction, setPendingExtraAction] =
    useState<ExtraAction | null>(null);
  const [queryParams, setQueryParams] = useState(() => {
    // Validate that the default sort field exists in the columns
    const defaultSortField = module.dataTableSchema.sorting?.defaultSort?.field || "";
    const columnExists = defaultSortField === "" || module.dataTableSchema.columns?.some(
      (col: any) => col.fieldName === defaultSortField || col.id === defaultSortField
    );

    // Log warning if default sort field doesn't exist
    if (defaultSortField && !columnExists) {
      console.warn(
        `[ModuleDataTable] Default sort field '${defaultSortField}' does not exist in columns for module '${module.name?.en || module.id}'. Available columns:`,
        module.dataTableSchema.columns?.map((col: any) => col.fieldName || col.id)
      );
    }

    return {
      page: 1,
      limit: module.dataTableSchema.pagination?.defaultLimit || 10,
      sortBy: columnExists ? defaultSortField : "",
      sortOrder: (module.dataTableSchema.sorting?.defaultSort?.direction ||
        "asc") as "asc" | "desc",
      filters: {} as Record<string, Record<string, any>>,
    };
  });

  // Helper function to get raw nested field values (without language filtering)
  const getRawNestedValue = (obj: any, path: string) => {
    const value = path.split(".").reduce((current, key) => current?.[key], obj);

    // For populated fields and complex objects, return the entire object for raw access
    if (value && typeof value === "object") {
      return value; // Return the entire object for raw access
    }

    return value;
  };

  // Function to detect which languages a column supports
  const detectColumnLanguageSupport = (column: TableColumn) => {
    const fieldName = column.fieldName;

    // Check if this is a language-specific field path
    const isEnglishField =
      fieldName.includes(".en") || fieldName.endsWith(".en");
    const isMyanmarField =
      fieldName.includes(".mm") || fieldName.endsWith(".mm");

    let hasEnglish = true;
    let hasMyanmar = true;
    let isLanguageSpecific = false;

    if (isEnglishField) {
      // This is an English-specific field
      hasEnglish = true;
      hasMyanmar = false;
      isLanguageSpecific = true;
    } else if (isMyanmarField) {
      // This is a Myanmar-specific field
      hasEnglish = false;
      hasMyanmar = true;
      isLanguageSpecific = true;
    } else {
      // Check if there's data in the field (non-language-specific)
      // These fields support all languages
      hasEnglish = true;
      hasMyanmar = true;
      isLanguageSpecific = false;
    }

    // Removed excessive logging to prevent performance issues

    return { hasEnglish, hasMyanmar, isLanguageSpecific };
  };

  // Function to calculate column visibility based on current language and default limits
  const calculateLanguageBasedVisibility = (
    columns: TableColumn[],
    currentLanguage: string
  ) => {
    const visibility: Record<string, boolean> = {};

    // Always show Sr. no column
    visibility["sr"] = true;

    // Always show selection column if present
    if (module.dataTableSchema.layout === "withCheckbox") {
      visibility["select"] = true;
    }

    // Always show actions column if present
    if (module.dataTableSchema.actions) {
      visibility["actions"] = true;
    }

    // Calculate how many data columns we can show by default
    // Target: Show only 6 total columns (Sr. + Selection + 4 data + Actions)
    // If no selection: Sr. + 5 data + Actions = 7 total
    const hasSelection = module.dataTableSchema.layout === "withCheckbox";
    const maxDataColumns = hasSelection ? 4 : 5; // Adjust based on selection presence

    // Calculate visibility for data columns with language support and default limit
    let visibleDataColumnCount = 0;
    columns.forEach((column, index) => {
      const { hasEnglish, hasMyanmar, isLanguageSpecific } =
        detectColumnLanguageSupport(column);

      let shouldShowBasedOnLanguage = false;
      if (currentLanguage === "en") {
        shouldShowBasedOnLanguage = hasEnglish;
      } else if (currentLanguage === "mm") {
        shouldShowBasedOnLanguage = hasMyanmar;
      } else {
        // Default: show all columns for unknown languages
        shouldShowBasedOnLanguage = true;
      }

      // Show column if: language supports it AND within default limit
      const shouldShowByDefault =
        shouldShowBasedOnLanguage && visibleDataColumnCount < maxDataColumns;
      visibility[column.fieldName] = shouldShowByDefault;

      // Increment counter only if we're showing this column
      if (shouldShowByDefault) {
        visibleDataColumnCount++;
      }
    });

    return visibility;
  };

  // Hook to detect screen size
  const [isMobile, setIsMobile] = useState(false);

  // Calculate column visibility based on current language
  const columnVisibility = useMemo(() => {
    const visibility = calculateLanguageBasedVisibility(
      module.dataTableSchema.columns,
      currentLanguage
    );
    return visibility;
  }, [currentLanguage]); // Removed module.dataTableSchema.columns dependency to prevent excessive recalculation

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Debug: Log when data is received
  useEffect(() => {
    addDebugLog('DATA_RECEIVED', {
      dataCount: data?.length || 0,
      totalItems,
      totalPages,
      currentPage: queryParams.page,
      pageSize: queryParams.limit,
      params: {
        page: queryParams.page,
        limit: queryParams.limit,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder,
        filters: queryParams.filters,
      },
      response: {
        data: data || [],
        totalItems,
        totalPages,
      }
    });
  }, [data, totalItems, totalPages, queryParams]);

  // Helper function to get nested field values
  const getNestedValue = (obj: any, path: string) => {
    const value = path.split(".").reduce((current, key) => current?.[key], obj);

    // Handle populated reference fields with structure {_id, displayName: {en, mm}, ...}
    if (value && typeof value === "object" && value._id && value.displayName) {
      // This is a populated reference field from backend
      if (isMultilingualText(value.displayName)) {
        return value.displayName[currentLanguage] || value.displayName.en || "";
      }
      // If displayName is not multilingual, return it directly
      return value.displayName || value._id || "";
    }

    // Handle populated reference fields with fullName fallback
    if (
      value &&
      typeof value === "object" &&
      value._id &&
      value.fullName &&
      !value.displayName
    ) {
      return value.fullName || value._id || "";
    }

    // Handle fields with structure {id, value: {en, mm}} (legacy support)
    if (
      value &&
      typeof value === "object" &&
      value.hasOwnProperty("id") &&
      value.hasOwnProperty("value")
    ) {
      // This is a reference field with id and multilingual value
      if (isMultilingualText(value.value)) {
        return value.value[currentLanguage] || value.value.en || "";
      }
      // If value is not multilingual, return the value directly
      return value.value || "";
    }

    // If the value is a multilingual object, return the current language value
    if (isMultilingualText(value)) {
      return value[currentLanguage] || value.en || "";
    }

    return value;
  };

  const handleSort = (sortBy: string) => {
    setQueryParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder:
        prev.sortBy === sortBy && prev.sortOrder === "asc" ? "desc" : "asc",
      page: 1, // Reset to first page when sorting
    }));
  };

  const handleEdit = (id: string) => {
    // Navigate to dedicated edit page using Next.js router for client-side navigation
    router.push(`/${params.appId}/${module.slug}/${id}`);
  };

  const handleExtraAction = (action: ExtraAction) => {
    if (action.type === "modal") {
      // Clear row action item for bulk actions
      setRowActionItem(null);
      setActiveExtraAction(action);
      setIsExtraActionModalOpen(true);
    } else if (action.type === "inline") {
      // Handle inline action directly
      if (action.confirmMessage) {
        setPendingExtraAction(action);
        setExtraActionConfirmOpen(true);
      } else {
        console.log(`Executing inline action: ${action.actionKey}`);
        // Here you would call the API
      }
    }
    // Page type actions are handled by Link navigation
  };

  // Handle extra actions for single rows (automatically handle selection for actions that need it)
  const handleExtraActionForRow = (action: ExtraAction, item: any) => {
    const itemId = item._id || item.id;
    console.log(
      `🎯 handleExtraActionForRow: Processing action "${action.actionKey}" for item ${itemId}`
    );

    if (action.type === "modal") {
      console.log(
        `🎭 handleExtraActionForRow: Opening modal for "${action.actionKey}" with preselected item ${itemId}`
      );
      // Set the row action item and clear bulk selection
      setRowActionItem(item);
      setSelectedItems([]); // Clear any bulk selections
      setActiveExtraAction(action);
      setIsExtraActionModalOpen(true);
    } else if (action.type === "inline") {
      // For inline actions, still use the selectedItems approach
      setSelectedItems([itemId]);
      if (action.confirmMessage) {
        setPendingExtraAction(action);
        setExtraActionConfirmOpen(true);
      } else {
        console.log(
          `Executing inline action: ${action.actionKey} for item:`,
          itemId
        );
        // Here you would call the API
      }
    }
  };

  const executeExtraAction = () => {
    if (pendingExtraAction) {
      console.log(`Executing API action: ${pendingExtraAction.actionKey}`);
      // Here you would call the API
      setPendingExtraAction(null);
    }
  };

  const handleExtraActionSuccess = () => {
    // This is now called only when modal closes (if data was changed)
    // The ExtraActionModal tracks changes and only calls this on close if needed
    
    console.log('🔄 ModuleDataTable - handleExtraActionSuccess called', {
      hasOnRefresh: typeof onRefresh === 'function',
      onRefresh
    });
    
    // Trigger data refresh using the onRefresh callback
    if (onRefresh && typeof onRefresh === 'function') {
      console.log('✅ ModuleDataTable - Calling onRefresh');
      // Call the refresh function to refetch data (usually triggers React Query refetch)
      onRefresh();
    } else {
      console.warn('⚠️ ModuleDataTable - No onRefresh callback available');
    }
    
    // Note: The modal stays open for multiple operations
    // Data is only refetched once when modal closes (if changes were made)
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      addDebugLog('DELETE', {
        method: 'DELETE',
        url: `/api/${module.slug}/${pendingDeleteId}`,
        itemId: pendingDeleteId,
      });

      const result = await deleteItemMutation.mutateAsync(pendingDeleteId);

      // Check if the mutation actually succeeded
      if (!result || deleteItemMutation.isError) {
        throw new Error(
          currentLanguage === "mm"
            ? "ဖျက်ခြင်း မအောင်မြင်ပါ - ဆာဗာနှင့် ဆက်သွယ်၍မရပါ"
            : "Delete failed - Unable to connect to server"
        );
      }

      addDebugLog('DELETE', {
        method: 'DELETE',
        url: `/api/${module.slug}/${pendingDeleteId}`,
        response: { success: true, result },
      });

      // Only show success toast if operation truly succeeded
      const successMessage =
        currentLanguage === "mm"
          ? `${getLocalizedText(
              module.name,
              currentLanguage
            )} အောင်မြင်စွာ ဖျက်ပြီးပါပြီ!`
          : `${getLocalizedText(
              module.name,
              currentLanguage
            )} deleted successfully!`;

      toastSuccess(successMessage);

      // React Query mutations already invalidate queries which triggers automatic refetch
      // The onSuccess handler in the mutation hook handles query invalidation
    } catch (error) {
      console.error("Failed to delete item:", error);

      // Show error toast with more specific message
      let errorMessage = currentLanguage === "mm"
        ? "ဖျက်ခြင်း မအောင်မြင်ပါ"
        : "Failed to delete item";
      
      if (error instanceof Error) {
        // Check for network errors
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('connect')) {
          errorMessage = currentLanguage === "mm"
            ? "ဆာဗာနှင့် ဆက်သွယ်၍မရပါ - backend service စစ်ဆေးပါ"
            : "Cannot connect to server - Please check if backend service is running";
        } else {
          errorMessage = error.message;
        }
      }

      toastError(errorMessage);
    } finally {
      setPendingDeleteId(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    setBulkDeleteConfirmOpen(true);
  };

  const executeBulkDelete = async () => {
    try {
      const ids = selectedItems.map((item) => item._id || item.id);

      addDebugLog('BULK_OP', {
        method: 'POST',
        url: `/api/${module.slug}/bulk`,
        params: { operation: 'delete', ids, count: ids.length },
      });

      const result = await bulkOperationMutation.mutateAsync({
        operation: "delete",
        ids: ids,
      });

      // Check if the mutation actually succeeded
      if (!result || bulkOperationMutation.isError) {
        throw new Error(
          currentLanguage === "mm"
            ? "အစုလိုက် ဖျက်ခြင်း မအောင်မြင်ပါ - ဆာဗာနှင့် ဆက်သွယ်၍မရပါ"
            : "Bulk delete failed - Unable to connect to server"
        );
      }

      addDebugLog('BULK_OP', {
        method: 'POST',
        url: `/api/${module.slug}/bulk`,
        response: { success: true, deletedCount: ids.length, result },
      });

      // Only show success if operation truly succeeded
      // Clear selection and show success toast
      setSelectedItems([]);

      const successMessage =
        currentLanguage === "mm"
          ? `${selectedItems.length} ခု အောင်မြင်စွာ ဖျက်ပြီးပါပြီ!`
          : `${selectedItems.length} item${
              selectedItems.length > 1 ? "s" : ""
            } deleted successfully!`;

      toastSuccess(successMessage);

      // React Query mutations already invalidate queries which triggers automatic refetch
      // The onSuccess handler in the mutation hook handles query invalidation
    } catch (error) {
      console.error("Failed to delete items:", error);

      // Show error toast with more specific message
      let errorMessage = currentLanguage === "mm"
        ? "အစုလိုက် ဖျက်ခြင်း မအောင်မြင်ပါ"
        : "Failed to delete items";
      
      if (error instanceof Error) {
        // Check for network errors
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('connect')) {
          errorMessage = currentLanguage === "mm"
            ? "ဆာဗာနှင့် ဆက်သွယ်၍မရပါ - backend service စစ်ဆေးပါ"
            : "Cannot connect to server - Please check if backend service is running";
        } else {
          errorMessage = error.message;
        }
      }

      toastError(errorMessage);
    } finally {
      setBulkDeleteConfirmOpen(false);
    }
  };

  // Create columns for the data table
  const columns: ColumnDef<any>[] = useMemo(() => {
    const cols: ColumnDef<any>[] = [];

    // Sr. No column - Always first
    cols.push({
      id: "sr",
      size: 60, // Fixed width for serial number column
      minSize: 60,
      maxSize: 60,
      header: () => (
        <div className="text-center font-medium">
          {currentLanguage === "mm" ? "စဉ်" : "Sr."}
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-medium text-muted-foreground">
          {row.index + 1}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      enableResizing: false, // Prevent resizing
    });

    // Actions column - Always second if present
    if (module.dataTableSchema.actions) {
      cols.push({
        id: "actions",
        size: 80, // Fixed width for actions column
        minSize: 80,
        maxSize: 80,
        enableResizing: false, // Prevent resizing
        header: () => (
          <div className="text-center">
            <IconComponent name="Settings" className="h-4 w-4 mx-auto" />
            <span className="sr-only">
              {currentLanguage === "mm" ? "လုပ်ဆောင်ချက်များ" : "Actions"}
            </span>
          </div>
        ),
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <IconComponent name="MoreHorizontal" className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {currentLanguage === "mm" ? "လုပ်ဆောင်ချက်များ" : "Actions"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* View Action */}
                  {module.dataTableSchema.actions.view && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/${params.appId}/${module.slug}/${
                          item._id || item.id
                        }/view`}
                        className="cursor-pointer"
                      >
                        <IconComponent name="Eye" className="mr-2 h-4 w-4" />
                        {currentLanguage === "mm" ? "ကြည့်မည်" : "View"}
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {/* Edit Action - Show by default unless explicitly disabled */}
                  {module.dataTableSchema.actions.edit !== false && (
                    <DropdownMenuItem
                      onClick={() => handleEdit(item._id || item.id)}
                      className="cursor-pointer"
                    >
                      <IconComponent name="Pencil" className="mr-2 h-4 w-4" />
                      {currentLanguage === "mm" ? "ပြင်ဆင်မည်" : "Edit"}
                    </DropdownMenuItem>
                  )}

                  {/* Delete Action - Show by default unless explicitly disabled */}
                  {module.dataTableSchema.actions.delete !== false && (
                    <DropdownMenuItem
                      onClick={() => handleDelete(item._id || item.id)}
                      className="cursor-pointer text-destructive"
                    >
                      <IconComponent name="Trash2" className="mr-2 h-4 w-4" />
                      {currentLanguage === "mm" ? "ဖျက်မည်" : "Delete"}
                    </DropdownMenuItem>
                  )}

                  {/* Extra Actions - Only show actions that don't require selection (single-row actions) */}
                  {module.dataTableSchema.actions.extraActions
                    ?.filter((action) => {
                      // Filter out bulk actions (requiresSelection: true)
                      const actionForm = module.extraActionForms?.find(
                        (form) => form.actionKey === action.actionKey
                      );
                      return !actionForm?.requiresSelection;
                    })
                    .map((action) =>
                      action.type === "page" ? (
                        <DropdownMenuItem key={action.actionKey} asChild>
                          <Link
                            href={`/${params.appId}/${module.slug}/${
                              item._id || item.id
                            }/actions/${action.actionKey}`}
                            className="cursor-pointer"
                          >
                            <IconComponent
                              name={action.icon}
                              className="mr-2 h-4 w-4"
                            />
                            {getLocalizedText(action.label, currentLanguage)}
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          key={action.actionKey}
                          onClick={() => handleExtraActionForRow(action, item)}
                          className="cursor-pointer"
                        >
                          <IconComponent
                            name={action.icon}
                            className="mr-2 h-4 w-4"
                          />
                          {getLocalizedText(action.label, currentLanguage)}
                        </DropdownMenuItem>
                      )
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      });
    }

    // Selection column - Third if enabled
    if (module.dataTableSchema.layout === "withCheckbox") {
      cols.push({
        id: "select",
        size: 40, // Fixed width for checkbox column
        minSize: 40,
        maxSize: 40,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        enableResizing: false, // Prevent resizing
      });
    }

    // Data columns
    module.dataTableSchema.columns.forEach((column: TableColumn) => {
      cols.push({
        id: column.fieldName,
        accessorFn: (row) => getNestedValue(row, column.fieldName),
        size: 150, // Set default column width
        minSize: 100, // Minimum width
        maxSize: 300, // Maximum width
        header: ({ column: tableColumn }) => {
          return column.sortable ? (
            <Button
              variant="ghost"
              onClick={() => handleSort(column.fieldName)}
              className={`p-0 h-auto font-medium justify-start ${
                queryParams.sortBy === column.fieldName ? "text-primary" : ""
              }`}
            >
              {getLocalizedText(column.label, currentLanguage)}
              <IconComponent
                name={
                  queryParams.sortBy === column.fieldName
                    ? queryParams.sortOrder === "asc"
                      ? "ArrowUp"
                      : "ArrowDown"
                    : "ArrowUpDown"
                }
                className={`ml-2 h-4 w-4 ${
                  queryParams.sortBy === column.fieldName
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </Button>
          ) : (
            <span className="font-medium">
              {getLocalizedText(column.label, currentLanguage)}
            </span>
          );
        },
        cell: ({ row }) => {
          const fieldValue = getNestedValue(row.original, column.fieldName);
          const rawValue = getRawNestedValue(row.original, column.fieldName);

          if (column.type === "date" && fieldValue) {
            return new Date(fieldValue).toLocaleDateString();
          } else if (column.type === "boolean") {
            // Special handling for userId field (Portal Access)
            // Check both rawValue (may be populated object) and fieldValue
            if (column.fieldName === "userId") {
              // userId might be populated as an object or just an ObjectId
              const hasAccess = !!(rawValue?._id || rawValue?.id || fieldValue);
              return (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium print:inline-block print:mr-1 ${
                    hasAccess
                      ? "bg-green-100 text-green-800 border border-green-300 print:bg-green-100 print:text-green-800"
                      : "bg-red-100 text-red-800 border border-red-300 print:bg-red-100 print:text-red-800"
                  }`}
                >
                  {hasAccess ? (
                    <>
                      <CheckCircle className="h-3 w-3 print:hidden" />
                      <span className="print:inline">{currentLanguage === "mm" ? "ရှိ" : "Yes"}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 print:hidden" />
                      <span className="print:inline">{currentLanguage === "mm" ? "မရှိ" : "No"}</span>
                    </>
                  )}
                </span>
              );
            }

            // Default boolean rendering
            return (
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  fieldValue
                    ? "bg-success/20 text-success border border-success/30"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {fieldValue
                  ? currentLanguage === "mm"
                    ? "ရှိ"
                    : "Yes"
                  : currentLanguage === "mm"
                  ? "မရှိ"
                  : "No"}
              </span>
            );
          } else if (column.type === "status") {
            // Case-insensitive comparison for status values
            const isActive = typeof fieldValue === 'string' && fieldValue.toLowerCase() === 'active';
            return (
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isActive
                    ? "bg-success/20 text-success border border-success/30"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {isActive
                  ? currentLanguage === "mm"
                    ? "အသုံးပြုနေသည်"
                    : "Active"
                  : currentLanguage === "mm"
                  ? "အသုံးပြုမနေ"
                  : "Inactive"}
              </span>
            );
          } else if (column.type === "icon") {
            return fieldValue ? (
              <div className="flex items-center justify-center">
                <IconComponent name={fieldValue} size={20} />
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">
                {currentLanguage === "mm" ? "မရှိပါ" : "N/A"}
              </span>
            );
          } else if (column.type === "number") {
            return fieldValue ? (
              <div className="font-medium text-right">
                {fieldValue.toLocaleString()}
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">
                {currentLanguage === "mm" ? "မရှိပါ" : "N/A"}
              </span>
            );
          } else if (column.type === "image") {
            return fieldValue ? (
              <div className="flex items-center justify-center">
                <img
                  src={fieldValue}
                  alt="Image"
                  className="w-8 h-8 rounded object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    (e.target as HTMLImageElement).src =
                      "/placeholder-image.png";
                  }}
                />
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">
                {currentLanguage === "mm" ? "မရှိပါ" : "N/A"}
              </span>
            );
          } else if (column.renderAs === "badge" && fieldValue) {
            return (
              <Badge variant={column.badgeVariant || "secondary"}>
                {fieldValue}
              </Badge>
            );
          } else if (column.renderAs === "link" && fieldValue) {
            return (
              <a 
                href={String(fieldValue)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline truncate max-w-[250px] inline-block"
              >
                {fieldValue}
              </a>
            );
          } else if (column.type === "textArea" && fieldValue) {
            return (
              <div className="whitespace-pre-wrap text-sm max-w-[350px] line-clamp-3">
                {fieldValue}
              </div>
            );
          } else if (column.renderAs === "array" || column.renderAs === "list" || column.isArray) {
            // Handle array rendering - check both rawValue and fieldValue
            const arrayData = Array.isArray(rawValue) ? rawValue : (Array.isArray(fieldValue) ? fieldValue : []);

            if (!arrayData || arrayData.length === 0) {
              return (
                <span className="text-muted-foreground text-xs print:inline">
                  {currentLanguage === "mm" ? "မရှိပါ" : "-"}
                </span>
              );
            }

            // Helper function to get nested value from object using dot notation
            const getNestedArrayValue = (obj: any, path: string) => {
              if (!path) return obj;
              return path.split('.').reduce((current, key) => {
                if (current && typeof current === 'object' && key in current) {
                  return current[key];
                }
                return undefined;
              }, obj);
            };

            // Handle arrayDisplay configuration (new format)
            if (column.arrayDisplay) {
              const { field, separator = ", " } = column.arrayDisplay;

              const formattedItems = arrayData
                .map((item: any) => {
                  if (typeof item === 'object' && item !== null) {
                    const value = getNestedArrayValue(item, field);
                    // Handle multilingual values
                    if (value && typeof value === 'object' && (value.en || value.mm)) {
                      return getLocalizedText(value, currentLanguage);
                    }
                    return value;
                  }
                  return item;
                })
                .filter(val => val !== null && val !== undefined && val !== '');

              return (
                <span className="text-sm print:inline">
                  {formattedItems.join(separator)}
                </span>
              );
            }

            // Handle arrayFormat configuration (legacy format) - could be empty object or have fields
            if (column.arrayFormat && Object.keys(column.arrayFormat).length > 0) {
              const { fields, separator = " - ", displayFormat = "concatenated", fieldStyles = {} } = column.arrayFormat;

              // Special handling for batches column with advanced field styling
              if (column.fieldName === "batches" && fieldStyles && Object.keys(fieldStyles).length > 0) {
                // Helper to get color classes for badges
                const getColorClass = (color: string): { bg: string; text: string } => {
                  const colorMap: Record<string, { bg: string; text: string }> = {
                    green: { bg: 'bg-green-100', text: 'text-green-800' },
                    red: { bg: 'bg-red-100', text: 'text-red-800' },
                    blue: { bg: 'bg-blue-100', text: 'text-blue-800' },
                    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
                    gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
                  };
                  return colorMap[color] || colorMap.gray;
                };

                // Helper to render individual field with styling
                const renderStyledField = (fieldName: string, rawValue: any, formattedValue: string, fieldIndex: number) => {
                  const style = (fieldStyles as any)[fieldName];

                  if (!style) {
                    // No styling, render as plain text
                    return <span key={fieldIndex}>{formattedValue}</span>;
                  }

                  // Apply field styling based on type
                  if (style.type === 'badge') {
                    // Render as badge with color mapping
                    const color = style.colorMap?.[String(rawValue)] || 'gray';
                    const colorClass = getColorClass(color);

                    return (
                      <span
                        key={fieldIndex}
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${colorClass.bg} ${colorClass.text} print:inline-block print:mr-1`}
                      >
                        {formattedValue}
                      </span>
                    );
                  } else if (style.type === 'highlight') {
                    // Render as highlighted text
                    const fontWeightClass = style.fontWeight === 'bold' ? 'font-bold' :
                                          style.fontWeight === 'semibold' ? 'font-semibold' : '';

                    return (
                      <span
                        key={fieldIndex}
                        className={`${fontWeightClass} ${style.className || ''}`}
                      >
                        {formattedValue}
                      </span>
                    );
                  } else {
                    // Default to plain text with optional className
                    return (
                      <span key={fieldIndex} className={style.className || ''}>
                        {formattedValue}
                      </span>
                    );
                  }
                };

                // Render batches with field-level styling
                return (
                  <div className="flex flex-col gap-1 print:block">
                    {arrayData.map((batch: any, batchIdx: number) => (
                      <div key={batchIdx} className="flex items-center gap-2 text-sm flex-wrap print:block print:mb-1">
                        {fields?.map((field: string, fieldIdx: number) => {
                          const rawValue = getNestedArrayValue(batch, field);

                          // Format value based on type
                          let formattedValue = '-';
                          if (rawValue !== null && rawValue !== undefined) {
                            if (typeof rawValue === 'boolean') {
                              formattedValue = field === 'isActive'
                                ? (rawValue ? 'Active' : 'Inactive')
                                : (rawValue ? 'Yes' : 'No');
                            } else {
                              formattedValue = String(rawValue);
                            }
                          }

                          return (
                            <React.Fragment key={fieldIdx}>
                              {renderStyledField(field, rawValue, formattedValue, fieldIdx)}
                              {fieldIdx < (fields?.length || 0) - 1 && (
                                <span className="text-gray-400 print:inline">{separator}</span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              }

              // Original simple batches rendering (fallback if no fieldStyles)
              if (column.fieldName === "batches") {
                // Format each batch according to arrayFormat configuration
                const formattedBatches = arrayData.map((batch: any, idx: number) => {
                  const values: string[] = [];

                  // Extract each field value
                  fields?.forEach((field: string) => {
                    const value = getNestedArrayValue(batch, field);

                    // Format value based on type
                    if (value === null || value === undefined) {
                      values.push('-');
                    } else if (typeof value === 'boolean') {
                      // Handle isActive field
                      if (field === 'isActive') {
                        values.push(value ? 'Active' : 'Inactive');
                      } else {
                        values.push(value ? 'Yes' : 'No');
                      }
                    } else {
                      values.push(String(value));
                    }
                  });

                  return {
                    text: values.join(separator),
                    isActive: batch.isActive
                  };
                });

                return (
                  <div className="flex flex-col gap-1 print:block">
                    {formattedBatches.map((item, idx) => (
                      <div
                        key={idx}
                        className={`text-sm print:block print:mb-1 ${
                          item.isActive
                            ? "font-medium text-gray-900"
                            : "text-gray-600"
                        }`}
                      >
                        {item.text}
                      </div>
                    ))}
                  </div>
                );
              }

              const formattedItems = arrayData.map((item: any) => {
                if (typeof item === 'object' && item !== null) {
                  // If fields are specified, use them
                  if (fields && fields.length > 0) {
                    return fields
                      .map(field => {
                        const value = getNestedArrayValue(item, field);
                        // Handle multilingual values
                        if (value && typeof value === 'object' && (value.en || value.mm)) {
                          return getLocalizedText(value, currentLanguage);
                        }
                        return value;
                      })
                      .filter(val => val !== null && val !== undefined)
                      .join(separator);
                  }
                  // No fields specified - intelligently extract display values
                  if (item.accessionNo) {
                    return `${item.accessionNo}${item.status ? ` - ${item.status}` : ''}`;
                  } else if (item.name || item.displayName || item.title) {
                    return item.name || item.displayName || item.title;
                  } else {
                    // Try to find meaningful fields
                    const meaningfulFields = Object.entries(item)
                      .filter(([key, val]) => key !== '_id' && key !== 'id' && val !== null && val !== undefined)
                      .map(([_, val]) => String(val));
                    return meaningfulFields.length > 0 ? meaningfulFields.join(separator) : JSON.stringify(item);
                  }
                }
                // Fallback for non-objects
                return String(item);
              });

              if (displayFormat === "list") {
                return (
                  <div className="flex flex-col gap-1 print:block">
                    {formattedItems.map((item: string, index: number) => (
                      <span key={index} className="text-sm print:block">
                        {item}
                      </span>
                    ))}
                  </div>
                );
              } else if (displayFormat === "badges") {
                return (
                  <div className="flex flex-wrap gap-1 print:inline">
                    {formattedItems.map((item: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs print:inline-block print:mr-1">
                        {item}
                      </Badge>
                    ))}
                  </div>
                );
              } else {
                // Default: concatenated
                return (
                  <span className="text-sm print:inline">
                    {formattedItems.length > 0 ? formattedItems.join(", ") : "-"}
                  </span>
                );
              }
            } else {
              // No arrayFormat specified, intelligently format array items
              return (
                <span className="text-sm print:inline">
                  {arrayData.length > 0 ? arrayData.map((item: any) => {
                    if (typeof item === 'object' && item !== null) {
                      // Intelligently extract display values for objects
                      if (item.accessionNo) {
                        return `${item.accessionNo}${item.status ? ` - ${item.status}` : ''}`;
                      } else if (item.name || item.displayName || item.title) {
                        return item.name || item.displayName || item.title;
                      } else {
                        // Try to find meaningful fields
                        const meaningfulFields = Object.entries(item)
                          .filter(([key, val]) => key !== '_id' && key !== 'id' && val !== null && val !== undefined)
                          .map(([_, val]) => String(val));
                        return meaningfulFields.length > 0 ? meaningfulFields.join(' - ') : JSON.stringify(item);
                      }
                    }
                    return String(item);
                  }).join(", ") : "-"}
                </span>
              );
            }
          } else if (
            column.populate &&
            rawValue &&
            typeof rawValue === "object" &&
            rawValue._id
          ) {
            // Enhanced display for populated reference fields from backend
            const { displayField, isMultilingual } = column.populate;
            let displayValue = fieldValue;

            // If no display value was extracted, try to get it from the populated data
            if (!displayValue && rawValue[displayField]) {
              if (
                isMultilingual &&
                typeof rawValue[displayField] === "object"
              ) {
                displayValue =
                  rawValue[displayField][currentLanguage] ||
                  rawValue[displayField].en ||
                  "";
              } else {
                displayValue = rawValue[displayField];
              }
            }

            return (
              <div className="font-medium truncate max-w-[250px] group relative">
                <span title={displayValue || rawValue._id}>
                  {isLoading ? (
                    <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                  ) : (
                    displayValue || rawValue._id || (
                      <span className="text-muted-foreground text-xs">
                        {currentLanguage === "mm" ? "မရှိပါ" : "N/A"}
                      </span>
                    )
                  )}
                </span>
                {/* Show ID on hover for debugging in development */}
                {process.env.NODE_ENV === "development" && rawValue._id && (
                  <span className="invisible group-hover:visible absolute -top-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap">
                    ID: {rawValue._id}
                  </span>
                )}
              </div>
            );
          } else if (
            column.type === "reference" &&
            rawValue &&
            typeof rawValue === "object" &&
            rawValue.id
          ) {
            // Legacy support for reference fields with {id, value: {en, mm}} structure
            return (
              <div className="font-medium truncate max-w-[250px] group relative">
                <span title={fieldValue || rawValue.id}>
                  {fieldValue || rawValue.id || "-"}
                </span>
                {/* Optional: Show ID on hover for debugging in development */}
                {process.env.NODE_ENV === "development" && rawValue.id && (
                  <span className="invisible group-hover:visible absolute -top-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded z-10">
                    ID: {rawValue.id}
                  </span>
                )}
              </div>
            );
          }

          // Handle arrays that don't have renderAs: "array" specified
          if (Array.isArray(fieldValue)) {
            const displayValue = fieldValue.map((item: any) => {
              if (typeof item === 'object' && item !== null) {
                // For objects, try to extract meaningful display values
                if (item.accessionNo) {
                  // Special handling for accession numbers
                  return `${item.accessionNo}${item.status ? ` - ${item.status}` : ''}`;
                } else if (item.name || item.displayName || item.title) {
                  // Common display fields
                  return item.name || item.displayName || item.title;
                } else if (item._id && item.id) {
                  // If it has both _id and id, it might be a populated reference
                  return item.id;
                } else {
                  // Fallback: stringify the object
                  return JSON.stringify(item);
                }
              }
              return String(item);
            }).join(", ");

            return (
              <div
                className="font-medium truncate max-w-[250px]"
                title={displayValue || "-"}
              >
                {displayValue || "-"}
              </div>
            );
          }

          // Default fallback - ensure we handle arrays properly
          let displayContent = fieldValue;
          let titleContent = fieldValue;
          
          if (Array.isArray(fieldValue)) {
            // Convert array to string for display
            displayContent = fieldValue.map((item: any) => {
              if (typeof item === 'object' && item !== null) {
                // For objects, extract meaningful display values
                if (item.accessionNo) {
                  return `${item.accessionNo}${item.status ? ` - ${item.status}` : ''}`;
                } else if (item.name || item.displayName || item.title) {
                  return item.name || item.displayName || item.title;
                } else if (item._id && item.id) {
                  return item.id;
                } else {
                  return JSON.stringify(item);
                }
              }
              return String(item);
            }).join(", ");
            titleContent = displayContent; // Use the same string for title
          }
          
          return (
            <div
              className="font-medium truncate max-w-[250px]"
              title={typeof titleContent === 'string' ? titleContent : JSON.stringify(titleContent) || "-"}
            >
              {typeof displayContent === 'object' ? JSON.stringify(displayContent) : (displayContent || "-")}
            </div>
          );
        },
        enableSorting: column.sortable,
        enableHiding: true,
        meta: {
          // Store column schema information for print/export functionality
          columnType: column.type,
          renderAs: (column as any).renderAs,
          arrayFormat: (column as any).arrayFormat,
          arrayDisplay: column.arrayDisplay,
          populate: column.populate,
        },
      });
    });

    // Actions column moved to second position above
    if (false && module.dataTableSchema.actions) {
      cols.push({
        id: "actions",
        header: () => (
          <div className="text-center">
            {currentLanguage === "mm" ? "လুပ်ဆောင်ချက်များ" : "Actions"}
          </div>
        ),
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <IconComponent name="MoreHorizontal" className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {currentLanguage === "mm" ? "လုပ်ဆောင်ချက်များ" : "Actions"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* View Action */}
                  {module.dataTableSchema.actions.view && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/${params.appId}/${module.slug}/${
                          item._id || item.id
                        }/view`}
                        className="cursor-pointer"
                      >
                        <IconComponent name="Eye" className="mr-2 h-4 w-4" />
                        {currentLanguage === "mm" ? "ကြည့်မည်" : "View"}
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {/* Edit Action - Show by default unless explicitly disabled */}
                  {module.dataTableSchema.actions.edit !== false && (
                    <DropdownMenuItem
                      onClick={() => handleEdit(item._id || item.id)}
                      className="cursor-pointer"
                    >
                      <IconComponent name="Edit" className="mr-2 h-4 w-4" />
                      {currentLanguage === "mm" ? "ပြင်ဆင်မည်" : "Edit"}
                    </DropdownMenuItem>
                  )}

                  {/* Delete Action - Show by default unless explicitly disabled */}
                  {module.dataTableSchema.actions.delete !== false && (
                    <DropdownMenuItem
                      onClick={() => handleDelete(item._id || item.id)}
                      className="cursor-pointer text-destructive"
                    >
                      <IconComponent name="Trash2" className="mr-2 h-4 w-4" />
                      {currentLanguage === "mm" ? "ဖျက်မည်" : "Delete"}
                    </DropdownMenuItem>
                  )}

                  {/* Extra Actions - All actions available from row menu with automatic selection handling */}
                  {module.dataTableSchema.actions.extraActions?.map((action) =>
                    action.type === "page" ? (
                      <DropdownMenuItem key={action.actionKey} asChild>
                        <Link
                          href={`/${params.appId}/${module.slug}/${
                            item._id || item.id
                          }/actions/${action.actionKey}`}
                          className="cursor-pointer"
                        >
                          <IconComponent
                            name={action.icon}
                            className="mr-2 h-4 w-4"
                          />
                          {getLocalizedText(action.label, currentLanguage)}
                        </Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        key={action.actionKey}
                        onClick={() => handleExtraActionForRow(action, item)}
                        className="cursor-pointer"
                      >
                        <IconComponent
                          name={action.icon}
                          className="mr-2 h-4 w-4"
                        />
                        {getLocalizedText(action.label, currentLanguage)}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      });
    }

    return cols;
  }, [module.dataTableSchema, currentLanguage, queryParams]);

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconComponent
              name={module.iconName}
              className="w-6 h-6 text-primary"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              {getLocalizedText(module.name, currentLanguage)}
            </h1>
            <p className="text-muted-foreground hidden md:block">
              {getLocalizedText(module.description, currentLanguage)}
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Filter Section - Hidden when prefilters are rendered externally */}
      {hasPrefilters && !hidePrefilters && (
        <div className="space-y-3">
          {/* Filter Summary when collapsed */}
          {filterSummary && !showAdvancedFilters && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Active filters:</span>
                  <div className="flex flex-wrap gap-1">
                    {filterSummary.map((summary, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {summary}
                      </Badge>
                    ))}
                  </div>
                </div>
                <span className="text-muted-foreground/50">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs">Found:</span>
                  <Badge variant="default" className="text-xs">
                    {totalItems.toLocaleString()} {currentLanguage === "mm" ? "မှတ်တမ်း" : "records"}
                  </Badge>
                </div>
              </div>
              
              {/* Clear All Button */}
              {filterSummary && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                  setPrefilterValues({});
                  // Clear all prefilter params from URL
                  const newSearchParams = new URLSearchParams(searchParams.toString());
                  if (module.dataTableSchema?.prefilters?.fields) {
                    module.dataTableSchema.prefilters.fields.forEach((field: any) => {
                      if (field.type === 'text') {
                        // Clear all operator-based params for text fields
                        const operators = field.searchOptions?.operators || [{ value: '$regex' }, { value: '$eq' }];
                        operators.forEach((op: any) => {
                          newSearchParams.delete(`${field.fieldName}[${op.value}]`);
                        });
                      } else if (field.type === 'yearRange') {
                        // Clear year range params
                        newSearchParams.delete(field.fieldName);
                        newSearchParams.delete(`${field.fieldName}[$eq]`);
                        newSearchParams.delete(`${field.fieldName}[$gte]`);
                        newSearchParams.delete(`${field.fieldName}[$lte]`);
                        newSearchParams.delete(`${field.fieldName}[$gt]`);
                        newSearchParams.delete(`${field.fieldName}[$lt]`);
                      } else {
                        newSearchParams.delete(field.fieldName);
                      }
                    });
                  }
                  newSearchParams.set('page', '1');
                  router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
                  // Keep advanced filters panel open after clearing
                }}
                className="text-xs"
              >
                <IconComponent name="X" className="h-3 w-3 mr-1" />
                Clear all filters
              </Button>
            )}
            </div>
          )}
          
          {/* Collapsible Filter Panel */}
          {showAdvancedFilters && (
            <>
              {/* Tab-based prefilters when displayMode is 'tabs' and fieldGroups are defined */}
              {useTabsDisplay && module.dataTableSchema.prefilters?.fieldGroups ? (
                <PrefilterTabGroup
                  fieldGroups={module.dataTableSchema.prefilters.fieldGroups}
                  prefilterValues={prefilterValues as Record<string, string | string[] | { from: string; to: string } | undefined>}
                  onPrefilterChange={handlePrefilterChange}
                  onClearAll={handleClearAllPrefilters}
                  currentLanguage={currentLanguage}
                  moduleSlug={module.slug}
                  sortOptions={sortOptions}
                  currentSort={searchParams.get('sortBy') || searchParams.get('sort') || module.dataTableSchema?.sorting?.defaultSort?.field || ''}
                  currentOrder={(searchParams.get('sortOrder') || searchParams.get('order') || module.dataTableSchema?.sorting?.defaultSort?.direction || 'asc') as 'asc' | 'desc'}
                  onSortChange={handleSortChange}
                  totalItems={totalItems}
                  activeTab={activePrefilterTab}
                  onActiveTabChange={handleActiveTabChange}
                />
              ) : (
                /* Legacy flat grid layout for prefilters */
                <div className="bg-muted/30 border border-border/50 rounded-lg p-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {module.dataTableSchema.prefilters?.fields?.map((field: any, index: number) => {
                      // Render different field types - all fields take 1 column in a 3-column grid
                      if (field.type === 'text') {
                        return (
                          <PrefilterText
                            key={field.fieldName}
                            field={field}
                            value={prefilterValues[field.fieldName] as string | undefined}
                            operator={prefilterValues[`${field.fieldName}_operator`] as string || field.searchOptions?.defaultOperator || '$regex'}
                            onChange={(value, operator) => handlePrefilterChange(field.fieldName, value, operator)}
                            currentLanguage={currentLanguage}
                          />
                        );
                      } else if (field.type === 'yearRange') {
                        return (
                          <PrefilterYearRange
                            key={field.fieldName}
                            field={field}
                            value={prefilterValues[field.fieldName] as string | { from: string; to: string } | undefined}
                            operator={prefilterValues[`${field.fieldName}_operator`] as string || field.yearRangeOptions?.defaultOperator || '$eq'}
                            onChange={(value, operator) => handlePrefilterChange(field.fieldName, value, operator)}
                            currentLanguage={currentLanguage}
                          />
                        );
                      } else if (field.type === 'typeaheadDynamicSelect') {
                        return (
                          <PrefilterTypeahead
                            key={field.fieldName}
                            field={field}
                            value={prefilterValues[field.fieldName]}
                            onChange={(value) => handlePrefilterChange(field.fieldName, value)}
                            currentLanguage={currentLanguage}
                            moduleSlug={module.slug}
                          />
                        );
                      } else {
                        return (
                          <PrefilterSelect
                            key={field.fieldName}
                            field={field}
                            value={prefilterValues[field.fieldName]}
                            onChange={(value) => handlePrefilterChange(field.fieldName, value)}
                            currentLanguage={currentLanguage}
                            moduleSlug={module.slug}
                          />
                        );
                      }
                    })}

                    {/* Sort option at the end */}
                    {sortOptions.length > 0 && (
                      <PrefilterSort
                        sortOptions={sortOptions}
                        currentSort={searchParams.get('sortBy') || searchParams.get('sort') || module.dataTableSchema?.sorting?.defaultSort?.field || ''}
                        currentOrder={(searchParams.get('sortOrder') || searchParams.get('order') || module.dataTableSchema?.sorting?.defaultSort?.direction || 'asc') as 'asc' | 'desc'}
                        onChange={handleSortChange}
                        currentLanguage={currentLanguage}
                      />
                    )}
                  </div>

                  {/* Search Summary Footer */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      {/* Left side - Search Summary */}
                      <div className="flex items-center gap-3">
                        {filterSummary && filterSummary.length > 0 && (
                          <>
                            <span className="text-xs font-medium text-muted-foreground">
                              {currentLanguage === "mm" ? "ရှာဖွေမှု:" : "Active Filters:"}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {filterSummary.map((summary, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs py-0.5 px-2">
                                  {summary}
                                </Badge>
                              ))}
                            </div>
                          </>
                        )}
                        {(!filterSummary || filterSummary.length === 0) && (
                          <span className="text-xs text-muted-foreground italic">
                            {currentLanguage === "mm" ? "စစ်ထုတ်မှု မရှိပါ" : "No filters applied"}
                          </span>
                        )}
                      </div>

                      {/* Right side - Total Records and Clear button */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <IconComponent name="Database" className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {currentLanguage === "mm" ? "စုစုပေါင်း:" : "Total:"}
                          </span>
                          <Badge variant="outline" className="text-xs font-bold px-2 py-0.5">
                            {totalItems.toLocaleString()}
                          </Badge>
                        </div>

                        {/* Clear Filters Button */}
                        {filterSummary && filterSummary.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAllPrefilters}
                            className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                          >
                            <IconComponent name="FilterX" className="h-3.5 w-3.5 mr-1" />
                            {currentLanguage === "mm" ? "စစ်ထုတ်မှု ဖယ်ရှားရန်" : "Clear Filters"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Monthly Report Selector */}
      {showMonthlySelector && (
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {currentLanguage === "mm" ? "လစဉ် အစီရင်ခံစာ" : "Monthly Report"}
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Year Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">
                  {currentLanguage === "mm" ? "နှစ်" : "Year"}:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => handleMonthChange(parseInt(e.target.value), selectedMonth)}
                  className="px-3 py-1 text-sm border border-border rounded bg-background text-foreground min-w-[80px]"
                >
                  {generateYearOptions().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">
                  {currentLanguage === "mm" ? "လ" : "Month"}:
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(selectedYear, parseInt(e.target.value))}
                  className="px-3 py-1 text-sm border border-border rounded bg-background text-foreground min-w-[120px]"
                >
                  {generateMonthOptions().map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Period Display */}
              <div className="text-sm text-primary font-medium bg-primary/10 px-3 py-1 rounded-md">
                {getMonthName(selectedMonth)} {selectedYear}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      {selectedItems.length > 0 &&
        module.dataTableSchema.layout === "withCheckbox" && (
          <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedItems.length}{" "}
                {currentLanguage === "mm" ? "ခု ရွေးချယ်ထားသည်" : "selected"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Bulk Delete */}
              {module.dataTableSchema.actions.delete !== false && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <IconComponent name="Trash2" className="w-4 h-4 mr-2" />
                  {currentLanguage === "mm" ? "ဖျက်မည်" : "Delete"}
                </Button>
              )}

              {/* Bulk Extra Actions */}
              {module.dataTableSchema.actions.extraActions
                ?.filter((action) =>
                  module.extraActionForms.find(
                    (form) =>
                      form.actionKey === action.actionKey &&
                      form.requiresSelection
                  )
                )
                .map((action) => (
                  <Button
                    key={action.actionKey}
                    variant={
                      module.extraActionForms.find(
                        (form) => form.actionKey === action.actionKey
                      )?.buttonStyle === "destructive"
                        ? "destructive"
                        : module.extraActionForms.find(
                            (form) => form.actionKey === action.actionKey
                          )?.buttonStyle === "secondary"
                        ? "secondary"
                        : "default"
                    }
                    size="sm"
                    onClick={() => handleExtraAction(action)}
                  >
                    <IconComponent
                      name={action.icon}
                      className="w-4 h-4 mr-2"
                    />
                    {getLocalizedText(action.label, currentLanguage)}
                  </Button>
                ))}
            </div>
          </div>
        )}

      {/* Data Table - Responsive: Cards for mobile and small tablets, Table for large screens */}
      <div 
        className="w-full min-w-0 overflow-hidden" 
        style={{ 
          maxWidth: sidebarState === "collapsed" 
            ? 'calc(100vw - 80px)'   // More space when sidebar is collapsed (~48px + padding)
            : 'calc(100vw - 320px)'  // Less space when sidebar is expanded (~256px + padding)
        }}
      >
        {/* Mobile Card View - Show on mobile and tablet */}
        <div className="mobile-view-block space-y-4">
          {data.map((item, index) => (
            <div
              key={item._id || item.id || index}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
            >
              {/* Sr. no and selection for mobile cards */}
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {currentLanguage === "mm" ? "စဉ်" : "Sr."} {index + 1}
                  </span>
                </div>
                {module.dataTableSchema.layout === "withCheckbox" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedItems.some(
                        (selected) =>
                          (selected._id || selected.id) ===
                          (item._id || item.id)
                      )}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedItems((prev) => [...prev, item]);
                        } else {
                          setSelectedItems((prev) =>
                            prev.filter(
                              (selected) =>
                                (selected._id || selected.id) !==
                                (item._id || item.id)
                            )
                          );
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {currentLanguage === "mm" ? "ရွေးချယ်မည်" : "Select"}
                    </span>
                  </div>
                )}
              </div>

              {/* Card content - each column as a row */}
              {module.dataTableSchema.columns.map((column: TableColumn) => {
                const fieldValue = getNestedValue(item, column.fieldName);
                let displayValue = fieldValue;

                // Format the value based on column type
                if (column.type === "date" && fieldValue) {
                  displayValue = new Date(fieldValue).toLocaleDateString();
                } else if (column.type === "boolean") {
                  displayValue = (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        fieldValue
                          ? "bg-success/20 text-success border border-success/30"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {fieldValue
                        ? currentLanguage === "mm"
                          ? "ရှိ"
                          : "Yes"
                        : currentLanguage === "mm"
                        ? "မရှိ"
                        : "No"}
                    </span>
                  );
                } else if (column.type === "status") {
                  displayValue = (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        fieldValue === "Active"
                          ? "bg-success/20 text-success border border-success/30"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {fieldValue === "Active"
                        ? currentLanguage === "mm"
                          ? "အသုံးပြုနေသည်"
                          : "Active"
                        : currentLanguage === "mm"
                        ? "အသုံးပြုမနေ"
                        : "Inactive"}
                    </span>
                  );
                } else if (column.type === "icon") {
                  displayValue = fieldValue ? (
                    <div className="flex items-center">
                      <IconComponent name={fieldValue} size={20} />
                    </div>
                  ) : null;
                } else if (column.type === "number") {
                  displayValue = fieldValue ? (
                    <span className="font-medium">
                      {fieldValue.toLocaleString()}
                    </span>
                  ) : null;
                } else if (column.type === "image") {
                  displayValue = fieldValue ? (
                    <img
                      src={fieldValue}
                      alt="Image"
                      className="w-6 h-6 rounded object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/placeholder-image.png";
                      }}
                    />
                  ) : null;
                } else if (column.renderAs === "badge" && fieldValue) {
                  displayValue = (
                    <Badge variant={column.badgeVariant || "secondary"}>
                      {fieldValue}
                    </Badge>
                  );
                } else if (column.renderAs === "link" && fieldValue) {
                  displayValue = (
                    <a 
                      href={String(fieldValue)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      {fieldValue}
                    </a>
                  );
                } else if (column.type === "textArea" && fieldValue) {
                  displayValue = (
                    <div className="whitespace-pre-wrap text-sm">
                      {fieldValue}
                    </div>
                  );
                } else if (column.renderAs === "array" && Array.isArray(fieldValue)) {
                  // Handle array rendering for mobile view
                  const arrayFormat = column.arrayFormat || {};
                  const { fields, separator = ", ", displayFormat = "concatenated" } = arrayFormat;
                  
                  const formattedItems = fieldValue.map((item: any) => {
                    if (typeof item === 'object' && item !== null) {
                      if (fields && fields.length > 0) {
                        return fields
                          .map(field => item[field])
                          .filter(val => val !== null && val !== undefined)
                          .join(separator);
                      }
                      // Intelligent extraction for objects without fields specified
                      if (item.accessionNo) {
                        return `${item.accessionNo}${item.status ? ` - ${item.status}` : ''}`;
                      } else if (item.name || item.displayName || item.title) {
                        return item.name || item.displayName || item.title;
                      } else {
                        const meaningfulFields = Object.entries(item)
                          .filter(([key, val]) => key !== '_id' && key !== 'id' && val !== null && val !== undefined)
                          .map(([_, val]) => String(val));
                        return meaningfulFields.length > 0 ? meaningfulFields.join(separator) : JSON.stringify(item);
                      }
                    }
                    return String(item);
                  });

                  if (displayFormat === "list") {
                    displayValue = (
                      <div className="flex flex-col gap-1">
                        {formattedItems.map((item: string, index: number) => (
                          <span key={index} className="text-sm">
                            {item}
                          </span>
                        ))}
                      </div>
                    );
                  } else if (displayFormat === "badges") {
                    displayValue = (
                      <div className="flex flex-wrap gap-1">
                        {formattedItems.map((item: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    );
                  } else {
                    displayValue = <span className="text-sm">{formattedItems.join(", ")}</span>;
                  }
                } else if (Array.isArray(fieldValue)) {
                  // Handle arrays without renderAs specification
                  displayValue = fieldValue.map((item: any) => {
                    if (typeof item === 'object' && item !== null) {
                      if (item.accessionNo) {
                        return `${item.accessionNo}${item.status ? ` - ${item.status}` : ''}`;
                      } else if (item.name || item.displayName || item.title) {
                        return item.name || item.displayName || item.title;
                      } else {
                        const meaningfulFields = Object.entries(item)
                          .filter(([key, val]) => key !== '_id' && key !== 'id' && val !== null && val !== undefined)
                          .map(([_, val]) => String(val));
                        return meaningfulFields.length > 0 ? meaningfulFields.join(' - ') : JSON.stringify(item);
                      }
                    }
                    return String(item);
                  }).join(", ");
                } else if (typeof fieldValue === 'object' && fieldValue !== null && !React.isValidElement(displayValue)) {
                  // Handle any other objects that might slip through
                  displayValue = JSON.stringify(fieldValue);
                }

                // Hide column if data is empty/null and not loading
                if (!isLoading && !displayValue && !fieldValue) {
                  return null;
                }

                return (
                  <div
                    key={column.fieldName}
                    className="flex flex-col space-y-1"
                  >
                    <span className="text-sm font-medium text-muted-foreground text-left">
                      {getLocalizedText(column.label, currentLanguage)}
                    </span>
                    <div className="text-sm text-foreground ml-4">
                      {isLoading ? (
                        <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                      ) : (
                        displayValue
                      )}
                    </div>
                  </div>
                );
              }).filter(Boolean)}

              {/* Actions for mobile cards */}
              {module.dataTableSchema.actions && (
                <div className="pt-3 border-t border-border">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {/* View Action */}
                    {module.dataTableSchema.actions.view && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/${params.appId}/${module.slug}/${
                            item._id || item.id
                          }/view`}
                        >
                          <IconComponent name="Eye" className="mr-2 h-4 w-4" />
                          {currentLanguage === "mm" ? "ကြည့်မည်" : "View"}
                        </Link>
                      </Button>
                    )}

                    {/* Edit Action */}
                    {module.dataTableSchema.actions.edit !== false && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item._id || item.id)}
                      >
                        <IconComponent name="Edit" className="mr-2 h-4 w-4" />
                        {currentLanguage === "mm" ? "ပြင်ဆင်မည်" : "Edit"}
                      </Button>
                    )}

                    {/* Delete Action */}
                    {module.dataTableSchema.actions.delete !== false && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item._id || item.id)}
                        className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <IconComponent name="Trash2" className="mr-2 h-4 w-4" />
                        {currentLanguage === "mm" ? "ဖျက်မည်" : "Delete"}
                      </Button>
                    )}

                    {/* Extra Actions */}
                    {module.dataTableSchema.actions.extraActions?.map(
                      (action) =>
                        action.type === "page" ? (
                          <Button
                            key={action.actionKey}
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link
                              href={`/${params.appId}/${module.slug}/${
                                item._id || item.id
                              }/actions/${action.actionKey}`}
                            >
                              <IconComponent
                                name={action.icon}
                                className="mr-2 h-4 w-4"
                              />
                              {getLocalizedText(action.label, currentLanguage)}
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            key={action.actionKey}
                            variant="outline"
                            size="sm"
                            onClick={() => handleExtraAction(action)}
                          >
                            <IconComponent
                              name={action.icon}
                              className="mr-2 h-4 w-4"
                            />
                            {getLocalizedText(action.label, currentLanguage)}
                          </Button>
                        )
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Empty state for mobile */}
          {data.length === 0 && (
            <div className="text-center py-8">
              <IconComponent
                name="Database"
                className="w-12 h-12 text-muted-foreground mx-auto mb-4"
              />
              <p className="text-lg font-medium mb-2">
                {currentLanguage === "mm" ? "ဒေတာမရှိပါ" : "No data found"}
              </p>
              <p className="text-muted-foreground">
                {currentLanguage === "mm"
                  ? "ဒေတာများထည့်ရန် အသစ်ထည့်မည်ကို နှိပ်ပါ"
                  : "Click 'Add New' to create your first entry"}
              </p>
            </div>
          )}
        </div>

        {/* Desktop Table View - Show on desktop screens (768px+) */}
        <div className="desktop-view-hidden w-full min-w-0 overflow-hidden">
          <div 
            className="module-data-table w-full" 
            style={{ 
              maxWidth: sidebarState === "collapsed" 
                ? 'calc(100vw - 80px)'   // More space when sidebar is collapsed
                : 'calc(100vw - 320px)'  // Less space when sidebar is expanded
            }}
          >
            <DataTable
              columns={columns}
              data={data}
              moduleId={module.slug}
              searchKey={
                module.dataTableSchema.filtering?.searchFields?.[0] ||
                module.dataTableSchema.columns[0]?.fieldName
              }
              searchPlaceholder={
                currentLanguage === "mm"
                  ? `${
                      module.dataTableSchema.filtering?.searchFields?.[0] ||
                      "ဒေတာ"
                    } ရှာဖွေမည်...`
                  : `Search ${
                      module.dataTableSchema.filtering?.searchFields?.[0] ||
                      "data"
                    }...`
              }
              onRowSelectionChange={setSelectedItems}
              initialColumnVisibility={columnVisibility}
              enablePagination={
                // Enable client-side pagination when:
                // 1. Module has pagination enabled AND
                // 2. We have totalPages passed (indicating we're in client-side pagination mode)
                // OR we don't have server-side handlers (fallback to client-side)
                module.dataTableSchema.pagination?.enabled &&
                (totalPages > 1 || (!onPageChange && !currentPage))
              }
              pageSize={module.dataTableSchema.pagination?.defaultLimit || 10}
              // Pass external pagination props
              totalPages={totalPages}
              totalItems={totalItems}
              currentPage={currentPage}
              onPageChange={onPageChange}
              onRefresh={onRefresh}
              isLoading={isLoading}
              isPaginationControlsLoading={isLoading} // Sync pagination loading with data loading
              addNewRoute={`/${params.appId}/${module.slug}/new`}
              printTitle={getPrintTitle()}
              showAdvancedFilter={hasPrefilters}
              onAdvancedFilterToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
              isAdvancedFilterOpen={showAdvancedFilters}
              activeFilterCount={filterSummary ? filterSummary.length : 0}
              showRecycleBin={showRecycleBin}
              recycleBinCount={deletedCount}
              onRecycleBinClick={() => setRecycleBinOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Server-side Pagination - Only show when we have server-side pagination props */}
      {(() => {
        const hasData = data.length > 0;
        const paginationEnabled = module.dataTableSchema.pagination?.enabled;
        const isServerSidePaging =
          module.dataTableSchema.pagination?.isClientSidePaging === false;
        const isClientSidePaging = !isServerSidePaging;

        // Server-side pagination: requires onPageChange and totalPages
        const hasServerSideProps =
          onPageChange && totalPages !== undefined && totalPages >= 1;

        // Client-side pagination: just needs pagination enabled and data
        const hasClientSideRequirements =
          isClientSidePaging && paginationEnabled;

        const shouldShowPagination =
          hasData &&
          ((isServerSidePaging && hasServerSideProps) ||
            (isClientSidePaging && hasClientSideRequirements));

        return shouldShowPagination;
      })() && (
        <div className={isLoading ? "pointer-events-none" : ""}>
          <Pagination
            currentPage={currentPage ?? 1}
            totalPages={totalPages}
            pageSize={
              pageSize ??
              (module.dataTableSchema.pagination?.defaultLimit || 10)
            }
            totalItems={totalItems}
            allowedLimits={module.dataTableSchema.pagination?.allowedLimits}
            onPageChange={
              onPageChange ||
              ((page) => setQueryParams((prev) => ({ ...prev, page })))
            }
            onPageSizeChange={
              onPageSizeChange ||
              ((pageSize) =>
                setQueryParams((prev) => ({
                  ...prev,
                  limit: pageSize,
                  page: 1,
                })))
            }
            currentLanguage={currentLanguage}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Extra Action Modal */}
      {activeExtraAction && (
        <ExtraActionModal
          action={activeExtraAction}
          actionForm={module.extraActionForms.find(
            (form) => form.actionKey === activeExtraAction.actionKey
          )}
          module={module}
          selectedItems={
            rowActionItem
              ? [rowActionItem]
              : selectedItems
          }
          isOpen={isExtraActionModalOpen}
          isRowAction={!!rowActionItem} // True if this is a row action
          onClose={() => {
            setIsExtraActionModalOpen(false);
            setActiveExtraAction(null);
            setRowActionItem(null); // Clear row action item on close
          }}
          onSuccess={handleExtraActionSuccess}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={currentLanguage === "mm" ? "ဖျက်လိုသည်လား?" : "Delete Item"}
        description={
          currentLanguage === "mm"
            ? "ဤ item ကို ဖျက်လိုသည်မှာ သေချာပါသလား? ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍မရပါ။"
            : "Are you sure you want to delete this item? This action cannot be undone."
        }
        confirmText={currentLanguage === "mm" ? "ဖျက်မည်" : "Delete"}
        cancelText={currentLanguage === "mm" ? "မလုပ်တော့" : "Cancel"}
        onConfirm={executeDelete}
        destructive={true}
        icon="Trash2"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title={
          currentLanguage === "mm"
            ? `${selectedItems.length} ခု ဖျက်မည်`
            : `Delete ${selectedItems.length} Items`
        }
        description={
          currentLanguage === "mm"
            ? `ရွေးချယ်ထားသော ${selectedItems.length} ခုကို ဖျက်လိုသည်မှာ သေချာပါသလား? ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍မရပါ။`
            : `Are you sure you want to delete ${selectedItems.length} selected items? This action cannot be undone.`
        }
        confirmText={currentLanguage === "mm" ? "ဖျက်မည်" : "Delete All"}
        cancelText={currentLanguage === "mm" ? "မလုပ်တော့" : "Cancel"}
        onConfirm={executeBulkDelete}
        destructive={true}
        icon="Trash2"
      />

      {/* Extra Action Confirmation Dialog */}
      {pendingExtraAction && (
        <ConfirmationDialog
          open={extraActionConfirmOpen}
          onOpenChange={setExtraActionConfirmOpen}
          title={getLocalizedText(pendingExtraAction.label, currentLanguage)}
          description={getLocalizedText(
            pendingExtraAction.confirmMessage!,
            currentLanguage
          )}
          confirmText={currentLanguage === "mm" ? "ရှေ့ဆက်မည်" : "Continue"}
          cancelText={currentLanguage === "mm" ? "မလုပ်တော့" : "Cancel"}
          onConfirm={executeExtraAction}
          icon={pendingExtraAction.icon}
        />
      )}

      {/* Debug Panel */}
      <div className="mt-6 border rounded-lg overflow-hidden">
        <div className="bg-muted/50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent name="Bug" className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Debug Information</h3>
            <Badge variant="outline" className="text-xs">
              {debugLogs.length} {currentLanguage === "mm" ? "မှတ်တမ်း" : "logs"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDebugLogs([])}
              disabled={debugLogs.length === 0}
            >
              <IconComponent name="Trash2" className="w-4 h-4 mr-1" />
              {currentLanguage === "mm" ? "ရှင်းမည်" : "Clear Logs"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              <IconComponent
                name={showDebug ? "ChevronUp" : "ChevronDown"}
                className="w-4 h-4"
              />
            </Button>
          </div>
        </div>

        {showDebug && (
          <div className="p-4 space-y-4 bg-background max-h-[500px] overflow-y-auto">
            {/* Table Schema Info */}
            <div className="border rounded-lg p-3 bg-muted/20">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <IconComponent name="Table" className="w-4 h-4" />
                Table Layout Schema
              </h4>
              <div className="text-xs space-y-1 font-mono">
                <div><strong>Module:</strong> {module.slug}</div>
                <div><strong>Layout:</strong> {module.dataTableSchema?.layout || 'default'}</div>
                <div><strong>Columns:</strong> {module.dataTableSchema?.columns?.length || 0}</div>
                <div><strong>Pagination:</strong> {module.dataTableSchema?.pagination?.defaultLimit || 10} per page</div>
                <div><strong>Sorting:</strong> {module.dataTableSchema?.sorting?.defaultSort?.field || 'none'} ({module.dataTableSchema?.sorting?.defaultSort?.direction || 'asc'})</div>
                <div><strong>Has Prefilters:</strong> {(module.dataTableSchema as any)?.prefilters?.fields?.length > 0 ? 'Yes' : 'No'}</div>
                {(module.dataTableSchema as any)?.prefilters?.fields?.length > 0 && (
                  <div className="mt-2">
                    <strong>Prefilter Fields:</strong>
                    <ul className="ml-4 mt-1">
                      {(module.dataTableSchema as any).prefilters.fields.map((field: any) => (
                        <li key={field.fieldName}>
                          {field.fieldName} ({field.type})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Debug Logs */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <IconComponent name="Activity" className="w-4 h-4" />
                Activity Logs
              </h4>
              {debugLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  {currentLanguage === "mm" ? "မှတ်တမ်းမရှိသေးပါ" : "No logs yet"}
                </p>
              ) : (
                <div className="space-y-2">
                  {debugLogs.slice().reverse().map((log, idx) => (
                    <div
                      key={debugLogs.length - idx}
                      className={`border rounded p-2 text-xs font-mono ${
                        log.type === 'DELETE' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                        log.type === 'BULK_OP' ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800' :
                        log.type === 'DATA_RECEIVED' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' :
                        'bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge
                          variant={
                            log.type === 'DELETE' ? 'destructive' :
                            log.type === 'BULK_OP' ? 'default' :
                            log.type === 'DATA_RECEIVED' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {log.type}
                        </Badge>
                        <span className="text-muted-foreground">{log.timestamp}</span>
                      </div>

                      {log.url && (
                        <div className="mt-1">
                          <strong className="text-blue-600 dark:text-blue-400">{log.method}:</strong> {log.url}
                        </div>
                      )}

                      {log.dataCount !== undefined && (
                        <div className="mt-1">
                          <strong>Data Received:</strong> {log.dataCount} items (Total: {log.response?.totalItems || totalItems})
                        </div>
                      )}

                      {log.params && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Parameters
                          </summary>
                          <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.params, null, 2)}
                          </pre>
                        </details>
                      )}

                      {log.response && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Response
                          </summary>
                          <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.response, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recycle Bin Dialog */}
      {showRecycleBin && (
        <RecycleBinDialog
          moduleSlug={module.slug}
          moduleName={getLocalizedText(module.name, currentLanguage)}
          open={recycleBinOpen}
          onOpenChange={setRecycleBinOpen}
        />
      )}
    </div>
  );
}
