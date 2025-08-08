'use client'

import React from 'react'
import { ReactHookWizardForm } from '@/components/forms/ReactHookWizardForm'
import type { ModuleSchema } from '@repo/types'

export default function TestWizardPasswordPage() {
  // Mock module schema with wizard steps including password fields
  const mockModule: ModuleSchema = {
    id: 'test-wizard-password',
    name: 'Test Wizard with Password',
    slug: 'test-wizard-password',
    description: 'Testing wizard form with password strength indicators',
    formLayout: 'wizard-vertical',
    fields: [
      // Step 1: Basic Info
      {
        fieldName: 'firstName',
        label: { en: 'First Name', mm: 'အမည်' },
        fieldType: 'text',
        placeHolder: 'Enter your first name',
        stepId: 'personal-info',
        validationRule: {
          required: true,
          errorMessage: {
            en: 'First name is required',
            mm: 'အမည် လိုအပ်သည်'
          }
        }
      },
      {
        fieldName: 'email',
        label: { en: 'Email Address', mm: 'အီးမေးလ်လိပ်စာ' },
        fieldType: 'email',
        placeHolder: 'Enter your email',
        stepId: 'personal-info',
        validationRule: {
          required: true,
          errorMessage: {
            en: 'Valid email is required',
            mm: 'မှန်ကန်သော အီးမေးလ် လိုအပ်သည်'
          }
        }
      },
      
      // Step 2: Password Setup with Strength Indicator
      {
        fieldName: 'password',
        label: { en: 'Create Password', mm: 'စကားဝှက်ဖန်တီးပါ' },
        fieldType: 'password',
        placeHolder: 'Enter a strong password',
        stepId: 'security',
        validationRule: {
          required: true,
          minLength: 8,
          pattern: '^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
          showStrengthIndicator: true,
          errorMessage: {
            en: 'Password must be at least 8 characters long and include letters, numbers, and special characters',
            mm: 'စကားဝှက်သည် အနည်းဆုံး ၈ လုံး ရှိရမည်ပြီး စာလုံးများ၊ ဂဏန်းများနှင့် အထူးအက္ခရာများ ပါဝင်ရမည်'
          }
        }
      },
      {
        fieldName: 'confirmPassword',
        label: { en: 'Confirm Password', mm: 'စကားဝှက်အတည်ပြုပါ' },
        fieldType: 'password',
        placeHolder: 'Re-enter your password',
        stepId: 'security',
        validationRule: {
          required: true,
          minLength: 8,
          showStrengthIndicator: false, // No strength indicator for confirm password
          errorMessage: {
            en: 'Please confirm your password',
            mm: 'စကားဝှက်အတည်ပြုပါ'
          }
        }
      },

      // Step 3: Custom Password with Different Requirements
      {
        fieldName: 'customPassword',
        label: { en: 'Custom Password (Advanced)', mm: 'စိတ်ကြိုက် စကားဝှက် (အဆင့်မြင့်)' },
        fieldType: 'password',
        placeHolder: 'Create a custom password',
        stepId: 'advanced',
        validationRule: {
          required: true,
          showStrengthIndicator: true,
          strengthMeterConfig: {
            minLength: 10,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false, // No special chars required
            showRequirements: true,
            showStrengthMeter: true,
            strengthLabels: {
              weak: { en: 'Too Simple', mm: 'ရိုးရှင်းလွန်းသည်' },
              medium: { en: 'Better', mm: 'ပိုကောင်းသည်' },
              strong: { en: 'Perfect!', mm: 'ပြီးပြည့်စုံသည်!' }
            },
            requirementMessages: {
              minLength: { en: 'At least 10 characters', mm: 'အနည်းဆုံး ၁၀ လုံး' },
              uppercase: { en: 'Uppercase letters (A-Z)', mm: 'စာလုံးကြီးများ (A-Z)' },
              lowercase: { en: 'Lowercase letters (a-z)', mm: 'စာလုံးသေးများ (a-z)' },
              numbers: { en: 'Numbers (0-9)', mm: 'ဂဏန်းများ (0-9)' },
              specialChars: { en: 'Special characters', mm: 'အထူးအက္ခရာများ' }
            }
          },
          errorMessage: {
            en: 'Password must meet custom requirements',
            mm: 'စကားဝှက်သည် စိတ်ကြိုက်လိုအပ်ချက်များနှင့် ကိုက်ညီရမည်'
          }
        }
      },
      {
        fieldName: 'notes',
        label: { en: 'Additional Notes', mm: 'ထပ်တိုးမှတ်ချက်များ' },
        fieldType: 'textArea',
        placeHolder: 'Any additional notes...',
        stepId: 'advanced',
        rows: 3,
        validationRule: {
          required: false,
          errorMessage: {
            en: 'Notes are optional',
            mm: 'မှတ်ချက်များသည် ရွေးချယ်ခွင့်ရှိသည်'
          }
        }
      }
    ],
    wizardConfig: {
      steps: [
        {
          id: 'personal-info',
          stepKey: 'personal-info',
          title: { en: 'Personal Information', mm: 'ကိုယ်ရေးကိုယ်တာအချက်အလက်များ' },
          description: { en: 'Enter your basic information', mm: 'သင့်၏ အခြေခံအချက်အလက်များကို ဖြည့်စွက်ပါ' },
          icon: 'User',
          order: 1,
          fields: ['firstName', 'email']
        },
        {
          id: 'security',
          stepKey: 'security',
          title: { en: 'Security Setup', mm: 'လုံခြုံရေးတပ်ဆင်မှု' },
          description: { en: 'Create a secure password', mm: 'လုံခြုံသော စကားဝှက်ဖန်တီးပါ' },
          icon: 'Lock',
          order: 2,
          fields: ['password', 'confirmPassword']
        },
        {
          id: 'advanced',
          stepKey: 'advanced',
          title: { en: 'Advanced Options', mm: 'အဆင့်မြင့် ရွေးချယ်စရာများ' },
          description: { en: 'Additional configuration options', mm: 'ထပ်တိုးသတ်မှတ်ချက် ရွေးချယ်စရာများ' },
          icon: 'Settings',
          order: 3,
          fields: ['customPassword', 'notes']
        }
      ]
    }
  }

  const handleFormSubmit = (data: any) => {
    console.log('Wizard form submitted:', data)
    alert('Wizard form submitted successfully! Check console for data.')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Wizard Form with Password Strength Indicators</h1>
          <p className="text-gray-600 mb-6">
            This test demonstrates password strength indicators working within wizard forms. 
            Each step shows different password field configurations.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Test Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li><strong>Step 1:</strong> Fill in basic information</li>
              <li><strong>Step 2:</strong> Create password with default strength indicator</li>
              <li><strong>Step 3:</strong> Create custom password with relaxed requirements (no special chars needed)</li>
              <li>Notice how different password fields have different requirements and visual indicators</li>
              <li>Try weak, medium, and strong passwords to see real-time feedback</li>
            </ol>
          </div>
        </div>

        <ReactHookWizardForm
          module={mockModule}
          action="create"
          moduleSlug="test-wizard-password"
          currentLanguage="en"
          // onSubmit={handleFormSubmit}
        />
      </div>
    </div>
  )
}