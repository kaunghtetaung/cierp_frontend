import React from "react";
import Link from "next/link";
import { Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getContentSettings } from "@repo/content";
import VisitorStats from "../VisitorStats";
import HitRecorder from "../HitRecorder";

interface FooterModernProps {
  currentLanguage?: "en" | "mm";
}

function pickLang(
  v: { en?: string; mm?: string } | undefined | null,
  lang: "en" | "mm",
): string {
  if (!v) return "";
  return (lang === "mm" ? v.mm : v.en) || v.en || v.mm || "";
}

const SOCIAL_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

/**
 * um1sf — Modern Footer variant.
 *
 * Single-row compact footer: brand logo + name on the left,
 * social icons + visitor count on the right, copyright underneath.
 * No multi-column quick-links — that's the Default variant's job.
 */
export async function FooterModern({
  currentLanguage = "en",
}: FooterModernProps) {
  const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
  const tenantId: string | null = middleware?.tenantId ?? null;

  const settings = tenantId
    ? await getContentSettings(tenantId).catch(() => null)
    : null;

  const footerCfg: any = (settings as any)?.footer ?? {};
  const showSocialLinks = footerCfg.showSocialLinks !== false;
  const showCopyright = footerCfg.showCopyright !== false;
  const showVisitorCount = footerCfg.showVisitorCount === true;

  const orgFullName =
    (settings as any)?.organization?.fullName ||
    (settings as any)?.organizationName ||
    "";
  const logoUrl =
    (settings as any)?.organization?.logoUrl ||
    (settings as any)?.logoUrl ||
    null;
  const copyrightText =
    pickLang(footerCfg.copyrightText, currentLanguage) ||
    `© ${new Date().getFullYear()} ${orgFullName}`;

  const socialLinks = Array.isArray(footerCfg.socialLinks)
    ? footerCfg.socialLinks.filter(
        (s: any) => s && s.enabled !== false && s.url,
      )
    : [];

  return (
    <footer className="w-full border-t border-border bg-muted/30">
      <HitRecorder />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={orgFullName || "Logo"}
                className="h-8 w-8 object-contain flex-shrink-0"
              />
            )}
            {orgFullName && (
              <span className="text-sm font-medium text-foreground">
                {orgFullName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {showSocialLinks && socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map((s: any) => {
                  const Icon = SOCIAL_ICON[String(s.platform).toLowerCase()];
                  return (
                    <Link
                      key={s.platform + s.url}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.platform}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {Icon ? (
                        <Icon size={18} />
                      ) : (
                        <span className="text-xs">{s.platform}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
            {showVisitorCount && (
              <VisitorStats tenantId={tenantId} language={currentLanguage} />
            )}
          </div>
        </div>

        {showCopyright && (
          <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground text-center">
            {copyrightText}
          </div>
        )}
      </div>
    </footer>
  );
}

export default FooterModern;
