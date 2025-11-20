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

    console.log('================================');
    console.log('🎭 [ExtraActionModal] handleFormSubmit called');
    console.log('================================');
    console.log('📝 Action ID:', action.actionId);
    console.log('📦 Module Slug:', module.slug);
    console.log('👥 Selected Items Count:', selectedItems.length);
    console.log('📋 Initial FormData entries:', Array.from(formData.entries()));
    console.log('================================');

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

      console.log('📤 [ExtraActionModal] Final FormData before executeExtraAction:');
      console.log('   All entries:', Array.from(formData.entries()));
      console.log('   Action Key:', formData.get('actionKey'));
      console.log('   Module Slug:', formData.get('moduleSlug'));
      console.log('   Selected IDs:', formData.getAll('selectedIds'));
      console.log('   Is Row Action:', isRowAction);

      console.log('🚀 [ExtraActionModal] Calling executeExtraAction...');

      // Check if result is already in FormData (pre-built forms might handle their own API calls)
      const preBuiltResult = formData.get('result');
      let result;

      if (preBuiltResult) {
        console.log('📦 [ExtraActionModal] Pre-built form result found in FormData');
        try {
          result = JSON.parse(preBuiltResult as string);
          console.log('✅ [ExtraActionModal] Parsed pre-built result:', result);
        } catch (e) {
          console.error('❌ [ExtraActionModal] Failed to parse pre-built result:', e);
          result = { success: false, error: 'Invalid result format' };
        }
      } else {
        // Execute the action via standard flow
        result = await executeExtraAction(formData);
      }

      console.log('================================');
      console.log('📥 [ExtraActionModal] executeExtraAction response');
      console.log('================================');
      console.log('✅ Success:', result?.success);
      console.log('📦 Result Data:', result?.data);
      console.log('❌ Error:', result?.error);
      console.log('🔍 Full Result:', result);
      console.log('================================');

      // Handle success/failure
      if (result?.success) {
        const successMessage = getLocalizedText(
          action.successMessage || { en: "Action completed successfully" },
          currentLanguage
        );
        console.log('🎉 [ExtraActionModal] Action succeeded, showing toast:', successMessage);
        toastSuccess(successMessage);

        // Call onSuccess to trigger data refresh, but DON'T close the modal
        // This allows users to see debug info and perform multiple actions
        onSuccess();

        // Don't auto-close - let user close manually after reviewing debug info
        // onClose();
      } else {
        const errorMessage = result?.error ||
          getLocalizedText(
            action.errorMessage || { en: "Action failed" },
            currentLanguage
          );
        console.error('❌ [ExtraActionModal] Action failed, showing error:', errorMessage);
        toastError(errorMessage);
      }

      // Return the result so forms can access debugInfo
      return result;
    } catch (error) {
      console.log('================================');
      console.error('💥 [ExtraActionModal] Exception caught');
      console.error('================================');
      console.error('Error:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('================================');
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toastError(errorMessage);
    } finally {
      setIsSubmitting(false);
      console.log('🏁 [ExtraActionModal] handleFormSubmit completed');
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
          selectedItems={selectedItems}
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
export { useExtraActionForm } from "@repo/schema-hooks";