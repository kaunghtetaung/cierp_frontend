import React from "react";
import { getPageBySlug, getPageSections } from "@repo/page";
import { SectionRenderer } from "../section";
import { InteractiveButtons } from "./InteractiveButtons";
import { ErrorPage } from "../../../../feature-components/error/ErrorPage";

interface ContentPageProps {
  slug: string;
  tenantId: string;
  currentLanguage?: "en" | "mm";
}

/**
 * Content Page Template
 * Renders any content page using page data and sections
 */
export async function ContentPage({
  slug,
  tenantId: _tenantId,
  currentLanguage = "en",
}: ContentPageProps) {
  try {
    // Fetch page data
    const page = await getPageBySlug(slug);
    const sections = await getPageSections(slug);

    if (!page) {
      return (
        <ErrorPage
          type="page"
          title="Page Not Found"
          message="The requested page could not be found."
          showRetry={false}
          showHome={true}
        />
      );
    }

    return (
      <div className="content-page">
        {/* Page Header */}
        <div className="py-16 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {page.title[currentLanguage] || page.title.en}
            </h1>
            {page.excerpt && (
              <p className="text-lg text-muted-foreground mb-8">
                {page.excerpt[currentLanguage] || page.excerpt.en}
              </p>
            )}
          </div>
        </div>

        {/* Page Content */}
        {page.content && (
          <div className="py-12">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{
                  __html: page.content[currentLanguage] || page.content.en,
                }}
              />
            </div>
          </div>
        )}

        {/* Page Sections */}
        {sections.length > 0 && (
          <SectionRenderer
            sections={sections}
            currentLanguage={currentLanguage}
            className="page-sections"
          />
        )}
      </div>
    );
  } catch (error) {
    console.error("Error loading content page:", error);

    return (
      <ErrorPage
        type="service"
        title="Unable to Load Page"
        message={`There was an error loading the page content for "${slug}".`}
        showRetry={true}
        showHome={true}
        debugInfo={error instanceof Error ? error.message : String(error)}
      />
    );
  }
}

export default ContentPage;
