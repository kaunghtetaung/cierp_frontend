import React from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getContentSettings } from "@repo/content";
import { getCurrentUser } from "@repo/auth/server";
import ContactPageClient from "./ContactPageClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{ lang?: string }>;
}

/**
 * /contact — public contact page.
 *
 * Server component: resolves tenant + current user up-front, then
 * hands everything to the client component for the actual form
 * (the form needs interactivity for the math challenge, fill-time
 * timer, and per-field validation). Contact info + map are read
 * straight off `Settings.footer.contactInfo` so the admin manages
 * both the footer and the contact page from one place.
 */
export default async function ContactPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const language = params.lang === "mm" ? "mm" : "en";

  const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
  const tenantId = middleware?.tenantId ?? null;

  const [settings, user] = await Promise.all([
    tenantId ? getContentSettings(tenantId).catch(() => null) : Promise.resolve(null),
    getCurrentUser().catch(() => null),
  ]);

  const footerCfg: any = (settings as any)?.footer ?? {};
  const contact = footerCfg.contactInfo ?? {};
  const openHoursText = pickLang(footerCfg.openHours, language);

  return (
    <ContactPageClient
      language={language}
      // Pre-resolve the strings server-side so the client doesn't
      // need a second pickLang pass — keeps the bundle small.
      address={
        contact.showAddress ? pickLang(contact.address, language) : ""
      }
      phone={contact.showPhone ? contact.phone || "" : ""}
      email={contact.showEmail ? contact.email || "" : ""}
      openHours={openHoursText}
      mapEmbedUrl={resolveMapEmbedUrl(contact)}
      latitude={typeof contact.latitude === "number" ? contact.latitude : null}
      longitude={
        typeof contact.longitude === "number" ? contact.longitude : null
      }
      currentUser={
        user
          ? {
              id: (user as any).id,
              name: (user as any).name || "",
              email: (user as any).email || "",
            }
          : null
      }
    />
  );
}

function pickLang(
  text: { en?: string; mm?: string } | undefined | null,
  lang: "en" | "mm",
): string {
  if (!text) return "";
  return (text as any)[lang] || text.en || text.mm || "";
}

function resolveMapEmbedUrl(contact: {
  showMap?: boolean;
  mapEmbedUrl?: string;
  latitude?: number;
  longitude?: number;
}): string | null {
  if (!contact.showMap) return null;
  const raw = contact.mapEmbedUrl?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (
        u.hostname === "www.google.com" ||
        u.hostname === "maps.google.com" ||
        u.hostname === "www.google.com.mm" ||
        u.hostname === "maps.google.com.mm"
      ) {
        return u.toString();
      }
    } catch {
      /* fall through */
    }
  }
  if (
    typeof contact.latitude === "number" &&
    typeof contact.longitude === "number"
  ) {
    return `https://maps.google.com/maps?q=${contact.latitude},${contact.longitude}&hl=en&z=15&output=embed`;
  }
  return null;
}
