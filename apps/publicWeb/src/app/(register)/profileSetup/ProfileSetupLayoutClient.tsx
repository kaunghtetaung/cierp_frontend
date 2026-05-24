"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { S3Image } from "@/components/common/S3Image";
import { ArrowLeft } from "lucide-react";
import { useTenant } from "@repo/tenant";
import { LangSelectorUI } from "@/components/site-shell/navigation/header/LangSelectorUI";
import { LangSelectorProvider } from "@/feature-components/lang-selector";
import type { Language } from "@/feature-components/lang-selector";

interface ProfileSetupLayoutClientProps {
  children: React.ReactNode;
  initialLanguage?: string;
}

export default function ProfileSetupLayoutClient({
  children,
  initialLanguage = "en",
}: ProfileSetupLayoutClientProps) {
  const router = useRouter();
  const { tenant } = useTenant();

  // Show loading state if tenant is not available yet
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2460B9] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Simple dots pattern (clean and professional for student registration)
  const backgroundPattern = `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.15'/%3E%3C/svg%3E`;

  // Build language array from tenant's langSupport
  const languages: Language[] = (tenant.langSupport || ["en", "mm"]).map((code: string) => {
    const languageMap: Record<string, Language> = {
      en: { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", direction: "ltr" },
      mm: { code: "mm", name: "Myanmar", nativeName: "မြန်မာ", flag: "🇲🇲", direction: "ltr" },
    };
    return languageMap[code] || languageMap.en;
  });

  return (
    <LangSelectorProvider key={initialLanguage} initialLanguage={initialLanguage} languages={languages}>
      <div className="min-h-screen" style={{ backgroundColor: "#e8f0fa" }}>
      {/* Header with pattern */}
      <header
        className="relative z-50"
        style={{
          backgroundColor: "#2460B9",
          backgroundImage: `url("${backgroundPattern}")`,
          backgroundRepeat: "repeat",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Back button */}
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3">
              {tenant.brandInfo?.logoUrl && (
                <div className="relative h-12 w-12">
                  <S3Image
                    src={tenant.brandInfo.logoUrl}
                    alt={tenant.brandInfo.title || "Organization Logo"}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div className="text-white">
                {/* Short name on mobile, full name on md+ */}
                <h1 className="text-xl font-semibold">
                  <span className="md:hidden">
                    {(tenant.displayShortName && tenant.displayShortName[initialLanguage as keyof typeof tenant.displayShortName]) ||
                     (tenant.displayName && tenant.displayName[initialLanguage as keyof typeof tenant.displayName]) ||
                     tenant.brandInfo?.title || "Profile Setup"}
                  </span>
                  <span className="hidden md:inline">
                    {(tenant.displayName && tenant.displayName[initialLanguage as keyof typeof tenant.displayName]) || tenant.brandInfo?.title || "Profile Setup"}
                  </span>
                </h1>
                <p className="text-sm text-blue-100">Student Registration</p>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex items-center">
              <LangSelectorUI
                variant="dropdown"
                showFlag={true}
                showNativeName={true}
                showName={false}
                triggerClassName="text-white hover:text-blue-100 transition-colors"
                contentClassName="!bg-[#1e4f99] border-white/30 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-8">
        {children}
      </main>

      {/* Footer - hidden on mobile */}
      <footer className="hidden sm:block mt-auto border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()}{" "}
            {(tenant.displayName && tenant.displayName[initialLanguage as keyof typeof tenant.displayName]) || tenant.brandInfo?.title || "Organization"}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
    </LangSelectorProvider>
  );
}
