"use client";

import React from "react";
import { useLanguage } from "@repo/language";
import { ReactHookForm } from "./ReactHookForm";
import { ReactHookFormEnhanced } from "./ReactHookFormEnhanced";
import { ReactHookWizardForm } from "./ReactHookWizardForm";
import type { ModuleSchema } from "@repo/types";

interface FormWithLanguageProps {
  module: ModuleSchema;
  action: "create" | "update";
  initialData?: Record<string, any>;
  moduleSlug: string;
  itemId?: string;
  isWizard?: boolean;
  isEnhanced?: boolean;
  navigation?: {
    hasNext: boolean;
    hasPrevious: boolean;
    nextId?: string;
    previousId?: string;
    currentIndex?: number;
    totalRecords?: number;
  };
  appId?: string;
}

export function FormWithLanguage({
  module,
  action,
  initialData,
  moduleSlug,
  itemId,
  isWizard = false,
  isEnhanced = true, // Default to enhanced for better UX
  navigation,
  appId,
}: FormWithLanguageProps) {
  const { currentLanguage } = useLanguage();

  // Select the appropriate form component
  const FormComponent = isWizard 
    ? ReactHookWizardForm 
    : isEnhanced 
      ? ReactHookFormEnhanced 
      : ReactHookForm;

  return (
    <FormComponent
      module={module}
      action={action}
      initialData={initialData}
      moduleSlug={moduleSlug}
      itemId={itemId}
      currentLanguage={currentLanguage}
      {...(isEnhanced && navigation ? { navigation, appId } : {})}
    />
  );
}