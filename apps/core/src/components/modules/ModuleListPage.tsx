"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@repo/language";
import { getLocalizedText } from "@repo/utils";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconComponent } from "@repo/ui/components/icons";
import {
  useModuleList,
  useModuleItem,
  useDeleteModuleItem,
  useBulkModuleOperation,
} from "@/hooks/use-module-query";
import { DynamicSearch } from "./DynamicSearch";
import { ReactHookForm } from "../forms/ReactHookForm";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toastSuccess, toastError } from "@repo/utils";
import type { ModuleSchema, DataTableColumn } from "@repo/types";
import type { ColumnDef } from "@tanstack/react-table";

interface ModuleListPageProps {
  module: ModuleSchema;
  initialData: any[];
}

export function ModuleListPage({ module, initialData }: ModuleListPageProps) {
  const router = useRouter();
  const { currentLanguage } = useLanguage();
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Confirmation dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 10,
    sortBy: "",
    sortOrder: "asc" as const,
    filters: {} as Record<string, Record<string, any>>,
  });

  // Pagination handlers using TanStack Query
  const handlePageChange = (newPage: number) => {
    setQueryParams((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleLimitChange = (newLimit: number) => {
    setQueryParams((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1, // Reset to first page when changing limit
    }));
  };

  // TanStack Query hooks - using server actions
  const {
    data: moduleData,
    isLoading,
    error,
    refetch,
  } = useModuleList(module.slug, queryParams, {
    // Use placeholderData from server-side fetch for instant loading
    initialData: initialData,
    placeholderData: initialData,
    staleTime: 30 * 1000, // Reduce cache time to 30 seconds for better reactivity
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // TanStack Query hook for fetching item data for editing
  const {
    data: editItemData,
    isLoading: isLoadingEditItem,
    error: editItemError,
  } = useModuleItem(module.slug, editingItemId || "", {
    enabled: !!editingItemId && isEditModalOpen,
    staleTime: 0, // Always fetch fresh data for editing
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    retry: 2, // Retry failed requests twice
  });

  const deleteItemMutation = useDeleteModuleItem(module.slug);
  const bulkOperationMutation = useBulkModuleOperation(module.slug);

  const handleCreate = () => {
    router.push(`/${module.slug}/new`);
  };

  const handleEdit = (id: string) => {
    setEditingItemId(id);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (data: any) => {
    setIsEditModalOpen(false);
    setEditingItemId(null);
    // TanStack Query will automatically invalidate and refetch
  };

  const handleEditError = (error: string) => {
    console.error("Edit error:", error);
    // Keep modal open for user to retry
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setEditingItemId(null);
  };

  const handleFiltersChange = (
    filters: Record<string, Record<string, any>>
  ) => {
    setQueryParams((prev) => ({
      ...prev,
      page: 1, // Reset to first page when filters change
      filters,
    }));
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
      const ids = selectedItems.map((item) => item._id);
      await bulkOperationMutation.mutateAsync({
        operation: "delete",
        ids,
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

  const handleSort = (sortBy: string) => {
    setQueryParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder:
        prev.sortBy === sortBy && prev.sortOrder === "asc" ? "desc" : "asc",
      page: 1, // Reset to first page when sorting
    }));
  };

  // Helper function to get nested field values
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  // Create columns for the data table
  const columns: ColumnDef<any>[] = useMemo(() => {
    const cols: ColumnDef<any>[] = [];

    // Selection column
    if (module.dataTableSchema.layout === "withCheckbox") {
      cols.push({
        id: "select",
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
    module.dataTableSchema.columns.forEach((column: DataTableColumn) => {
      cols.push({
        id: column.fieldName, // Use id instead of accessorKey for nested fields
        accessorFn: (row) => getNestedValue(row, column.fieldName), // Custom accessor function
        header: ({ column: tableColumn }) => {
          return column.sortable ? (
            <Button
              variant="ghost"
              onClick={() => handleSort(column.fieldName)}
              className="p-0 h-auto font-medium"
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
                className="ml-2 h-4 w-4"
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
          }

          return <div className="font-medium">{fieldValue || "-"}</div>;
        },
        enableSorting: column.sortable,
        enableHiding: true,
      });
    });

    // Actions column
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
                <DropdownMenuItem
                  onClick={() => handleEdit(item._id)}
                  className="cursor-pointer"
                >
                  <IconComponent name="Edit" className="mr-2 h-4 w-4" />
                  {currentLanguage === "mm" ? "ပြင်ဆင်မည်" : "Edit"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(item._id)}
                  className="cursor-pointer text-destructive"
                  disabled={deleteItemMutation.isPending}
                >
                  <IconComponent name="Trash2" className="mr-2 h-4 w-4" />
                  {deleteItemMutation.isPending
                    ? currentLanguage === "mm"
                      ? "ဖျက်နေသည်..."
                      : "Deleting..."
                    : currentLanguage === "mm"
                    ? "ဖျက်မည်"
                    : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    });

    return cols;
  }, [
    module.dataTableSchema,
    currentLanguage,
    queryParams,
    deleteItemMutation.isPending,
  ]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <IconComponent
            name="AlertCircle"
            className="w-12 h-12 text-destructive mx-auto mb-4"
          />
          <p className="text-lg font-medium mb-2">
            {currentLanguage === "mm" ? "ဒေတာ ရယူ၍မရပါ" : "Failed to load data"}
          </p>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <IconComponent name="RotateCcw" className="w-4 h-4 mr-2" />
            {currentLanguage === "mm" ? "ပြန်လည်ကြိုးစားမည်" : "Try Again"}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <IconComponent name="Loader2" className="w-6 h-6 animate-spin" />
          <span className="text-lg">
            {currentLanguage === "mm" ? "ရယူနေသည်..." : "Loading..."}
          </span>
        </div>
      </div>
    );
  }

  const moduleDataList = moduleData || [];

  console.log("Final moduleDataList for DataTable:", moduleDataList);
  console.log("moduleDataList length:", moduleDataList.length);

  return (
    <div className="space-y-6">
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
            <h1 className="text-2xl font-bold">
              {getLocalizedText(module.name, currentLanguage)}
            </h1>
            <p className="text-muted-foreground">
              {getLocalizedText(module.description, currentLanguage)}
            </p>
          </div>
        </div>

        <Button onClick={handleCreate}>
          <IconComponent name="Plus" className="w-4 h-4 mr-2" />
          {currentLanguage === "mm" ? "အသစ်ထည့်မည်" : "Add New"}
        </Button>
      </div>

      {/* Search and Filters */}
      <DynamicSearch
        queryAllowedFields={module?.moduleAccessPolicy?.queryAllowedFields}
        onFiltersChange={handleFiltersChange}
        className="mb-4"
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedItems.length}{" "}
              {currentLanguage === "mm" ? "ခု ရွေးချယ်ထားသည်" : "selected"}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkOperationMutation.isPending}
            >
              <IconComponent name="Trash2" className="w-4 h-4 mr-2" />
              {bulkOperationMutation.isPending
                ? currentLanguage === "mm"
                  ? "ဖျက်နေသည်..."
                  : "Deleting..."
                : currentLanguage === "mm"
                ? "ဖျက်မည်"
                : "Delete"}
            </Button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={moduleDataList}
        searchKey={module.dataTableSchema.columns[0]?.fieldName}
        searchPlaceholder={
          currentLanguage === "mm" ? "ရှာဖွေမည်..." : "Filter data..."
        }
        onRowSelectionChange={setSelectedItems}
      />

      {/* Pagination Controls */}
      {moduleDataList.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {currentLanguage === "mm" ? "စুစုပေါင်း" : "Total"}:{" "}
            {moduleDataList.length} {currentLanguage === "mm" ? "ခု" : "items"}
          </div>
          <div>
            {currentLanguage === "mm" ? "စာမျက်နှာ" : "Page"} {queryParams.page}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {currentLanguage === "mm" ? "တည်းဖြတ်မည်" : "Edit"}{" "}
              {getLocalizedText(module.name, currentLanguage)}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {isLoadingEditItem ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="flex items-center gap-2">
                  <IconComponent
                    name="Loader2"
                    className="w-6 h-6 animate-spin"
                  />
                  <span>
                    {currentLanguage === "mm" ? "ရယူနေသည်..." : "Loading..."}
                  </span>
                </div>
              </div>
            ) : editItemError ? (
              <div className="text-center py-8">
                <IconComponent
                  name="AlertCircle"
                  className="w-12 h-12 text-destructive mx-auto mb-4"
                />
                <p className="text-lg font-medium mb-2">
                  {currentLanguage === "mm"
                    ? "ဒေတာ ရယူ၍မရပါ"
                    : "Failed to load data"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {editItemError instanceof Error
                    ? editItemError.message
                    : "Unknown error"}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                  >
                    <IconComponent name="RotateCcw" className="w-4 h-4 mr-2" />
                    {currentLanguage === "mm" ? "ပြန်လည်ကြိုးစားမည်" : "Retry"}
                  </Button>
                  <Button
                    onClick={handleEditCancel}
                    variant="outline"
                    size="sm"
                  >
                    {currentLanguage === "mm" ? "ပိတ်မည်" : "Close"}
                  </Button>
                </div>
              </div>
            ) : editItemData ? (
              <ReactHookForm
                fields={module.formFields}
                initialData={editItemData}
                onSuccess={(data) => {
                  handleEditSuccess(data);
                }}
                onCancel={handleEditCancel}
                submitButtonText={currentLanguage === 'mm' ? 'သိမ်းမည်' : 'Save'}
                cancelButtonText={currentLanguage === 'mm' ? 'ပိတ်မည်' : 'Cancel'}
              />
            ) : editingItemId ? (
              <div className="text-center py-8">
                <IconComponent
                  name="AlertCircle"
                  className="w-12 h-12 text-muted-foreground mx-auto mb-4"
                />
                <p className="text-lg font-medium mb-2">
                  {currentLanguage === "mm" ? "မရှိပါ" : "No data found"}
                </p>
                <Button onClick={handleEditCancel} variant="outline">
                  {currentLanguage === "mm" ? "ပိတ်မည်" : "Close"}
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
