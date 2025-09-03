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
import { executeExtraAction } from "@repo/app-modules/server-actions";
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

  const handleFormSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Add action metadata
      formData.append('actionKey', action.actionId); // Use actionKey for server compatibility
      formData.append('actionId', action.actionId); // Keep actionId for backwards compatibility
      formData.append('moduleSlug', module.slug);
      
      // Add selected items with both naming conventions for compatibility
      selectedItems.forEach((item, index) => {
        const itemId = typeof item === 'string' ? item : (item._id || item.id);
        if (itemId) {
          formData.append('selectedIds', itemId); // Server expects selectedIds as array
          formData.append(`selectedItems[${index}]`, itemId); // Keep indexed format for backwards compatibility
        }
      });
      
      // If this is a row action, add the specific item ID
      if (isRowAction && selectedItems.length === 1) {
        const itemId = typeof selectedItems[0] === 'string' ? selectedItems[0] : (selectedItems[0]._id || selectedItems[0].id);
        if (itemId) {
          formData.append('id', itemId);
        }
      }

      console.log('ExtraActionModal: Submitting form data', {
        actionKey: action.actionId,
        actionId: action.actionId,
        moduleSlug: module.slug,
        selectedItemsCount: selectedItems.length,
        isRowAction: isRowAction,
        hasId: formData.has('id'),
        id: formData.get('id')
      });

      // Execute the action
      const result = await executeExtraAction(formData);
      
      if (result?.success) {
        const successMessage = getLocalizedText(
          action.successMessage || { en: "Action completed successfully" },
          currentLanguage
        );
        toastSuccess(successMessage);
        onSuccess();
        onClose();
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
export { useExtraActionForm } from "@/hooks/use-extra-action-form";