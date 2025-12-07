import { fetchLayoutData } from "@/lib/layout-data";
import { getModulePermissions } from "@/lib/module-access-utils";
import { notFound } from "next/navigation";
import { StudentDashboardWrapper } from "./components/StudentDashboardWrapper";
import type { ModuleSchema } from "@repo/types";

export default async function StudentsListPage({ module, user }: any) {
  // Get filtered layout data
  const { appSchemaData } = await fetchLayoutData();

  if (!appSchemaData?.modules) {
    notFound();
  }

  // Find the module by slug
  const clientModule = appSchemaData.modules.find(
    (mod: any) => mod.slug === "students"
  ) as ModuleSchema | undefined;

  if (!clientModule) {
    notFound();
  }

  // Calculate user permissions for this module
  const userPermissions = getModulePermissions(module, user);

  // Use the dashboard wrapper which handles both dashboard and data views
  // with shared prefilter controls outside of the data table
  return (
    <div className="w-full min-w-0 overflow-hidden">
      <StudentDashboardWrapper
        module={clientModule}
        initialData={[]}
        userPermissions={userPermissions}
      />
    </div>
  );
}
