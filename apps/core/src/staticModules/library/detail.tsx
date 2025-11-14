import { notFound } from 'next/navigation';
import { getModuleItemWithNavigation } from '@repo/app-modules';
import { FormWithLanguage } from '@repo/schema-forms';
import { enableCommonMultilangFields } from '@/lib/enable-multilang';
import { transformS3KeysToUrls } from '@/actions/media-url';

export default async function LibraryDetailPage({ module, user, tenant, appId, itemId, searchParams }: any) {
  const isCreateMode = itemId === 'new';

  console.log("🎯 Static Library Detail Page Called:", {
    isCreateMode,
    itemId,
    hasTenant: !!tenant,
    tenantId: tenant?.id,
    tenantSlug: tenant?.slug,
    tenantRootDomain: tenant?.rootDomain,
  });

  // Fetch initial data for edit mode with navigation
  let initialData = null;
  let navigation = undefined;

  if (!isCreateMode) {
    try {
      // Get sort parameters from search params (inherited from list view)
      const sortBy = (searchParams.sortBy as string) || 'createdAt';
      const sortOrder = (searchParams.sortOrder as 'asc' | 'desc') || 'desc';

      const itemResponse = await getModuleItemWithNavigation(
        'library',
        itemId,
        {
          includeNavigation: true,
          sortBy,
          sortOrder
        }
      );

      initialData = itemResponse.data;
      navigation = itemResponse.navigation;

      console.log("📊 Library Edit Page - Navigation data fetched:", {
        hasNavigation: !!navigation,
        navigation,
        itemId
      });

      // Transform S3 keys to signed URLs for media fields
      // Add media field names specific to library module here
      if (initialData && tenant.rootDomain) {
        const tenantSlug = tenant.slug || tenant.id;
        const mediaFields: string[] = []; // Example: ['coverImage', 'thumbnail']

        if (mediaFields.length > 0) {
          console.log("📸 Library Edit Page - Tenant context for transformation:", {
            tenantId: tenant.id,
            tenantSlug: tenantSlug,
            rootDomain: tenant.rootDomain,
            appId: appId,
            mediaFields,
          });

          initialData = await transformS3KeysToUrls(
            initialData,
            mediaFields,
            {
              tenantId: tenant.id,
              tenantSlug: tenantSlug,
              tenantRootDomain: tenant.rootDomain,
              app: appId,
            }
          );

          console.log("📸 Library Edit Page - Transformed media URLs:", {
            transformedFields: mediaFields,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch library item:', error);
      notFound();
    }
  }

  // Enable multilanguage support for common fields
  const moduleWithMultilang = enableCommonMultilangFields(module);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <FormWithLanguage
        module={moduleWithMultilang}
        action={isCreateMode ? 'create' : 'update'}
        initialData={initialData}
        moduleSlug="library"
        itemId={isCreateMode ? undefined : itemId}
        navigation={navigation}
        appId={appId}
      />
    </div>
  );
}
