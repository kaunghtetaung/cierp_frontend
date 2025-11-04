"use client";

import React from "react";
import { useLanguage } from "@repo/language";
import { ReactHookForm } from "./ReactHookForm";
import { ReactHookWizardForm } from "./ReactHookWizardForm";
import type { ModuleSchema } from "@repo/types";

interface FormWithLanguageProps {
  module: ModuleSchema;
  action: "create" | "update";
  initialData?: Record<string, any>;
  moduleSlug: string;
  itemId?: string;
  isWizard?: boolean;
  tenantId?: string;
  appId?: string;
  username?: string;
}

export function FormWithLanguage({
  module,
  action,
  initialData,
  moduleSlug,
  itemId,
  isWizard = false,
  tenantId,
  appId,
  username,
}: FormWithLanguageProps) {
  const { currentLanguage } = useLanguage();

  const FormComponent = isWizard ? ReactHookWizardForm : ReactHookForm;

  return (
    <FormComponent
      module={module}
      action={action}
      initialData={initialData}
      moduleSlug={moduleSlug}
      itemId={itemId}
      currentLanguage={currentLanguage}
      tenantId={tenantId}
      appId={appId}
      username={username}
    />
  );
}