'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { IconComponent } from '@repo/ui'
import { useLanguage } from '@repo/language'
import { getLocalizedText } from '@repo/utils'

export default function NotFound() {
  const router = useRouter()
  const { currentLanguage } = useLanguage()

  const notFoundMessages = {
    title: {
      en: 'Page Not Found',
      mm: 'စာမျက်နှာ မတွေ့ရှိပါ'
    },
    description: {
      en: "The page you're looking for doesn't exist or has been moved. Please check the URL or navigate back to a safe page.",
      mm: 'သင်ရှာဖွေနေသော စာမျက်နှာမှာ မရှိပါ သို့မဟုတ် ရွေ့ပြောင်းထားပါသည်။ ကျေးဇူးပြု၍ URL ကို စစ်ဆေးပါ သို့မဟုတ် ဘေးကင်းသော စာမျက်နှာသို့ ပြန်သွားပါ။'
    },
    goHome: {
      en: 'Go to Home',
      mm: 'ပင်မစာမျက်နှာသို့ သွားပါ'
    },
    goBack: {
      en: 'Go Back',
      mm: 'ပြန်သွားပါ'
    },
    searchSite: {
      en: 'Search Site',
      mm: 'ဆိုက်တွင် ရှာဖွေပါ'
    }
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const handleSearch = () => {
    router.push('/search')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          {/* 404 Icon */}
          <div className="mx-auto mb-6 w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <IconComponent 
              name="FileQuestion" 
              className="w-10 h-10 text-muted-foreground"
            />
          </div>

          {/* Large 404 Text */}
          <div className="text-6xl font-bold text-muted-foreground mb-4">
            404
          </div>

          {/* Not Found Title */}
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {getLocalizedText(notFoundMessages.title, currentLanguage)}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {getLocalizedText(notFoundMessages.description, currentLanguage)}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              asChild
              className="w-full"
              size="lg"
            >
              <Link href="/">
                <IconComponent name="Home" className="w-4 h-4 mr-2" />
                {getLocalizedText(notFoundMessages.goHome, currentLanguage)}
              </Link>
            </Button>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleGoBack}
                className="flex-1"
              >
                <IconComponent name="ArrowLeft" className="w-4 h-4 mr-2" />
                {getLocalizedText(notFoundMessages.goBack, currentLanguage)}
              </Button>

              <Button 
                variant="outline" 
                onClick={handleSearch}
                className="flex-1"
              >
                <IconComponent name="Search" className="w-4 h-4 mr-2" />
                {getLocalizedText(notFoundMessages.searchSite, currentLanguage)}
              </Button>
            </div>
          </div>

          {/* Helpful Links */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              {currentLanguage === 'mm' ? 'အသုံးဝင်သော လင့်များ' : 'Helpful Links'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  {currentLanguage === 'mm' ? 'ဒက်ရှ်ဘုတ်' : 'Dashboard'}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/support">
                  {currentLanguage === 'mm' ? 'အကူအညီ' : 'Support'}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/faq">
                  {currentLanguage === 'mm' ? 'မေးခွန်းများ' : 'FAQ'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}