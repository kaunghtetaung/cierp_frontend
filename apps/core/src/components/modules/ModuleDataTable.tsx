"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  deleteModuleItem,
  bulkModuleOperation,
  submitModuleForm,
} from "@repo/app-modules/server-actions";
import { SimpleForm } from "../forms/SimpleForm";
import { DynamicSearch } from "./DynamicSearch";
import { Pagination } from "@/components/ui/pagination";
import { ExtraActionModal } from "./ExtraActionModal";
import { generateZodSchema } from "@/lib/form-schema";
import type { ModuleSchema, DataTableColumn, ExtraAction } from "@repo/types";
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
  currentLanguage = "en",
}: ModuleDataTableProps) {
  // Debug: Log the actions configuration
  console.log("ModuleDataTable actions config:", {
    hasActions: !!module.dataTableSchema.actions,
    actions: module.dataTableSchema.actions,
    edit: module.dataTableSchema.actions?.edit,
    delete: module.dataTableSchema.actions?.delete,
    view: module.dataTableSchema.actions?.view,
  });
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeExtraAction, setActiveExtraAction] =
    useState<ExtraAction | null>(null);
  const [isExtraActionModalOpen, setIsExtraActionModalOpen] = useState(false);
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: module.dataTableSchema.pagination?.defaultLimit || 10,
    sortBy: module.dataTableSchema.sorting?.defaultSort?.field || "",
    sortOrder: (module.dataTableSchema.sorting?.defaultSort?.direction ||
      "asc") as "asc" | "desc",
    filters: {} as Record<string, Record<string, any>>,
  });

  // Helper function to get nested field values
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
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
    setEditingItemId(id);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingItemId(null);
    // In a real app, this would trigger a refetch
    window.location.reload();
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setEditingItemId(null);
  };

  const handleExtraAction = (action: ExtraAction) => {
    if (action.type === "modal") {
      setActiveExtraAction(action);
      setIsExtraActionModalOpen(true);
    } else if (action.type === "api") {
      // Handle API action directly
      if (action.confirmMessage) {
        if (confirm(getLocalizedText(action.confirmMessage, currentLanguage))) {
          console.log(`Executing API action: ${action.actionKey}`);
          // Here you would call the API
        }
      } else {
        console.log(`Executing API action: ${action.actionKey}`);
        // Here you would call the API
      }
    }
    // Page type actions are handled by Link navigation
  };

  const handleExtraActionSuccess = () => {
    setIsExtraActionModalOpen(false);
    setActiveExtraAction(null);
    window.location.reload(); // In a real app, this would trigger a refetch
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        currentLanguage === "mm"
          ? "ဖျက်လိုသည်လား?"
          : "Are you sure you want to delete this item?"
      )
    ) {
      try {
        const result = await deleteModuleItem(module.slug, id);
        if (result.success) {
          window.location.reload();
        } else {
          console.error("Delete failed:", result.error);
          alert(result.error || "Failed to delete item");
        }
      } catch (error) {
        console.error("Failed to delete item:", error);
        alert("Failed to delete item");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    if (
      confirm(
        currentLanguage === "mm"
          ? `ရွေးချယ်ထားသော ${selectedItems.length} ခုကို ဖျက်လိုသည်လား?`
          : `Are you sure you want to delete ${selectedItems.length} selected items?`
      )
    ) {
      try {
        const ids = selectedItems.map((item) => item._id || item.id);
        const result = await bulkModuleOperation(module.slug, "delete", ids);

        if (result.success) {
          setSelectedItems([]);
          window.location.reload();
        } else {
          console.error("Bulk delete failed:", result.error);
          alert(result.error || "Failed to delete items");
        }
      } catch (error) {
        console.error("Failed to delete items:", error);
        alert("Failed to delete items");
      }
    }
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
        id: column.fieldName,
        accessorFn: (row) => getNestedValue(row, column.fieldName),
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
          }

          return (
            <div className="font-medium max-w-[200px] truncate" title={fieldValue || "-"}>
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

  const editItemData = data.find(
    (item) => (item._id || item.id) === editingItemId
  );

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
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

        <Link href={`/${module.slug}/new`}>
          <Button>
            <IconComponent name="Plus" className="w-4 h-4 mr-2" />
            {currentLanguage === "mm" ? "အသစ်ထည့်မည်" : "Add New"}
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

      {/* Data Table */}
      <div className="w-full min-w-0">
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
        />
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
            {editItemData ? (
              <SimpleForm
                module={module}
                action="update"
                initialData={editItemData}
                serverAction={async (formData: FormData) => {
                  try {
                    const validationSchema = generateZodSchema(
                      module.formFields
                    );
                    const result = await submitModuleForm(
                      module.slug,
                      formData,
                      validationSchema,
                      "update",
                      editingItemId || undefined
                    );

                    if (result.success) {
                      handleEditSuccess();
                    } else {
                      console.error(
                        "Update failed:",
                        result.error || result.errors
                      );
                      // Handle validation errors
                      if (result.errors) {
                        // Show validation errors to user
                        const errorMessages = Object.entries(result.errors)
                          .map(
                            ([field, messages]) =>
                              `${field}: ${messages.join(", ")}`
                          )
                          .join("\n");
                        alert(`Validation errors:\n${errorMessages}`);
                      } else {
                        alert(result.error || "Failed to update item");
                      }
                    }
                  } catch (error) {
                    console.error("Form submission error:", error);
                    alert("Failed to update item");
                  }
                }}
                currentLanguage={currentLanguage}
              />
            ) : (
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
            )}
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
