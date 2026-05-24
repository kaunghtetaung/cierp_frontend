import React from "react";
import { SectionRenderer } from "../section";
import { PageLayoutRenderer } from "./PageLayoutRenderer";
import { getMessages } from "../../lib/messages";

interface HomePageProps {
  tenantId: string;
  currentLanguage?: "en" | "mm";
  homePage: any; // Page data
  sections: any[]; // Sections data
}

/**
 * Home Page Template
 * Renders the home page using provided page data and sections
 */
export async function HomePage({
  tenantId,
  currentLanguage = "en",
  homePage,
  sections,
}: HomePageProps) {
  const t = getMessages(currentLanguage);

  if (!homePage) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            {t.homePage.notFoundTitle}
          </h1>
          <p className="text-destructive/80 mb-2">
            {t.homePage.notFoundMessage}
          </p>
          <p className="text-destructive/70">{t.homePage.notFoundHint}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Page Header (optional, based on page settings) */}
      {homePage.showPageHeader && (
        <div className="bg-gradient-to-r from-muted/30 via-background to-muted/30 py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              {homePage.title[currentLanguage] || homePage.title.en}
            </h1>
            {homePage.description && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {homePage.description[currentLanguage] ||
                  homePage.description.en}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Page Sections — page-builder tree if authored, else flat fallback */}
      {homePage.layout || sections.length > 0 ? (
        <PageLayoutRenderer
          layout={homePage.layout}
          allSections={sections}
          fallbackSections={sections}
          currentLanguage={currentLanguage}
          // Home page opts in to alternating-band zebra stripes so
          // adjacent marketing sections read as separate bands.
          // Other pages (about, faculty, post detail) render flat.
          striped
        />
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-24">
          <div className="text-center p-12 bg-muted/50 rounded-xl border border-border">
            <h2 className="text-3xl font-semibold text-foreground mb-4">
              {t.homePage.welcomeTitle}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t.homePage.welcomeMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
