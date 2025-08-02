'use client'

import React from 'react'

interface LoadingStep {
  en: string
  mm?: string
}

interface LoadingPageProps {
  title?: { en: string; mm?: string }
  description?: { en: string; mm?: string }
  steps?: LoadingStep[]
  currentLanguage?: string
  showProgress?: boolean
}

/**
 * Reusable loading page component for dashboard applications
 * Provides consistent loading experience across different dashboard apps
 */
export function DashboardLoadingPage({
  title = { en: 'Loading...', mm: 'ရယူနေသည်...' },
  description = { en: 'Please wait while we prepare your content.', mm: 'သင့်အတွက် အကြောင်းအရာများ ပြင်ဆင်နေချိန်တွင် ကျေးဇူးပြု၍ စောင့်ဆိုင်းပါ။' },
  steps = [
    { en: 'Connecting to server...', mm: 'ဆာဗာသို့ ချိတ်ဆက်နေသည်...' },
    { en: 'Loading your data...', mm: 'သင့်ဒေတာများ ရယူနေသည်...' },
    { en: 'Preparing interface...', mm: 'အင်တာဖေ့စ် ပြင်ဆင်နေသည်...' }
  ],
  currentLanguage = 'en',
  showProgress = true
}: LoadingPageProps) {
  const [currentStep, setCurrentStep] = React.useState(0)

  React.useEffect(() => {
    if (!showProgress || steps.length === 0) return

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [steps.length, showProgress])

  const getLocalizedText = (text: { en: string; mm?: string }) => {
    return currentLanguage === 'mm' && text.mm ? text.mm : text.en
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-sm w-full mx-auto p-6">
        <div className="text-center">
          {/* Loading Animation */}
          <div className="relative mb-8">
            {/* Outer ring */}
            <div className="mx-auto w-20 h-20 rounded-full border-4 border-muted"></div>
            
            {/* Spinning ring */}
            <div className="absolute inset-0 mx-auto w-20 h-20 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
            
            {/* Inner pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Loading Title */}
          <h1 className="text-2xl font-semibold text-foreground mb-3">
            {getLocalizedText(title)}
          </h1>

          {/* Loading Description */}
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {getLocalizedText(description)}
          </p>

          {/* Progress Steps */}
          {showProgress && steps.length > 0 && (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                    index === currentStep 
                      ? 'text-primary font-medium' 
                      : index < currentStep 
                        ? 'text-muted-foreground opacity-50' 
                        : 'text-muted-foreground opacity-30'
                  }`}
                >
                  {/* Step Icon */}
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-500 ${
                    index === currentStep 
                      ? 'border-primary bg-primary/10' 
                      : index < currentStep 
                        ? 'border-muted-foreground bg-muted' 
                        : 'border-muted'
                  }`}>
                    {index < currentStep && (
                      <div className="w-3 h-3 text-muted-foreground m-0.5">✓</div>
                    )}
                    {index === currentStep && (
                      <div className="w-1.5 h-1.5 bg-primary rounded-full m-1.5 animate-pulse"></div>
                    )}
                  </div>

                  {/* Step Text */}
                  <span>
                    {getLocalizedText(step)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          {showProgress && steps.length > 0 && (
            <div className="mt-8">
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700 ease-out rounded-full"
                  style={{
                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% {currentLanguage === 'mm' ? 'ပြီးစီး' : 'Complete'}
              </p>
            </div>
          )}

          {/* Security indicator */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3">🔒</div>
              <span>
                {currentLanguage === 'mm' 
                  ? 'လုံခြုံစိတ်ချရသော ချိတ်ဆက်မှု' 
                  : 'Secure Connection'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardLoadingPage