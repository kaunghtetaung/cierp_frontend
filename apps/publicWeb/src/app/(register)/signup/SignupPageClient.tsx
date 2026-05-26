"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { SignupForm } from "./components/SignupForm";
import { translations } from "./translations";
import type { TenantSettings } from "@repo/types";
import { useLangSelector } from "@/feature-components/lang-selector";

interface SignupPageClientProps {
  tenantSettings: TenantSettings | null;
  initialLang: string;
}

/**
 * Signup page content — chrome (logo, tenant name, lang switcher,
 * back arrow, footer) is supplied by the outer `(register)/layout` →
 * `AuthShell`. This file owns only the form card.
 *
 * Tenant brand colours come through `var(--color-primary)` (set on
 * the AuthShell root via `.theme-<name>.theme-variant-<v>`). Hex
 * fallback only kicks in for theme-less environments.
 */
export function SignupPageClient({
  tenantSettings,
  initialLang,
}: SignupPageClientProps) {
  // AuthShell owns the LangSelectorProvider. Reading the live
  // currentLanguage means switching languages in the header updates
  // the signup form copy without a page reload.
  const { currentLanguage } = useLangSelector();
  const currentLang =
    (currentLanguage as "en" | "mm") || (initialLang as "en" | "mm") || "en";
  const t = translations[currentLang] || translations.en;

  const primary = "var(--color-primary, #2460B9)";

  return (
    <div className="max-w-md mx-auto px-4 sm:px-0 py-8 sm:py-12">
      {/* Floating avatar overlapping the card top — small visual flourish
          that ties the brand colour into the card without dominating it. */}
      <div className="relative">
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg ring-4 ring-white"
          style={{ backgroundColor: primary }}
        >
          <UserPlus className="w-7 h-7 text-white" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 pt-10 pb-7 px-6 sm:px-8">
          {/* Heading */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t.signUp}
            </h2>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
              {t.fillForm}
            </p>
          </div>

        <SignupForm
          tenantId={tenantSettings?.id}
          language={currentLang}
          translations={t}
        />

        {/* Sign-in link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          {t.alreadyHaveAccount}{" "}
          <Link
            href="/login"
            className="font-medium hover:underline"
            style={{ color: primary }}
          >
            {t.signIn}
          </Link>
        </p>

        {/* Terms */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-[11px] text-center text-gray-400 leading-relaxed">
            {t.agreementText}{" "}
            <Link
              href="/terms"
              className="hover:underline"
              style={{ color: primary }}
            >
              {t.termsOfService}
            </Link>{" "}
            {t.and}{" "}
            <Link
              href="/privacy"
              className="hover:underline"
              style={{ color: primary }}
            >
              {t.privacyPolicy}
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
