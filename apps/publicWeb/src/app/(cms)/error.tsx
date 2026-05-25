"use client";

import React from "react";
import Link from "next/link";
import { Home, RefreshCw, AlertTriangle, Mail } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Theme-aware error boundary for CMS routes.
 *
 * Wrapped by `(cms)/layout.tsx`'s `<ThemeLayout>` chrome — so the
 * active theme's header + footer surround this content. Matches
 * the same visual language as `(cms)/not-found.tsx`.
 *
 * Must be a client component (Next.js error boundary requirement —
 * needs `reset()` and error access). Reads language from cookie
 * directly because the LanguageProvider may not be reachable if
 * the error happened during provider mount.
 */
function readLanguageCookie(): "en" | "mm" {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)x-lang=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : "";
  return value === "mm" ? "mm" : "en";
}

const T = {
  en: {
    code: "ERROR",
    heading: "Something went wrong",
    sub: "An unexpected error occurred while loading this page.",
    hint: "Try again or head back to the home page. If the problem persists, contact support.",
    retry: "Try again",
    home: "Back to home",
    contact: "Contact support",
    devDetails: "Error details (development)",
  },
  mm: {
    code: "အမှား",
    heading: "တစ်ခုခု မှားယွင်းသွားပါသည်",
    sub: "ဤစာမျက်နှာ ဖွင့်နေစဉ် မမျှော်လင့်ထားသော အမှား တစ်ခု ဖြစ်ပေါ်ခဲ့သည်။",
    hint: "ထပ်မံ ကြိုးစားကြည့်ပါ သို့မဟုတ် ပင်မ စာမျက်နှာသို့ ပြန်သွားပါ။ ပြဿနာ ဆက်တိုက် ဖြစ်နေပါက ပံ့ပိုးကူညီရေး အဖွဲ့ကို ဆက်သွယ်ပါ။",
    retry: "ထပ်ကြိုးစားရန်",
    home: "ပင်မစာမျက်နှာ",
    contact: "ပံ့ပိုးကူညီရေး ဆက်သွယ်ရန်",
    devDetails: "အမှား အသေးစိတ် (Development)",
  },
} as const;

export default function CMSErrorPage({ error, reset }: ErrorProps) {
  const [lang, setLang] = React.useState<"en" | "mm">("en");
  React.useEffect(() => {
    setLang(readLanguageCookie());
  }, []);
  React.useEffect(() => {
    console.error("CMS error boundary caught:", error);
  }, [error]);
  const m = T[lang];
  const isDev = process.env.NODE_ENV === "development";

  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/40 px-4 py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-destructive/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl"
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>

        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-destructive">
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
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            {m.retry}
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-background px-6 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-auto"
          >
            <Home className="h-4 w-4" />
            {m.home}
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail className="h-3.5 w-3.5" />
            {m.contact}
          </Link>
        </div>

        {isDev && (
          <details className="mx-auto mt-10 max-w-xl text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              {m.devDetails}
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
              {error.stack && `\n\nStack:\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </section>
  );
}
