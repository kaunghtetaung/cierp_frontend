"use client";

import React, { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/styled-components/ui/Button";
import { FaqSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";

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

  const [openItems, setOpenItems] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const headline = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : null;

  const description = section.description
    ? getLocalizedText(section.description, currentLanguage)
    : null;

  if (!faqs || faqs.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-background via-muted/50 to-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No FAQs Available
            </h3>
            <p className="text-muted-foreground">
              Frequently asked questions will be displayed here when available.
            </p>
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
    <div className="space-y-4">
      {filteredFaqs.map((faq, index) => {
        const isOpen = openItems.includes(index);
        return (
          <div
            key={index}
            className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300"
          >
            <Button
              variant="ghost"
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
              onClick={() => toggleItem(index)}
            >
              <span className="font-semibold text-foreground pr-4">
                {getLocalizedText(faq.question, currentLanguage)}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-primary transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
            {isOpen && (
              <div className="px-6 pb-4 text-muted-foreground leading-relaxed border-t border-border bg-muted/30">
                <div className="pt-4">
                  {getLocalizedText(faq.answer, currentLanguage)}
                </div>
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
          <h3 className="font-semibold text-foreground mb-4">
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
      className="py-16 bg-gradient-to-b from-background via-muted/50 to-background"
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        {(headline || description) && (
          <div className="text-center mb-12">
            {headline && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 relative">
                <span className="absolute -top-2 -left-2 w-6 h-6 bg-muted/70 rounded-full blur-sm"></span>
                {headline}
              </h2>
            )}
            {description && (
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
