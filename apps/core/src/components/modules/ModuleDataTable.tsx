"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toastSuccess, toastError } from "@repo/utils";
import { getLocalizedText } from "@repo/utils";
import { useLanguage } from "@repo/language";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { DataTable, FilterConfig } from "@repo/ui";
import { Checkbox } from "@repo/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";
import { IconComponent } from "@repo/ui";
import {
  useDeleteModuleItem,
  useHardDeleteModuleItem,
  useBulkModuleOperation,
} from "@repo/schema-hooks";
import { DynamicSearch } from "./DynamicSearch";
import { Pagination } from "@repo/ui";
import { ExtraActionModal } from "@repo/schema-forms";
import { generateZodSchema } from "@repo/schema-utils";
import { generateSearchFields, getPrimarySearchField } from "@repo/schema-utils/search-field-generator";
import { ConfirmationDialog } from "@repo/ui";
import type { ModuleSchema, TableColumn, ExtraAction } from "@repo/types";
import { isMultilingualText } from "@repo/types";
import type { ColumnDef } from "@tanstack/react-table";

interface ModuleDataTableProps {
  module: ModuleSchema;
  data: any[];
  totalItems?: number;
  totalPages?: number;
  currentLanguage?: string;
}

export function ModuleDataTable({
  module,
  data,
  totalItems = data.length,
  totalPages = 1,
}: Omit<ModuleDataTableProps, 'currentLanguage'>) {
  const { currentLanguage } = useLanguage();
  const router = useRouter();

  // Helper function to get current app prefix for URLs
  const getCurrentAppPrefix = (): string => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const pathSegments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
      const appFromPath = pathSegments.length > 0 ? pathSegments[0] : '';
      
      if (appFromPath && (appFromPath === 'core' || appFromPath === 'library' || appFromPath === 'school' || appFromPath === 'content')) {
        return `/${appFromPath}`;
      }
    }
    return '/core'; // Default fallback
  };
  
  // React Query mutations for delete operations
  const deleteItemMutation = useDeleteModuleItem(module.slug);
  const hardDeleteItemMutation = useHardDeleteModuleItem(module.slug);
  const bulkOperationMutation = useBulkModuleOperation(module.slug);
  
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
  const [pendingDeleteType, setPendingDeleteType] = useState<'soft' | 'hard'>('soft');
  const [bulkDeleteType, setBulkDeleteType] = useState<'soft' | 'hard'>('soft');
  const [pendingExtraAction, setPendingExtraAction] = useState<ExtraAction | null>(null);
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: module.dataTableSchema.pagination?.defaultLimit || 10,
    sortBy: module.dataTableSchema.sorting?.defaultSort?.field || "",
    sortOrder: (module.dataTableSchema.sorting?.defaultSort?.direction ||
      "asc") as "asc" | "desc",
    filters: {} as Record<string, Record<string, any>>,
  });

  // Simple search state
  const [simpleSearchValue, setSimpleSearchValue] = useState("");
  
  // Advanced search toggle state
  const [isAdvancedSearchActive, setIsAdvancedSearchActive] = useState(false);
  
  // Generate search fields from schema
  const searchFields = useMemo(() => {
    return generateSearchFields(module);
  }, [module]);
  
  // Get primary search field for simple search
  const primarySearchField = useMemo(() => {
    return getPrimarySearchField(module);
  }, [module]);

  // Handle simple search
  const handleSimpleSearch = useCallback((value: string) => {
    setSimpleSearchValue(value);
    
    if (primarySearchField && value.trim()) {
      // Use regex operator for text search
      const searchOperator = primarySearchField.operators.includes('$regex') 
        ? '$regex' 
        : primarySearchField.operators[0];
      
      setQueryParams(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          [primarySearchField.fieldName]: {
            [searchOperator]: value
          }
        },
        page: 1
      }));
    } else if (!value.trim() && primarySearchField) {
      // Clear the primary search field filter
      setQueryParams(prev => {
        const newFilters = { ...prev.filters };
        delete newFilters[primarySearchField.fieldName];
        return {
          ...prev,
          filters: newFilters,
          page: 1
        };
      });
    }
  }, [primarySearchField]);

  // Helper function to get raw nested field values (without language filtering)
  const getRawNestedValue = (obj: any, path: string) => {
    const value = path.split(".").reduce((current, key) => current?.[key], obj);
    
    // For populated fields and complex objects, return the entire object for raw access
    if (value && typeof value === 'object') {
      return value; // Return the entire object for raw access
    }
    
    return value;
  };

  // Function to detect which languages a column supports
  const detectColumnLanguageSupport = (column: TableColumn) => {
    const fieldName = column.fieldName;
    
    // Check if this is a language-specific field path
    const isEnglishField = fieldName.includes('.en') || fieldName.endsWith('.en');
    const isMyanmarField = fieldName.includes('.mm') || fieldName.endsWith('.mm');
    
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

  // Function to calculate column visibility based on current language with 6-column limit
  const calculateLanguageBasedVisibility = (columns: TableColumn[], currentLanguage: string) => {
    const visibility: Record<string, boolean> = {};
    
    // Always show selection column if present (doesn't count toward 6-column limit)
    if (module.dataTableSchema.layout === "withCheckbox") {
      visibility["select"] = true;
    }
    
    // Show serial number column by default but allow hiding (doesn't count toward 6-column limit)
    visibility["sr"] = true;
    
    // Always show actions column if present (doesn't count toward 6-column limit)
    if (module.dataTableSchema.actions) {
      visibility["actions"] = true;
    }
    
    // Calculate visibility for data columns - only show first 6 columns by default
    let visibleCount = 0;
    const maxVisibleColumns = 6;
    
    columns.forEach(column => {
      const { hasEnglish, hasMyanmar, isLanguageSpecific } = detectColumnLanguageSupport(column);
      
      let shouldShow = false;
      if (currentLanguage === 'en') {
        shouldShow = hasEnglish;
      } else if (currentLanguage === 'mm') {
        shouldShow = hasMyanmar;
      } else {
        shouldShow = true; // Default: show all columns for unknown languages
      }
      
      // Only show first 6 columns that should be visible
      if (shouldShow && visibleCount < maxVisibleColumns) {
        visibility[column.fieldName] = true;
        visibleCount++;
      } else {
        visibility[column.fieldName] = false;
      }
    });
    
    return visibility;
  };

  // Hook to detect screen size
  const [isMobile, setIsMobile] = useState(false);
  
  // Calculate column visibility based on current language
  const columnVisibility = useMemo(() => {
    const visibility = calculateLanguageBasedVisibility(module.dataTableSchema.columns, currentLanguage);
    return visibility;
  }, [currentLanguage]); // Removed module.dataTableSchema.columns dependency to prevent excessive recalculation
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Helper function to get nested field values
  const getNestedValue = (obj: any, path: string) => {
    const value = path.split(".").reduce((current, key) => current?.[key], obj);
    
    // Handle populated reference fields with structure {_id, displayName: {en, mm}, ...}
    if (value && typeof value === 'object' && value._id && value.displayName) {
      // This is a populated reference field from backend
      if (isMultilingualText(value.displayName)) {
        return value.displayName[currentLanguage] || value.displayName.en || '';
      }
      // If displayName is not multilingual, return it directly
      return value.displayName || value._id || '';
    }
    
    // Handle populated reference fields with fullName fallback
    if (value && typeof value === 'object' && value._id && value.fullName && !value.displayName) {
      return value.fullName || value._id || '';
    }
    
    // Handle fields with structure {id, value: {en, mm}} (legacy support)
    if (value && typeof value === 'object' && value.hasOwnProperty('id') && value.hasOwnProperty('value')) {
      // This is a reference field with id and multilingual value
      if (isMultilingualText(value.value)) {
        return value.value[currentLanguage] || value.value.en || '';
      }
      // If value is not multilingual, return the value directly
      return value.value || '';
    }
    
    // If the value is a multilingual object, return the current language value
    if (isMultilingualText(value)) {
      return value[currentLanguage] || value.en || '';
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
    const appPrefix = getCurrentAppPrefix();
    router.push(`${appPrefix}/${module.slug}/${id}`);
  };


  const handleExtraAction = (action: ExtraAction) => {
    if (action.type === "modal") {
      // Clear row action item for bulk actions
      setRowActionItem(null);
      setActiveExtraAction(action);
      setIsExtraActionModalOpen(true);
    } else if (action.type === "api") {
      // Handle API action directly
      if (action.confirmMessage) {
        setPendingExtraAction(action);
        setExtraActionConfirmOpen(true);
      } else {
        console.log(`Executing API action: ${action.actionKey}`);
        // Here you would call the API
      }
    }
    // Page type actions are handled by Link navigation
  };

  // Handle extra actions for single rows (automatically handle selection for actions that need it)
  const handleExtraActionForRow = (action: ExtraAction, item: any) => {
    const itemId = item._id || item.id;
    console.log(`🎯 handleExtraActionForRow: Processing action "${action.actionKey}" for item ${itemId}`);
    
    if (action.type === "modal") {
      console.log(`🎭 handleExtraActionForRow: Opening modal for "${action.actionKey}" with preselected item ${itemId}`);
      // Set the row action item and clear bulk selection
      setRowActionItem(item);
      setSelectedItems([]); // Clear any bulk selections
      setActiveExtraAction(action);
      setIsExtraActionModalOpen(true);
    } else if (action.type === "api") {
      // For API actions, still use the selectedItems approach
      setSelectedItems([itemId]);
      if (action.confirmMessage) {
        setPendingExtraAction(action);
        setExtraActionConfirmOpen(true);
      } else {
        console.log(`Executing API action: ${action.actionKey} for item:`, itemId);
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
    setIsExtraActionModalOpen(false);
    setActiveExtraAction(null);
    setRowActionItem(null); // Clear row action item
    // Note: The ExtraActionModal already shows success toasts
    // Data refetching is handled by the individual mutations in the modal
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!pendingDeleteId) return;
    
    try {
      await deleteItemMutation.mutateAsync(pendingDeleteId);
      
      // Show success toast
      const successMessage = currentLanguage === "mm"
        ? `${getLocalizedText(module.name, currentLanguage)} အောင်မြင်စွာ ဖျက်ပြီးပါပြီ!`
        : `${getLocalizedText(module.name, currentLanguage)} deleted successfully!`;
      
      toastSuccess(successMessage);
      
    } catch (error) {
      console.error("Failed to delete item:", error);
      
      // Show error toast
      const errorMessage = error instanceof Error 
        ? error.message 
        : (currentLanguage === "mm" 
          ? "ဖျက်ခြင်း မအောင်မြင်ပါ"
          : "Failed to delete item");
      
      toastError(errorMessage);
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    setBulkDeleteConfirmOpen(true);
  };

  const executeBulkDelete = async () => {
    try {
      const ids = selectedItems.map((item) => item._id || item.id);
      await bulkOperationMutation.mutateAsync({
        operation: "delete",
        ids: ids,
      });

      // Clear selection and show success toast
      setSelectedItems([]);
      
      const successMessage = currentLanguage === "mm"
        ? `${selectedItems.length} ခု အောင်မြင်စွာ ဖျက်ပြီးပါပြီ!`
        : `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} deleted successfully!`;
      
      toastSuccess(successMessage);
      
    } catch (error) {
      console.error("Failed to delete items:", error);
      
      // Show error toast
      const errorMessage = error instanceof Error 
        ? error.message 
        : (currentLanguage === "mm" 
          ? "အစုလိုက် ဖျက်ခြင်း မအောင်မြင်ပါ"
          : "Failed to delete items");
      
      toastError(errorMessage);
    }
  };

  // Generate filter configurations based on column types
  const filterConfigs: Record<string, FilterConfig> = useMemo(() => {
    const configs: Record<string, FilterConfig> = {};
    
    module.dataTableSchema.columns.forEach((column: TableColumn) => {
      const fieldName = column.fieldName;
      
      switch (column.type) {
        case 'date':
        case 'datetime':
          configs[fieldName] = {
            dataType: column.type === 'datetime' ? 'datetime' : 'date'
          };
          break;
        case 'number':
        case 'integer':
        case 'float':
          configs[fieldName] = {
            dataType: 'number'
          };
          break;
        case 'boolean':
          configs[fieldName] = {
            dataType: 'boolean'
          };
          break;
        case 'select':
        case 'enum':
          configs[fieldName] = {
            dataType: 'select',
            options: column.options || []
          };
          break;
        case 'multiselect':
          configs[fieldName] = {
            dataType: 'multiselect',
            options: column.options || []
          };
          break;
        case 'text':
        case 'string':
        case 'email':
        case 'url':
        default:
          configs[fieldName] = {
            dataType: 'text',
            // Add typeahead if needed - can implement getSuggestions for specific fields
            getSuggestions: column.searchable ? async (value: string) => {
              // This could be implemented to fetch suggestions from API
              // For now, return empty array
              return [];
            } : undefined
          };
          break;
      }
    });
    
    return configs;
  }, [module.dataTableSchema.columns]);

  // Create columns for the data table
  const columns: ColumnDef<any>[] = useMemo(() => {
    const cols: ColumnDef<any>[] = [];

    // Selection column
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
      });
    }

    // Serial Number column
    cols.push({
      id: "sr",
      size: 60, // Fixed width for serial number column
      minSize: 60,
      maxSize: 60,
      header: currentLanguage === "mm" ? "စဉ်" : "Sr.",
      cell: ({ row, table }) => {
        // Get the current sorted/filtered row position
        const sortedRows = table.getSortedRowModel().rows;
        const sortedIndex = sortedRows.findIndex(r => r.id === row.id);
        return (
          <div className="text-center font-medium">
            {sortedIndex + 1}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true, // Can be hidden
    });

    // Data columns
    module.dataTableSchema.columns.forEach((column: TableColumn) => {
      cols.push({
        id: column.fieldName,
        accessorFn: (row) => getNestedValue(row, column.fieldName),
        size: 150, // Set default column width
        minSize: 100, // Minimum width
        maxSize: 300, // Maximum width
        header: getLocalizedText(column.label, currentLanguage),
        enableSorting: column.sortable,
        cell: ({ row }) => {
          const fieldValue = getNestedValue(row.original, column.fieldName);
          const rawValue = getRawNestedValue(row.original, column.fieldName);

          if (column.type === "date" && fieldValue) {
            return new Date(fieldValue).toLocaleDateString();
          } else if (column.type === "boolean") {
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
            return (
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
          } else if (column.type === "icon" && fieldValue) {
            return (
              <div className="flex items-center justify-center">
                <IconComponent name={fieldValue} size={20} />
              </div>
            );
          } else if (column.type === "number" && fieldValue) {
            return (
              <div className="font-medium text-right">
                {fieldValue.toLocaleString()}
              </div>
            );
          } else if (column.type === "image" && fieldValue) {
            return (
              <div className="flex items-center justify-center">
                <img 
                  src={fieldValue} 
                  alt="Image"
                  className="w-8 h-8 rounded object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                  }}
                />
              </div>
            );
          } else if (column.populate && rawValue && typeof rawValue === 'object' && rawValue._id) {
            // Enhanced display for populated reference fields from backend
            const { displayField, isMultilingual } = column.populate;
            let displayValue = fieldValue;
            
            // If no display value was extracted, try to get it from the populated data
            if (!displayValue && rawValue[displayField]) {
              if (isMultilingual && typeof rawValue[displayField] === 'object') {
                displayValue = rawValue[displayField][currentLanguage] || rawValue[displayField].en || '';
              } else {
                displayValue = rawValue[displayField];
              }
            }
            
            return (
              <div className="font-medium truncate max-w-[250px] group relative">
                <span title={displayValue || rawValue._id}>
                  {displayValue || rawValue._id || "-"}
                </span>
                {/* Show ID on hover for debugging in development */}
                {process.env.NODE_ENV === 'development' && rawValue._id && (
                  <span className="invisible group-hover:visible absolute -top-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap">
                    ID: {rawValue._id}
                  </span>
                )}
              </div>
            );
          } else if (column.type === "reference" && rawValue && typeof rawValue === 'object' && rawValue.id) {
            // Legacy support for reference fields with {id, value: {en, mm}} structure
            return (
              <div className="font-medium truncate max-w-[250px] group relative">
                <span title={fieldValue || rawValue.id}>
                  {fieldValue || rawValue.id || "-"}
                </span>
                {/* Optional: Show ID on hover for debugging in development */}
                {process.env.NODE_ENV === 'development' && rawValue.id && (
                  <span className="invisible group-hover:visible absolute -top-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded z-10">
                    ID: {rawValue.id}
                  </span>
                )}
              </div>
            );
          }

          return (
            <div
              className="font-medium truncate max-w-[250px]"
              title={fieldValue || "-"}
            >
              {fieldValue || "-"}
            </div>
          );
        },
        enableSorting: column.sortable,
        enableHiding: true,
      });
    });

    // Actions column
    if (module.dataTableSchema.actions) {
      cols.push({
        id: "actions",
        size: 120, // Wider for direct buttons
        minSize: 120,
        maxSize: 120,
        header: () => (
          <div className="text-center">
            {currentLanguage === "mm" ? "လုပ်ဆောင်ချက်များ" : "Actions"}
          </div>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const hasExtraActions = module.dataTableSchema.actions.extraActions && 
                                  module.dataTableSchema.actions.extraActions.length > 0;

          return (
            <div className="flex items-center justify-center gap-1">
              {/* Direct Edit Button */}
              {module.dataTableSchema.actions.edit !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(item._id || item.id)}
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                  title={currentLanguage === "mm" ? "ပြင်ဆင်မည်" : "Edit"}
                >
                  <IconComponent name="Edit" className="h-4 w-4" />
                </Button>
              )}

              {/* Direct Delete Button */}
              {module.dataTableSchema.actions.delete !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item._id || item.id)}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  title={currentLanguage === "mm" ? "ဖျက်မည်" : "Delete"}
                >
                  <IconComponent name="Trash2" className="h-4 w-4" />
                </Button>
              )}

              {/* More Actions Dropdown - Only show if there are extra actions or view action */}
              {(hasExtraActions || module.dataTableSchema.actions.view) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 data-[state=open]:bg-muted hover:bg-muted"
                      title={currentLanguage === "mm" ? "နောက်ထပ်လုပ်ဆောင်ချက်များ" : "More actions"}
                    >
                      <IconComponent name="MoreHorizontal" className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    {module.dataTableSchema.actions.view && (
                      <DropdownMenuItem asChild>
                        <Link
                          href={`${getCurrentAppPrefix()}/${module.slug}/${item._id || item.id}/view`}
                          className="cursor-pointer"
                        >
                          <IconComponent name="Eye" className="mr-2 h-4 w-4" />
                          {currentLanguage === "mm" ? "ကြည့်မည်" : "View"}
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {/* Extra Actions */}
                    {module.dataTableSchema.actions.extraActions?.map((action) =>
                      action.type === "page" ? (
                        <DropdownMenuItem key={action.actionKey} asChild>
                          <Link
                            href={`${getCurrentAppPrefix()}/${module.slug}/${
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
              )}
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
    <div className="space-y-6 w-full min-w-0 overflow-hidden">
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

        <Link href={`${getCurrentAppPrefix()}/${module.slug}/new`}>
          <Button>
            <IconComponent name="Plus" className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">
              {currentLanguage === "mm" ? "အသစ်ထည့်မည်" : "Add New"}
            </span>
            <span className="sm:hidden">
              {currentLanguage === "mm" ? "အသစ်" : "New"}
            </span>
          </Button>
        </Link>
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        {/* Search Row - Normal Search (Left) + Advanced Search Button (Right) */}
        <div className={`${isAdvancedSearchActive ? 'w-full' : 'flex items-center justify-between gap-4'}`}>
          {/* Normal Search - Left Side - Hidden when advanced is active */}
          {!isAdvancedSearchActive && primarySearchField && (
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <IconComponent 
                  name="Search" 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" 
                />
                <Input
                  type="text"
                  placeholder={
                    currentLanguage === "mm" 
                      ? `${getLocalizedText(primarySearchField.label || { en: "Search", mm: "ရှာဖွေမည်" }, currentLanguage)} ရှာဖွေမည်...` 
                      : `Search ${getLocalizedText(primarySearchField.label || { en: "Search", mm: "ရှာဖွေမည়" }, currentLanguage)}...`
                  }
                  value={simpleSearchValue}
                  onChange={(e) => handleSimpleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {simpleSearchValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSimpleSearch("")}
                >
                  <IconComponent name="X" className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Advanced Search - Full width when active, right side when inactive */}
          {module.dataTableSchema.filtering?.enabled && searchFields.length > 0 && (
            <div className={`${isAdvancedSearchActive ? 'w-full' : 'flex-shrink-0'}`}>
              <DynamicSearch
                queryAllowedFields={searchFields}
                onFiltersChange={(filters) => {
                  setQueryParams((prev) => ({ ...prev, filters, page: 1 }));
                }}
                simpleSearchField={primarySearchField?.fieldName}
                onAdvancedToggle={(isActive) => setIsAdvancedSearchActive(isActive)}
              />
            </div>
          )}
        </div>
      </div>

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
      <div className="w-full min-w-0">
        {/* Mobile Card View - Show on mobile, iPad Mini and iPad Air */}
        <div className="xl:hidden space-y-4">
          {data.map((item, index) => (
            <div
              key={item._id || item.id || index}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
            >
              {/* Selection checkbox for mobile cards */}
              {module.dataTableSchema.layout === "withCheckbox" && (
                <div className="flex items-center space-x-2 pb-2 border-b border-border">
                  <Checkbox
                    checked={selectedItems.some(
                      (selected) =>
                        (selected._id || selected.id) === (item._id || item.id)
                    )}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedItems((prev) => [...prev, item]);
                      } else {
                        setSelectedItems((prev) =>
                          prev.filter(
                            (selected) =>
                              (selected._id || selected.id) !== (item._id || item.id)
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
                } else if (column.type === "icon" && fieldValue) {
                  displayValue = (
                    <div className="flex items-center">
                      <IconComponent name={fieldValue} size={20} />
                    </div>
                  );
                } else if (column.type === "number" && fieldValue) {
                  displayValue = (
                    <span className="font-medium">
                      {fieldValue.toLocaleString()}
                    </span>
                  );
                } else if (column.type === "image" && fieldValue) {
                  displayValue = (
                    <img 
                      src={fieldValue} 
                      alt="Image"
                      className="w-6 h-6 rounded object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                      }}
                    />
                  );
                }

                return (
                  <div key={column.fieldName} className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-muted-foreground text-left">
                      {getLocalizedText(column.label, currentLanguage)}
                    </span>
                    <div className="text-sm text-foreground ml-4">
                      {displayValue || "-"}
                    </div>
                  </div>
                );
              })}

              {/* Actions for mobile cards */}
              {module.dataTableSchema.actions && (
                <div className="pt-3 border-t border-border">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {/* View Action */}
                    {module.dataTableSchema.actions.view && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`${getCurrentAppPrefix()}/${module.slug}/${item._id || item.id}/view`}>
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
                    {module.dataTableSchema.actions.extraActions?.map((action) =>
                      action.type === "page" ? (
                        <Button key={action.actionKey} variant="outline" size="sm" asChild>
                          <Link
                            href={`${getCurrentAppPrefix()}/${module.slug}/${
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

        {/* Desktop Table View - Only show on extra large screens (1280px+) */}
        <div className="hidden xl:block w-full min-w-0 overflow-hidden">
          <div className="module-data-table">
            <DataTable
              columns={columns}
              data={data}
              onRowSelectionChange={setSelectedItems}
              initialColumnVisibility={columnVisibility}
              printTitle={getLocalizedText(module.name, currentLanguage)}
              moduleId={module.slug}
              filterConfigs={filterConfigs}
              showFilters={true}
            />
          </div>
        </div>
      </div>

      {/* Pagination */}
      {data.length > 0 && module.dataTableSchema.pagination?.enabled && (
        <Pagination
          currentPage={queryParams.page}
          totalPages={totalPages}
          pageSize={queryParams.limit}
          totalItems={totalItems}
          allowedLimits={module.dataTableSchema.pagination.allowedLimits}
          onPageChange={(page) => setQueryParams((prev) => ({ ...prev, page }))}
          onPageSizeChange={(pageSize) =>
            setQueryParams((prev) => ({ ...prev, limit: pageSize, page: 1 }))
          }
          currentLanguage={currentLanguage}
        />
      )}


      {/* Extra Action Modal */}
      {activeExtraAction && (
        <ExtraActionModal
          action={activeExtraAction}
          actionForm={module.extraActionForms.find(
            (form) => form.actionKey === activeExtraAction.actionKey
          )}
          module={module}
          selectedItems={rowActionItem ? [rowActionItem._id || rowActionItem.id] : selectedItems}
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
        description={currentLanguage === "mm" 
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
        title={currentLanguage === "mm" 
          ? `${selectedItems.length} ခု ဖျက်မည်` 
          : `Delete ${selectedItems.length} Items`
        }
        description={currentLanguage === "mm" 
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
          description={getLocalizedText(pendingExtraAction.confirmMessage!, currentLanguage)}
          confirmText={currentLanguage === "mm" ? "ရှေ့ဆက်မည်" : "Continue"}
          cancelText={currentLanguage === "mm" ? "မလုပ်တော့" : "Cancel"}
          onConfirm={executeExtraAction}
          icon={pendingExtraAction.icon}
        />
      )}
    </div>
  );
}
