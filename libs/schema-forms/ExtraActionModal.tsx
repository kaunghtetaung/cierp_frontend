"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  IconComponent,
} from "@repo/ui";
import { ExtraActionFormRouter } from "./ExtraActionFormRouter";
import { getLocalizedText } from "@repo/utils";
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
  const [footerMessage, setFooterMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isDataChanged, setIsDataChanged] = useState(false); // Track if any data operations occurred

  // Reset isDataChanged when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsDataChanged(false);
      setFooterMessage(null);
    }
  }, [isOpen]);

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
        
        // Show success message in footer instead of toast
        setFooterMessage({ type: 'success', text: successMessage });
        
        // Clear the message after 5 seconds
        setTimeout(() => {
          setFooterMessage(null);
        }, 5000);
        
        // Mark that data has been changed (will trigger refetch on modal close)
        console.log('📝 ExtraActionModal - Marking data as changed for action:', action.actionId);
        setIsDataChanged(true);
        console.log('📝 ExtraActionModal - isDataChanged is now:', true);
        
        // Don't call onSuccess here anymore - will call it on modal close if needed
        // onSuccess();
        
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
        
        // Show error message in footer instead of toast
        setFooterMessage({ type: 'error', text: errorMessage });
        
        // Clear error message after 7 seconds
        setTimeout(() => {
          setFooterMessage(null);
        }, 7000);
      }
    } catch (error) {
      console.error('ExtraActionModal: Error submitting form', error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      
      // Show error message in footer instead of toast
      setFooterMessage({ type: 'error', text: errorMessage });
      
      // Clear error message after 7 seconds
      setTimeout(() => {
        setFooterMessage(null);
      }, 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!actionForm) {
    return null;
  }

  // Determine modal width based on form configuration
  const getModalWidth = () => {
    // Special handling for manageAccessionNumbers - use large size
    if (actionForm.actionKey === 'manageAccessionNumbers') {
      return "max-w-2xl";
    }
    
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

  // Handle modal close - refetch data if changes were made
  const handleModalClose = (open: boolean) => {
    if (!open) {
      console.log('🔄 ExtraActionModal - Closing modal:', {
        isDataChanged,
        hasOnSuccess: typeof onSuccess === 'function'
      });
      
      // If data was changed, trigger refresh before closing
      if (isDataChanged) {
        console.log('✅ ExtraActionModal - Triggering data refresh');
        onSuccess(); // This will trigger React Query refetch
        setIsDataChanged(false); // Reset the flag
      }
      
      // Clear footer message and close modal
      setFooterMessage(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className={`w-full ${getModalWidth()} max-h-[90vh] overflow-y-auto`}>
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
          onCancel={() => handleModalClose(false)}
          hideHeader={true}
          moduleSlug={module.slug}
        />
        
        {/* Footer Message Area */}
        <div className="mt-4 space-y-2">
          {footerMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              footerMessage.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              <IconComponent 
                name={footerMessage.type === 'success' ? 'CheckCircle' : 'AlertCircle'} 
                className="w-5 h-5 flex-shrink-0"
              />
              <span className="text-sm font-medium">{footerMessage.text}</span>
            </div>
          )}
          
          {/* Data Changed Indicator */}
          {isDataChanged && !footerMessage && (
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-xs">
                <IconComponent name="Info" className="w-4 h-4" />
                <span>
                  {currentLanguage === 'mm' 
                    ? 'အချက်အလက်များ ပြောင်းလဲထားပါသည်။ Modal ပိတ်သောအခါ ပြန်လည်ရယူပါမည်။'
                    : 'Data has been modified. Changes will be refreshed when you close this modal.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export the hook for direct usage in other components if needed
export { useExtraActionForm } from "@repo/schema-hooks/use-extra-action-form";