'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@repo/ui';

interface EditorSectionProps {
  /** Section heading shown in the collapsible header. */
  title: React.ReactNode;
  /** Optional small label (badge / counter) shown to the right of the title. */
  badge?: React.ReactNode;
  /** Optional icon left of the title. */
  icon?: React.ReactNode;
  /** Default open/closed when first rendered. */
  defaultOpen?: boolean;
  /** Set true on the dominant section ("Content") so it's always expanded. */
  alwaysOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Lightweight collapsible card used inside section forms (CTA, Testimonials,
 * Gallery, etc). Replaces the previous flat `<h3>` + `<div>` structure so
 * the editor side-panel scrolls less and authors can focus on one
 * concern at a time. Mirrors the visual language of the rest of the
 * admin (border + bg-muted/30 header) without pulling in shadcn Accordion.
 */
export function EditorSection({
  title,
  badge,
  icon,
  defaultOpen = false,
  alwaysOpen = false,
  children,
}: EditorSectionProps) {
  const [isOpen, setIsOpen] = useState(alwaysOpen || defaultOpen);
  const open = alwaysOpen ? true : isOpen;

  return (
    <div className="rounded-md border bg-background overflow-hidden">
      <button
        type="button"
        onClick={() => !alwaysOpen && setIsOpen((v) => !v)}
        disabled={alwaysOpen}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-muted/40',
          alwaysOpen
            ? 'cursor-default'
            : 'hover:bg-muted/60 transition-colors',
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          <span className="text-sm font-semibold truncate">{title}</span>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
        {!alwaysOpen && (
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform shrink-0',
              open ? 'rotate-180' : '',
            )}
          />
        )}
      </button>
      {open && (
        <div className="p-3 space-y-3 border-t bg-background">{children}</div>
      )}
    </div>
  );
}
