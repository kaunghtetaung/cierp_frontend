import { notFound } from 'next/navigation'
import { fetchLayoutData } from '@/lib/layout-data'
import { requireModuleAccess } from '@/lib/auth-utils'
import { getModuleItemWithNavigation } from '@repo/app-modules'
import { submitModuleForm } from '@repo/app-modules/server-actions'
import { FormWithLanguage } from '@repo/schema-forms'
import { generateZodSchema } from '@repo/schema-utils'
import { enableCommonMultilangFields } from '@/lib/enable-multilang'
import type { ModuleSchema } from '@repo/types'
import { existsSync } from 'fs'
import path from 'path'

interface ModuleDetailPageProps {
  params: Promise<{
    appId: string
    module: string
    id: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ModuleDetail({ params, searchParams }: ModuleDetailPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  // 🔒 SECURITY: Server-side authorization check - prevents direct URL access
  const { user, tenant, module: fullModule } = await requireModuleAccess(
    resolvedParams.appId,
    resolvedParams.module
  )

  // ⭐ CHECK: If static module exists for this appId/module combination
  const staticModulePath = path.join(
    process.cwd(),
    "src",
    "staticModules",
    resolvedParams.appId,
    resolvedParams.module,
    "detail.tsx"
  );

  if (existsSync(staticModulePath)) {
    // Dynamic import of static module
    try {
      const StaticModule = await import(
        `@/staticModules/${resolvedParams.appId}/${resolvedParams.module}/detail`
      );
      return (
        <StaticModule.default
          module={fullModule}
          user={user}
          tenant={tenant}
          appId={resolvedParams.appId}
          itemId={resolvedParams.id}
          searchParams={resolvedSearchParams}
        />
      );
    } catch (error) {
      console.error(
        `Failed to load static module detail page: ${resolvedParams.appId}/${resolvedParams.module}`,
        error
      );
      // Fall through to generic module if import fails
    }
  }

  // Get filtered layout data (this will only include modules user has access to)
  const { appSchemaData } = await fetchLayoutData()

  if (!appSchemaData?.modules) {
    notFound()
  }

  // Find the module by slug (this should always succeed since we passed requireModuleAccess)
  const module = appSchemaData.modules.find(
    (mod: any) => mod.slug === resolvedParams.module
  )

  if (!module) {
    notFound()
  }

  // Enable multilanguage support for common fields
  const moduleWithMultilang = enableCommonMultilangFields(module);

  const isCreateMode = resolvedParams.id === 'new'

  // Fetch initial data for edit mode with navigation
  let initialData = null
  let navigation = undefined
  
  if (!isCreateMode) {
    try {
      // Get sort parameters from search params (inherited from list view)
      const sortBy = (resolvedSearchParams.sortBy as string) || 'createdAt'
      const sortOrder = (resolvedSearchParams.sortOrder as 'asc' | 'desc') || 'desc'
      
      const itemResponse = await getModuleItemWithNavigation(
        resolvedParams.module,
        resolvedParams.id,
        {
          includeNavigation: true,
          sortBy,
          sortOrder
        }
      )
      
      initialData = itemResponse.data
      navigation = itemResponse.navigation
      
      console.log("📊 Edit Page - Navigation data fetched:", {
        hasNavigation: !!navigation,
        navigation,
        moduleSlug: resolvedParams.module,
        itemId: resolvedParams.id
      })
    } catch (error) {
      console.error('Failed to fetch module item:', error)
      notFound()
    }
  }

  // Create validation schema for the module
  const validationSchema = generateZodSchema(moduleWithMultilang.formFields)
  
  // Choose form component based on layout type
  const isWizardForm = module.formLayout === "wizard-vertical" || module.formLayout === "wizard-horizontal";
  const isStudentForm = module.formLayout === "studentForm";
  const isStudentWizardForm = module.formLayout === "studentWizardForm";
  const isStaffWizardForm = module.formLayout === "staffWizardForm";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <FormWithLanguage
        module={moduleWithMultilang}
        action={isCreateMode ? 'create' : 'update'}
        initialData={initialData}
        moduleSlug={resolvedParams.module}
        itemId={isCreateMode ? undefined : resolvedParams.id}
        isWizard={isWizardForm}
        isStudentForm={isStudentForm}
        isStudentWizardForm={isStudentWizardForm}
        isStaffWizardForm={isStaffWizardForm}
        navigation={navigation}
        appId={resolvedParams.appId}
      />
    </div>
  )
}

export async function generateMetadata({ params }: ModuleDetailPageProps) {
  const resolvedParams = await params

  try {
    // 🔒 SECURITY: Check module access for metadata generation
    const { module: fullModule } = await requireModuleAccess(
      resolvedParams.appId,
      resolvedParams.module
    )

    const isCreateMode = resolvedParams.id === 'new'
    const actionType = isCreateMode ? 'Create' : 'Edit'

    return {
      title: `${actionType} ${fullModule.name?.en || fullModule.slug} - Core Dashboard`,
      description: `${actionType} ${fullModule.name?.en || fullModule.slug} details`,
    }
  } catch (error) {
    // If access is denied, return generic metadata
    return {
      title: 'Access Denied',
      description: 'You don\'t have permission to access this module.',
    }
  }
}