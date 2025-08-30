'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IconComponent } from '@repo/ui/components/icons'
import { MultilingualErrorBoundary } from './MultilingualErrorBoundary'
import { useLanguage } from '@repo/language'
import { getLocalizedErrorMessage } from '@repo/api/messages'

// Component that throws different types of errors for testing
function ErrorThrowingComponent({ errorType }: { errorType: string }) {
  React.useEffect(() => {
    // Simulate different error types
    switch (errorType) {
      case 'component':
        throw new Error('Component rendering failed')
      case 'network':
        const networkError = new Error('Failed to fetch data from server')
        networkError.name = 'TypeError'
        throw networkError
      case 'chunk':
        const chunkError = new Error('Loading chunk 0 failed')
        chunkError.name = 'ChunkLoadError'
        throw chunkError
      case 'validation':
        throw new Error('Form validation failed')
      default:
        throw new Error('Unknown error occurred')
    }
  }, [errorType])

  return <div>This component will throw an error</div>
}

// Form component for testing form errors
function TestFormComponent({ shouldError }: { shouldError: boolean }) {
  if (shouldError) {
    throw new Error('Form submission failed due to validation errors')
  }
  
  return (
    <div className="p-4 border border-green-200 rounded-lg bg-green-50">
      <p className="text-green-800 text-sm">Form loaded successfully!</p>
    </div>
  )
}

// Data loading component for testing data errors
function TestDataComponent({ shouldError }: { shouldError: boolean }) {
  if (shouldError) {
    const dataError = new Error('Failed to load user data')
    dataError.name = 'DataLoadError'
    throw dataError
  }
  
  return (
    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
      <p className="text-blue-800 text-sm">Data loaded successfully!</p>
    </div>
  )
}

/**
 * Component for testing multilingual error boundaries
 * This should only be used in development/testing environments
 */
export function ErrorTestComponent() {
  const { currentLanguage, switchLanguage } = useLanguage()
  const [activeTest, setActiveTest] = useState<string | null>(null)

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  const testCases = [
    {
      id: 'component',
      title: currentLanguage === 'mm' ? 'ကွန်ပိုနင့် အမှား' : 'Component Error',
      description: currentLanguage === 'mm' 
        ? 'ကွန်ပိုနင့် ရန်ဒါရင်း အမှားကို စမ်းသပ်မည်'
        : 'Test component rendering error',
      context: 'component'
    },
    {
      id: 'network',
      title: currentLanguage === 'mm' ? 'ကွန်ယက် အမှား' : 'Network Error',
      description: currentLanguage === 'mm' 
        ? 'ကွန်ယက် ချိတ်ဆက်မှု အမှားကို စမ်းသပ်မည်'
        : 'Test network connection error',
      context: 'data'
    },
    {
      id: 'chunk',
      title: currentLanguage === 'mm' ? 'ကုဒ် တင်ခြင်း အမှား' : 'Chunk Load Error',
      description: currentLanguage === 'mm' 
        ? 'JavaScript chunk တင်ခြင်း အမှားကို စမ်းသပ်မည်'
        : 'Test JavaScript chunk loading error',
      context: 'component'
    },
    {
      id: 'form',
      title: currentLanguage === 'mm' ? 'ဖောင် အမှား' : 'Form Error',
      description: currentLanguage === 'mm' 
        ? 'ဖောင် တင်သွင်းခြင်း အမှားကို စမ်းသပ်မည်'
        : 'Test form submission error',
      context: 'form'
    },
    {
      id: 'data',
      title: currentLanguage === 'mm' ? 'ဒေတာ အမှား' : 'Data Error',
      description: currentLanguage === 'mm' 
        ? 'ဒေတာ တင်ခြင်း အမှားကို စမ်းသပ်မည်'
        : 'Test data loading error',
      context: 'data'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent name="Bug" className="w-5 h-5 text-destructive" />
            {currentLanguage === 'mm' 
              ? 'Multilingual Error Boundary စမ်းသပ်ခြင်း'
              : 'Multilingual Error Boundary Testing'
            }
          </CardTitle>
          <CardDescription>
            {currentLanguage === 'mm' 
              ? 'မတူညီသော အမှားအယွင်း အမျိုးအစားများကို စမ်းသပ်ရန် အောက်ပါ ခလုတ်များကို နှိပ်ပါ'
              : 'Click the buttons below to test different error scenarios in both languages'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Switcher */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">
              {currentLanguage === 'mm' ? 'ဘာသာစကား:' : 'Language:'}
            </span>
            <Button
              variant={currentLanguage === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => switchLanguage('en')}
            >
              English
            </Button>
            <Button
              variant={currentLanguage === 'mm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => switchLanguage('mm')}
            >
              မြန်မာ
            </Button>
          </div>

          {/* Test Case Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {testCases.map((testCase) => (
              <Button
                key={testCase.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start text-left"
                onClick={() => setActiveTest(testCase.id)}
              >
                <div className="font-semibold text-sm mb-1">{testCase.title}</div>
                <div className="text-xs text-muted-foreground">{testCase.description}</div>
              </Button>
            ))}
          </div>

          {/* Clear Test Button */}
          {activeTest && (
            <Button
              variant="secondary"
              onClick={() => setActiveTest(null)}
              className="w-full"
            >
              <IconComponent name="RotateCcw" className="w-4 h-4 mr-2" />
              {currentLanguage === 'mm' ? 'စမ်းသပ်မှုကို ရှင်းလင်းမည်' : 'Clear Test'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Error Test Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Component Error Test */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {currentLanguage === 'mm' ? 'ကွန်ပိုနင့် အမှား စမ်းသပ်ခြင်း' : 'Component Error Test'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MultilingualErrorBoundary 
              language={currentLanguage as 'en' | 'mm'}
              errorContext="component"
            >
              {activeTest && ['component', 'network', 'chunk'].includes(activeTest) ? (
                <ErrorThrowingComponent errorType={activeTest} />
              ) : (
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <p className="text-green-800 text-sm">
                    {currentLanguage === 'mm' 
                      ? 'ကွန်ပိုနင့် အဆင်ပြေစွာ တင်ပြနေသည်!'
                      : 'Component loaded successfully!'
                    }
                  </p>
                </div>
              )}
            </MultilingualErrorBoundary>
          </CardContent>
        </Card>

        {/* Form Error Test */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {currentLanguage === 'mm' ? 'ဖောင် အမှား စမ်းသပ်ခြင်း' : 'Form Error Test'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MultilingualErrorBoundary 
              language={currentLanguage as 'en' | 'mm'}
              errorContext="form"
            >
              <TestFormComponent shouldError={activeTest === 'form'} />
            </MultilingualErrorBoundary>
          </CardContent>
        </Card>

        {/* Data Error Test */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {currentLanguage === 'mm' ? 'ဒေတာ အမှား စမ်းသပ်ခြင်း' : 'Data Error Test'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MultilingualErrorBoundary 
              language={currentLanguage as 'en' | 'mm'}
              errorContext="data"
            >
              <TestDataComponent shouldError={activeTest === 'data'} />
            </MultilingualErrorBoundary>
          </CardContent>
        </Card>

        {/* API Error Simulation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {currentLanguage === 'mm' ? 'API အမှား စမ်းသပ်ခြင်း' : 'API Error Test'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-sm text-blue-800 mb-2">
                  {currentLanguage === 'mm' ? 'နမူနာ API အမှားများ:' : 'Sample API Errors:'}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <IconComponent name="AlertCircle" className="w-3 h-3 text-destructive" />
                    <span className="font-mono">NETWORK_CONNECTION_FAILED:</span>
                    <span>{getLocalizedErrorMessage('NETWORK_CONNECTION_FAILED', currentLanguage as 'en' | 'mm')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconComponent name="AlertCircle" className="w-3 h-3 text-destructive" />
                    <span className="font-mono">SESSION_EXPIRED:</span>
                    <span>{getLocalizedErrorMessage('SESSION_EXPIRED', currentLanguage as 'en' | 'mm')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconComponent name="AlertCircle" className="w-3 h-3 text-destructive" />
                    <span className="font-mono">INSUFFICIENT_PERMISSIONS:</span>
                    <span>{getLocalizedErrorMessage('INSUFFICIENT_PERMISSIONS', currentLanguage as 'en' | 'mm')}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ErrorTestComponent