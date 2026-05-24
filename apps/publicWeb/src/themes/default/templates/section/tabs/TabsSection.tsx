"use client";

import React, { useState } from "react";
import type { TabsSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";
import { getSectionSpacingStyles, hasAnySpacing } from "../section-spacing";

/**
 * Tabbed content panel. Horizontal — labels along the top with a
 * single panel below. Vertical — labels in a left rail with the
 * panel to the right. Per item: `label` (always) + either `content`
 * (plain text) or `contentHtml` (rich HTML — wins when both set).
 *
 * Inline HTML is rendered through the shared `[data-rich-html]`
 * styling that already lives in publicWeb's globals.css (the same
 * one the FAQ accordion uses), so lists, tables, images, headings
 * all pick up consistent typography.
 */
export function TabsSection({
  section,
  currentLanguage = "en",
}: SectionProps<TabsSectionData>) {
  const items = Array.isArray((section as any).items)
    ? (section as any).items
    : [];

  const orientation: "horizontal" | "vertical" =
    (section as any).orientation === "vertical" ? "vertical" : "horizontal";

  const initial = Math.min(
    Math.max(0, Number((section as any).defaultIndex) || 0),
    Math.max(0, items.length - 1),
  );
  const [active, setActive] = useState(initial);

  const showHeadline = (section as any).showHeadline !== false;
  const showDescription = (section as any).showDescription !== false;
  const headline = (section as any).headline
    ? getLocalizedText((section as any).headline, currentLanguage)
    : null;
  const description = (section as any).description
    ? getLocalizedText((section as any).description, currentLanguage)
    : null;

  if (!items || items.length === 0) {
    return null;
  }

  const activeItem = items[active] ?? items[0];
  const activeHtml = (activeItem as any)?.contentHtml
    ? getLocalizedText((activeItem as any).contentHtml, currentLanguage)
    : "";
  const activePlain = (activeItem as any)?.content
    ? getLocalizedText((activeItem as any).content, currentLanguage)
    : "";

  // Author-configurable spacing falls through to inline `style`;
  // when nothing is configured the section keeps its default
  // `py-12` rhythm. `hasAnySpacing` covers the partial-override
  // case so a custom `paddingBottom` doesn't conflict with the
  // default `py-12` on the top axis.
  const spacing = getSectionSpacingStyles(section as any);
  const hasSpacing = hasAnySpacing(section as any);

  return (
    <section
      className={hasSpacing ? "" : "py-12"}
      style={spacing}
      data-section-id={section._id}
      data-section-type="tabs"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header — description is authored via the admin Tiptap
            editor so it can be HTML (paragraphs / inline marks /
            links). Render via `dangerouslySetInnerHTML` inside a
            `data-rich-html` container so the global typography
            rules style it consistently with the rest of rich
            content; plain-text values (e.g. legacy data) still
            render correctly because they sit inside `<div>` and
            inherit the surrounding text styles. */}
        {((showHeadline && headline) || (showDescription && description)) && (
          <div className="mb-8">
            {showHeadline && headline && (
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {headline}
              </h2>
            )}
            {showDescription && description && (
              <div
                data-rich-html
                className="text-muted-foreground max-w-3xl"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </div>
        )}

        {orientation === "vertical" ? (
          // Vertical: left rail (1/4) + right panel (3/4). Stacks on
          // mobile so labels never get crushed below ~360px.
          <div className="flex flex-col md:flex-row gap-6">
            <div
              role="tablist"
              aria-orientation="vertical"
              className="md:w-1/4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0 md:pr-2"
            >
              {items.map((it: any, i: number) => {
                const label = getLocalizedText(it.label, currentLanguage);
                const isActive = i === active;
                return (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(i)}
                    className={`text-left px-4 py-3 rounded-md text-sm font-medium whitespace-nowrap md:whitespace-normal transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      isActive
                        ? "bg-primary/10 text-primary border-l-2 md:border-l-4 border-primary"
                        : "text-foreground hover:bg-muted/60 border-l-2 md:border-l-4 border-transparent"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex-1 min-w-0">
              <Panel html={activeHtml} plain={activePlain} />
            </div>
          </div>
        ) : (
          // Horizontal: top label strip + single panel.
          <div>
            <div
              role="tablist"
              aria-orientation="horizontal"
              className="flex flex-wrap gap-1 border-b border-border mb-6"
            >
              {items.map((it: any, i: number) => {
                const label = getLocalizedText(it.label, currentLanguage);
                const isActive = i === active;
                return (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(i)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <Panel html={activeHtml} plain={activePlain} />
          </div>
        )}
      </div>
    </section>
  );
}

function Panel({ html, plain }: { html?: string; plain?: string }) {
  if (html && html.trim()) {
    return (
      <div
        data-rich-html
        className="bg-card border border-border rounded-lg p-5"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  if (plain && plain.trim()) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 text-foreground leading-relaxed whitespace-pre-line">
        {plain}
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-lg p-5 text-muted-foreground text-sm">
      No content for this tab yet.
    </div>
  );
}

export default TabsSection;
