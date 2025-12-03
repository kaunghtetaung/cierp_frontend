"use client";

import React, { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@repo/ui";
import { Button, Badge, IconComponent, ConfirmationDialog } from "@repo/ui";
import { Pagination } from "@repo/ui";
import { Skeleton } from "@repo/ui";
import {
  useDeletedModuleItems,
  useDeletedModuleCount,
  useHardDeleteModuleItem,
  useRestoreModuleItem,
} from "@repo/schema-hooks";
import { useLanguage } from "@repo/language";
import { toastSuccess, toastError } from "@repo/utils";
import { formatDistanceToNow } from "date-fns";

interface RecycleBinDialogProps {
  moduleSlug: string;
  moduleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DeletedItem {
  _id: string;
  name?: string;
  fullName?: string;
  displayName?: string | { en?: string; mm?: string };
  title?: string | { en?: string; mm?: string };
  description?: string | { en?: string; mm?: string };
  code?: string;
  email?: string;
  deletedAt?: string;
  createdAt?: string;
  [key: string]: any;
}

// Helper to get display name from item
function getItemDisplayName(item: DeletedItem, lang: string = "en"): string {
  // Check name fields in priority order
  if (item.name) return item.name;
  if (item.fullName) return item.fullName;
  if (item.displayName) {
    if (typeof item.displayName === "string") return item.displayName;
    return item.displayName[lang as "en" | "mm"] || item.displayName.en || "";
  }
  if (item.title) {
    if (typeof item.title === "string") return item.title;
    return item.title[lang as "en" | "mm"] || item.title.en || "";
  }
  return item._id;
}

// Helper to get description from item
function getItemDescription(item: DeletedItem, lang: string = "en"): string | null {
  if (item.description) {
    if (typeof item.description === "string") return item.description;
    return item.description[lang as "en" | "mm"] || item.description.en || null;
  }
  if (item.code) return `Code: ${item.code}`;
  if (item.email) return item.email;
  return null;
}

// Helper to get item details for confirmation dialog
function getItemDetails(item: DeletedItem, lang: string = "en"): Array<{ label: string; value: string }> {
  const details: Array<{ label: string; value: string }> = [];

  // Name
  const name = getItemDisplayName(item, lang);
  if (name && name !== item._id) {
    details.push({ label: "Name", value: name });
  }

  // Code
  if (item.code) {
    details.push({ label: "Code", value: item.code });
  }

  // Email
  if (item.email) {
    details.push({ label: "Email", value: item.email });
  }

  // Description
  const desc = getItemDescription(item, lang);
  if (desc && !desc.startsWith("Code:")) {
    details.push({ label: "Description", value: desc.length > 100 ? desc.substring(0, 100) + "..." : desc });
  }

  // Created date
  if (item.createdAt) {
    details.push({
      label: "Created",
      value: new Date(item.createdAt).toLocaleDateString(),
    });
  }

  // Deleted date
  if (item.deletedAt) {
    details.push({
      label: "Deleted",
      value: new Date(item.deletedAt).toLocaleDateString(),
    });
  }

  return details;
}

export function RecycleBinDialog({
  moduleSlug,
  moduleName,
  open,
  onOpenChange,
}: RecycleBinDialogProps) {
  const { currentLanguage } = useLanguage();
  const [page, setPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "restore" | "hardDelete";
    item: DeletedItem;
  } | null>(null);

  const limit = 10;

  // Fetch deleted items with pagination
  const {
    data: deletedData,
    isLoading,
    isFetching,
    refetch,
  } = useDeletedModuleItems(moduleSlug, { page, limit }, { enabled: open });

  // Mutations
  const hardDeleteMutation = useHardDeleteModuleItem(moduleSlug);
  const restoreMutation = useRestoreModuleItem(moduleSlug);

  const items = deletedData?.data || [];
  const meta = deletedData?.meta;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.total || 0;

  // Handle restore
  const handleRestore = useCallback(async () => {
    if (!confirmDialog || confirmDialog.type !== "restore") return;

    try {
      const result = await restoreMutation.mutateAsync(confirmDialog.item._id);
      if (result.success) {
        toastSuccess("Item restored successfully");
        refetch();
      } else {
        toastError(result.error || "Failed to restore item");
      }
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Failed to restore item");
    } finally {
      setConfirmDialog(null);
    }
  }, [confirmDialog, restoreMutation, refetch]);

  // Handle hard delete
  const handleHardDelete = useCallback(async () => {
    if (!confirmDialog || confirmDialog.type !== "hardDelete") return;

    try {
      const result = await hardDeleteMutation.mutateAsync(confirmDialog.item._id);
      if (result.success) {
        toastSuccess("Item permanently deleted");
        refetch();
      } else {
        toastError(result.error || "Failed to delete item");
      }
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Failed to delete item");
    } finally {
      setConfirmDialog(null);
    }
  }, [confirmDialog, hardDeleteMutation, refetch]);

  const isProcessing = hardDeleteMutation.isPending || restoreMutation.isPending;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg flex flex-col"
        >
          <SheetHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                <IconComponent name="Trash2" className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="flex items-center gap-2">
                  Recycle Bin
                  {totalItems > 0 && (
                    <Badge variant="secondary">{totalItems}</Badge>
                  )}
                </SheetTitle>
                <SheetDescription>
                  Deleted items from {moduleName}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-auto py-4">
            {isLoading ? (
              <div className="space-y-3 mx-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground mx-4">
                <IconComponent name="Trash2" className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Recycle bin is empty</p>
              </div>
            ) : (
              <div className="space-y-2 mx-4">
                {items.map((item: DeletedItem) => (
                  <div
                    key={item._id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {getItemDisplayName(item, currentLanguage)}
                      </p>
                      {getItemDescription(item, currentLanguage) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {getItemDescription(item, currentLanguage)}
                        </p>
                      )}
                      {item.deletedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Deleted{" "}
                          {formatDistanceToNow(new Date(item.deletedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() =>
                          setConfirmDialog({ type: "restore", item })
                        }
                        disabled={isProcessing}
                        title="Restore"
                      >
                        <IconComponent name="RotateCcw" className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() =>
                          setConfirmDialog({ type: "hardDelete", item })
                        }
                        disabled={isProcessing}
                        title="Delete Permanently"
                      >
                        <IconComponent name="Trash2" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t pt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                showPageNumbers={false}
              />
            </div>
          )}

          {/* Loading overlay when fetching */}
          {isFetching && !isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <IconComponent
                name="Loader2"
                className="w-6 h-6 animate-spin text-primary"
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Restore Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog?.type === "restore"}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
        title="Restore Item?"
        description={
          confirmDialog?.item
            ? `"${getItemDisplayName(confirmDialog.item, currentLanguage)}" will be restored to the active list.`
            : ""
        }
        confirmText="Restore"
        cancelText="Cancel"
        variant="default"
        icon="RotateCcw"
        onConfirm={handleRestore}
        isLoading={restoreMutation.isPending}
      />

      {/* Hard Delete Confirmation Dialog */}
      {confirmDialog?.type === "hardDelete" && confirmDialog.item && (
        <ConfirmationDialog
          open={true}
          onOpenChange={(open) => !open && setConfirmDialog(null)}
          title="Permanently Delete?"
          description=""
          confirmText="Delete Permanently"
          cancelText="Cancel"
          variant="destructive"
          icon="AlertTriangle"
          onConfirm={handleHardDelete}
          isLoading={hardDeleteMutation.isPending}
        >
          {/* Custom content for detailed information */}
          <div className="mt-2 mb-4 text-sm text-muted-foreground">
            <p className="mb-3">
              This action cannot be undone. The following item will be
              permanently deleted:
            </p>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              {getItemDetails(confirmDialog.item, currentLanguage).map(
                (detail, index) => (
                  <div key={index} className="flex">
                    <span className="font-medium w-24 text-foreground">
                      {detail.label}:
                    </span>
                    <span className="flex-1 truncate">{detail.value}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </ConfirmationDialog>
      )}
    </>
  );
}

// Recycle Bin Trigger Button Component
interface RecycleBinTriggerProps {
  moduleSlug: string;
  onClick: () => void;
}

export function RecycleBinTrigger({ moduleSlug, onClick }: RecycleBinTriggerProps) {
  const { data: count, isLoading } = useDeletedModuleCount(moduleSlug);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="relative"
      title="Recycle Bin"
    >
      <IconComponent name="Trash2" className="w-4 h-4" />
      {!isLoading && count !== undefined && count > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center text-xs px-1"
        >
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </Button>
  );
}
