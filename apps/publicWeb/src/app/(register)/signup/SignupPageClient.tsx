"use client";

import { UserPlus, Mail, FileText, CheckCircle } from "lucide-react";
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
 * `AuthShell`. This file owns only the form card + the four-step
 * registration journey hint.
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

  // Use a CSS variable for the brand colour so um1 (cardinal),
  // um1-blue, UDM-blue, etc. all light up automatically.
  const primary = "var(--color-primary, #2460B9)";

  const steps = [
    { icon: UserPlus, label: t.step1, title: t.createAccountStep, current: true },
    { icon: Mail, label: t.step2, title: t.completeProfile, current: false },
    { icon: FileText, label: t.step3, title: t.adminApproval, current: false },
    { icon: CheckCircle, label: t.step4, title: t.welcomeEmail, current: false },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0 py-6 sm:py-2">
      {/* Step ribbon — communicates the 4-stage signup → verify →
          approval → welcome journey so users aren't surprised when
          the form leads to a profile-setup popup later. */}
      <ol className="hidden sm:flex items-center justify-between gap-2 mb-8">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center text-center min-w-0 flex-1">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                  style={
                    s.current
                      ? { backgroundColor: primary, color: "#FFFFFF" }
                      : { backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", color: "#9CA3AF" }
                  }
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500">
                  {s.label}
                </div>
                <div
                  className={`text-xs font-medium truncate w-full ${
                    s.current ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {s.title}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="h-px flex-1 bg-gray-200 mx-1 -translate-y-3" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Form card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2" style={{ color: primary }}>
            <UserPlus className="w-5 h-5" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t.signUp}
            </h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">{t.fillForm}</p>
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
        <div className="mt-6 pt-6 border-t border-gray-100">
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
