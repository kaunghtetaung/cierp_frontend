"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExtraActionFormRouter } from "./ExtraActionFormRouter";
import { useExtraActionForm } from "@/hooks/use-extra-action-form";
import type { ExtraActionForm } from "@repo/types";

interface ExtraActionModalProps {
  moduleSlug: string;
  currentLanguage: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function ExtraActionModal({
  moduleSlug,
  currentLanguage,
  onSuccess,
  onError,
}: ExtraActionModalProps) {
  const {
    isFormOpen,
    currentAction,
    selectedItems,
    closeForm,
    handleSubmit,
  } = useExtraActionForm({
    moduleSlug,
    currentLanguage,
    onSuccess,
    onError,
  });

  if (!currentAction) return null;

  // Determine modal width based on form configuration
  const getModalWidth = (action: ExtraActionForm) => {
    switch (action.formWidth) {
      case "sm": return "max-w-md";
      case "md": return "max-w-lg";
      case "lg": return "max-w-2xl";
      case "xl": return "max-w-4xl";
      case "full": return "max-w-7xl";
      default: return "max-w-lg";
    }
  };

  return (
    <Dialog open={isFormOpen} onOpenChange={closeForm}>
      <DialogContent className={`${getModalWidth(currentAction)} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="sr-only">
            {currentAction.title.en}
          </DialogTitle>
        </DialogHeader>
        
        <ExtraActionFormRouter
          action={currentAction}
          selectedItems={selectedItems}
          currentLanguage={currentLanguage}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          moduleSlug={moduleSlug}
        />
      </DialogContent>
    </Dialog>
  );
}

// Export the hook for direct usage in other components
export { useExtraActionForm };