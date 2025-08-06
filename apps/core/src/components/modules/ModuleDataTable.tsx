"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toastSuccess, toastError } from "@repo/utils";
import { getLocalizedText } from "@repo/utils";
import { useLanguage } from "@repo/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconComponent } from "@repo/ui/components/icons";
import {
  useDeleteModuleItem,
  useHardDeleteModuleItem,
  useBulkModuleOperation,
} from "@/hooks/use-module-query";
import { DynamicSearch } from "./DynamicSearch";
import { Pagination } from "@/components/ui/pagination";
import { ExtraActionModal } from "./ExtraActionModal";
import { generateZodSchema } from "@/lib/form-schema";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog";
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

  // Function to calculate column visibility based on current language
  const calculateLanguageBasedVisibility = (columns: TableColumn[], currentLanguage: string) => {
    const visibility: Record<string, boolean> = {};
    
    // Always show selection column if present
    if (module.dataTableSchema.layout === "withCheckbox") {
      visibility["select"] = true;
    }
    
    // Always show actions column if present
    if (module.dataTableSchema.actions) {
      visibility["actions"] = true;
    }
    
    // Calculate visibility for data columns
    columns.forEach(column => {
      const { hasEnglish, hasMyanmar, isLanguageSpecific } = detectColumnLanguageSupport(column);
      
      if (currentLanguage === 'en') {
        visibility[column.fieldName] = hasEnglish;
      } else if (currentLanguage === 'mm') {
        visibility[column.fieldName] = hasMyanmar;
      } else {
        // Default: show all columns for unknown languages
        visibility[column.fieldName] = true;
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
    router.push(`/${module.slug}/${id}`);
  };


  const handleExtraAction = (action: ExtraAction) => {
    if (action.type === "modal") {
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
        header: () => (
          <div className="text-center">
            {currentLanguage === "mm" ? "လုပ်ဆောင်ချက်များ" : "Actions"}
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
                        href={`/${module.slug}/${item._id || item.id}/view`}
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

                  {/* Extra Actions */}
                  {module.dataTableSchema.actions.extraActions?.map((action) =>
                    action.type === "page" ? (
                      <DropdownMenuItem key={action.actionKey} asChild>
                        <Link
                          href={`/${module.slug}/${
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
                        onClick={() => handleExtraAction(action)}
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

        <Link href={`/${module.slug}/new`}>
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

      {/* Advanced Search */}
      {module.dataTableSchema.filtering?.enabled &&
        module.moduleAccessPolicy?.queryAllowedFields && (
          <DynamicSearch
            queryAllowedFields={module.moduleAccessPolicy.queryAllowedFields}
            onFiltersChange={(filters) => {
              setQueryParams((prev) => ({ ...prev, filters, page: 1 }));
            }}
            className="mb-4"
          />
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
                        <Link href={`/${module.slug}/${item._id || item.id}/view`}>
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
                            href={`/${module.slug}/${
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
              searchKey={
                module.dataTableSchema.filtering?.searchFields?.[0] ||
                module.dataTableSchema.columns[0]?.fieldName
              }
              searchPlaceholder={
                currentLanguage === "mm"
                  ? `${
                      module.dataTableSchema.filtering?.searchFields?.[0] || "ဒေတာ"
                    } ရှာဖွေမည်...`
                  : `Search ${
                      module.dataTableSchema.filtering?.searchFields?.[0] || "data"
                    }...`
              }
              onRowSelectionChange={setSelectedItems}
              initialColumnVisibility={columnVisibility}
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
          selectedItems={selectedItems}
          isOpen={isExtraActionModalOpen}
          onClose={() => {
            setIsExtraActionModalOpen(false);
            setActiveExtraAction(null);
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
