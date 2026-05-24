"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Grid2x2, List, Table } from "lucide-react";
import { getMessages } from "../../lib/messages";

export type ListViewMode = "list" | "card" | "table";

interface ViewToggleProps {
  current: ListViewMode;
  /** Passed from the server component so the client renders in the
   * caller's language (en/mm). Defaults to English when omitted. */
  currentLanguage?: "en" | "mm";
}

/**
 * Toolbar buttons that switch the post-list view via URL query.
 * Server-rendered list re-renders on each click — no client-side
 * state needed beyond the URL. Reuses the same `?page=N&view=…`
 * query the route already reads.
 */
export function ViewToggle({ current, currentLanguage = "en" }: ViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = getMessages(currentLanguage);

  const go = (next: ListViewMode) => {
    const sp = new URLSearchParams(params.toString());
    if (next === "list") {
      sp.delete("view"); // list is the default
    } else {
      sp.set("view", next);
    }
    // Reset to page 1 when switching views — the previous offset
    // doesn't translate cleanly between card grid and table row
    // counts.
    sp.delete("page");
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const item = (
    mode: ListViewMode,
    Icon: React.ComponentType<{ className?: string }>,
    label: string,
  ) => {
    const active = current === mode;
    return (
      <button
        type="button"
        onClick={() => go(mode)}
        aria-pressed={active}
        title={label}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors"
        style={{
          backgroundColor: active
            ? "var(--color-primary)"
            : "transparent",
          color: active
            ? "var(--color-primary-foreground, #fff)"
            : "var(--color-foreground)",
        }}
      >
        <Icon className="h-4 w-4" />
        <span className="sr-only">{label}</span>
      </button>
    );
  };

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-md border p-0.5"
      style={{ borderColor: "var(--color-border)" }}
      role="group"
      aria-label={t.postList.viewMode}
    >
      {item("list", List, t.postList.viewList)}
      {item("card", Grid2x2, t.postList.viewCard)}
      {item("table", Table, t.postList.viewTable)}
    </div>
  );
}

export default ViewToggle;
