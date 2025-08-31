'use client'

import React from 'react'
import type { ModuleSchema } from '@repo/types'

interface WizardDebugInfoProps {
  module: ModuleSchema
  currentStep: number
}

export function WizardDebugInfo({ module, currentStep }: WizardDebugInfoProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const wizardConfig = module.wizardConfig
  const steps = wizardConfig?.steps || []
  const currentStepData = steps[currentStep]

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4 text-xs">
      <h4 className="font-bold mb-2">Wizard Debug Info (Step {currentStep + 1})</h4>
      
      <div className="space-y-2">
        <div>
          <strong>Module:</strong> {module.name?.en || 'Unknown'} ({module.slug})
        </div>
        
        <div>
          <strong>Total Steps:</strong> {steps.length}
        </div>
        
        <div>
          <strong>Current Step Data:</strong>
          <pre className="bg-gray-100 p-1 mt-1 text-xs overflow-auto">
            {JSON.stringify(currentStepData, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>Form Fields ({module.formFields?.length || 0}):</strong>
          <div className="max-h-32 overflow-auto bg-gray-100 p-1 mt-1">
            {module.formFields?.map((field, index) => (
              <div key={index} className="text-xs">
                {index}: {field?.fieldName || 'UNDEFINED'} ({field?.fieldType || 'unknown'})
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <strong>Step Field Names:</strong> {currentStepData?.fields?.join(', ') || 'None'}
        </div>
        
        <div>
          <strong>Matched Fields:</strong>
          {currentStepData?.fields?.map(fieldName => {
            const field = module.formFields?.find(f => f.fieldName === fieldName)
            return (
              <div key={fieldName} className="text-xs ml-2">
                - {fieldName}: {field ? '✓ Found' : '❌ Not Found'}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}