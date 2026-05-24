import React from "react";
import { ArticlePage } from "./ArticlePage";
import { EventPage } from "./EventPage";
import { ErrorPage } from "../../../../feature-components/error/ErrorPage";
import { getMessages } from "../../lib/messages";

interface PostPageProps {
  post?: any;
  categories?: any[];
  tags?: any[];
  related?: any[];
  currentLanguage?: "en" | "mm";
  crumbs?: Array<{ label: string; href?: string }>;
  /** Slug for the not-found message; the route passes the URL slug. */
  slug?: string;
  /**
   * Optional replacement for the post body slot. Used by the route
   * when a post is `visibility: 'Password'` and locked — instead of
   * rendering the redacted body the route injects a `<PasswordGate>`
   * here so the surrounding chrome (hero, breadcrumbs, sidebar) still
   * renders normally.
   */
  bodySlot?: React.ReactNode;
}

/**
 * Default-theme post-page dispatcher. Branches on `post.postTypeSlug`:
 *
 *   - `events` → EventPage (event-focused chrome)
 *   - everything else (`news`, `announcement`, `article`, `lesson`,
 *     custom types) → ArticlePage
 *
 * The route fetches the post + ancillaries (categories, tags,
 * related) and passes them in; this component is a pure dispatcher
 * with no data fetching of its own. um1sf will register a parallel
 * PostPage with the same prop shape so theme-level swaps work via
 * `getThemeTemplates(themeName).PostPage` like Home / Content pages.
 */
export function PostPage({
  post,
  categories,
  tags,
  related,
  currentLanguage = "en",
  crumbs,
  slug,
  bodySlot,
}: PostPageProps) {
  if (!post) {
    const t = getMessages(currentLanguage);
    return (
      <ErrorPage
        type="page"
        title={t.postPage.notFoundTitle}
        message={
          slug
            ? t.postPage.notFoundMessageWithSlug(slug)
            : t.postPage.notFoundMessage
        }
        showRetry={false}
        showHome={true}
      />
    );
  }

  const typeSlug = (post.postTypeSlug as string) || "article";

  if (typeSlug === "events" || typeSlug === "event") {
    return (
      <EventPage
        post={post}
        categories={categories}
        tags={tags}
        related={related}
        currentLanguage={currentLanguage}
        crumbs={crumbs}
        bodySlot={bodySlot}
      />
    );
  }

  return (
    <ArticlePage
      post={post}
      categories={categories}
      tags={tags}
      related={related}
      currentLanguage={currentLanguage}
      crumbs={crumbs}
      bodySlot={bodySlot}
    />
  );
}

export default PostPage;
