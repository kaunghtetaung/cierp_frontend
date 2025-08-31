import { notFound } from 'next/navigation'
import { fetchLayoutData } from '@/lib/layout-data'
import { getModuleItem } from '@repo/app-modules'
import { submitModuleForm } from '@repo/app-modules/server-actions'
import { FormWithLanguage } from '@/components/forms/FormWithLanguage'
import { generateZodSchema } from '@/lib/form-schema'
import { enableCommonMultilangFields } from '@/lib/enable-multilang'
import type { ModuleSchema } from '@repo/types'

interface ModuleDetailPageProps {
  params: Promise<{
    module: string
    id: string
  }>
}

export default async function ModuleDetail({ params }: ModuleDetailPageProps) {
  const { appSchemaData } = await fetchLayoutData()
  const resolvedParams = await params
  
  if (!appSchemaData?.modules) {
    notFound()
  }

  // Find the module by slug
  const module = appSchemaData.modules.find(
    (mod: ModuleSchema) => mod.slug === resolvedParams.module
  )

  if (!module) {
    notFound()
  }

  // Enable multilanguage support for common fields
  const moduleWithMultilang = enableCommonMultilangFields(module);

  const isCreateMode = resolvedParams.id === 'new'

  // Fetch initial data for edit mode
  let initialData = null
  if (!isCreateMode) {
    try {
      initialData = await getModuleItem(resolvedParams.module, resolvedParams.id)
    } catch (error) {
      console.error('Failed to fetch module item:', error)
      notFound()
    }
  }

  // Create validation schema for the module
  const validationSchema = generateZodSchema(moduleWithMultilang.formFields)
  
  // Choose form component based on layout type
  const isWizardForm = module.formLayout === "wizard-vertical" || module.formLayout === "wizard-horizontal";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <FormWithLanguage
        module={moduleWithMultilang}
        action={isCreateMode ? 'create' : 'update'}
        initialData={initialData}
        moduleSlug={resolvedParams.module}
        itemId={isCreateMode ? undefined : resolvedParams.id}
        isWizard={isWizardForm}
      />
    </div>
  )
}

export async function generateMetadata({ params }: ModuleDetailPageProps) {
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

  return {
    title: `${module.name.en} Details - Core Dashboard`,
    description: `View and manage ${module.name.en.toLowerCase()} details`
  }
}