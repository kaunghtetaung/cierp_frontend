'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormFieldRenderer } from '@/components/forms/FormFieldRenderer'
import { Badge } from '@/components/ui/badge'
import type { FormField } from '@repo/types'

export default function TestPasswordPage() {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'mm'>('en')
  const form = useForm({
    defaultValues: {
      basicPassword: '',
      enhancedPassword: '',
      customConfigPassword: ''
    }
  })

  // Test form fields
  const basicPasswordField: FormField = {
    fieldName: 'basicPassword',
    label: { en: 'Basic Password', mm: 'ရိုးရှင်းသော စကားဝှက်' },
    fieldType: 'password',
    placeHolder: 'Enter basic password',
    validationRule: {
      required: true,
      minLength: 6,
      errorMessage: {
        en: 'Password is required',
        mm: 'စကားဝှက် လိုအပ်သည်'
      }
    }
  }

  const enhancedPasswordField: FormField = {
    fieldName: 'enhancedPassword',
    label: { en: 'Enhanced Password (with strength indicator)', mm: 'အဆင့်မြင့် စကားဝှက် (အင်အားပြသည့်အရာနှင့်)' },
    fieldType: 'password',
    placeHolder: 'Enter password with strength indicator',
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
  }

  const customConfigPasswordField: FormField = {
    fieldName: 'customConfigPassword',
    label: { en: 'Custom Config Password', mm: 'စိတ်ကြိုက်သတ်မှတ်ထားသော စကားဝှက်' },
    fieldType: 'password',
    placeHolder: 'Enter password with custom requirements',
    validationRule: {
      required: true,
      showStrengthIndicator: true,
      strengthMeterConfig: {
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false, // Custom: no special chars required
        showRequirements: true,
        showStrengthMeter: true,
        strengthLabels: {
          weak: { en: 'Too Weak', mm: 'အလွန်အားနည်း' },
          medium: { en: 'Getting Better', mm: 'ပိုကောင်းလာနေသည်' },
          strong: { en: 'Excellent!', mm: 'အလွန်ကောင်းမွန်!' }
        },
        requirementMessages: {
          minLength: { en: 'At least 10 characters long', mm: 'အနည်းဆုံး ၁၀ လုံး ရှိရမည်' },
          uppercase: { en: 'Include uppercase letters (A-Z)', mm: 'စာလုံးကြီးများ (A-Z) ပါဝင်ရမည်' },
          lowercase: { en: 'Include lowercase letters (a-z)', mm: 'စာလုံးသေးများ (a-z) ပါဝင်ရမည်' },
          numbers: { en: 'Include numbers (0-9)', mm: 'ဂဏန်းများ (0-9) ပါဝင်ရမည်' },
          specialChars: { en: 'Special characters (optional)', mm: 'အထူးအက္ခရာများ (မရှိလည်းရသည်)' }
        }
      },
      errorMessage: {
        en: 'Password must meet the requirements shown above',
        mm: 'စကားဝှက်သည် အထက်ပြထားသော လိုအပ်ချက်များနှင့် ကိုက်ညီရမည်'
      }
    }
  }

  const onSubmit = (data: any) => {
    console.log('Form data:', data)
    alert(`Form submitted! Check console for data. Language: ${currentLanguage}`)
  }

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'en' ? 'mm' : 'en')
  }

  const watchValues = form.watch()

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Password Field Testing</h1>
          <p className="text-gray-600 mt-2">
            Testing password fields with and without strength indicators
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            Language: {currentLanguage === 'en' ? 'English' : 'Myanmar'}
          </Badge>
          <Button onClick={toggleLanguage} variant="outline">
            Switch to {currentLanguage === 'en' ? 'Myanmar' : 'English'}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Basic Password Field */}
          <Card>
            <CardHeader>
              <CardTitle>1. Basic Password Field</CardTitle>
              <p className="text-sm text-gray-600">
                Standard password input without strength indicator
              </p>
            </CardHeader>
            <CardContent>
              <FormFieldRenderer 
                field={basicPasswordField} 
                currentLanguage={currentLanguage}
              />
              <div className="mt-2 text-xs text-gray-500">
                Value: "{watchValues.basicPassword}"
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Password Field */}
          <Card>
            <CardHeader>
              <CardTitle>2. Enhanced Password Field</CardTitle>
              <p className="text-sm text-gray-600">
                Password field with default strength indicator and requirements
              </p>
            </CardHeader>
            <CardContent>
              <FormFieldRenderer 
                field={enhancedPasswordField} 
                currentLanguage={currentLanguage}
              />
              <div className="mt-2 text-xs text-gray-500">
                Value: "{watchValues.enhancedPassword}"
              </div>
            </CardContent>
          </Card>

          {/* Custom Configuration Password Field */}
          <Card>
            <CardHeader>
              <CardTitle>3. Custom Configuration Password Field</CardTitle>
              <p className="text-sm text-gray-600">
                Password field with custom requirements (no special characters required, 10 min length)
              </p>
            </CardHeader>
            <CardContent>
              <FormFieldRenderer 
                field={customConfigPasswordField} 
                currentLanguage={currentLanguage}
              />
              <div className="mt-2 text-xs text-gray-500">
                Value: "{watchValues.customConfigPassword}"
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardHeader>
              <CardTitle>Form Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <Button type="submit" className="w-full">
                {currentLanguage === 'en' ? 'Submit Form' : 'ဖောင် ပေးပို့ရန်'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Test Cases:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 mt-2">
              <li>Try typing weak passwords like "123" or "password" in enhanced fields</li>
              <li>Try medium strength passwords like "Password123"</li>
              <li>Try strong passwords like "MySecureP@ss123!"</li>
              <li>Switch between English and Myanmar languages to test localization</li>
              <li>Test the custom configuration field with different requirements</li>
              <li>Verify that the basic field doesn't show strength indicators</li>
              <li>Test form validation on submission</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold">Expected Behavior:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mt-2">
              <li>Real-time strength calculation and visual feedback</li>
              <li>Color-coded progress bars (red/yellow/green)</li>
              <li>Checkmarks for completed requirements</li>
              <li>Proper language switching for all text</li>
              <li>Different requirements for custom configuration</li>
              <li>Password visibility toggle</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}