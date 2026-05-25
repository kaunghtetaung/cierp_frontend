import React from "react";
import Link from "next/link";
import { Home, Search, Mail } from "lucide-react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { BackButton } from "./_components/BackButton";

/**
 * Theme-aware 404 page for CMS routes.
 *
 * Wrapped by `(cms)/layout.tsx`, which mounts the active theme's
 * RootLayout — that's where header + footer + theme styles come
 * from. So this file only renders the 404 BODY, not the chrome.
 *
 * Closest-not-found semantics: Next.js renders THIS file (not
 * `app/not-found.tsx`) when `notFound()` is called from any page
 * inside `(cms)/`. The root `app/not-found.tsx` stays as a
 * provider-less fallback for routes outside `(cms)/` (library,
 * login, etc.).
 *
 * Server component — uses `getMiddlewareDataFromHeaders()` for
 * language detection instead of a client-side hook. The Back
 * button has to be a client component (history API), so it's
 * delegated to a small inline interactive piece.
 */

const T = {
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

export default async function NotFound() {
  const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
  const lang: "en" | "mm" =
    middleware?.language === "mm" ? "mm" : "en";
  const m = T[lang];

  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/40 px-4 py-20 sm:py-28">
      {/* Decorative blurred shapes — cosmetic only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl"
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
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

        <div className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-auto"
          >
            <Home className="h-4 w-4" />
            {m.home}
          </Link>
          <BackButton label={m.back} />
        </div>

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
    </section>
  );
}

