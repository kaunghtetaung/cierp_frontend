"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, UserPlus, FileText, CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import styles from "./styles/signup.module.css";
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
    // Set cookie for persistence
    document.cookie = `x-lang=${lang}; path=/; max-age=${365 * 24 * 60 * 60}`;
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Left Side - Organization Branding */}
        <div className={styles.brandingPanel}>
          {/* Background Pattern */}
          <div className={styles.bgPattern} />
          
          {/* Animated Gradient Orbs */}
          <div className={`${styles.orb} ${styles.orb1}`} />
          <div className={`${styles.orb} ${styles.orb2}`} />
          
          <div className={styles.brandingContent}>
            {/* Header */}
            <div>
              <Link href="/" className={styles.backLink}>
                <ArrowLeft size={16} />
                {t.backToHome}
              </Link>
              
              {/* Organization Logo/Name */}
              <div className={styles.orgBranding}>
                <div className={styles.orgLogo}>
                  <Sparkles size={24} />
                </div>
                <div className={styles.orgInfo}>
                  <h1 className={styles.orgName}>{orgName}</h1>
                  <p className={styles.orgTagline}>{orgTagline}</p>
                </div>
              </div>
            </div>

            {/* Registration Flow */}
            <div className={styles.registrationFlow}>
              <h2 className={styles.flowTitle}>{t.registrationJourney}</h2>
              
              <div className={styles.flowSteps}>
                {/* Step 1: Sign Up */}
                <div className={styles.flowStep}>
                  <div className={`${styles.stepIcon} ${styles.current}`}>
                    <UserPlus size={24} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepLabel}>{t.step1}</div>
                    <h3 className={styles.stepTitle}>{t.createAccountStep}</h3>
                    <p className={styles.stepDescription}>
                      {t.createAccountDesc}
                    </p>
                  </div>
                </div>

                {/* Step 2: Data Entry */}
                <div className={styles.flowStep}>
                  <div className={styles.stepIcon}>
                    <FileText size={24} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepLabel}>{t.step2}</div>
                    <h3 className={styles.stepTitle}>{t.completeProfile}</h3>
                    <p className={styles.stepDescription}>
                      {t.completeProfileDesc}
                    </p>
                  </div>
                </div>

                {/* Step 3: Admin Approval */}
                <div className={styles.flowStep}>
                  <div className={styles.stepIcon}>
                    <CheckCircle size={24} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepLabel}>{t.step3}</div>
                    <h3 className={styles.stepTitle}>{t.adminApproval}</h3>
                    <p className={styles.stepDescription}>
                      {t.adminApprovalDesc}
                    </p>
                  </div>
                </div>

                {/* Step 4: Welcome */}
                <div className={styles.flowStep}>
                  <div className={styles.stepIcon}>
                    <Mail size={24} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepLabel}>{t.step4}</div>
                    <h3 className={styles.stepTitle}>{t.welcomeEmail}</h3>
                    <p className={styles.stepDescription}>
                      {t.welcomeEmailDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className={styles.formPanel}>
          {/* Form Header - Full width of panel */}
          <div className={styles.formHeader}>
            <div className={styles.formHeaderContent}>
              <h2 className={styles.formTitle}>
                <UserPlus size={20} style={{ marginRight: '0.5rem' }} />
                {t.signUp}
              </h2>
              <p className={styles.formSubtitle}>
                {t.fillForm}
              </p>
            </div>
            <LanguageSwitcher 
              currentLang={currentLang}
              onLanguageChange={handleLanguageChange}
            />
          </div>

          <div className={styles.formWrapper}>
            {/* Mobile Header - Only visible on mobile */}
            <div className={styles.mobileHeader}>
              <div className={styles.mobileLogo}>
                <Sparkles size={24} />
              </div>
              <h1 className={styles.mobileOrgName}>{orgName}</h1>
            </div>

            <div className={styles.formCard}>
              <SignupForm 
                tenantId={tenantSettings?.id}
                language={currentLang}
                translations={t}
              />

              <div className={styles.divider}>
                <div className={styles.dividerLine}>
                  <div className={styles.dividerBorder} />
                </div>
                <div className={styles.dividerText}>
                  <span className={styles.dividerTextBg}>Or</span>
                </div>
              </div>

              <div className={styles.linkText}>
                {t.alreadyHaveAccount}{" "}
                <Link href="/login" className={styles.link}>
                  {t.signIn}
                </Link>
              </div>

              {/* Footer - Inside form panel */}
              <div className={styles.formFooter}>
                <p className={styles.footerText}>
                  {t.agreementText}{" "}
                  <Link href="/terms" className={styles.footerLink}>
                    {t.termsOfService}
                  </Link>{" "}
                  {t.and}{" "}
                  <Link href="/privacy" className={styles.footerLink}>
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