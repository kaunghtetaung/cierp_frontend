import React from "react";
import { SectionRenderer, getProcessedSections } from "../section";
import { PageLayoutRenderer } from "@/themes/default/templates/page/PageLayoutRenderer";
import { PostContentProvider } from "@/themes/default/templates/section/post-body/PostContentContext";
import PostBodySection from "@/themes/default/templates/section/post-body/PostBodySection";
import { PageHeader } from "./PageHeader";

interface ContentPageProps {
  tenantId?: string;
  currentLanguage?: "en" | "mm";
  page?: any;
  sections?: any[];
  slug?: string;
}

/**
 * um1sf generic content page (about, faculty, etc).
 *
 * Two render paths:
 *   1. Page has a layout tree (`page.layout`, possibly merged from a
 *      wrapper template by the route) → walk it via
 *      `PageLayoutRenderer`, dispatching each section through um1sf's
 *      own `SectionRenderer` so per-type overrides (Hero, FeatureList,
 *      Stats, …) still apply inside the column grid.
 *   2. No layout tree → fall through to the legacy flat-section
 *      stack via um1sf's `SectionRenderer`.
 *
 * In both cases we wrap with `PostContentProvider` so a `postBody`
 * section anywhere in the tree can pull this page's body from
 * context. ThemeLayout supplies the surrounding header / footer.
 */
export async function ContentPage({
  currentLanguage = "en",
  page,
  sections,
}: ContentPageProps) {
  const list = sections ?? [];
  const processed = getProcessedSections(list);

  const title = page?.title?.[currentLanguage] ?? page?.title?.en;
  const description =
    page?.description?.[currentLanguage] ?? page?.description?.en;

  const layout = (page as any)?.layout;
  const hasLayoutTree =
    !!layout?.containers?.length &&
    layout.containers.some(
      (c: any) => Array.isArray(c.rows) && c.rows.length > 0,
    );

  // Build the breadcrumb chain. We don't currently fetch ancestor
  // titles (would need an extra round-trip per crumb), so for now
  // the chain is `Home → [current title]`. When `page.path` ancestry
  // resolution is wired up, append intermediate ancestors here.
  const crumbs = title
    ? [
        { label: currentLanguage === "mm" ? "ပင်မ" : "Home", href: "/" },
        { label: title },
      ]
    : undefined;

  return (
    <PostContentProvider
      value={(() => {
        // Resolve body channel. The page editor's "Tiptap body"
        // mode saves into `bodyTiptap` (PM JSON, per language);
        // legacy pages keep HTML in `content`; post-as-page docs
        // use `body`. Preference order:
        //   1. bodyTiptap → render as Tiptap JSON
        //   2. body       → HTML (newer post-as-page pattern)
        //   3. content    → HTML (legacy Page collection)
        const p: any = page;
        if (p?.bodyTiptap && (p.bodyTiptap.en || p.bodyTiptap.mm)) {
          return {
            body: p.bodyTiptap,
            contentFormat: 'json' as const,
            title: p.title,
          };
        }
        return {
          body: (p?.body as any) ?? (p?.content as any) ?? {},
          contentFormat: (p?.contentFormat as any) ?? 'html',
          title: p?.title,
        };
      })()}
    >
      {/* `flex-1 flex flex-col` lets this wrapper absorb the
           leftover height inside um1sf's `<main flex-1 flex>` on
           short pages — without it, PageHeader + body-wrapper take
           only their natural height and a large dead gap forms
           between the content and the footer. */}
      <div className="w-full flex-1 flex flex-col">
        <PageHeader
          title={title}
          description={description}
          crumbs={crumbs}
          showTitle={page?.showTitle !== false}
          showBreadcrumbs={page?.showBreadcrumbs !== false}
        />
        {/* Body wrapper — flex-1 absorbs the rest of the page so the
             footer sits comfortably below short content instead of
             leaving a big dead space. Top padding gives separation
             from the themed header band; bottom padding is a small
             buffer above the footer. */}
        <div className="flex-1 pt-10 md:pt-14 lg:pt-16 pb-6 md:pb-8">
          {hasLayoutTree ? (
            <PageLayoutRenderer
              layout={layout as any}
              allSections={list as any}
              fallbackSections={processed as any}
              currentLanguage={currentLanguage}
              RendererComponent={SectionRenderer}
            />
          ) : processed.length > 0 ? (
            <SectionRenderer
              sections={processed}
              currentLanguage={currentLanguage}
            />
          ) : (
            // Pure-body fallback: no template, no own layout, no
            // section refs — the author wrote a Tiptap body and
            // expected it to just show. `PostBodySection` reads the
            // body out of `PostContentProvider` context (already set
            // above) and renders it via the same prose styling that
            // the template-wrapped path uses. Centered with a
            // readable measure so long body text doesn't sprawl
            // edge-to-edge inside the um1sf shell.
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
              <PostBodySection currentLanguage={currentLanguage} />
            </div>
          )}
        </div>
      </div>
    </PostContentProvider>
  );
}

export default ContentPage;
