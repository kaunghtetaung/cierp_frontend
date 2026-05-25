import React from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getContentSettings } from "@repo/content";

interface FooterMinimalProps {
  currentLanguage?: "en" | "mm";
}

function pickLang(
  v: { en?: string; mm?: string } | undefined | null,
  lang: "en" | "mm",
): string {
  if (!v) return "";
  return (lang === "mm" ? v.mm : v.en) || v.en || v.mm || "";
}

/**
 * um1sf — Minimal Footer variant.
 *
 * Single line — copyright only. Pairs with HeaderMinimal for
 * landing / one-page micro-sites where chrome should disappear.
 */
export async function FooterMinimal({
  currentLanguage = "en",
}: FooterMinimalProps) {
  const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
  const tenantId = middleware?.tenantId;

  const settings = tenantId
    ? await getContentSettings(tenantId).catch(() => null)
    : null;

  const footerCfg: any = (settings as any)?.footer ?? {};
  const orgFullName =
    (settings as any)?.organization?.fullName ||
    (settings as any)?.organizationName ||
    "";
  const copyrightText =
    pickLang(footerCfg.copyrightText, currentLanguage) ||
    `© ${new Date().getFullYear()} ${orgFullName}`;

  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="max-w-5xl mx-auto px-4 py-4 text-xs text-muted-foreground text-center">
        {copyrightText}
      </div>
    </footer>
  );
}

export default FooterMinimal;
