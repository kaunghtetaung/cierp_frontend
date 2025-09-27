'use client'

import React from 'react'
import { DashboardLoadingPage } from '@repo/base-dashboard'

export default function Loading() {
  // Use default language since loading happens before providers are available
  const currentLanguage = "en"

  const loadingMessages = {
    title: {
      en: 'Loading Core Dashboard...',
      mm: 'ကို အား ဒက်ရှ်ဘုတ် ရယူနေသည်...'
    },
    description: {
      en: 'Please wait while we prepare your core dashboard content.',
      mm: 'သင့်အတွက် ကို အား ဒက်ရှ်ဘုတ် အကြောင်းအရာများ ပြင်ဆင်နေချိန်တွင် ကျေးဇူးပြု၍ စောင့်ဆိုင်းပါ။'
    },
    loadingSteps: [
      {
        en: 'Connecting to core services...',
        mm: 'ကို အား ဝန်ဆောင်မှုများသို့ ချိတ်ဆက်နေသည်...'
      },
      {
        en: 'Loading dashboard data...',
        mm: 'ဒက်ရှ်ဘုတ် ဒေတာများ ရယူနေသည်...'
      },
      {
        en: 'Preparing core interface...',
        mm: 'ကို အား အင်တာဖေ့စ် ပြင်ဆင်နေသည်...'
      }
    ]
  }

  return (
    <DashboardLoadingPage
      title={loadingMessages.title}
      description={loadingMessages.description}
      steps={loadingMessages.loadingSteps}
      currentLanguage={currentLanguage}
      showProgress={true}
    />
  )
}