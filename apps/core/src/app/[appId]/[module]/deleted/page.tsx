import { requireModuleAccess } from '@/lib/auth-utils'
import { DeletedItemsClient } from './client'

interface ModuleDeletedPageProps {
  params: Promise<{
    appId: string
    module: string
  }>
}

export default async function ModuleDeletedPage({ params }: ModuleDeletedPageProps) {
  const resolvedParams = await params

  // 🔒 SECURITY: Server-side authorization check - prevents direct URL access
  const { user, tenant, module: fullModule } = await requireModuleAccess(
    resolvedParams.appId,
    resolvedParams.module
  )

  return <DeletedItemsClient />
}

export async function generateMetadata({ params }: ModuleDeletedPageProps) {
  const resolvedParams = await params

  try {
    // 🔒 SECURITY: Check module access for metadata generation
    const { module: fullModule } = await requireModuleAccess(
      resolvedParams.appId,
      resolvedParams.module
    )

    return {
      title: `Deleted ${fullModule.name?.en || fullModule.slug}s - Core Dashboard`,
      description: `Manage deleted ${fullModule.name?.en || fullModule.slug} items`,
    }
  } catch (error) {
    // If access is denied, return generic metadata
    return {
      title: 'Access Denied',
      description: 'You don\'t have permission to access this module.',
    }
  }
}