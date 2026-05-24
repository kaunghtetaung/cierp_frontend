"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface HeaderSearchProps {
  currentLanguage: "en" | "mm";
}

/**
 * Inline search trigger for the um1sf brand-row header. Starts as a
 * styled button matching the rest of the row; clicking it expands an
 * inline input + form that submits to `/search?q=<term>`.
 *
 * Pure client; no fetching here — the `/search` route owns rendering
 * the results page.
 */
export function HeaderSearch({ currentLanguage }: HeaderSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setOpen(false);
  }

  const label = currentLanguage === "mm" ? "ရှာ" : "Search";
  const placeholder =
    currentLanguage === "mm" ? "ရှာဖွေရန် ရိုက်ထည့်ပါ..." : "Search posts...";

  return (
    <div ref={containerRef} className="hidden lg:flex items-center gap-2">
      {!open ? (
        <button
          type="button"
          aria-label={label}
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <Search className="h-3.5 w-3.5" />
          <span>{label}</span>
        </button>
      ) : (
        <form
          onSubmit={submit}
          className="flex items-center gap-1 rounded-sm border border-primary px-2 py-1 bg-background"
          role="search"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-56 lg:w-72 bg-transparent px-1 py-0.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label={label}
            style={{ fontFamily: "var(--font-sans)" }}
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                inputRef.current?.focus();
              }}
              aria-label={currentLanguage === "mm" ? "ရှင်းရန်" : "Clear"}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
      )}
    </div>
  );
}

export default HeaderSearch;
