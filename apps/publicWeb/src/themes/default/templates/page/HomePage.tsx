import React from "react";
import { SectionRenderer } from "../section";

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
  if (!homePage) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Home Page Not Found
          </h1>
          <p className="text-destructive/80 mb-2">
            The home page has not been configured for this tenant.
          </p>
          <p className="text-destructive/70">
            Please contact the administrator to set up the home page.
          </p>
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

      {/* Page Sections */}
      {sections.length > 0 ? (
        <SectionRenderer
          sections={sections}
          currentLanguage={currentLanguage}
          className="w-full"
        />
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-24">
          <div className="text-center p-12 bg-muted/50 rounded-xl border border-border">
            <h2 className="text-3xl font-semibold text-foreground mb-4">
              Welcome
            </h2>
            <p className="text-lg text-muted-foreground">
              This home page is ready for content. Add sections to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
