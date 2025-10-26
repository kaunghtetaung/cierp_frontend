import { notFound } from "next/navigation";
import { fetchLayoutData } from "@/lib/layout-data";
import { requireModuleAccess } from "@/lib/auth-utils";
import { getModulePermissions } from "@/lib/module-access-utils";
import { getModuleList } from "@repo/app-modules";
import { ModuleDataTableWrapper } from "@/components/modules/ModuleDataTableWrapper";
import { ModuleDataTableWithTimeout } from "@/components/modules/ModuleDataTableWithTimeout";
import type { ClientModule, ModulePermissions } from "@/types/layout";

interface ModulePageProps {
  params: Promise<{
    appId: string;
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
  const resolvedParams = await params;

  // 🔒 SECURITY: Server-side authorization check - prevents direct URL access
  const { user, tenant, module: fullModule } = await requireModuleAccess(
    resolvedParams.appId,
    resolvedParams.module
  );

  // Get filtered layout data (this will only include modules user has access to)
  const { appSchemaData } = await fetchLayoutData();

  if (!appSchemaData?.modules) {
    notFound();
  }

  // Find the module by slug (this should always succeed since we passed requireModuleAccess)
  const module = appSchemaData.modules.find(
    (mod: ClientModule) => mod.slug === resolvedParams.module
  );

  if (!module) {
    notFound();
  }

  // Calculate user permissions for this module
  const userPermissions = getModulePermissions(fullModule, user);
  console.log(`[MODULE_PAGE] User permissions for ${module.slug}:`, userPermissions);

  // Check if module uses server-side pagination
  const isServerSidePaging =
    module.dataTableSchema?.pagination?.isClientSidePaging === false;

  // Skip server-side fetch for server-paginated modules to avoid double API calls
  if (isServerSidePaging) {
    // For server-side pagination, let client handle fetching with proper params
    return (
      <div className="w-full min-w-0 overflow-hidden">
        <ModuleDataTableWrapper
          module={module}
          initialData={[]}
          userPermissions={userPermissions}
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
      setTimeout(() => reject(new Error("Server timeout")), 10000);
    });

    const dataPromise = getModuleList(
      resolvedParams.module,
      resolvedSearchParams
    );
    moduleData = (await Promise.race([dataPromise, timeoutPromise])) as any[];
  } catch (error) {
    // Enhanced error logging with full context
    console.error(
      `Server-side data fetch failed for ${resolvedParams.module}:`,
      {
        module: resolvedParams.module,
        error: error instanceof Error ? error.message : String(error),
        statusCode: (error as any)?.statusCode,
        errorCode: (error as any)?.errorCode,
        category: (error as any)?.category,
        traceId: (error as any)?.traceId,
        stack: error instanceof Error ? error.stack : undefined,
      }
    );
    serverError = true;
    // Don't throw - let client handle it
  }

  return (
    <div className="space-y-6">
      {serverError || !moduleData ? (
        <ModuleDataTableWithTimeout
          module={module}
          searchParams={resolvedSearchParams}
          userPermissions={userPermissions}
        />
      ) : (
        <ModuleDataTableWrapper
          module={module}
          initialData={moduleData}
          userPermissions={userPermissions}
        />
      )}
    </div>
  );
}

export async function generateMetadata({ params }: ModulePageProps) {
  const resolvedParams = await params;

  try {
    // 🔒 SECURITY: Check module access for metadata generation
    const { module: fullModule } = await requireModuleAccess(
      resolvedParams.appId,
      resolvedParams.module
    );

    return {
      title: `${fullModule.name?.en || fullModule.slug} - Core Dashboard`,
      description: fullModule.description?.en || `${fullModule.slug} module`,
    };
  } catch (error) {
    // If access is denied, return generic metadata
    return {
      title: "Access Denied",
      description: "You don't have permission to access this module.",
    };
  }
}
