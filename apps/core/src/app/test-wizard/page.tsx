'use client'

import React from 'react'
import { ReactHookWizardFormWrapper } from '@/components/forms/ReactHookWizardFormWrapper'
import { sampleWizardModule } from '@/lib/sample-wizard-module'
import { WizardErrorBoundary } from '@/components/debug/WizardErrorBoundary'

export default function TestWizardPage() {
  console.log('🏁 Test Wizard Page - sampleWizardModule:', {
    module: sampleWizardModule,
    id: sampleWizardModule.id,
    name: sampleWizardModule.name,
    formFieldsLength: sampleWizardModule.formFields?.length || 0,
    wizardConfig: sampleWizardModule.wizardConfig ? 'present' : 'missing',
    wizardStepsCount: sampleWizardModule.wizardConfig?.steps?.length || 0
  });

  console.log('🏁 Test Wizard Page - About to render ReactHookWizardFormWrapper');

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Wizard Form</h1>
      
      <div style={{ border: '2px solid red', padding: '10px', margin: '10px' }}>
        <p>Debug: Wrapper container</p>
        <WizardErrorBoundary>
          <ReactHookWizardFormWrapper
            module={sampleWizardModule}
            action="create"
            moduleSlug="test-wizard"
          />
        </WizardErrorBoundary>
      </div>

      <div style={{ border: '2px solid blue', padding: '10px', margin: '10px' }}>
        <p>Debug: Module info</p>
        <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px' }}>
          Module ID: {sampleWizardModule.id}
          Module Name: {JSON.stringify(sampleWizardModule.name)}
          Form Fields Count: {sampleWizardModule.formFields?.length || 0}
          Wizard Config Present: {sampleWizardModule.wizardConfig ? 'Yes' : 'No'}
          Wizard Steps Count: {sampleWizardModule.wizardConfig?.steps?.length || 0}
        </pre>
      </div>
    </div>
  )
}