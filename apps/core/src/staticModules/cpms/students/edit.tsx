import { notFound } from "next/navigation";
import { getModuleItemWithNavigation } from "@repo/app-modules";
import { FormWithLanguage } from "@repo/schema-forms";
import { enableCommonMultilangFields } from "@/lib/enable-multilang";
import { transformS3KeysToUrls } from "@/actions/media-url";

interface StudentsDetailPageProps {
  module: any;
  user: any;
  tenant: any;
  appId: string;
  itemId: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function StudentsDetailPage({
  module,
  user,
  tenant,
  appId,
  itemId,
  searchParams,
}: StudentsDetailPageProps) {
  console.log("🎯 Static Students Detail Page Called:", {
    itemId,
    hasTenant: !!tenant,
    tenantId: tenant?.id,
    tenantSlug: tenant?.slug,
    tenantRootDomain: tenant?.rootDomain,
  });

  // Fetch initial data for edit mode with navigation
  let initialData = null;
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
    // Get sort parameters from search params (inherited from list view)
    const sortBy = (searchParams?.sortBy as string) || "createdAt";
    const sortOrder = (searchParams?.sortOrder as "asc" | "desc") || "desc";

    const itemResponse = await getModuleItemWithNavigation("students", itemId, {
      includeNavigation: true,
      sortBy,
      sortOrder,
    });

    initialData = itemResponse.data;

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

    console.log("📊 Student Edit Page - Navigation data fetched:", {
      hasNavigation: !!navigation,
      navigation,
      itemId,
    });

    // Transform S3 keys to signed URLs for media fields
    // This ensures profilePhoto (and any other media fields) display correctly
    if (initialData && tenant?.rootDomain) {
      const tenantSlug =
        tenant.slug || initialData.profilePhoto?.split("/")[0] || tenant.id;

      console.log("📸 Student Edit Page - Tenant context for transformation:", {
        tenantId: tenant.id,
        tenantSlug: tenantSlug,
        rootDomain: tenant.rootDomain,
        appId: appId,
        hasProfilePhoto: !!initialData.profilePhoto,
        profilePhotoValue: initialData.profilePhoto,
      });

      initialData = await transformS3KeysToUrls(
        initialData,
        ["profilePhoto"], // Add more media field names here as needed
        {
          tenantId: tenant.id,
          tenantSlug: tenantSlug,
          tenantRootDomain: tenant.rootDomain,
          app: appId,
        }
      );

      console.log("📸 Student Edit Page - Transformed media URLs:", {
        hasProfilePhoto: !!initialData.profilePhoto,
        isUrl: initialData.profilePhoto?.startsWith("http"),
        transformedValue: initialData.profilePhoto,
      });
    }
  } catch (error) {
    console.error("Failed to fetch student item:", error);
    notFound();
  }

  // Enable multilanguage support for common fields
  const moduleWithMultilang = enableCommonMultilangFields(module);

  return (
    <div className="w-full p-6">
      <FormWithLanguage
        module={moduleWithMultilang}
        action="update"
        initialData={initialData}
        moduleSlug="students"
        itemId={itemId}
        isStudentWizardForm={true}
        navigation={navigation}
        appId={appId}
        tenantId={tenant?.tenantId || tenant?.id}
        username={user?.email?.split("@")[0] || user?.id}
      />
    </div>
  );
}
