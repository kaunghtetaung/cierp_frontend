import { notFound } from "next/navigation";
import { fetchLayoutData } from "@/lib/layout-data";
import { getModuleList } from "@repo/app-modules";
import { ModuleDataTableWrapper } from "@/components/modules/ModuleDataTableWrapper";
import { ModuleDataTableWithTimeout } from "@/components/modules/ModuleDataTableWithTimeout";
import type { ModuleSchema } from "@repo/types";

interface ModulePageProps {
  params: Promise<{
    module: string;
  }>;
  searchParams: Promise<Record<string, string>>;
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

  // Check if module uses server-side pagination
  const isServerSidePaging = module.dataTableSchema.pagination?.isClientSidePaging === false;
  
  // Skip server-side fetch for server-paginated modules to avoid double API calls
  if (isServerSidePaging) {
    // For server-side pagination, let client handle fetching with proper params
    return (
      <div className="w-full min-w-0 overflow-hidden">
        <ModuleDataTableWrapper 
          module={module} 
          initialData={[]} 
        />
      </div>
    );
  }

  // For client-side pagination, fetch all data on server
  const resolvedSearchParams = await searchParams;
  let moduleData: any[] | null = null;
  let serverError = false;

  try {
    // Create a timeout promise (10 seconds for server-side)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Server timeout')), 10000);
    });
    
    const dataPromise = getModuleList(resolvedParams.module, resolvedSearchParams);
    moduleData = await Promise.race([dataPromise, timeoutPromise]) as any[];
    
  } catch (error) {
    console.log(`Server-side data fetch failed for ${resolvedParams.module}:`, error);
    serverError = true;
    // Don't throw - let client handle it
  }

  return (
    <div className="space-y-6">
      {serverError || !moduleData ? (
        <ModuleDataTableWithTimeout 
          module={module} 
          searchParams={resolvedSearchParams}
        />
      ) : (
        <ModuleDataTableWrapper 
          module={module} 
          initialData={moduleData} 
        />
      )}
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
