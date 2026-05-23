import React from "react";

/**
 * Small "Draft" pill rendered next to a post / page title when its
 * status is `Draft`. Backend only ever delivers drafts to viewers
 * eligible to see them (sysAdmin / orgAdmin / matching deptAdmin /
 * creator), so showing this badge implicitly confirms the viewer has
 * preview access.
 */
type LangKey = "en" | "mm";

interface DraftBadgeProps {
  language?: LangKey;
  /** Override the rendered label entirely. */
  label?: string;
  className?: string;
}

const LABELS: Record<LangKey, string> = {
  en: "Draft",
  mm: "မူကြမ်း",
};

export function DraftBadge({
  language = "en",
  label,
  className = "",
}: DraftBadgeProps) {
  const text = label ?? LABELS[language] ?? LABELS.en;
  return (
    <span
      role="status"
      aria-label={text}
      className={
        "inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 " +
        className
      }
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"
      />
      {text}
    </span>
  );
}

export default DraftBadge;
