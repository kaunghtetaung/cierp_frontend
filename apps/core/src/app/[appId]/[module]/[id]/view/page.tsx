import { notFound } from 'next/navigation'
import { fetchLayoutData } from '@/lib/layout-data'
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
  const { appSchemaData } = await fetchLayoutData()
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  if (!appSchemaData?.modules) {
    notFound()
  }

  // Find the module by slug
  const module = appSchemaData.modules.find(
    (mod: ModuleSchema) => mod.slug === resolvedParams.module
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
  const { appSchemaData } = await fetchLayoutData()
  const resolvedParams = await params
  
  if (!appSchemaData?.modules) {
    return {
      title: 'Item Not Found',
      description: 'The requested item could not be found.'
    }
  }

  const module = appSchemaData.modules.find(
    (mod: ModuleSchema) => mod.slug === resolvedParams.module
  )

  if (!module) {
    return {
      title: 'Item Not Found', 
      description: 'The requested item could not be found.'
    }
  }

  // For metadata, we'll use a generic title to avoid duplicate API calls
  // The actual title will be shown in the page content
  return {
    title: `${module.name.en} Details - Core Dashboard`,
    description: `View details for ${module.name.en.toLowerCase()}`
  }
}