import React from "react";
import { getTenantSettingClientSafe } from "@repo/tenant/tenant-service";
// import { getContentSettings, getFooterMenu } from "@repo/content"; // Temporarily commented out - will fix later
import { FooterContainerProps } from "./types";
import FooterContent from "./FooterContent";

/**
 * Main Footer Container Component
 * Orchestrates footer layout and data
 * Server component that fetches real tenant and content data
 */
export async function FooterContainer({
  className,
  currentLanguage = "en",
  tenantId,
  showSocialLinks = true,
  showCopyright = true,
  showLinks = true,
}: FooterContainerProps) {
  try {
    // Fetch real data from your existing services
    const [tenantSettings] = await Promise.all([
      getTenantSettingClientSafe(tenantId),
      // getContentSettings(tenantId), // Temporarily commented out
    ]);
    
    // Placeholder content settings
    const contentSettings = {
      footer: {
        enabled: true,
        showSocialLinks: true,
        showCopyright: true,
        showLinks: true,
        customCopyrightText: null,
        customFooterText: null,
        socialLinks: [],
        columns: [],
      }
    } as any;

    // Extract footer data from your settings
    const footerData = {
      // Footer settings from content settings
      footerSettings: {
        enabled: contentSettings.footer?.enabled !== false,
        showSocialLinks:
          contentSettings.footer?.showSocialLinks !== false && showSocialLinks,
        showCopyright:
          contentSettings.footer?.showCopyright !== false && showCopyright,
        showLinks: contentSettings.footer?.showLinks !== false && showLinks,
        customCopyrightText: contentSettings.footer?.customCopyrightText,
        customFooterText: contentSettings.footer?.customFooterText,
      },

      // Social links from content settings
      socialLinks: contentSettings.footer?.socialLinks || [],

      // Footer columns/links from content settings
      footerColumns: contentSettings.footer?.columns || [],

      // Copyright and tenant info
      copyrightText:
        contentSettings.footer?.customCopyrightText?.[currentLanguage] ||
        `© ${new Date().getFullYear()} ${
          (tenantSettings as any)?.fullName || 'Organization'
        }. All rights reserved.`,

      customFooterText:
        contentSettings.footer?.customFooterText?.[currentLanguage],

      tenantInfo: {
        id: tenantSettings?.id,
        fullName: (tenantSettings as any)?.fullName,
        shortName: (tenantSettings as any)?.shortName,
      },
    };

    // If footer is disabled, return null
    if (!footerData.footerSettings.enabled) {
      return null;
    }

    return (
      <FooterContent
        footerData={footerData}
        currentLanguage={currentLanguage}
        className={className}
      />
    );
  } catch (error) {
    console.error("Error loading footer data:", error);

    // Fallback footer in case of error
    return (
      <footer className={`bg-muted border-t border-border ${className || ""}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">
              © {new Date().getFullYear()} CMS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }
}

export default FooterContainer;
