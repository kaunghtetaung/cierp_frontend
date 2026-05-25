import React from "react";
import { sanitizeHtml } from "@repo/utils/common";
import { SectionRenderer } from "../section";
import { PageLayoutRenderer } from "./PageLayoutRenderer";
import { PostContentProvider } from "../section/post-body/PostContentContext";
import PostBodySection from "../section/post-body/PostBodySection";
import { ErrorPage } from "../../../../feature-components/error/ErrorPage";
import { getMessages } from "../../lib/messages";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

interface ContentPageProps {
  tenantId?: string;
  currentLanguage?: "en" | "mm";
  // Pre-fetched in the route so the dispatch can pick the right
  // theme's ContentPage with the same prop shape (matches um1sf).
  page?: any;
  sections?: any[];
  // Slug only for the error message when nothing came back.
  slug?: string;
  /** Optional breadcrumb trail from the route. When omitted, falls
   * back to a `Home → <title>` two-step chain so visitors still get
   * a back link on deep pages. Suppressed entirely on the home page. */
  crumbs?: Crumb[];
}

/**
 * Default-theme generic content page.
 *
 * Renders the layout tree (page.layout — already merged by the route
 * with template.layout for wrapper mode) when present, otherwise
 * falls back to the legacy HTML body + flat-sections render. Wraps
 * with `PostContentProvider` so a `postBody` section anywhere in
 * the tree can pull this page's body out at render time.
 *
 * Data is fetched in the route (mirrors `SafeHomePage`) so the
 * theme dispatcher in `[slug]/page.tsx` can swap in the active
 * theme's ContentPage without two different fetch paths.
 */
export async function ContentPage({
  currentLanguage = "en",
  page,
  sections,
  slug,
  crumbs,
}: ContentPageProps) {
  const t = getMessages(currentLanguage);

  if (!page) {
    return (
      <ErrorPage
        type="page"
        title={t.contentPage.notFoundTitle}
        message={
          slug
            ? t.contentPage.notFoundMessageWithSlug(slug)
            : t.contentPage.notFoundMessage
        }
        showRetry={false}
        showHome={true}
      />
    );
  }

  const list = Array.isArray(sections) ? sections : [];
  const layout = (page as any)?.layout;
  const hasLayoutTree =
    !!layout?.containers?.length &&
    layout.containers.some(
      (c: any) => Array.isArray(c.rows) && c.rows.length > 0,
    );

  // Crumbs: prefer the route-supplied chain, else build a default
  // `Home → <title>` two-step. Suppressed on the home page, where
  // the visitor is already at the root and a "Home → Home" trail is
  // visual noise. `showBreadcrumbs` (page-as-post toggle) lets
  // authors hide the trail entirely on a specific page.
  const resolvedCrumbs: Crumb[] =
    crumbs && crumbs.length > 0
      ? crumbs
      : [
          { label: currentLanguage === "mm" ? "ပင်မ" : "Home", href: "/" },
          {
            label:
              page?.title?.[currentLanguage] || page?.title?.en || slug || "",
          },
        ];
  const showBreadcrumbs =
    page?.showBreadcrumbs !== false && !page?.isHomePage;

  return (
    <div className="content-page">
      {/* Page header (title + excerpt + breadcrumbs). Gated on the
           post's `showTitle` flag — schema-default `true`, authors flip
           it from the page settings sheet to suppress the header
           on templates that paint their own hero band. */}
      {page?.showTitle !== false && (
        <div className="py-16 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {showBreadcrumbs && (
              <div className="flex justify-center mb-6">
                <Breadcrumbs crumbs={resolvedCrumbs} />
              </div>
            )}
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {page.title?.[currentLanguage] || page.title?.en}
            </h1>
            {page.excerpt && (
              <p className="text-lg text-muted-foreground mb-8">
                {page.excerpt?.[currentLanguage] || page.excerpt?.en}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Layout tree takes priority. Falls back to legacy HTML body +
           flat sections when no layout is present.
           Wrap with `PostContentProvider` so a `postBody` section
           inside the layout (typically inside an authored template)
           can pull this page's content out at render time. We accept
           both shapes the page-fetcher may return: `body` for
           post-as-page docs, `content` for legacy Page collection
           docs; `bodyTiptap` (PM JSON) wins over either when set. */}
      {hasLayoutTree ? (
        <PostContentProvider
          value={(() => {
            const p: any = page;
            if (p?.bodyTiptap && (p.bodyTiptap.en || p.bodyTiptap.mm)) {
              return {
                body: p.bodyTiptap,
                contentFormat: "json" as const,
                title: p.title,
              };
            }
            return {
              body: (p?.body as any) ?? (p?.content as any) ?? {},
              contentFormat: (p?.contentFormat as any) ?? "html",
              title: p?.title,
            };
          })()}
        >
          <PageLayoutRenderer
            layout={layout as any}
            allSections={list as any}
            fallbackSections={list as any}
            currentLanguage={currentLanguage}
          />
        </PostContentProvider>
      ) : (
        <PostContentProvider
          value={(() => {
            // Mirror the layout-tree branch's body resolution so a
            // page authored as a pure Tiptap body (no template, no
            // own layout, no section refs) still gets its body
            // rendered through `PostBodySection` below. Without this
            // the fallback path only knew about the LEGACY
            // `page.content` shape and post-as-page docs (which carry
            // body on `page.body`) rendered blank.
            const p: any = page;
            if (p?.bodyTiptap && (p.bodyTiptap.en || p.bodyTiptap.mm)) {
              return {
                body: p.bodyTiptap,
                contentFormat: "json" as const,
                title: p.title,
              };
            }
            return {
              body: (p?.body as any) ?? (p?.content as any) ?? {},
              contentFormat: (p?.contentFormat as any) ?? "html",
              title: p?.title,
            };
          })()}
        >
          {/* Body — `PostBodySection` reads from the context above
              and renders via prose styling. Covers post-as-page docs
              with `body`. */}
          <div className="py-12">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
              <PostBodySection currentLanguage={currentLanguage} />
            </div>
          </div>

          {/* Legacy `page.content` fallback for the old `pages`
              collection docs. Still renders for tenants migrating
              from the old model. */}
          {page.content && !page.body && (
            <div className="py-12">
              <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(
                      page.content[currentLanguage] || page.content.en,
                    ),
                  }}
                />
              </div>
            </div>
          )}

          {list.length > 0 && (
            <SectionRenderer
              sections={list as any}
              currentLanguage={currentLanguage}
              className="page-sections"
            />
          )}
        </PostContentProvider>
      )}
    </div>
  );
}

export default ContentPage;
