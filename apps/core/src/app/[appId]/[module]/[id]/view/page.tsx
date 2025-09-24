import { notFound } from 'next/navigation'
import { fetchLayoutData } from '@/lib/layout-data'
import { requireModuleAccess } from '@/lib/auth-utils'
import { getModuleItemWithNavigation } from '@repo/app-modules'
import { DetailViewRenderer } from '@/components/modules/DetailViewRenderer'
import type { ModuleSchema } from '@repo/types'

interface ModuleViewPageProps {
  params: Promise<{
    appId: string
    module: string
    id: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ModuleViewPage({ params, searchParams }: ModuleViewPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  // 🔒 SECURITY: Server-side authorization check - prevents direct URL access
  const { user, tenant, module: fullModule } = await requireModuleAccess(
    resolvedParams.appId,
    resolvedParams.module
  )

  // Get filtered layout data (this will only include modules user has access to)
  const { appSchemaData } = await fetchLayoutData()

  if (!appSchemaData?.modules) {
    notFound()
  }

  // Find the module by slug (this should always succeed since we passed requireModuleAccess)
  const module = appSchemaData.modules.find(
    (mod: any) => mod.slug === resolvedParams.module
  )

  if (!module || !module.detailViewSchema) {
    notFound()
  }

  // Get sort parameters from search params (inherited from list view)
  // Default to createdAt desc if not specified
  const sortBy = (resolvedSearchParams.sortBy as string) || 'createdAt'
  const sortOrder = (resolvedSearchParams.sortOrder as 'asc' | 'desc') || 'desc'

  // Fetch the item data with navigation
  let itemData = null
  let navigation = undefined
  
  console.log('📍 [VIEW PAGE] Fetching item with navigation:', {
    module: resolvedParams.module,
    id: resolvedParams.id,
    params: {
      includeNavigation: true,
      sortBy,
      sortOrder
    }
  })
  
  try {
    const itemResponse = await getModuleItemWithNavigation(
      resolvedParams.module, 
      resolvedParams.id,
      {
        includeNavigation: true,
        sortBy,
        sortOrder
      }
    )
    
    console.log('✅ [VIEW PAGE] Response received:', {
      hasData: !!itemResponse?.data,
      hasNavigation: !!itemResponse?.navigation,
      navigation: itemResponse?.navigation,
      dataKeys: itemResponse?.data ? Object.keys(itemResponse.data).slice(0, 5) : [],
      fullResponse: itemResponse
    })
    
    itemData = itemResponse.data
    navigation = itemResponse.navigation
  } catch (error) {
    console.error('❌ [VIEW PAGE] Failed to fetch module item:', error)
    notFound()
  }

  if (!itemData) {
    console.error('❌ [VIEW PAGE] No item data found')
    notFound()
  }
  
  console.log('🎯 [VIEW PAGE] Rendering with:', {
    hasItemData: !!itemData,
    hasNavigation: !!navigation,
    navigationDetails: navigation
  })

  return (
    <div className="max-w-6xl mx-auto p-6">
      <DetailViewRenderer
        module={module}
        itemData={itemData}
        navigation={navigation}
        appId={resolvedParams.appId}
      />
    </div>
  )
}

export async function generateMetadata({ params }: ModuleViewPageProps) {
  const resolvedParams = await params

  try {
    // 🔒 SECURITY: Check module access for metadata generation
    const { module: fullModule } = await requireModuleAccess(
      resolvedParams.appId,
      resolvedParams.module
    )

    return {
      title: `View ${fullModule.name?.en || fullModule.slug} - Core Dashboard`,
      description: `View details for ${fullModule.name?.en || fullModule.slug}`,
    }
  } catch (error) {
    // If access is denied, return generic metadata
    return {
      title: 'Access Denied',
      description: 'You don\'t have permission to access this module.',
    }
  }
}