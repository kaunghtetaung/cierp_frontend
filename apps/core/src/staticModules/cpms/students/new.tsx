import { FormWithLanguage } from "@repo/schema-forms";
import { enableCommonMultilangFields } from "@/lib/enable-multilang";

interface StudentsNewPageProps {
  module: any;
  user: any;
  tenant: any;
  appId: string;
}

export default async function StudentsNewPage({
  module,
  user,
  tenant,
  appId,
}: StudentsNewPageProps) {
  // Enable multilanguage support for common fields
  const moduleWithMultilang = enableCommonMultilangFields(module);

  return (
    <div className="w-full p-6">
      <FormWithLanguage
        module={moduleWithMultilang}
        action="create"
        moduleSlug="students"
        isStudentWizardForm={true}
        appId={appId}
        tenantId={tenant?.tenantId || tenant?.id}
        username={user?.email?.split("@")[0] || user?.id}
      />
    </div>
  );
}
