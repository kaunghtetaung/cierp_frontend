"use client";

import { useState, useCallback } from "react";
import type { ExtraActionForm } from "@repo/types";

interface UseExtraActionFormProps {
  moduleSlug: string;
  currentLanguage: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

interface ExtraActionFormState {
  isOpen: boolean;
  action: ExtraActionForm | null;
  selectedItems: string[];
}

export function useExtraActionForm({
  moduleSlug,
  currentLanguage,
  onSuccess,
  onError,
}: UseExtraActionFormProps) {
  const [state, setState] = useState<ExtraActionFormState>({
    isOpen: false,
    action: null,
    selectedItems: [],
  });

  // Open extra action form
  const openForm = useCallback((action: ExtraActionForm, selectedItems: string[] = []) => {
    console.log(`🎯 useExtraActionForm.openForm: Opening form for action "${action.actionKey}"`, {
      actionKey: action.actionKey,
      requiresSelection: action.requiresSelection,
      selectedItemsCount: selectedItems.length,
      formApproach: action.formApproach,
      hasFormFields: !!action.formFields?.length,
    });

    // Validate selection requirements
    if (action.requiresSelection && selectedItems.length === 0) {
      const message = currentLanguage === "mm" 
        ? "ဤလုပ်ဆောင်ချက်အတွက် အရာများ ရွေးချယ်ရပါမည်"
        : "This action requires selecting items first";
      console.error(`❌ useExtraActionForm.openForm: Selection required but none provided for "${action.actionKey}"`);
      onError?.(message);
      return;
    }

    setState({
      isOpen: true,
      action,
      selectedItems,
    });
    console.log(`✅ useExtraActionForm.openForm: Form state updated for "${action.actionKey}"`);
  }, [currentLanguage, onError]);

  // Close extra action form
  const closeForm = useCallback(() => {
    setState({
      isOpen: false,
      action: null,
      selectedItems: [],
    });
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (formData: FormData) => {
    if (!state.action) return;

    try {
      // Add action metadata to form data
      formData.append("actionKey", state.action.actionKey);
      formData.append("moduleSlug", moduleSlug);
      
      // Add selected items for single/bulk operations
      if (state.selectedItems.length > 0) {
        // For single item actions, add as 'id'
        if (state.action.endpoint.includes("{id}")) {
          formData.append("id", state.selectedItems[0]);
        }
        // For bulk actions, add as 'selectedIds'
        state.selectedItems.forEach((id) => formData.append("selectedIds", id));
      }

      // Use module server action from libs
      const { executeExtraAction } = await import("@repo/app-modules/server-actions/extra-actions");
      
      const result = await executeExtraAction(formData);
      
      // Success feedback
      const successMessage = currentLanguage === "mm"
        ? "လုပ်ဆောင်ချက် အောင်မြင်ပါသည်"
        : "Action completed successfully";
      
      onSuccess?.(result.message || successMessage);
      
      // Store result data for components that need it
      if (result.data) {
        (window as any).lastExtraActionResult = result.data;
      }
      
      closeForm();
      
      // Trigger page refresh or data refetch
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : currentLanguage === "mm"
        ? "အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်"
        : "An error occurred";
      
      onError?.(errorMessage);
    }
  }, [state.action, state.selectedItems, moduleSlug, currentLanguage, onSuccess, onError, closeForm]);

  // Handle confirmation for actions that require confirmation
  const handleWithConfirmation = useCallback((
    action: ExtraActionForm, 
    selectedItems: string[] = [],
    onConfirm?: () => void
  ) => {
    if (action.confirmMessage && onConfirm) {
      // Let the caller handle the confirmation dialog
      onConfirm();
    } else {
      openForm(action, selectedItems);
    }
  }, [openForm]);

  return {
    // State
    isFormOpen: state.isOpen,
    currentAction: state.action,
    selectedItems: state.selectedItems,
    
    // Actions
    openForm: handleWithConfirmation,
    closeForm,
    handleSubmit,
  };
}