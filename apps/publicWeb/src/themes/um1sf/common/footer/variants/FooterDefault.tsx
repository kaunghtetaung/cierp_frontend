import React from "react";
import Link from "next/link";
import {
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  MapPin,
  Phone,
  Clock,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getContentSettings } from "@repo/content";
import VisitorStats from "../VisitorStats";
import HitRecorder from "../HitRecorder";

interface FooterDefaultProps {
  currentLanguage?: "en" | "mm";
}

/**
 * um1sf Footer — Stanford-style multi-column, fully driven by Content
 * Settings (`footer.*`).
 *
 * Quick-link columns come from `footer.columns`: each `FooterColumn`
 * renders as a heading + list of links. Address / phone / email /
 * open hours read from `footer.contactInfo` + `footer.openHours`.
 * Social icons from `footer.socialLinks`. Visitor counter is gated by
 * `footer.showVisitorCount`.
 *
 * Any settings fetch failure degrades gracefully — a transient
 * outage shouldn't blank the chrome.
 */
export async function FooterDefault({
  currentLanguage = "en",
}: FooterDefaultProps) {
  const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
  const tenantId = middleware?.tenantId;

  const settings = tenantId
    ? await getContentSettings(tenantId).catch(() => null)
    : null;

  const footerCfg: any = (settings as any)?.footer ?? {};
  const showSocialLinks = footerCfg.showSocialLinks !== false;
  const showCopyright = footerCfg.showCopyright !== false;
  const showVisitorCount = footerCfg.showVisitorCount === true;

  const contact = footerCfg.contactInfo ?? {};
  const showAddress =
    !!contact.showAddress && !!pickLang(contact.address, currentLanguage);
  const showPhone = !!contact.showPhone && !!contact.phone;
  const showEmail = !!contact.showEmail && !!contact.email;
  const openHoursText = pickLang(footerCfg.openHours, currentLanguage);

  // Resolve the map iframe URL. Prefer the admin-supplied embed URL
  // (`mapEmbedUrl`) — it can encode zoom, place marker, etc. Fall
  // back to the keyless search-query embed when only lat/lng are
  // available; that path doesn't need a Google Maps API key.
  const mapEmbedUrl = resolveMapEmbedUrl(contact);
  const showMap = !!contact.showMap && !!mapEmbedUrl;

  const orgName =
    pickLang((settings as any)?.header?.customBannerTitle, currentLanguage) ||
    (settings as any)?.organization?.fullName ||
    (currentLanguage === "mm"
      ? "ဆေးတက္ကသိုလ် (၁) ရန်ကုန်"
      : "University of Medicine 1, Yangon");
  const orgSubtitle = pickLang(
    (settings as any)?.header?.customBannerSubtitle,
    currentLanguage,
  );
  const copyrightText =
    pickLang(footerCfg.copyrightText, currentLanguage) ||
    `© ${new Date().getFullYear()} ${orgName}`;

  const columns: Array<{
    title: { en?: string; mm?: string };
    links: Array<{ title: { en?: string; mm?: string }; url: string }>;
  }> = Array.isArray(footerCfg.columns) ? footerCfg.columns : [];

  const socialLinks: Array<{
    platform: string;
    url: string;
    icon?: string;
    enabled?: boolean;
  }> = footerCfg.socialLinks ?? [];

  const hasContactBlock =
    showAddress || showPhone || showEmail || !!openHoursText;

  return (
    <footer
      className="w-full relative"
      style={{
        backgroundColor: "var(--color-footer-bg)",
        color: "var(--color-footer-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <HitRecorder />

      {/* Cardinal-red top accent stripe. Anchors the footer to the
          theme's primary color and gives the section a hard visual
          starting line. */}
      <div
        className="w-full h-1"
        style={{ backgroundColor: "var(--color-primary)" }}
      />

      {/* Row 1 — content grid.
          Layout shifts by breakpoint:
            mobile:  brand stacks above 2-col content grid
            md:      brand spans 2 cols, content fills 4
            lg:      brand 3 / dynamic columns / contact / map = 12 cols
          We use an explicit 12-col grid so the brand block always
          gets generous breathing room next to the link lists. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-16 pb-10 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          {/* Brand block — anchors the left edge with the org's
              wordmark and (when set) its subtitle. Serif title +
              cardinal-red accent rule for editorial weight. */}
          <div className="md:col-span-12 lg:col-span-3">
            <Link
              href="/"
              className="inline-block group"
              aria-label={orgName}
            >
              <span
                className="block text-xl md:text-2xl font-bold leading-tight"
                style={{
                  color: "var(--color-footer-heading)",
                  fontFamily: "var(--font-serif)",
                }}
              >
                {orgName}
              </span>
              {orgSubtitle && (
                <span
                  className="block mt-1 text-xs uppercase tracking-[0.2em]"
                  style={{ color: "var(--color-footer-link)" }}
                >
                  {orgSubtitle}
                </span>
              )}
              <span
                className="block mt-3 h-px w-10 group-hover:w-16 transition-all"
                style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                aria-hidden
              />
            </Link>
          </div>

          {/* Content slots — quick-link columns + contact + map.
              Each takes 1/3 of the right-side 9-col band on lg, so
              up to 3 slots fit comfortably. Beyond 3, columns wrap
              gracefully to the next row. */}
          <div className="md:col-span-12 lg:col-span-9">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {columns.map((col, idx) => {
                const heading = pickLang(col.title, currentLanguage);
                return (
                  <div key={`col-${idx}`}>
                    <h3
                      className="text-[0.7rem] font-bold mb-4 tracking-[0.18em] uppercase flex items-center gap-2.5"
                      style={{ color: "var(--color-footer-heading)" }}
                    >
                      <span
                        className="inline-block h-px w-5"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.4)",
                        }}
                        aria-hidden
                      />
                      {heading}
                    </h3>
                    {Array.isArray(col.links) && col.links.length > 0 && (
                      <ul className="space-y-2.5 text-sm">
                        {col.links.map((l, li) => {
                          const label = pickLang(l.title, currentLanguage);
                          if (!label) return null;
                          return (
                            <li key={`${idx}-${li}`}>
                              <Link
                                href={l.url || "#"}
                                className="group inline-flex items-center gap-1.5 transition-colors hover:text-white"
                                style={{ color: "var(--color-footer-link)" }}
                              >
                                <ChevronRight
                                  className="h-3 w-3 -ml-1 opacity-0 group-hover:opacity-70 group-hover:ml-0 transition-all"
                                  aria-hidden
                                />
                                <span className="group-hover:underline underline-offset-4">
                                  {label}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}

              {/* Contact / hours block. Each row gets a small ringed
                  icon container so the column reads as "info" rather
                  than as another link list. */}
              {hasContactBlock && (
                <div>
                  <h3
                    className="text-[0.7rem] font-bold mb-4 tracking-[0.18em] uppercase flex items-center gap-2"
                    style={{ color: "var(--color-footer-heading)" }}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "var(--color-primary)" }}
                      aria-hidden
                    />
                    {currentLanguage === "mm" ? "ဆက်သွယ်ရန်" : "Contact"}
                  </h3>
                  <ul
                    className="space-y-3.5 text-sm"
                    style={{ color: "var(--color-footer-link)" }}
                  >
                    {showAddress && (
                      <li className="flex items-start gap-3">
                        <ContactIcon icon={MapPin} />
                        <span className="whitespace-pre-line leading-relaxed">
                          {pickLang(contact.address, currentLanguage)}
                        </span>
                      </li>
                    )}
                    {showPhone && (
                      <li className="flex items-start gap-3">
                        <ContactIcon icon={Phone} />
                        <a
                          href={`tel:${contact.phone}`}
                          className="hover:text-white transition-colors leading-relaxed"
                        >
                          {contact.phone}
                        </a>
                      </li>
                    )}
                    {showEmail && (
                      <li className="flex items-start gap-3">
                        <ContactIcon icon={Mail} />
                        <a
                          href={`mailto:${contact.email}`}
                          className="hover:text-white transition-colors break-all leading-relaxed"
                        >
                          {contact.email}
                        </a>
                      </li>
                    )}
                    {openHoursText && (
                      <li className="flex items-start gap-3">
                        <ContactIcon icon={Clock} />
                        <span className="whitespace-pre-line leading-relaxed">
                          {openHoursText}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Google Map. Rounded corners, top-edge red accent, +
                  a "Get directions" link below for users who want
                  the full Maps experience. */}
              {showMap && (
                <div>
                  <h3
                    className="text-[0.7rem] font-bold mb-4 tracking-[0.18em] uppercase flex items-center gap-2"
                    style={{ color: "var(--color-footer-heading)" }}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "var(--color-primary)" }}
                      aria-hidden
                    />
                    {currentLanguage === "mm" ? "မြေပုံ" : "Find us"}
                  </h3>
                  <div
                    className="rounded-md overflow-hidden ring-1 shadow-lg"
                    style={{
                      // Subtle white ring on all sides so the map
                      // reads as a card on the dark footer. Earlier
                      // a 2px cardinal-red top edge sat here, but
                      // red-on-black at small linewidths looked harsh
                      // next to the muted neutrals everywhere else.
                      // @ts-expect-error CSS custom property in style
                      "--tw-ring-color": "rgba(255,255,255,0.1)",
                    }}
                  >
                    <iframe
                      src={mapEmbedUrl!}
                      title="Google Map"
                      width="100%"
                      height="180"
                      style={{
                        border: 0,
                        display: "block",
                        filter: "grayscale(0.15)",
                      }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  {(contact.latitude != null && contact.longitude != null) && (
                    <a
                      href={`https://www.google.com/maps?q=${contact.latitude},${contact.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 text-xs hover:text-white transition-colors"
                      style={{ color: "var(--color-footer-link)" }}
                    >
                      {currentLanguage === "mm" ? "လမ်းညွှန်" : "Get directions"}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 — bottom strip. Slim, refined.
          Layout (desktop):
            [ copyright ]   [ social pill buttons ]   [ visitor chip ]
          Each cluster gets its own visual weight: copyright is plain
          text, social are pill-buttons with hover treatment, visitor
          is a bordered chip. Together they read as separate elements
          rather than competing typography. */}
      <div
        className="border-t"
        style={{ borderColor: "var(--color-footer-divider)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div
            className="leading-snug"
            style={{ color: "var(--color-footer-link)" }}
          >
            {showCopyright ? copyrightText : `© ${new Date().getFullYear()} ${orgName}`}
          </div>

          <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
            {showSocialLinks && socialLinks.length > 0 && (
              <div className="flex items-center gap-1.5">
                {socialLinks
                  .filter((s) => s.enabled !== false && s.url)
                  .map((s) => {
                    const Icon =
                      SOCIAL_ICON[s.platform?.toLowerCase()] ?? Mail;
                    return (
                      <a
                        key={`${s.platform}-${s.url}`}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.platform}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-all hover:scale-110"
                        style={{
                          color: "var(--color-footer-link)",
                          backgroundColor: "rgba(255,255,255,0.04)",
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </a>
                    );
                  })}
              </div>
            )}

            {showVisitorCount && (
              <div
                className="inline-flex items-center px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--color-footer-divider)",
                }}
              >
                <VisitorStats
                  tenantId={tenantId}
                  language={currentLanguage}
                />
              </div>
            )}

            <a
              href="#top"
              aria-label="Back to top"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-all hover:scale-110"
              style={{
                color: "var(--color-footer-link)",
                backgroundColor: "rgba(255,255,255,0.04)",
              }}
            >
              <ArrowUpRight className="h-3.5 w-3.5 -rotate-45" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Small ringed icon used on each contact-info row. Distinguishes
 * informational rows (address / phone / email / hours) from link
 * lists, where icons would feel like extra clutter.
 */
function ContactIcon({
  icon: Icon,
}: {
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 mt-0.5"
      style={{
        // Warm neutral on a faint white panel — works on the dark
        // footer without the harsh red-on-black contrast that the
        // earlier `--color-primary` fill produced. Cardinal red is
        // reserved for thin accent lines (top stripe, heading dot,
        // map top-edge) where it punctuates rather than competes.
        backgroundColor: "rgba(255,255,255,0.06)",
        color: "var(--color-footer-heading)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      aria-hidden
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

export default FooterDefault;

// ── Helpers ──────────────────────────────────────────────────────────

function pickLang(
  text: { en?: string; mm?: string } | undefined | null,
  lang: "en" | "mm",
): string {
  if (!text) return "";
  return (text as any)[lang] || text.en || text.mm || "";
}

/**
 * Resolve the Google Map iframe `src` from the admin-supplied
 * settings. We accept three shapes, in priority order:
 *   1. `mapEmbedUrl` — the full `src` from Maps' Share → Embed
 *      dialog. Trusted as-is provided it points at the Google
 *      domain (anything else is rejected so a paste accident
 *      can't iframe a hostile origin).
 *   2. `latitude` + `longitude` — keyless search-query embed.
 *   3. None of the above → null, and the column is hidden.
 */
function resolveMapEmbedUrl(contact: {
  mapEmbedUrl?: string;
  latitude?: number;
  longitude?: number;
}): string | null {
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
      /* fall through to lat/lng */
    }
  }
  const { latitude, longitude } = contact;
  if (typeof latitude === "number" && typeof longitude === "number") {
    return `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=15&output=embed`;
  }
  return null;
}

const SOCIAL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  email: Mail,
  mail: Mail,
};
