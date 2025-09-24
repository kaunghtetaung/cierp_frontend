"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, UserPlus, FileText, CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import { SignupForm } from "./components/SignupForm";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { translations } from "./translations";
import type { TenantSettings } from "@repo/types";

interface SignupPageClientProps {
  tenantSettings: TenantSettings | null;
  initialLang: string;
}

export function SignupPageClient({ tenantSettings, initialLang }: SignupPageClientProps) {
  const [currentLang, setCurrentLang] = useState<'en' | 'mm'>(initialLang as 'en' | 'mm' || 'en');
  const t = translations[currentLang];

  // Get tenant info with language support
  const getOrgName = () => {
    if (tenantSettings?.brandInfo?.title) return tenantSettings.brandInfo.title;
    if (tenantSettings?.displayName) {
      return currentLang === 'mm' && tenantSettings.displayName.mm 
        ? tenantSettings.displayName.mm 
        : tenantSettings.displayName.en || "Your Organization";
    }
    return "Your Organization";
  };

  const getOrgTagline = () => {
    if (tenantSettings?.brandInfo?.subTitle) return tenantSettings.brandInfo.subTitle;
    if (tenantSettings?.localizedDescription) {
      return currentLang === 'mm' && tenantSettings.localizedDescription.mm
        ? tenantSettings.localizedDescription.mm
        : tenantSettings.localizedDescription.en || t.empoweringInnovation;
    }
    return t.empoweringInnovation;
  };

  const orgName = getOrgName();
  const orgTagline = getOrgTagline();

  const handleLanguageChange = async (lang: string) => {
    setCurrentLang(lang as 'en' | 'mm');
    document.cookie = `x-lang=${lang}; path=/; max-age=${365 * 24 * 60 * 60}`;
  };

  const steps = [
    { 
      icon: UserPlus, 
      label: t.step1, 
      title: t.createAccountStep, 
      desc: t.createAccountDesc,
      current: true 
    },
    { 
      icon: Mail, 
      label: t.step2, 
      title: t.completeProfile, 
      desc: t.completeProfileDesc,
      current: false 
    },
    { 
      icon: FileText, 
      label: t.step3, 
      title: t.adminApproval, 
      desc: t.adminApprovalDesc,
      current: false 
    },
    { 
      icon: CheckCircle, 
      label: t.step4, 
      title: t.welcomeEmail, 
      desc: t.welcomeEmailDesc,
      current: false 
    },
  ];

  return (
    <div className="min-h-screen h-screen overflow-hidden bg-gray-50 flex">
      <div className="w-full flex">
        {/* Left Panel - Branding (40% on large screens) */}
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Animated Gradient Orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-delayed" />

          <div className="relative z-10 flex flex-col justify-between p-12 text-white">
            {/* Header */}
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">{t.backToHome}</span>
              </Link>
              
              {/* Organization Info */}
              <div className="flex items-start gap-4 mb-12">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{orgName}</h1>
                  <p className="text-blue-100">{orgTagline}</p>
                </div>
              </div>
            </div>

            {/* Registration Steps */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t.registrationJourney}</h2>
              
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="flex gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        step.current 
                          ? 'bg-white text-blue-600' 
                          : 'bg-white/20 text-white/60'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-blue-100 mb-1">{step.label}</div>
                        <h3 className={`font-semibold mb-1 ${
                          step.current ? 'text-white' : 'text-white/60'
                        }`}>{step.title}</h3>
                        <p className={`text-sm ${
                          step.current ? 'text-blue-100' : 'text-white/40'
                        }`}>{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div /> {/* Spacer */}
          </div>
        </div>

        {/* Right Panel - Form (60% on large screens, 100% on mobile) */}
        <div className="flex-1 lg:w-3/5 flex flex-col">
          {/* Form Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{t.signUp}</h2>
                  <p className="text-sm text-gray-600 mt-1">{t.fillForm}</p>
                </div>
              </div>
              <LanguageSwitcher 
                currentLang={currentLang}
                onLanguageChange={handleLanguageChange}
              />
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-8 py-8">
            {/* Mobile Header */}
            <div className="lg:hidden mb-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">{orgName}</h1>
            </div>

            <div className="max-w-md mx-auto">
              <SignupForm 
                tenantId={tenantSettings?.id}
                language={currentLang}
                translations={t}
              />

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              {/* Sign In Link */}
              <p className="text-center text-sm text-gray-600">
                {t.alreadyHaveAccount}{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  {t.signIn}
                </Link>
              </p>

              {/* Footer */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">
                  {t.agreementText}{" "}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                    {t.termsOfService}
                  </Link>{" "}
                  {t.and}{" "}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                    {t.privacyPolicy}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}