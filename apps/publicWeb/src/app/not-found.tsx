"use client";

import React from "react";
import Link from "next/link";
import { Home, ArrowLeft, Search, Mail } from "lucide-react";

/**
 * Public-web 404 page.
 *
 * Mounted by Next.js as the closest `not-found.tsx` for the root —
 * shown when:
 *   1. A page explicitly calls `notFound()` (e.g. unknown slug).
 *   2. No route matches the URL at all.
 *
 * IMPORTANT: This component renders OUTSIDE the `(cms)/layout.tsx`
 * provider tree, so client hooks like `useLanguage()` are NOT
 * available — they'd crash with "must be used within a
 * LanguageProvider". We read the language cookie directly instead.
 *
 * Stays self-contained for two more reasons:
 *   - 404s should render even when the backend is degraded.
 *   - Cross-tenant resolution may have failed (which is why we're
 *     on 404 in the first place).
 */
function readLanguageCookie(): "en" | "mm" {
  if (typeof document === "undefined") return "en";
  // Cookie name set by middleware — see libs/language/config.ts.
  const match = document.cookie.match(/(?:^|;\s*)x-lang=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : "";
  return value === "mm" ? "mm" : "en";
}

export default function NotFound() {
  // Read cookie inside an effect so SSR doesn't lock the language
  // to a stale value; the first paint uses 'en' and React swaps to
  // 'mm' after hydration if the cookie says so.
  const [lang, setLang] = React.useState<"en" | "mm">("en");
  React.useEffect(() => {
    setLang(readLanguageCookie());
  }, []);

  const t = {
    en: {
      heading: "Page not found",
      sub: "The page you're looking for doesn't exist, has moved, or is temporarily unavailable.",
      hint: "Try one of the links below or head back to the home page.",
      home: "Back to home",
      back: "Go back",
      search: "Search",
      contact: "Contact",
      code: "404 ERROR",
    },
    mm: {
      heading: "စာမျက်နှာ မတွေ့ပါ",
      sub: "သင်ရှာဖွေနေသော စာမျက်နှာသည် မရှိတော့ပါ၊ ပြောင်းရွှေ့ပြီး ဖြစ်နိုင်သည် သို့မဟုတ် ယာယီ မ ရရှိနိုင်ပါ။",
      hint: "အောက်ပါ link များ တွင် တစ်ခုခု ရွေးပါ သို့မဟုတ် ပင်မ စာမျက်နှာသို့ ပြန်သွားပါ။",
      home: "ပင်မစာမျက်နှာ",
      back: "နောက်သို့ပြန်",
      search: "ရှာဖွေရန်",
      contact: "ဆက်သွယ်ရန်",
      code: "404 အမှား",
    },
  } as const;
  const m = t[lang];

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/40 px-4 py-12">
      {/* Decorative blurred shapes — purely cosmetic; pointer-events
          off so they don't intercept clicks. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl"
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
        {/* Oversized 404 numeral — primary visual anchor. */}
        <div className="mb-6 select-none">
          <span className="bg-gradient-to-br from-primary via-primary/70 to-primary/30 bg-clip-text text-[6.5rem] font-black leading-none tracking-tighter text-transparent sm:text-[10rem]">
            404
          </span>
        </div>

        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-muted-foreground">
          {m.code}
        </p>

        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {m.heading}
        </h1>

        <p className="mx-auto mb-2 max-w-lg text-base text-muted-foreground sm:text-lg">
          {m.sub}
        </p>
        <p className="mx-auto mb-8 max-w-lg text-sm text-muted-foreground/80">
          {m.hint}
        </p>

        {/* Primary actions: Home (filled) + Back (outline). Inline
            on ≥sm, stacked on mobile. */}
        <div className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-auto"
          >
            <Home className="h-4 w-4" />
            {m.home}
          </Link>
          <button
            type="button"
            onClick={() =>
              typeof window !== "undefined" && window.history.length > 1
                ? window.history.back()
                : (window.location.href = "/")
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-background px-6 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            {m.back}
          </button>
        </div>

        {/* Secondary links — common destinations. If a tenant doesn't
            expose them, the link just 404s cleanly back here. */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            {m.search}
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail className="h-3.5 w-3.5" />
            {m.contact}
          </Link>
        </div>
      </div>
    </main>
  );
}
