"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Search, ChevronDown } from "lucide-react";
import { IconComponent } from "@repo/ui/components/icons";
import HeaderLangSelector from "./HeaderLangSelector";
import HeaderUserActions from "./HeaderUserActions";

export interface MenuTreeNode {
  _id: string;
  title?: { en?: string; mm?: string };
  url?: string;
  slug?: string;
  icon?: string;
  openInNewTab?: boolean;
  displayType?: "dropdown" | "mega";
  children?: MenuTreeNode[];
}

interface MobileMenuProps {
  primaryMenu: MenuTreeNode[];
  audienceMenu: MenuTreeNode[];
  currentLanguage: "en" | "mm";
  showSearch: boolean;
  showNavigation: boolean;
  showLanguageSelector: boolean;
  showUserMenu: boolean;
  brandTitle: string;
}

/**
 * Mobile header surface for the um1sf theme. Only rendered below
 * the `lg` breakpoint — the desktop header is unchanged and renders
 * in parallel inside HeaderContainer.
 *
 * Surfaces:
 *   - Search icon → inline expanded input (submits to `/search?q=`).
 *   - Hamburger → slide-in drawer with accordion primary + audience
 *     menus, language switcher, and user actions.
 *
 * No SSR-visible drawer — it renders only when `open` flips client-side
 * to keep first-paint identical to the static SSR shell.
 */
export function MobileMenu({
  primaryMenu,
  audienceMenu,
  currentLanguage,
  showSearch,
  showNavigation,
  showLanguageSelector,
  showUserMenu,
  brandTitle,
}: MobileMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Body scroll-lock while drawer is open. Restores prior overflow on
  // close so we don't trap users whose page had its own overflow setup.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes whichever surface is open (search first, then menu).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (searchOpen) setSearchOpen(false);
      else if (open) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, searchOpen]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchValue("");
  }

  const searchLabel = currentLanguage === "mm" ? "ရှာ" : "Search";
  const menuLabel = currentLanguage === "mm" ? "မီနူး" : "Menu";
  const closeLabel = currentLanguage === "mm" ? "ပိတ်ရန်" : "Close";

  return (
    <>
      {/* Trigger row — laid out by HeaderContainer's flex parent. */}
      <div className="flex items-center gap-1">
        {showSearch && (
          <button
            type="button"
            aria-label={searchLabel}
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:text-primary hover:bg-muted/60 transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          aria-label={menuLabel}
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:text-primary hover:bg-muted/60 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Inline search overlay — covers the brand row when open. */}
      {searchOpen && (
        <div
          className="fixed inset-x-0 top-0 z-[60] bg-background border-b border-border shadow-md"
          role="search"
        >
          <form
            onSubmit={submitSearch}
            className="flex items-center gap-2 px-4 py-3 max-w-7xl mx-auto"
          >
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={
                currentLanguage === "mm"
                  ? "ရှာဖွေရန် ရိုက်ထည့်ပါ..."
                  : "Search posts..."
              }
              className="flex-1 min-w-0 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              style={{ fontFamily: "var(--font-sans)" }}
              aria-label={searchLabel}
            />
            <button
              type="button"
              onClick={() => {
                setSearchValue("");
                setSearchOpen(false);
              }}
              aria-label={closeLabel}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

      {/* Drawer overlay + panel. Renders only when open so closed-state
          DOM stays empty for both perf and tab-trap reasons. */}
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
          {/* Backdrop — closes on click, blurred for depth without
              borrowing screen real estate from the content beneath. */}
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Slide-in panel from the right. Width caps at 22rem so it
              stays comfortably narrower than a phone screen and leaves
              a thumb-zone strip on the left to dismiss. */}
          <aside
            className="absolute right-0 top-0 h-full w-[86%] max-w-[22rem] bg-background shadow-2xl flex flex-col"
            style={{ borderLeft: "1px solid var(--color-border)" }}
          >
            {/* Drawer header — cardinal-red accent strip + brand + close */}
            <div
              className="h-1 w-full"
              style={{ backgroundColor: "var(--color-primary)" }}
            />
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span
                className="text-base font-semibold truncate"
                style={{
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-serif)",
                }}
              >
                {brandTitle || menuLabel}
              </span>
              <button
                type="button"
                aria-label={closeLabel}
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:text-primary hover:bg-muted/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable nav body. */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {showNavigation && primaryMenu.length > 0 && (
                <MenuSection
                  label={currentLanguage === "mm" ? "မီနူး" : "Menu"}
                  nodes={primaryMenu}
                  language={currentLanguage}
                  onNavigate={() => setOpen(false)}
                />
              )}
              {audienceMenu.length > 0 && (
                <MenuSection
                  label={
                    currentLanguage === "mm" ? "အသုံးပြုသူများ" : "Quick Links"
                  }
                  nodes={audienceMenu}
                  language={currentLanguage}
                  onNavigate={() => setOpen(false)}
                  variant="muted"
                />
              )}
            </div>

            {/* Footer strip: language + user actions. */}
            {(showLanguageSelector || showUserMenu) && (
              <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-3 bg-muted/30">
                {showLanguageSelector ? <HeaderLangSelector /> : <span />}
                {showUserMenu ? (
                  <HeaderUserActions language={currentLanguage} />
                ) : (
                  <span />
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

/**
 * Section heading + recursive accordion list. Each node with children
 * renders as a collapsible row controlled by its own boolean state —
 * standalone leaves render as a single `<Link>`.
 */
function MenuSection({
  label,
  nodes,
  language,
  onNavigate,
  variant = "default",
}: {
  label: string;
  nodes: MenuTreeNode[];
  language: "en" | "mm";
  onNavigate: () => void;
  variant?: "default" | "muted";
}) {
  return (
    <div className="px-2 py-3 border-b border-border last:border-b-0">
      <div
        className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider"
        style={{
          color:
            variant === "muted"
              ? "var(--color-muted-foreground)"
              : "var(--color-primary)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {label}
      </div>
      <ul>
        {nodes.map((n) => (
          <MenuRow
            key={n._id}
            node={n}
            language={language}
            depth={0}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </div>
  );
}

function MenuRow({
  node,
  language,
  depth,
  onNavigate,
}: {
  node: MenuTreeNode;
  language: "en" | "mm";
  depth: number;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const label = pickLang(node.title, language) || node.slug || "";
  const hasChildren = (node.children?.length ?? 0) > 0;
  const indent = depth === 0 ? 0 : depth === 1 ? 12 : 24;

  // Leaf row.
  if (!hasChildren) {
    return (
      <li>
        <Link
          href={node.url || "#"}
          target={node.openInNewTab ? "_blank" : undefined}
          rel={node.openInNewTab ? "noopener noreferrer" : undefined}
          onClick={onNavigate}
          className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 ${
            depth === 0
              ? "text-foreground font-medium"
              : "text-muted-foreground"
          }`}
          style={{
            paddingLeft: 12 + indent,
            fontFamily: "var(--font-sans)",
          }}
        >
          {node.icon && (
            <IconComponent
              name={node.icon}
              size={14}
              className="flex-shrink-0"
            />
          )}
          <span className="truncate">{label}</span>
        </Link>
      </li>
    );
  }

  // Parent row — split into two interactive zones:
  //   - the label/link area navigates (if the node has a real url)
  //   - the chevron toggles the accordion
  // When the node has no real url (`#`), the whole row toggles.
  const hasRealUrl = !!node.url && node.url !== "#";

  return (
    <li>
      <div className="flex items-stretch rounded-md hover:bg-muted/60">
        {hasRealUrl ? (
          <Link
            href={node.url!}
            target={node.openInNewTab ? "_blank" : undefined}
            rel={node.openInNewTab ? "noopener noreferrer" : undefined}
            onClick={onNavigate}
            className={`flex flex-1 items-center gap-2 px-3 py-2.5 text-sm min-w-0 transition-colors ${
              depth === 0
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }`}
            style={{
              paddingLeft: 12 + indent,
              fontFamily: "var(--font-sans)",
            }}
          >
            {node.icon && (
              <IconComponent
                name={node.icon}
                size={14}
                className="flex-shrink-0"
              />
            )}
            <span className="truncate">{label}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`flex flex-1 items-center gap-2 px-3 py-2.5 text-sm min-w-0 transition-colors text-left ${
              depth === 0
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }`}
            style={{
              paddingLeft: 12 + indent,
              fontFamily: "var(--font-sans)",
            }}
            aria-expanded={open}
          >
            {node.icon && (
              <IconComponent
                name={node.icon}
                size={14}
                className="flex-shrink-0"
              />
            )}
            <span className="truncate">{label}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse" : "Expand"}
          aria-expanded={open}
          className="inline-flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
      {open && (
        <ul className="py-1">
          {node.children!.map((c) => (
            <MenuRow
              key={c._id}
              node={c}
              language={language}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function pickLang(
  text: { en?: string; mm?: string } | undefined | null,
  lang: "en" | "mm",
): string {
  if (!text) return "";
  return (text as any)[lang] || text.en || text.mm || "";
}

export default MobileMenu;
