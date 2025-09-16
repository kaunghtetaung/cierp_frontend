"use client";

import React from "react";
import { DynamicExtraActionForm } from "./DynamicExtraActionForm";
import type { ExtraActionForm } from "@repo/types";

interface ExtraActionFormRouterProps {
  action: ExtraActionForm;
  selectedItems?: string[]; // For actions that require selection
  currentLanguage: string;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  hideHeader?: boolean; // Hide the form header to prevent duplication in modals
}

// Pre-built form components registry
const PreBuiltFormComponents: Record<string, React.ComponentType<any>> = {
  // User management forms - support multiple naming conventions
  userPwdChangeForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.UserPasswordChangeForm }))),
  userPasswordChangeForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.UserPasswordChangeForm }))),
  UserPasswordChangeForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.UserPasswordChangeForm }))),
  RoleAssignForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.RoleAssignForm }))),
  roleAssignForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.RoleAssignForm }))),
  GroupAssignForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.GroupAssignForm }))),
  BulkRoleAssignForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.BulkRoleAssignForm }))),
  BulkGroupAssignForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.BulkGroupAssignForm }))),
  
  // Organization management forms
  ManageApplicationsForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.ManageApplicationsForm }))),
  ApplicationManageForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.ManageApplicationsForm }))),
  
  // Department management forms
  DepartmentUserManageForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.DepartmentUserManageForm }))),
  
  // Bibliography management forms
  AccessionNumberManagementForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.AccessionNumberManagementForm }))),
  AccessionManageForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.AccessionNumberManagementForm }))),
  
  // Add more pre-built form components as needed
};

export function ExtraActionFormRouter({
  action,
  selectedItems,
  currentLanguage,
  onSubmit,
  onCancel,
  hideHeader = false,
}: ExtraActionFormRouterProps) {
  // Determine form approach - default to 'pre-built' for backward compatibility
  const formApproach = action.formApproach || 'pre-built';

  console.log(`🎭 ExtraActionFormRouter: Routing form for action "${action.actionKey}"`, {
    actionKey: action.actionKey,
    formApproach,
    hasFormFields: !!action.formFields?.length,
    formFieldsCount: action.formFields?.length,
    hasFormName: !!action.formName,
    formName: action.formName,
  });

  // Schema-driven approach
  if (formApproach === 'schema-driven' && action.formFields && action.formFields.length > 0) {
    console.log(`📋 ExtraActionFormRouter: Using schema-driven approach for "${action.actionKey}"`);
    return (
      <DynamicExtraActionForm
        action={action}
        selectedItems={selectedItems}
        currentLanguage={currentLanguage}
        onSubmit={onSubmit}
        onCancel={onCancel}
        hideHeader={hideHeader}
      />
    );
  }

  // Hybrid approach - check which method to use
  if (formApproach === 'hybrid') {
    // Prefer schema-driven if formFields are available
    if (action.formFields && action.formFields.length > 0) {
      return (
        <DynamicExtraActionForm
          action={action}
          selectedItems={selectedItems}
          currentLanguage={currentLanguage}
          onSubmit={onSubmit}
          onCancel={onCancel}
          hideHeader={hideHeader}
        />
      );
    }
    // Fallback to pre-built if formName is available
    if (action.formName && PreBuiltFormComponents[action.formName]) {
      const PreBuiltComponent = PreBuiltFormComponents[action.formName];
      return (
        <React.Suspense fallback={<FormLoadingFallback />}>
          <PreBuiltComponent
            action={action}
            selectedItems={selectedItems}
            currentLanguage={currentLanguage}
            onSubmit={onSubmit}
            onCancel={onCancel}
            hideHeader={hideHeader}
          />
        </React.Suspense>
      );
    }
  }

  // Pre-built approach
  if (formApproach === 'pre-built' && action.formName) {
    const PreBuiltComponent = PreBuiltFormComponents[action.formName];
    
    console.log(`🎭 ExtraActionFormRouter: Pre-built form lookup`, {
      actionKey: action.actionKey,
      formName: action.formName,
      componentFound: !!PreBuiltComponent,
      availableComponents: Object.keys(PreBuiltFormComponents),
      onSubmitType: typeof onSubmit
    });
    
    if (!PreBuiltComponent) {
      return (
        <div className="p-4 text-center">
          <p className="text-destructive text-sm">
            {currentLanguage === "mm"
              ? `ကြိုတင်တည်ဆောက်ထားသော ဖောင်မ် '${action.formName}' မတွေ့ရှိပါ`
              : `Pre-built form component '${action.formName}' not found`}
          </p>
        </div>
      );
    }

    return (
      <React.Suspense fallback={<FormLoadingFallback />}>
        <PreBuiltComponent
          action={action}
          selectedItems={selectedItems}
          currentLanguage={currentLanguage}
          onSubmit={async (formData: FormData) => {
            console.log(`🎭 ExtraActionFormRouter: onSubmit called from pre-built component`, {
              actionKey: action.actionKey,
              formName: action.formName,
              formDataEntries: Array.from(formData.entries())
            });
            console.log(`🎭 ExtraActionFormRouter: About to call parent onSubmit`);
            const result = await onSubmit(formData);
            console.log(`🎭 ExtraActionFormRouter: Parent onSubmit completed with result:`, result);
            return result;
          }}
          onCancel={onCancel}
          hideHeader={hideHeader}
        />
      </React.Suspense>
    );
  }

  // Fallback for invalid configuration
  return (
    <div className="p-4 text-center">
      <p className="text-destructive text-sm">
        {currentLanguage === "mm"
          ? "ဖောင်မ်ပုံစံ မမှန်ကန်ပါ"
          : "Invalid form configuration"}
      </p>
      <p className="text-muted-foreground text-xs mt-2">
        {currentLanguage === "mm"
          ? "formApproach, formFields သို့မဟုတ် formName လိုအပ်သည်"
          : "Either formFields (for schema-driven) or formName (for pre-built) is required"}
      </p>
    </div>
  );
}

// Loading fallback component for pre-built forms
function FormLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading form...</span>
      </div>
    </div>
  );
}

// Export types for pre-built form components
export interface PreBuiltFormProps {
  action: ExtraActionForm;
  selectedItems?: string[];
  currentLanguage: string;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  hideHeader?: boolean;
}