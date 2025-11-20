"use client";

import React from "react";
import { DynamicExtraActionFormWithSections } from "./DynamicExtraActionFormWithSections";
import type { ExtraActionForm } from "@repo/types";

interface ExtraActionFormRouterProps {
  action: ExtraActionForm;
  selectedItems?: string[]; // For actions that require selection
  currentLanguage: string;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  hideHeader?: boolean; // Hide the form header to prevent duplication in modals
  moduleSlug?: string; // Module context for API calls
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

  // Library management forms - support multiple naming conventions
  AccessionNumberManagementForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.AccessionNumberManagementForm }))),
  accessionNumberManagementForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.AccessionNumberManagementForm }))),
  AccessionManageForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.AccessionNumberManagementForm }))),
  accessionManageForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.AccessionNumberManagementForm }))),
  accessionManagementForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.AccessionNumberManagementForm }))),
  AccessionManagementForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.AccessionNumberManagementForm }))),

  // Borrower management forms - support multiple naming conventions
  approveBorrowerForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.ApproveBorrowerForm }))),
  ApproveBorrowerForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.ApproveBorrowerForm }))),
  borrowerApproveForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.ApproveBorrowerForm }))),
  BorrowerApproveForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.ApproveBorrowerForm }))),

  // Student management forms - support multiple naming conventions
  approveStudentForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.ApproveStudentForm }))),
  ApproveStudentForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.ApproveStudentForm }))),
  studentApproveForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.ApproveStudentForm }))),
  StudentApproveForm: React.lazy(() => import("./pre-built").then(m => ({ default: m.ApproveStudentForm }))),

  // Add more pre-built form components as needed
};

export function ExtraActionFormRouter({
  action,
  selectedItems,
  currentLanguage,
  onSubmit,
  onCancel,
  hideHeader = false,
  moduleSlug,
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
      <DynamicExtraActionFormWithSections
        action={action}
        selectedItems={selectedItems}
        currentLanguage={currentLanguage}
        onSubmit={onSubmit}
        onCancel={onCancel}
        hideHeader={hideHeader}
        moduleSlug={moduleSlug}
      />
    );
  }

  // Hybrid approach - check which method to use
  if (formApproach === 'hybrid') {
    // Prefer schema-driven if formFields are available
    if (action.formFields && action.formFields.length > 0) {
      return (
        <DynamicExtraActionFormWithSections
          action={action}
          selectedItems={selectedItems}
          currentLanguage={currentLanguage}
          onSubmit={onSubmit}
          onCancel={onCancel}
          hideHeader={hideHeader}
          moduleSlug={moduleSlug}
        />
      );
    }
    // Fallback to pre-built if formName is available
    if (action.formName && PreBuiltFormComponents[action.formName]) {
      const PreBuiltComponent = PreBuiltFormComponents[action.formName];
      return (
        <div className="w-full">
          <React.Suspense fallback={<FormLoadingFallback />}>
            <PreBuiltComponent
              action={action}
              selectedItems={selectedItems}
              currentLanguage={currentLanguage}
              onSubmit={onSubmit}
              onCancel={onCancel}
              hideHeader={hideHeader}
              moduleSlug={moduleSlug}
            />
          </React.Suspense>
        </div>
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
      availableComponents: Object.keys(PreBuiltFormComponents).filter(k => k.toLowerCase().includes('accession')),
      allComponents: Object.keys(PreBuiltFormComponents),
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
      <div className="w-full">
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
            moduleSlug={moduleSlug}
          />
        </React.Suspense>
      </div>
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
    <div className="w-full min-h-[200px] flex items-center justify-center px-4 py-8">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading form...</span>
      </div>
    </div>
  );
}

// Export types for pre-built form components
export interface PreBuiltFormProps {
  action: ExtraActionForm;
  selectedItems?: any[]; // Can be string IDs or full data objects
  currentLanguage: string;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  hideHeader?: boolean;
  moduleSlug?: string;
}