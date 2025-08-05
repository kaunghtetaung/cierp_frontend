"use client";

import React, { useState } from "react";
import { toastSuccess, toastError } from "@repo/utils";
import { getLocalizedText } from "@repo/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { IconComponent } from "@repo/ui/components/icons";
import { ExtraActionFormRouter } from "../forms/ExtraActionFormRouter";
import { enableCommonMultilangFields } from "@/lib/enable-multilang";
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
}

export function ExtraActionModal({
  action,
  actionForm,
  module,
  selectedItems,
  isOpen,
  onClose,
  onSuccess,
  currentLanguage = 'en'
}: ExtraActionModalProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debug logging when modal opens
  React.useEffect(() => {
    if (isOpen) {
      console.log(`🎭 ExtraActionModal: Modal opened for action "${action.actionKey}"`, {
        actionKey: action.actionKey,
        hasActionForm: !!actionForm,
        formApproach: actionForm?.formApproach,
        hasFormFields: !!actionForm?.formFields?.length,
        formFieldsCount: actionForm?.formFields?.length,
        selectedItemsCount: selectedItems.length,
        moduleSlug: module.slug,
      });
    }
  }, [isOpen, action.actionKey, actionForm, selectedItems.length, module.slug]);


  const handleActionSubmit = async (formData: FormData) => {
    console.log(`🚀 ExtraActionModal: Starting action submission for "${action.actionKey}"`, {
      actionKey: action.actionKey,
      selectedItemsCount: selectedItems.length,
      hasFormData: !!formData,
    });

    if (action.confirmMessage && !showConfirmDialog) {
      setShowConfirmDialog(true);
      return;
    }

    setIsLoading(true);
    try {
      // Add action metadata to form data
      formData.append("actionKey", action.actionKey);
      formData.append("moduleSlug", module.slug);
      
      // Add selected items
      if (selectedItems.length > 0) {
        // For single item actions, add as 'id'
        if (action.endpoint?.includes("{id}")) {
          formData.append("id", selectedItems[0]._id || selectedItems[0].id);
        }
        // For bulk actions, add as 'selectedIds'
        selectedItems.forEach((item) => {
          formData.append("selectedIds", item._id || item.id);
        });
      }

      console.log(`🌐 ExtraActionModal: Calling executeExtraAction for "${action.actionKey}"`);
      
      // Use the real server action
      const result = await executeExtraAction(formData);
      
      console.log(`📊 ExtraActionModal: Server action result for "${action.actionKey}":`, result);
      
      if (result.success) {
        console.log(`✅ ExtraActionModal: Action "${action.actionKey}" completed successfully`);
        
        // Show success toast with multilingual support
        const successMessage = currentLanguage === "mm"
          ? `${getLocalizedText(action.label, currentLanguage)} အောင်မြင်စွာ ပြီးစီးပါပြီ!`
          : `${getLocalizedText(action.label, currentLanguage)} completed successfully!`;
        
        toastSuccess(successMessage);
        
        onSuccess();
        onClose();
      } else {
        console.error(`❌ ExtraActionModal: Action "${action.actionKey}" failed:`, result.message);
        
        // Show error toast
        const errorMessage = result.message || (currentLanguage === "mm" 
          ? "လုပ်ဆောင်ချက် မအောင်မြင်ပါ" 
          : "Action failed");
        
        toastError(errorMessage);
      }
    } catch (error) {
      console.error(`💥 ExtraActionModal: Exception in action "${action.actionKey}":`, error);
      
      // Show error toast for exceptions
      const errorMessage = currentLanguage === "mm" 
        ? "မမျှော်လင့်သော အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်" 
        : "An unexpected error occurred";
      
      toastError(errorMessage);
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    handleActionSubmit();
  };

  // If action requires selection but none are selected
  if (actionForm?.requiresSelection && selectedItems.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconComponent name={action.icon} className="w-5 h-5" />
              {getLocalizedText(action.label, currentLanguage)}
            </DialogTitle>
            <DialogDescription>
              {currentLanguage === 'mm' 
                ? 'ဤလုပ်ဆောင်ချက်အတွက် အနည်းဆုံး တစ်ခုခုကို ရွေးချယ်ရန် လိုအပ်သည်။'
                : 'This action requires at least one item to be selected.'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose} variant="outline">
              {currentLanguage === 'mm' ? 'ပိတ်မည်' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {/* Main Action Modal */}
      <Dialog open={isOpen && !showConfirmDialog} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] w-auto overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {actionForm ? (
              // Use the ExtraActionFormRouter for both schema-driven and pre-built forms
              <ExtraActionFormRouter
                action={actionForm}
                selectedItems={selectedItems.map(item => item._id || item.id)}
                currentLanguage={currentLanguage}
                onSubmit={handleActionSubmit}
                onCancel={onClose}
              />
            ) : (
              // Simple action confirmation (no form) - Add header for consistency
              <div className="space-y-6">
                {/* Form Header */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconComponent name={action.icon} className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {getLocalizedText(action.label, currentLanguage)}
                    </h2>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    {currentLanguage === 'mm' 
                      ? `ရွေးချယ်ထားသော အရာ ${selectedItems.length} ခု`
                      : `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} selected`
                    }
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button onClick={onClose} variant="outline" disabled={isLoading}>
                    {currentLanguage === 'mm' ? 'မလုပ်တော့ပါ' : 'Cancel'}
                  </Button>
                  <Button 
                    onClick={() => handleActionSubmit(new FormData())}
                    disabled={isLoading}
                    variant={action.buttonStyle === 'destructive' ? 'destructive' : 'default'}
                  >
                    {isLoading && <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />}
                    {getLocalizedText(action.label, currentLanguage)}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      {action.confirmMessage && (
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconComponent name="AlertTriangle" className="w-5 h-5 text-warning" />
                {currentLanguage === 'mm' ? 'အတည်ပြုပါ' : 'Confirm Action'}
              </DialogTitle>
              <DialogDescription>
                {getLocalizedText(action.confirmMessage, currentLanguage)}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
                disabled={isLoading}
              >
                {currentLanguage === 'mm' ? 'ပယ်ချမည်' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={isLoading}
                variant={actionForm?.buttonStyle === 'destructive' ? 'destructive' : 'default'}
              >
                {isLoading && <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />}
                {currentLanguage === 'mm' ? 'အတည်ပြုမည်' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}