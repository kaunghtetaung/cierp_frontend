"use client";

import React from "react";
import { useLanguage } from "@repo/language";
import { ReactHookWizardForm } from "./ReactHookWizardForm";
import type { ModuleSchema } from "@repo/types";

interface ReactHookWizardFormWrapperProps {
  module: ModuleSchema;
  action: "create" | "update";
  initialData?: Record<string, any>;
  moduleSlug: string;
  itemId?: string;
}

export function ReactHookWizardFormWrapper({
  module,
  action,
  initialData,
  moduleSlug,
  itemId,
}: ReactHookWizardFormWrapperProps) {
  const { currentLanguage } = useLanguage();

  return (
    <ReactHookWizardForm
      module={module}
      action={action}
      initialData={initialData}
      moduleSlug={moduleSlug}
      itemId={itemId}
      currentLanguage={currentLanguage}
    />
  );
}