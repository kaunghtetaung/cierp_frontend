'use client'

import React from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { IconComponent } from '@repo/ui'
import { useLanguage } from '@repo/language'
import { getLocalizedText } from '@repo/utils'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter()
  const { currentLanguage } = useLanguage()

  // Log error for debugging and monitoring
  useEffect(() => {
    console.error('Application Error:', error)
    
    // TODO: Report error to monitoring service (Sentry, LogRocket, etc.)
    // reportError(error)
  }, [error])

  const errorMessages = {
    title: {
      en: 'Something went wrong!',
      mm: 'တစ်ခုခု မှားယွင်းနေသည်!'
    },
    description: {
      en: 'An unexpected error has occurred. Please try again or contact support if the problem persists.',
      mm: 'မမျှော်လင့်ထားသော အမှားအယွင်းတစ်ခု ဖြစ်ပွားခဲ့သည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ သို့မဟုတ် ပြဿနာ ဆက်လက်ရှိနေပါက ပံ့ပိုးကူညီမှုကို ဆက်သွယ်ပါ။'
    },
    tryAgain: {
      en: 'Try again',
      mm: 'ထပ်မံကြိုးစားပါ'
    },
    goHome: {
      en: 'Go to Home',
      mm: 'ပင်မစာမျက်နှာသို့ ပြန်သွားပါ'
    },
    contactSupport: {
      en: 'Contact Support',
      mm: 'ပံ့ပိုးကူညီမှုကို ဆက်သွယ်ပါ'
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleContactSupport = () => {
    router.push('/support')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto mb-6 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <IconComponent 
              name="AlertTriangle" 
              className="w-8 h-8 text-destructive"
            />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {getLocalizedText(errorMessages.title, currentLanguage)}
          </h1>

          {/* Error Description */}
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {getLocalizedText(errorMessages.description, currentLanguage)}
          </p>

          {/* Error Details (Development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-muted rounded-lg text-left">
              <h3 className="font-semibold text-sm mb-2">Error Details:</h3>
              <p className="text-xs text-muted-foreground font-mono break-words">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs text-muted-foreground overflow-auto">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={reset} 
              className="w-full"
              size="lg"
            >
              <IconComponent name="RotateCcw" className="w-4 h-4 mr-2" />
              {getLocalizedText(errorMessages.tryAgain, currentLanguage)}
            </Button>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleGoHome}
                className="flex-1"
              >
                <IconComponent name="Home" className="w-4 h-4 mr-2" />
                {getLocalizedText(errorMessages.goHome, currentLanguage)}
              </Button>

              <Button 
                variant="outline" 
                onClick={handleContactSupport}
                className="flex-1"
              >
                <IconComponent name="LifeBuoy" className="w-4 h-4 mr-2" />
                {getLocalizedText(errorMessages.contactSupport, currentLanguage)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}