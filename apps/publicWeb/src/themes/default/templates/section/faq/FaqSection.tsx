"use client";

import React, { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/styled-components/ui/Button";
import { FaqSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";
import { getSectionSpacingStyles, hasAnySpacing } from "../section-spacing";
import { getMessages } from "../../../lib/messages";

/**
 * FAQ Section Component
 * Displays frequently asked questions with collapsible answers
 */
export function FaqSection({
  section,
  currentLanguage = "en",
}: SectionProps<FaqSectionData>) {
  const {
    layout = "accordion",
    allowMultipleOpen = false,
    showCategories = false,
    searchable = false,
    faqs = [],
  } = section;

  // Header-visibility flags. `undefined` (legacy data) is treated as
  // `true` so old FAQ sections keep rendering their headline +
  // description; only an explicit `false` hides them.
  const showHeadline = (section as any).showHeadline !== false;
  const showDescription = (section as any).showDescription !== false;

  const [openItems, setOpenItems] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const headline = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : null;

  const description = section.description
    ? getLocalizedText(section.description, currentLanguage)
    : null;

  // Spacing overrides (admin-configured) — see `section-spacing.ts`.
  // Drops the default `py-16` className when ANY custom axis is set
  // so a partial override doesn't collide with the default on
  // unset axes.
  const spacingStyles = getSectionSpacingStyles(section as any);
  const sectionHasSpacing = hasAnySpacing(section as any);
  const sectionDefaultPadding = sectionHasSpacing ? "" : "py-16";

  if (!faqs || faqs.length === 0) {
    const t = getMessages(currentLanguage);
    return (
      <section
        className={`${sectionDefaultPadding} bg-gradient-to-b from-background via-muted/50 to-background`}
        style={spacingStyles}
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t.faq.emptyTitle}
            </h3>
            <p className="text-muted-foreground">{t.faq.emptyMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  // Get unique categories
  const categories = Array.from(
    new Set(faqs.map((faq) => faq.category).filter(Boolean))
  );

  // Filter FAQs based on search and category
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      !searchQuery ||
      getLocalizedText(faq.question, currentLanguage)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      getLocalizedText(faq.answer, currentLanguage)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === "all" || faq.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleItem = (index: number) => {
    if (allowMultipleOpen) {
      setOpenItems((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      setOpenItems((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  const renderAccordion = () => (
    <div className="space-y-3">
      {filteredFaqs.map((faq, index) => {
        const isOpen = openItems.includes(index);
        return (
          <div
            key={index}
            className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200"
          >
            {/* Use a plain `<button>` here instead of the styled
                `<Button>` component — the latter's base class includes
                `justify-center` which fights `justify-between` and can
                leave the title visually centred with the arrow. With
                a bare button + explicit flex utilities we get a
                deterministic layout: title left, arrow right, gap in
                between. */}
            <button
              type="button"
              onClick={() => toggleItem(index)}
              aria-expanded={isOpen}
              className={`w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isOpen ? "bg-muted/40" : "hover:bg-muted/30"
              }`}
            >
              <span className="flex-1 font-normal text-foreground text-base sm:text-lg">
                {getLocalizedText(faq.question, currentLanguage)}
              </span>
              <ChevronDown
                className={`shrink-0 w-5 h-5 text-primary transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-4 text-muted-foreground leading-relaxed border-t border-border bg-muted/30">
                {/* Prefer `answerHtml` (rich HTML — lists, tables,
                     images) over the legacy plain-text `answer`. Both
                     are optional in the schema; if neither is set we
                     just collapse the body. The `prose` wrapper gives
                     the injected HTML reasonable typography. */}
                {(faq as any).answerHtml &&
                getLocalizedText((faq as any).answerHtml, currentLanguage) ? (
                  <div
                    data-rich-html
                    className="pt-4"
                    dangerouslySetInnerHTML={{
                      __html: getLocalizedText(
                        (faq as any).answerHtml,
                        currentLanguage,
                      ),
                    }}
                  />
                ) : faq.answer ? (
                  <div className="pt-4">
                    {getLocalizedText(faq.answer, currentLanguage)}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {filteredFaqs.map((faq, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300"
        >
          <h3 className="font-normal text-foreground mb-4">
            {getLocalizedText(faq.question, currentLanguage)}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {getLocalizedText(faq.answer, currentLanguage)}
          </p>
        </div>
      ))}
    </div>
  );

  const renderTabs = () => {
    if (!showCategories || categories.length === 0) {
      return renderAccordion();
    }

    return (
      <div>
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-border">
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeCategory === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveCategory("all")}
          >
            All
          </button>
          {categories.map((category, index) => (
            <button
              key={index}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeCategory === category
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveCategory(category || "all")}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {renderAccordion()}
      </div>
    );
  };

  return (
    <section
      className={`${sectionDefaultPadding} bg-gradient-to-b from-background via-muted/50 to-background`}
      style={spacingStyles}
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Header — each piece is gated on its show-* flag so authors
            can keep the value on the doc but hide it on render. */}
        {((showHeadline && headline) || (showDescription && description)) && (
          <div className="text-center mb-12">
            {showHeadline && headline && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 relative">
                <span className="absolute -top-2 -left-2 w-6 h-6 bg-muted/70 rounded-full blur-sm"></span>
                {headline}
              </h2>
            )}
            {showDescription && description && (
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Search */}
        {searchable && (
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        )}

        {/* Content */}
        {layout === "accordion" && renderAccordion()}
        {layout === "grid" && renderGrid()}
        {layout === "tabs" && renderTabs()}

        {/* No results */}
        {filteredFaqs.length === 0 &&
          (searchQuery || activeCategory !== "all") && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No FAQs found matching your criteria.</p>
            </div>
          )}
      </div>
    </section>
  );
}

export default FaqSection;
