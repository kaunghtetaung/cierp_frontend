import { fetchLayoutData } from "@/lib/layout-data";
import { getModulePermissions } from "@/lib/module-access-utils";
import { getModuleList } from "@repo/app-modules";
import { ModuleDataTableWrapper } from "@/components/modules/ModuleDataTableWrapper";
import { ModuleDataTableWithTimeout } from "@/components/modules/ModuleDataTableWithTimeout";
import { notFound } from "next/navigation";

export default async function BibliographiesListPage({
  module,
  user,
  appId,
}: any) {
  // Get filtered layout data
  const { appSchemaData } = await fetchLayoutData();

  if (!appSchemaData?.modules) {
    notFound();
  }

  // Find the module by slug
  const clientModule = appSchemaData.modules.find(
    (mod: any) => mod.slug === "bibliographies"
  );

  if (!clientModule) {
    notFound();
  }

  // Calculate user permissions for this module
  const userPermissions = getModulePermissions(module, user);

  // Check if module uses server-side pagination
  const isServerSidePaging =
    clientModule.dataTableSchema?.pagination?.isClientSidePaging === false;

  // Skip server-side fetch for server-paginated modules
  if (isServerSidePaging) {
    return (
      <div className="w-full min-w-0 overflow-hidden">
        "FROM Static"
        <ModuleDataTableWrapper
          module={clientModule}
          initialData={[]}
          userPermissions={userPermissions}
        />
      </div>
    );
  }

  // For client-side pagination, fetch all data on server
  let moduleData: any[] | null = null;
  let serverError = false;

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Server timeout")), 10000);
    });

    const dataPromise = getModuleList("bibliographies", {});
    moduleData = (await Promise.race([dataPromise, timeoutPromise])) as any[];
  } catch (error) {
    console.error("Server-side data fetch failed for bibliographies:", error);
    serverError = true;
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {serverError || !moduleData ? (
        <ModuleDataTableWithTimeout
          module={clientModule}
          searchParams={{}}
          userPermissions={userPermissions}
        />
      ) : (
        <ModuleDataTableWrapper
          module={clientModule}
          initialData={moduleData}
          userPermissions={userPermissions}
        />
      )}
    </div>
  );
}
