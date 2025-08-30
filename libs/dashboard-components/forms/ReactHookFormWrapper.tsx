"use client";

import React from "react";
import { useLanguage } from "@repo/language";
import { ReactHookForm } from "./ReactHookForm";
import type { ModuleSchema } from "@repo/types";

interface ReactHookFormWrapperProps {
  module: ModuleSchema;
  action: "create" | "update";
  initialData?: Record<string, any>;
  moduleSlug: string;
  itemId?: string;
}

export function ReactHookFormWrapper({
  module,
  action,
  initialData,
  moduleSlug,
  itemId,
}: ReactHookFormWrapperProps) {
  const { currentLanguage } = useLanguage();

  return (
    <ReactHookForm
      module={module}
      action={action}
      initialData={initialData}
      moduleSlug={moduleSlug}
      itemId={itemId}
      currentLanguage={currentLanguage}
    />
  );
}