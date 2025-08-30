"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { IconComponent } from "@repo/ui/components/icons";
import { getLocalizedText } from "@repo/utils";
import { useExtraActionForm } from "@/hooks/use-extra-action-form";
import { ExtraActionModal } from "../forms/ExtraActionModal";
import type { ExtraActionForm, ModuleSchema } from "@repo/types";

interface ExtraActionExampleProps {
  module: ModuleSchema;
  selectedItems: string[];
  currentLanguage: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function ExtraActionExample({
  module,
  selectedItems,
  currentLanguage,
  onSuccess,
  onError,
}: ExtraActionExampleProps) {
  const { openForm } = useExtraActionForm({
    moduleSlug: module.slug,
    currentLanguage,
    onSuccess,
    onError,
  });

  // Get all extra actions from the module
  const extraActions = module.extraActionForms || [];
  
  // Filter actions based on selection requirements
  const availableActions = extraActions.filter(action => {
    // If action requires selection, only show when items are selected
    if (action.requiresSelection) {
      return selectedItems.length > 0;
    }
    return true;
  });

  if (availableActions.length === 0) {
    return null;
  }

  const handleActionClick = (action: ExtraActionForm) => {
    // Check permissions here if needed
    // if (!hasPermission(action.permission)) return;
    
    openForm(action, selectedItems);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {currentLanguage === "mm" ? "အပို လုပ်ဆောင်ချက်များ" : "Extra Actions"}
      </h3>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {availableActions.map((action) => (
          <Button
            key={action.actionKey}
            variant={action.buttonStyle === "danger" ? "destructive" : "default"}
            size="sm"
            onClick={() => handleActionClick(action)}
            className="flex items-center gap-2"
          >
            {action.iconName && (
              <IconComponent name={action.iconName} className="w-4 h-4" />
            )}
            {getLocalizedText(action.title, currentLanguage)}
          </Button>
        ))}
      </div>

      {/* Selection Info */}
      {selectedItems.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm text-muted-foreground">
            {currentLanguage === "mm"
              ? `ရွေးချယ်ထားသော အရာ ${selectedItems.length} ခု`
              : `${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} selected`}
          </p>
        </div>
      )}

      {/* Modal */}
      <ExtraActionModal
        moduleSlug={module.slug}
        currentLanguage={currentLanguage}
        onSuccess={onSuccess}
        onError={onError}
      />
    </div>
  );
}

// Example of schema-driven extra actions for Organization module
export const organizationExtraActions: ExtraActionForm[] = [
  {
    actionKey: "addApplication",
    title: { en: "Add Application", mm: "အပ္ပလီကေးရှင်းထည့်ခြင်း" },
    description: { en: "Add an application to this organization", mm: "ဤအဖွဲ့အစည်းသို့ အပ္ပလီကေးရှင်းတစ်ခု ထည့်ပါ" },
    iconName: "Plus",
    endpoint: "/organizations/{id}/applications",
    method: "POST",
    formType: "modal",
    formApproach: "schema-driven",
    formWidth: "md",
    requiresSelection: false,
    buttonStyle: "primary",
    submitButtonText: { en: "Add Application", mm: "အပ္ပလီကေးရှင်းထည့်မည်" },
    formFields: [
      {
        fieldName: "applicationId",
        fieldType: "select",
        label: { en: "Select Application", mm: "အပ္ပလီကေးရှင်းရွေးချယ်ပါ" },
        placeHolder: "Choose an application",
        validationRule: {
          required: true,
          errorMessage: { en: "Application is required", mm: "အပ္ပလီကေးရှင်း ရွေးချယ်ရပါမည်" }
        },
        readonly: false,
        hidden: false,
        isMultiLang: false,
        dropdownConfig: {
          type: "dynamic",
          refPath: "/applications/ref",
          searchable: true,
          clearable: false,
          preloadData: true
        }
      }
    ]
  },
  {
    actionKey: "removeApplication",
    title: { en: "Remove Application", mm: "အပ္ပလီကေးရှင်းဖယ်ရှားခြင်း" },
    description: { en: "Remove an application from this organization", mm: "ဤအဖွဲ့အစည်းမှ အပ္ပလီကေးရှင်းတစ်ခု ဖယ်ရှားပါ" },
    iconName: "Trash",
    endpoint: "/organizations/{id}/applications",
    method: "DELETE",
    formType: "modal",
    formApproach: "schema-driven",
    formWidth: "md",
    requiresSelection: false,
    buttonStyle: "danger",
    confirmMessage: { en: "Are you sure you want to remove this application?", mm: "ဤအပ္ပလီကေးရှင်းကို ဖယ်ရှားလိုသည်မှာ သေချာပါသလား?" },
    submitButtonText: { en: "Remove Application", mm: "အပ္ပလီကေးရှင်းဖယ်ရှားမည်" },
    formFields: [
      {
        fieldName: "applicationId",
        fieldType: "select",
        label: { en: "Select Application to Remove", mm: "ဖယ်ရှားရန် အပ္ပလီကေးရှင်းရွေးချယ်ပါ" },
        validationRule: {
          required: true,
          errorMessage: { en: "Application is required", mm: "အပ္ပလီကေးရှင်း ရွေးချယ်ရပါမည်" }
        },
        readonly: false,
        hidden: false,
        isMultiLang: false,
        dropdownConfig: {
          type: "dynamic",
          refPath: "/organizations/{id}/applications/ref",
          searchable: true,
          clearable: false,
          preloadData: true
        }
      },
      {
        fieldName: "reason",
        fieldType: "textArea",
        label: { en: "Reason for Removal", mm: "ဖယ်ရှားရခြင်းအကြောင်းရင်း" },
        placeHolder: "Enter the reason for removing this application",
        validationRule: {
          required: false,
          maxLength: 500,
          errorMessage: { en: "Reason must not exceed 500 characters", mm: "အကြောင်းရင်းသည် ၅၀၀ လုံးထက် မပိုရ" }
        },
        readonly: false,
        hidden: false,
        isMultiLang: false,
        rows: 3
      }
    ]
  }
];