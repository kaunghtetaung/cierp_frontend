import { notFound } from "next/navigation";
import { fetchLayoutData } from "@/lib/layout-data";
import { getModuleList } from "@repo/app-modules";
import { ModuleDataTable } from "@/components/modules/ModuleDataTable";
import type { ModuleSchema } from "@repo/types";

interface ModulePageProps {
  params: {
    module: string;
  };
  searchParams: Record<string, string>;
}

// Generate static params for all known module slugs
export async function generateStaticParams() {
  // This will be called at build time
  return [
    { module: "applications" },
    { module: "organizations" },
    { module: "departments" },
    { module: "roles" },
    { module: "groups" },
    { module: "users" },
  ];
}

export default async function ModulePage({
  params,
  searchParams,
}: ModulePageProps) {
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

  // Fetch data directly in Server Component
  const awaitedSearchParams = await searchParams;
  const moduleData = await getModuleList(
    resolvedParams.module,
    awaitedSearchParams
  );

  return (
    <div className="w-full min-w-0">
      <ModuleDataTable module={module} data={moduleData} />
    </div>
  );
}

export async function generateMetadata({ params }: ModulePageProps) {
  const { appSchemaData } = await fetchLayoutData();
  const resolvedParams = await params;

  if (!appSchemaData?.modules) {
    return {
      title: "Module Not Found",
      description: "The requested module could not be found.",
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
    title: `${module.name.en} - Core Dashboard`,
    description: module.description.en,
  };
}
