import { notFound } from "next/navigation";
import { fetchLayoutData } from "@/lib/layout-data";
import { SimpleForm } from "@/components/forms/SimpleForm";
import { submitModuleForm } from "@repo/app-modules/server-actions";
import { generateZodSchema } from "@/lib/form-schema";
import { enableCommonMultilangFields } from "@/lib/enable-multilang";
import type { ModuleSchema } from "@repo/types";

interface ModuleNewPageProps {
  params: {
    module: string;
  };
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <SimpleForm
        module={moduleWithMultilang}
        action="create"
        serverAction={async (formData: FormData) => {
          "use server";
          
          const validationSchema = generateZodSchema(moduleWithMultilang.formFields);
          const result = await submitModuleForm(
            module.slug,
            formData,
            validationSchema,
            "create"
          );
          
          // The server action handles redirect on success
          // and returns errors if validation fails
          if (!result.success) {
            throw new Error(result.error || "Failed to create item");
          }
        }}
        currentLanguage="en" // TODO: Get from context
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