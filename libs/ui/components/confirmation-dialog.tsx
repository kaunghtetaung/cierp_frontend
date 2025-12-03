"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { IconComponent } from "../icons";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
  variant?: "default" | "destructive" | "warning";
  icon?: string;
  isLoading?: boolean;
  children?: React.ReactNode;

  // Delete-specific props
  deleteType?: "soft" | "hard";
  itemName?: string;
  itemCount?: number;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  icon,
  isLoading = false,
  children,

  // Delete-specific props
  deleteType,
  itemName,
  itemCount = 1,
}: ConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle delete-specific configuration
  const isDeleteAction = deleteType !== undefined;
  const isSoftDelete = deleteType === "soft";
  const isMultiple = itemCount > 1;

  // Generate delete-specific defaults if needed
  const actualTitle = title || (
    isDeleteAction
      ? isSoftDelete
        ? `Delete ${isMultiple ? `${itemCount} ${itemName}s` : itemName}?`
        : `Permanently delete ${isMultiple ? `${itemCount} ${itemName}s` : itemName}?`
      : "Confirm Action"
  );

  const actualDescription = description || (
    isDeleteAction
      ? isSoftDelete
        ? `${isMultiple ? "These items" : "This item"} will be moved to the recycle bin and can be restored later.`
        : `${isMultiple ? "These items" : "This item"} will be permanently deleted and cannot be recovered. This action cannot be undone.`
      : "Are you sure you want to proceed?"
  );

  const actualConfirmText = confirmText || (
    isDeleteAction
      ? isSoftDelete
        ? "Delete"
        : "Permanently Delete"
      : "Confirm"
  );

  const actualIcon = icon || (
    isDeleteAction
      ? isSoftDelete
        ? "Trash2"
        : "HardDrive"
      : variant === "destructive"
        ? "AlertTriangle"
        : variant === "warning"
          ? "AlertCircle"
          : "Info"
  );

  const actualVariant = variant || (
    isDeleteAction
      ? isSoftDelete
        ? "warning"
        : "destructive"
      : "default"
  );

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const getVariantStyles = () => {
    switch (actualVariant) {
      case "destructive":
        return {
          icon: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
          button: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
          button: "bg-orange-600 hover:bg-orange-700 text-white",
        };
      default:
        return {
          icon: "bg-primary/10 text-primary",
          button: "",
        };
    }
  };

  const styles = getVariantStyles();
  const isDisabled = isProcessing || isLoading;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${styles.icon}`}>
              <IconComponent 
                name={actualIcon} 
                className="w-5 h-5" 
              />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-left">
                {actualTitle}
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="text-left">
          {actualDescription}
        </AlertDialogDescription>

        {children}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isDisabled}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDisabled}
            className={styles.button}
          >
            {isDisabled ? (
              <>
                <IconComponent 
                  name="Loader2" 
                  className="mr-2 h-4 w-4 animate-spin" 
                />
                {isProcessing ? "Processing..." : "Loading..."}
              </>
            ) : (
              actualConfirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Export a specialized delete confirmation for convenience
export function DeleteConfirmationDialog(props: Omit<ConfirmationDialogProps, "variant" | "icon">) {
  return <ConfirmationDialog {...props} />;
}