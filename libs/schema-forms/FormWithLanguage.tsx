"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLanguage } from "@repo/language";
import { ReactHookForm } from "./ReactHookForm";
import { ReactHookFormEnhanced } from "./ReactHookFormEnhanced";
import { ReactHookWizardForm } from "./ReactHookWizardForm";
import { ReactHookStudentForm } from "./ReactHookStudentForm";
import { ReactHookStudentWizardForm } from "./ReactHookStudentWizardForm";
import { ReactHookStaffWizardForm } from "./ReactHookStaffWizardForm";
import type { ModuleSchema } from "@repo/types";

interface FormWithLanguageProps {
  module: ModuleSchema;
  action: "create" | "update";
  initialData?: Record<string, any>;
  moduleSlug: string;
  itemId?: string;
  isWizard?: boolean;
  isEnhanced?: boolean;
  isStudentForm?: boolean;
  isStudentWizardForm?: boolean;
  isStaffWizardForm?: boolean;
  navigation?: {
    hasNext: boolean;
    hasPrevious: boolean;
    nextId?: string;
    previousId?: string;
    currentIndex?: number;
    totalRecords?: number;
  };
  appId?: string;
  tenantId?: string;
  username?: string;
}

export function FormWithLanguage({
  module,
  action,
  initialData,
  moduleSlug,
  itemId,
  isWizard = false,
  isEnhanced = true, // Default to enhanced for better UX
  isStudentForm = false,
  isStudentWizardForm = false,
  isStaffWizardForm = false,
  navigation,
  appId,
  tenantId,
  username,
}: FormWithLanguageProps) {
  const { currentLanguage } = useLanguage();

  // Create a QueryClient instance for this form
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Debug navigation passing
  console.log("🔄 FormWithLanguage - Navigation props:", {
    hasNavigation: !!navigation,
    navigation,
    isWizard,
    isEnhanced,
    isStudentForm,
    isStudentWizardForm,
    isStaffWizardForm,
    willPassNavigation: isEnhanced && navigation
  });

  // Select the appropriate form component
  const FormComponent = isStaffWizardForm
    ? ReactHookStaffWizardForm
    : isStudentWizardForm
      ? ReactHookStudentWizardForm
      : isStudentForm
        ? ReactHookStudentForm
        : isWizard
          ? ReactHookWizardForm
          : isEnhanced
            ? ReactHookFormEnhanced
            : ReactHookForm;

  return (
    <QueryClientProvider client={queryClient}>
      <FormComponent
        module={module}
        action={action}
        initialData={initialData}
        moduleSlug={moduleSlug}
        itemId={itemId}
        currentLanguage={currentLanguage}
        appId={appId}
        tenantId={tenantId}
        username={username}
        {...(isEnhanced && navigation ? { navigation } : {})}
      />
    </QueryClientProvider>
  );
}