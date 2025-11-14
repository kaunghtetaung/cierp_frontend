import { notFound } from 'next/navigation'
import { requireModuleAccess } from '@/lib/auth-utils'
import { existsSync } from 'fs'
import path from 'path'

interface CatchAllRouteProps {
  params: Promise<{
    appId: string
    module: string
    slug: string[]
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CatchAllModuleRoute({
  params,
  searchParams
}: CatchAllRouteProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  // 🔒 SECURITY: Server-side authorization check - prevents direct URL access
  const { user, tenant, module: fullModule } = await requireModuleAccess(
    resolvedParams.appId,
    resolvedParams.module
  )

  // Build the slug path from array (e.g., ['barcode'] -> 'barcode', ['reports', 'monthly'] -> 'reports/monthly')
  const slugPath = resolvedParams.slug.join('/')

  console.log('🔍 Catch-all route handler:', {
    appId: resolvedParams.appId,
    module: resolvedParams.module,
    slug: resolvedParams.slug,
    slugPath,
    fullPath: `/${resolvedParams.appId}/${resolvedParams.module}/${slugPath}`
  })

  // ⭐ PRIORITY CHECK: Try static module custom route FIRST
  const staticModulePath = path.join(
    process.cwd(),
    'src',
    'staticModules',
    resolvedParams.appId,
    resolvedParams.module,
    slugPath,
    'page.tsx'
  )

  console.log('🔍 Checking static module path:', staticModulePath)
  console.log('🔍 File exists:', existsSync(staticModulePath))

  if (existsSync(staticModulePath)) {
    // Dynamic import of static module custom route
    try {
      const StaticModule = await import(
        `@/staticModules/${resolvedParams.appId}/${resolvedParams.module}/${slugPath}/page`
      )

      console.log('✅ Static module custom route found and loaded:', slugPath)

      return (
        <StaticModule.default
          module={fullModule}
          user={user}
          tenant={tenant}
          appId={resolvedParams.appId}
          slug={resolvedParams.slug}
          slugPath={slugPath}
          searchParams={resolvedSearchParams}
        />
      )
    } catch (error) {
      console.error(
        `❌ Failed to load static module custom route: ${resolvedParams.appId}/${resolvedParams.module}/${slugPath}`,
        error
      )
      // Fall through to 404 if import fails
    }
  }

  // If we get here, no static module route found
  console.log('❌ No static module route found for:', slugPath)
  console.log('💡 To create this route, add:')
  console.log(`   src/staticModules/${resolvedParams.appId}/${resolvedParams.module}/${slugPath}/page.tsx`)

  notFound()
}

export async function generateMetadata({ params }: CatchAllRouteProps) {
  const resolvedParams = await params

  try {
    // 🔒 SECURITY: Check module access for metadata generation
    const { module: fullModule } = await requireModuleAccess(
      resolvedParams.appId,
      resolvedParams.module
    )

    const slugPath = resolvedParams.slug.join('/')

    return {
      title: `${slugPath} - ${fullModule.name?.en || fullModule.slug} - Core Dashboard`,
      description: `${slugPath} for ${fullModule.name?.en || fullModule.slug}`,
    }
  } catch (error) {
    // If access is denied, return generic metadata
    return {
      title: 'Access Denied',
      description: 'You don\'t have permission to access this module.',
    }
  }
}
