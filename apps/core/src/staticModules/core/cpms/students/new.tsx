"use client";

import { FormWithLanguage } from "@repo/schema-forms";

export default function StudentsNewPage({ module, user, tenant, appId }: any) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      "FROM Static"
      <FormWithLanguage
        module={module}
        action="create"
        moduleSlug="students"
        isStudentWizardForm={true}
        appId={appId}
        tenantId={tenant.tenantId}
        username={user.email?.split('@')[0] || user.id}
      />
    </div>
  );
}
