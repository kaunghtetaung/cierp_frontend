"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui";
import { ExtraActionFormRouter } from "./ExtraActionFormRouter";
import { getLocalizedText, toastSuccess, toastError } from "@repo/utils";
import { submitExtraActionForm, submitBulkExtraActionForm } from "./server-actions/form-actions";
import type { ModuleSchema, ExtraAction, ExtraActionForm } from "@repo/types";

interface ExtraActionModalProps {
  action: ExtraAction;
  actionForm?: ExtraActionForm;
  module: ModuleSchema;
  selectedItems: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentLanguage?: string;
  isRowAction?: boolean;
}

export function ExtraActionModal({
  action,
  actionForm,
  module,
  selectedItems,
  isOpen,
  onClose,
  onSuccess,
  currentLanguage = 'en',
  isRowAction = false
}: ExtraActionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh of form components

  const handleFormSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Debug log the received FormData
      console.log('📥 ExtraActionModal: Received FormData from form:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      // Extract item IDs from selected items
      const itemIds = selectedItems.map(item => 
        typeof item === 'string' ? item : (item._id || item.id)
      ).filter(Boolean);

      console.log('ExtraActionModal: Submitting form data', {
        actionKey: action.actionId,
        moduleSlug: module.slug,
        selectedItemsCount: itemIds.length,
        isRowAction: isRowAction,
      });

      // Execute the action using server actions
      let result;
      if (isRowAction && itemIds.length === 1) {
        // Single item action
        result = await submitExtraActionForm(
          module.slug,
          action.actionId,
          itemIds[0],
          formData,
          actionForm?.endpoint,  // Pass endpoint from action schema
          actionForm?.method     // Pass HTTP method from action schema
        );
      } else if (itemIds.length > 1) {
        // Bulk action
        result = await submitBulkExtraActionForm(
          module.slug,
          action.actionId,
          itemIds,
          formData
        );
      } else {
        throw new Error('No items selected for action');
      }
      
      if (result?.success) {
        const successMessage = getLocalizedText(
          action.successMessage || { en: "Action completed successfully" },
          currentLanguage
        );
        toastSuccess(successMessage);
        
        // Call onSuccess to refresh the table data, but don't close the modal
        onSuccess();
        
        // Increment refresh key to force re-render of form components
        // This ensures forms are reset properly for the next operation
        setRefreshKey(prev => prev + 1);
        
        // Don't automatically close - let user continue with more operations
        // onClose();
      } else {
        const errorMessage = result?.error || 
          getLocalizedText(
            action.errorMessage || { en: "Action failed" },
            currentLanguage
          );
        toastError(errorMessage);
      }
    } catch (error) {
      console.error('ExtraActionModal: Error submitting form', error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toastError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!actionForm) {
    return null;
  }

  // Determine modal width based on form configuration
  const getModalWidth = () => {
    switch (actionForm.formWidth) {
      case "sm": return "max-w-md";
      case "md": return "max-w-lg";
      case "lg": return "max-w-2xl";
      case "xl": return "max-w-4xl";
      case "full": return "max-w-7xl";
      default: return "max-w-lg";
    }
  };

  const modalTitle = getLocalizedText(actionForm.title, currentLanguage);
  const modalDescription = actionForm.description 
    ? getLocalizedText(actionForm.description, currentLanguage)
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${getModalWidth()} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          {modalDescription && (
            <DialogDescription>{modalDescription}</DialogDescription>
          )}
        </DialogHeader>
        
        <ExtraActionFormRouter
          key={refreshKey} // Force re-mount when refreshKey changes
          action={actionForm}
          selectedItems={selectedItems.map(item => 
            typeof item === 'string' ? item : (item._id || item.id)
          )}
          currentLanguage={currentLanguage}
          onSubmit={handleFormSubmit}
          onCancel={onClose}
          hideHeader={true}
          moduleSlug={module.slug}
        />
      </DialogContent>
    </Dialog>
  );
}

// Export the hook for direct usage in other components if needed
export { useExtraActionForm } from "@repo/schema-hooks/use-extra-action-form";