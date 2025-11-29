"use client";

import { BibliographyForm } from "./components/BibliographyForm";

export default function BibliographiesNewPage({
  module,
  user,
  tenant,
  appId,
}: any) {
  return (
    <BibliographyForm
      module={module}
      action="create"
      moduleSlug="bibliographies"
      appId={appId}
      tenantId={tenant.tenantId}
      username={user.email?.split("@")[0] || user.id}
    />
  );
}
