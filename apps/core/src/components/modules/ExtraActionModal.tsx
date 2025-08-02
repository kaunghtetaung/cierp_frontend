"use client";

import React, { useState } from "react";
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
import { SimpleForm } from "../forms/SimpleForm";
import { enableCommonMultilangFields } from "@/lib/enable-multilang";
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


  const handleActionSubmit = async (formData?: FormData) => {
    if (action.confirmMessage && !showConfirmDialog) {
      setShowConfirmDialog(true);
      return;
    }

    setIsLoading(true);
    try {
      // Here you would normally call your API endpoint
      // For now, we'll simulate the action
      console.log(`Executing action ${action.actionKey} on items:`, selectedItems);
      console.log('Form data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Action failed:', error);
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
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <IconComponent name={actionForm?.iconName || action.icon} className="w-5 h-5" />
              {getLocalizedText(actionForm?.title || action.label, currentLanguage)}
            </DialogTitle>
            {actionForm?.description && (
              <DialogDescription>
                {getLocalizedText(actionForm.description, currentLanguage)}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {actionForm && actionForm.formType === 'modal' && actionForm.formName ? (
              // If there's a form definition, render it with multilanguage support
              <SimpleForm
                module={enableCommonMultilangFields(module)}
                action="create"
                serverAction={handleActionSubmit}
                currentLanguage={currentLanguage}
              />
            ) : (
              // Simple action confirmation
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">
                    {currentLanguage === 'mm' ? 'ရွေးချယ်ထားသော အချက်များ:' : 'Selected Items:'}
                  </h4>
                  <div className="text-sm text-muted-foreground">
                    {selectedItems.length} {currentLanguage === 'mm' ? 'ခု' : 'items selected'}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button onClick={onClose} variant="outline" disabled={isLoading}>
                    {currentLanguage === 'mm' ? 'ပယ်ချမည်' : 'Cancel'}
                  </Button>
                  <Button 
                    onClick={() => handleActionSubmit()}
                    disabled={isLoading}
                    variant={actionForm?.buttonStyle === 'destructive' ? 'destructive' : 'default'}
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