"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, Globe, LogIn, User, X } from "lucide-react";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { useLangSelector } from "@/feature-components/lang-selector";

interface MobileTopBarProps {
  brandTitle: string;
  logoUrl?: string | null;
  currentLanguage: "en" | "mm";
  showLogo?: boolean;
  showLanguageSelector?: boolean;
  showUserMenu?: boolean;
  // Slot for the drawer/sheet content (existing `MobileMenu` from
  // each Header variant). Rendered inside the hamburger overlay.
  drawer?: React.ReactNode;
}

/**
 * Icon-only mobile header for um1sf.
 *
 * Layout (left → right):
 *   • Brand: small logo + truncated title.
 *   • Hamburger button — opens the full-screen drawer (the existing
 *     `MobileMenu` from each Header variant; passed via `drawer`).
 *   • Language selector — globe icon + 2-letter code, opens a
 *     compact inline picker.
 *   • Sign-in / user — LogIn icon → `/login`, swapped for a User
 *     icon → `/profile` once authenticated.
 *
 * Sticky to the top so it travels with scroll. Hidden on lg+ where
 * the full desktop header takes over.
 */
export function MobileTopBar({
  brandTitle,
  logoUrl,
  currentLanguage,
  showLogo = true,
  showLanguageSelector = true,
  showUserMenu = true,
  drawer,
}: MobileTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  // Avoid mounting the portal until after hydration — otherwise
  // server-rendered HTML doesn't match client output.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const { user, isAuthenticated } = useSafeAuth();
  const langCtx = useLangSelector();

  // Lock body scroll while the drawer is open so the page behind
  // doesn't double-scroll. Cleanup restores the previous overflow
  // value in case other code is managing it too.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = menuOpen ? "hidden" : prev;
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // Close the inline language picker on outside click.
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest?.("[data-lang-pop]");
      if (!el) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [langOpen]);

  const langCode =
    currentLanguage === "mm" ? "MM" : "EN";

  return (
    <header className="lg:hidden sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex items-center justify-between gap-2 h-14 px-3">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 min-w-0 flex-1"
          aria-label={brandTitle || "Home"}
        >
          {showLogo && logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={brandTitle || "Logo"}
              className="h-8 w-8 object-contain flex-shrink-0"
            />
          )}
          {brandTitle && (
            <span className="text-sm font-semibold tracking-tight text-foreground truncate">
              {brandTitle}
            </span>
          )}
        </Link>

        {/* Right cluster — icon-only buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {showLanguageSelector && langCtx?.languages?.length ? (
            <div className="relative" data-lang-pop>
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className="inline-flex items-center justify-center h-9 min-w-9 px-2 rounded-md text-foreground hover:bg-muted/60 transition-colors gap-1"
                aria-label="Language"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
              >
                <Globe size={18} />
                <span className="text-[10px] font-semibold tracking-wider">
                  {langCode}
                </span>
              </button>
              {langOpen && (
                <ul
                  role="listbox"
                  data-lang-pop
                  className="absolute right-0 top-full mt-1 w-28 rounded-md border border-border bg-background shadow-lg py-1 z-50"
                >
                  {langCtx.languages.map((l: any) => {
                    const isActive = l.code === langCtx.currentLanguage;
                    return (
                      <li key={l.code}>
                        <button
                          type="button"
                          onClick={() => {
                            langCtx.changeLanguage(l.code);
                            setLangOpen(false);
                          }}
                          className={`block w-full text-left px-3 py-1.5 text-sm transition-colors ${
                            isActive
                              ? "bg-muted/60 text-primary font-medium"
                              : "text-foreground hover:bg-muted/60"
                          }`}
                          role="option"
                          aria-selected={isActive}
                        >
                          {l.code === "mm" ? "မြန်မာ" : "English"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}

          {showUserMenu && (
            <Link
              href={isAuthenticated ? "/profile" : "/login"}
              className="inline-flex items-center justify-center h-9 w-9 rounded-md text-foreground hover:bg-muted/60 transition-colors"
              aria-label={isAuthenticated ? user?.name || "Profile" : "Sign in"}
              title={isAuthenticated ? user?.name || "Profile" : "Sign in"}
            >
              {isAuthenticated ? <User size={18} /> : <LogIn size={18} />}
            </Link>
          )}

          {drawer && (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-md text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Drawer overlay portal — rendered on document.body so the
          `position: fixed` overlay isn't trapped by the sticky
          header's `backdrop-blur` containing block. `backdrop-blur`
          creates a new fixed-positioning context, which would
          otherwise scope `inset-0` to the header (≈56px tall)
          and the menu would appear empty/clipped. */}
      {mounted &&
        drawer &&
        menuOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <div className="relative ml-auto h-full w-[85vw] max-w-sm bg-background shadow-xl overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                <span className="text-sm font-semibold text-foreground truncate">
                  {brandTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md text-foreground hover:bg-muted/60 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
              <div
                className="p-2 flex-1 overflow-y-auto"
                onClick={(e) => {
                  // Auto-close when a menu link is clicked so the
                  // user doesn't have to manually dismiss after
                  // every nav. Container-level handler so we don't
                  // need to thread an onClick into every link.
                  const t = e.target as HTMLElement;
                  if (t.closest("a")) setMenuOpen(false);
                }}
              >
                {drawer}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}

export default MobileTopBar;
