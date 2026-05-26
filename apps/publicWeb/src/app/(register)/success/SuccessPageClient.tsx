"use client";

import { Mail, CheckCircle, Home, LogIn } from 'lucide-react';
import Link from 'next/link';
import type { TenantSettings } from "@repo/types";

interface SuccessPageClientProps {
  tenantSettings: TenantSettings | null;
  initialLang: string;
  email: string;
}

export function SuccessPageClient({ 
  tenantSettings, 
  initialLang,
  email 
}: SuccessPageClientProps) {
  const lang = initialLang as 'en' | 'mm' || 'en';
  
  const translations = {
    en: {
      pageTitle: 'Account Created Successfully!',
      pageSubtitle: 'Please verify your email to continue',
      emailSent: "We've sent a verification email to",
      checkInbox: 'Please check your inbox and click the verification link to activate your account.',
      whatNext: 'What happens next?',
      step1Text: 'Check your email inbox',
      step2Text: 'Click the verification link in the email',
      step3Text: 'Your account will be activated',
      step4Text: 'You can then sign in with your credentials',
      didntReceive: "Didn't receive the email?",
      checkSpam: 'Check your spam or junk folder',
      waitFew: 'Wait a few minutes and refresh your inbox',
      contactSupport: 'Contact support if you still have issues',
      goToLogin: 'Go to Login',
      backToHomeBtn: 'Back to Home'
    },
    mm: {
      pageTitle: 'အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါပြီ!',
      pageSubtitle: 'ဆက်လက်ရန် သင့်အီးမေးလ်ကို အတည်ပြုပါ',
      emailSent: 'အတည်ပြုရန် အီးမေးလ်ကို ပို့ပြီးပါပြီ',
      checkInbox: 'သင့်အီးမေးလ်ကို စစ်ဆေးပြီး အတည်ပြုလင့်ခ်ကို နှိပ်၍ သင့်အကောင့်ကို အသက်သွင်းပါ။',
      whatNext: 'နောက်ဘာလုပ်ရမလဲ?',
      step1Text: 'သင့်အီးမေးလ် inbox ကို စစ်ဆေးပါ',
      step2Text: 'အီးမေးလ်ထဲက အတည်ပြုလင့်ခ်ကို နှိပ်ပါ',
      step3Text: 'သင့်အကောင့်ကို အသက်သွင်းပါမည်',
      step4Text: 'ထို့နောက် သင့်အချက်အလက်များဖြင့် ဝင်ရောက်နိုင်ပါပြီ',
      didntReceive: 'အီးမေးလ် မရရှိဘူးလား?',
      checkSpam: 'Spam သို့မဟုတ် Junk ဖိုင်ဒါကို စစ်ဆေးပါ',
      waitFew: 'မိနစ်အနည်းငယ်စောင့်ပြီး inbox ကို refresh လုပ်ပါ',
      contactSupport: 'ပြဿနာရှိနေသေးလျှင် ပံ့ပိုးမှုအဖွဲ့ကို ဆက်သွယ်ပါ',
      goToLogin: 'Login စာမျက်နှာသို့',
      backToHomeBtn: 'ပင်မစာမျက်နှာသို့'
    }
  };
  
  const t = translations[lang];

  return (
    <div className="flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg animate-fadeIn">
        {/* Chrome (back arrow, tenant logo/name, lang switcher, footer)
            is provided by the outer `(register)/layout` → AuthShell. */}

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-b from-gray-50 to-white px-8 py-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              {t.pageTitle}
            </h1>
            <p className="text-sm text-gray-600 text-center mt-2">
              {t.pageSubtitle}
            </p>
          </div>

          {/* Content */}
          <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Email Section */}
            <div className="text-center space-y-2">
              <p className="text-gray-600">{t.emailSent}</p>
              <p className="text-xl font-semibold text-gray-900">{email}</p>
              <p className="text-sm text-gray-500">{t.checkInbox}</p>
            </div>


            {/* Didn't Receive Section */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 mb-2">{t.didntReceive}</h4>
              <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                <li>{t.checkSpam}</li>
                <li>{t.waitFew}</li>
                <li>{t.contactSupport}</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center pt-2">
              <Link 
                href="/login" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {t.goToLogin}
              </Link>
              
              <Link 
                href="/" 
                className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                {t.backToHomeBtn}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}