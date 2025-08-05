import { notFound } from "next/navigation";
import { fetchLayoutData } from "@/lib/layout-data";
import { ReactHookFormWrapper } from "@/components/forms/ReactHookFormWrapper";
import { ReactHookWizardFormWrapper } from "@/components/forms/ReactHookWizardFormWrapper";
import { submitModuleForm } from "@repo/app-modules/server-actions";
import { generateZodSchema } from "@/lib/form-schema";
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
  const FormComponent = isWizardForm ? ReactHookWizardFormWrapper : ReactHookFormWrapper;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <FormComponent
        module={moduleWithMultilang}
        action="create"
        moduleSlug={module.slug}
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