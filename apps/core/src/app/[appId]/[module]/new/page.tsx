import { notFound } from "next/navigation";
import { fetchLayoutData } from "@/lib/layout-data";
import { requireModuleOperationAccess } from "@/lib/auth-utils";
import { FormWithLanguage } from "@repo/schema-forms";
import { enableCommonMultilangFields } from "@/lib/enable-multilang";
import type { ModuleSchema } from "@repo/types";

interface ModuleNewPageProps {
  params: Promise<{
    appId: string;
    module: string;
  }>;
}

export default async function ModuleNewPage({ params }: ModuleNewPageProps) {
  const resolvedParams = await params;

  // 🔒 SECURITY: Server-side authorization check - prevents direct URL access
  // Also checks CREATE permission specifically for this operation
  const { user, tenant, module: fullModule } = await requireModuleOperationAccess(
    resolvedParams.appId,
    resolvedParams.module,
    'create'
  );

  // Get filtered layout data (this will only include modules user has access to)
  const { appSchemaData } = await fetchLayoutData();

  if (!appSchemaData?.modules) {
    notFound();
  }

  // Find the module by slug (this should always succeed since we passed requireModuleAccess)
  const module = appSchemaData.modules.find(
    (mod: any) => mod.slug === resolvedParams.module
  );

  if (!module) {
    notFound();
  }

  // Enable multilanguage support for common fields
  const moduleWithMultilang = enableCommonMultilangFields(module);

  // Choose form component based on layout type
  const isWizardForm = module.formLayout === "wizard-vertical" || module.formLayout === "wizard-horizontal";
  const isStudentForm = module.formLayout === "studentForm";
  const isStudentWizardForm = module.formLayout === "studentWizardForm";
  const isStaffWizardForm = module.formLayout === "staffWizardForm";

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <FormWithLanguage
        module={moduleWithMultilang}
        action="create"
        moduleSlug={module.slug}
        isWizard={isWizardForm}
        isStudentForm={isStudentForm}
        isStudentWizardForm={isStudentWizardForm}
        isStaffWizardForm={isStaffWizardForm}
        appId={resolvedParams.appId}
        tenantId={tenant.tenantId}
        username={user.email?.split('@')[0] || user.id}
        // No navigation needed for new records
      />
    </div>
  );
}

export async function generateMetadata({ params }: ModuleNewPageProps) {
  const resolvedParams = await params;

  try {
    // 🔒 SECURITY: Check module create access for metadata generation
    const { module: fullModule } = await requireModuleOperationAccess(
      resolvedParams.appId,
      resolvedParams.module,
      'create'
    );

    return {
      title: `Create New ${fullModule.name?.en || fullModule.slug} - Core Dashboard`,
      description: `Create a new ${fullModule.name?.en || fullModule.slug}`,
    };
  } catch (error) {
    // If access is denied, return generic metadata
    return {
      title: 'Access Denied',
      description: 'You don\'t have permission to access this module.',
    };
  }
}