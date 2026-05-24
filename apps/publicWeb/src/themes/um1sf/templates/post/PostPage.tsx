import React from "react";
import { ArticlePage } from "./ArticlePage";
import { EventPage } from "./EventPage";
import { ErrorPage } from "../../../../feature-components/error/ErrorPage";

interface PostPageProps {
  post?: any;
  categories?: any[];
  tags?: any[];
  related?: any[];
  currentLanguage?: "en" | "mm";
  crumbs?: Array<{ label: string; href?: string }>;
  slug?: string;
}

/**
 * um1sf post-page dispatcher — same prop shape as the default
 * theme's PostPage so the route can swap them via
 * `getThemeTemplates(themeName).PostPage`. Branches on
 * `post.postTypeSlug`:
 *
 *   - `events` / `event` → um1sf EventPage
 *   - everything else    → um1sf ArticlePage
 */
export function PostPage({
  post,
  categories,
  tags,
  related,
  currentLanguage = "en",
  crumbs,
  slug,
}: PostPageProps) {
  if (!post) {
    return (
      <ErrorPage
        type="page"
        title="Post Not Found"
        message={
          slug
            ? `The post "${slug}" could not be found.`
            : "The requested post could not be found."
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
    />
  );
}

export default PostPage;
