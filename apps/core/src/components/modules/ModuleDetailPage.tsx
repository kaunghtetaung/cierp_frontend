'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@repo/language'
import { getLocalizedText } from '@repo/utils'
import { Button } from '@repo/ui'
import { IconComponent } from '@repo/ui'
// Server component - data will be passed as props
import { ReactHookForm } from '../forms/ReactHookForm'
import type { ModuleSchema } from '@repo/types'

interface ModuleDetailPageProps {
  module: ModuleSchema
  id?: string // undefined for create mode
  mode: 'create' | 'edit'
  initialData?: any
}

export function ModuleDetailPage({ module, id, mode, initialData }: ModuleDetailPageProps) {
  const router = useRouter()
  const { currentLanguage } = useLanguage()

  const handleSuccess = (data: any) => {
    // Show success message (you can implement toast notifications)
    console.log('Success:', data)
  }

  const handleError = (error: string) => {
    // Show error message (you can implement toast notifications)
    console.error('Error:', error)
  }

  const handleCancel = () => {
    router.push(`/${module.slug}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button 
          onClick={() => router.push(`/${module.slug}`)}
          className="hover:text-foreground transition-colors"
        >
          {getLocalizedText(module.name, currentLanguage)}
        </button>
        <IconComponent name="ChevronRight" className="w-4 h-4" />
        <span>
          {mode === 'create' 
            ? (currentLanguage === 'mm' ? 'အသစ်ထည့်မည်' : 'Create New')
            : (currentLanguage === 'mm' ? 'တည်းဖြတ်မည်' : 'Edit')
          }
        </span>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
          >
            <IconComponent name="ArrowLeft" className="w-4 h-4 mr-2" />
            {currentLanguage === 'mm' ? 'ပြန်သွားမည်' : 'Back'}
          </Button>
        </div>

        {/* Additional Actions */}
        {mode === 'edit' && module.extraActionForms && module.extraActionForms.length > 0 && (
          <div className="flex items-center gap-2">
            {module.extraActionForms.map((action) => (
              <Button
                key={action.actionKey}
                variant="outline"
                size="sm"
                onClick={() => {
                  // Handle extra actions - you can implement modal or navigate to action page
                  console.log('Execute action:', action.actionKey)
                }}
              >
                <IconComponent name={action.iconName} className="w-4 h-4 mr-2" />
                {getLocalizedText(action.title, currentLanguage)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* React Hook Form */}
      <div className="bg-card rounded-lg p-6">
        <ReactHookForm
          module={module}
          action={mode as "create" | "update"}
          initialData={initialData}
          moduleSlug={module.slug}
          itemId={id}
          currentLanguage={currentLanguage}
        />
      </div>
    </div>
  )
}