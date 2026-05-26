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
    <div className="max-w-md mx-auto px-4 sm:px-0 py-6 sm:py-8">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
        {/* Heading */}
        <div className="mb-6 text-center">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
            style={{ backgroundColor: primary }}
          >
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t.signUp}</h2>
          <p className="text-sm text-gray-600 mt-1.5">{t.fillForm}</p>
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
          <p className="text-xs text-center text-gray-500">
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
  );
}
