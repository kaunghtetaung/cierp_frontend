"use client";

import { useEffect, useState } from "react";

/**
 * Returns the active theme classnames (e.g. `"theme-um1sf
 * theme-variant-cardinal"`) by sniffing the closest ancestor in the
 * DOM that carries them. Useful for portaled UI (Radix Dialog,
 * Popover, Toast) where the rendered content lives at `<body>` and
 * loses the theme CSS-variable scope set by `(cms)/layout` or
 * `(register)/layout`.
 *
 * Pass the returned string as a className on the portaled root —
 * e.g. `<DialogContent className={themeClass}>` — and CSS variables
 * like `--color-primary` resolve to the tenant's brand colour again.
 *
 * SSR-safe: returns "" on the server; resolves on first effect tick.
 */
export function useActiveThemeClass(): string {
  const [themeClass, setThemeClass] = useState("");

  useEffect(() => {
    if (typeof document === "undefined") return;
    // Look anywhere in the document for the active theme container.
    // Both `(cms)/layout` and `(register)/layout` set `theme-<name>`
    // on a wrapper div, so the first match is the live one. The
    // selector matches any class that *starts with* `theme-`, which
    // would include `theme-variant-*` too — so we filter to the
    // real theme name + variant pair.
    const el = document.querySelector(
      ".theme-default, .theme-um1sf, .theme-crystal",
    );
    if (!el) return;
    const classes = (el.className.match(/\btheme-[\w-]+\b/g) || []).join(" ");
    setThemeClass(classes);
  }, []);

  return themeClass;
}
