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
  console.log('🔮 ReactHookWizardFormWrapper props:', {
    module: module ? {
      id: module.id,
      name: module.name,
      slug: module.slug,
      formFieldsCount: module.formFields?.length || 0,
      wizardConfig: module.wizardConfig ? 'present' : 'missing'
    } : 'null module',
    action,
    moduleSlug,
    itemId
  });

  let currentLanguage = 'en';
  try {
    const langHook = useLanguage();
    currentLanguage = langHook.currentLanguage || 'en';
    console.log('🔮 ReactHookWizardFormWrapper useLanguage result:', langHook);
  } catch (error) {
    console.error('🔮 ReactHookWizardFormWrapper: useLanguage failed:', error);
    console.log('🔮 ReactHookWizardFormWrapper: Using fallback language: en');
  }
  
  console.log('🔮 ReactHookWizardFormWrapper currentLanguage:', currentLanguage);

  if (!module) {
    console.error('🔮 ReactHookWizardFormWrapper: module is null/undefined');
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <span className="font-medium">Error: Module is required in wrapper</span>
        </div>
      </div>
    );
  }

  console.log('🔮 ReactHookWizardFormWrapper: Rendering ReactHookWizardForm...');

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