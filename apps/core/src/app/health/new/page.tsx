import { notFound } from "next/navigation";
import { fetchLayoutData } from "@/lib/layout-data";
import { FormWithLanguage } from "@repo/schema-forms";
import { enableCommonMultilangFields } from "@/lib/enable-multilang";
import type { ModuleSchema } from "@repo/types";

interface ModuleNewPageProps {
  params: Promise<{
    module: string;
  }>;
}

export default async function ModuleNewPage({ params }: ModuleNewPageProps) {
  const { appSchemaData } = await fetchLayoutData();
  const resolvedParams = await params;

  if (!appSchemaData?.modules) {
    notFound();
  }

  // Find the module by slug
  const module = appSchemaData.modules.find(
    (mod: ModuleSchema) => mod.slug === resolvedParams.module
  );

  if (!module) {
    notFound();
  }

  // Enable multilanguage support for common fields
  const moduleWithMultilang = enableCommonMultilangFields(module);

  // Choose form component based on layout type
  const isWizardForm = module.formLayout === "wizard-vertical" || module.formLayout === "wizard-horizontal";

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <FormWithLanguage
        module={moduleWithMultilang}
        action="create"
        moduleSlug={module.slug}
        isWizard={isWizardForm}
        // No navigation needed for new records
      />
    </div>
  );
}

export async function generateMetadata({ params }: ModuleNewPageProps) {
  const { appSchemaData } = await fetchLayoutData();
  const resolvedParams = await params;

  if (!appSchemaData?.modules) {
    return {
      title: "Create New Item",
      description: "Create a new item",
    };
  }

  const module = appSchemaData.modules.find(
    (mod: ModuleSchema) => mod.slug === resolvedParams.module
  );

  if (!module) {
    return {
      title: "Module Not Found",
      description: "The requested module could not be found.",
    };
  }

  return {
    title: `Create New ${module.name.en}`,
    description: `Create a new ${module.name.en.toLowerCase()}`,
  };
}