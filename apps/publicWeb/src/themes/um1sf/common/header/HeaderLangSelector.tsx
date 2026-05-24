"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useLangSelector } from "@/feature-components/lang-selector";

/**
 * Compact language switcher for the um1sf gateway row.
 * Reads the active language from `LangSelectorProvider` (mounted at the
 * app root) and triggers `changeLanguage` on selection. Renders short
 * codes only — "Eng" / "MM" — to keep the gateway row chrome dense.
 * Visibility is gated by `header.showLanguageSelector`.
 */

/**
 * Map a language code to its short label. We intentionally hard-code
 * the abbreviations rather than slicing `code.toUpperCase()`: "MM" is
 * what locals expect for Myanmar, but a generic slice on `'en'` would
 * give "EN", not "Eng" — losing the visual cue that English is a full
 * word. Falls back to the upper-cased code for any future locale.
 */
function shortLabel(code: string): string {
  switch (code.toLowerCase()) {
    case "en":
      return "Eng";
    case "mm":
      return "MM";
    default:
      return code.toUpperCase();
  }
}

export function HeaderLangSelector() {
  const ctx = useLangSelector();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const current =
    ctx.languages?.find((l) => l.code === ctx.currentLanguage) ||
    ctx.languages?.[0];
  if (!current) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-sm px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors hover:bg-white/10"
        style={{
          color: "var(--color-gateway-text)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <span>{shortLabel(current.code)}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-2 w-32 rounded-md border border-border bg-background shadow-xl z-50"
          style={{
            borderTopWidth: 3,
            borderTopColor: "var(--color-primary)",
          }}
        >
          <ul className="py-1">
            {(ctx.languages ?? []).map((lang) => {
              const isActive = lang.code === current.code;
              return (
                <li key={lang.code}>
                  <button
                    type="button"
                    onClick={() => {
                      ctx.changeLanguage(lang.code);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left ${
                      isActive
                        ? "bg-muted/60 text-primary"
                        : "text-foreground hover:bg-muted/60 hover:text-primary"
                    }`}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span className="flex-1">{shortLabel(lang.code)}</span>
                    {isActive && <Check className="h-4 w-4" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default HeaderLangSelector;
