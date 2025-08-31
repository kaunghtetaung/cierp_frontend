"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
      formData.append('actionId', action.actionId);
      formData.append('moduleSlug', module.moduleSlug);
      
      // Add selected items
      selectedItems.forEach((item, index) => {
        const itemId = typeof item === 'string' ? item : (item._id || item.id);
        if (itemId) {
          formData.append(`selectedItems[${index}]`, itemId);
        }
      });

      console.log('ExtraActionModal: Submitting form data', {
        actionId: action.actionId,
        moduleSlug: module.moduleSlug,
        selectedItemsCount: selectedItems.length
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
        />
      </DialogContent>
    </Dialog>
  );
}

// Export the hook for direct usage in other components if needed
export { useExtraActionForm } from "@/hooks/use-extra-action-form";