import { notFound } from "next/navigation";
import { getModuleItemWithNavigation } from "@repo/app-modules";
import { transformS3KeysToUrls } from "@/actions/media-url";
import { StudentRecordCard } from "./components/StudentRecordCard";

interface StudentsViewPageProps {
  module: any;
  user: any;
  tenant: any;
  appId: string;
  itemId: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function StudentsViewPage({
  module,
  user,
  tenant,
  appId,
  itemId,
  searchParams,
}: StudentsViewPageProps) {
  console.log("🎯 Static Students View Page Called:", {
    itemId,
    hasTenant: !!tenant,
    tenantId: tenant?.id,
  });

  // Fetch student data with navigation
  let studentData = null;
  let navigation:
    | {
        hasNext: boolean;
        hasPrevious: boolean;
        nextId?: string;
        previousId?: string;
        currentIndex?: number;
        totalRecords?: number;
      }
    | undefined = undefined;

  try {
    const sortBy = (searchParams?.sortBy as string) || "createdAt";
    const sortOrder = (searchParams?.sortOrder as "asc" | "desc") || "desc";

    const itemResponse = await getModuleItemWithNavigation("students", itemId, {
      includeNavigation: true,
      sortBy,
      sortOrder,
    });

    studentData = itemResponse.data;

    // Transform navigation to convert null to undefined for type compatibility
    if (itemResponse.navigation) {
      navigation = {
        hasNext: itemResponse.navigation.hasNext,
        hasPrevious: itemResponse.navigation.hasPrevious,
        nextId: itemResponse.navigation.nextId ?? undefined,
        previousId: itemResponse.navigation.previousId ?? undefined,
        currentIndex: itemResponse.navigation.currentIndex,
        totalRecords: itemResponse.navigation.totalRecords,
      };
    }

    // Transform S3 keys to signed URLs for media fields
    if (studentData && tenant?.rootDomain) {
      const tenantSlug =
        tenant.slug || studentData.profilePhoto?.split("/")[0] || tenant.id;

      studentData = await transformS3KeysToUrls(
        studentData,
        ["profilePhoto"],
        {
          tenantId: tenant.id,
          tenantSlug: tenantSlug,
          tenantRootDomain: tenant.rootDomain,
          app: appId,
        }
      );
    }
  } catch (error) {
    console.error("Failed to fetch student data:", error);
    notFound();
  }

  if (!studentData) {
    notFound();
  }

  return (
    <StudentRecordCard
      student={studentData}
      module={module}
      navigation={navigation}
      appId={appId}
    />
  );
}
