import React from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getApiDomain } from "@repo/utils/server";
import { createHttpClient } from "@repo/api/client";
// `getPost` is the public alias for `getPostBySlug` exported from
// the `@repo/post` barrel. The barrel does NOT re-export the
// underlying `getPostBySlug` symbol, so importing it directly fails
// at runtime with "is not a function".
import { getPost, getRelatedPosts } from "@repo/post";
import { getContentSettings } from "@repo/content";
import { isKnownTheme } from "@repo/types";
import { getThemeTemplates, type ThemeName } from "@/themes";
import { ErrorPage } from "../../../../../feature-components/error";

/**
 * Site-wide taxonomy fetcher — pulls every Active category / tag
 * for the tenant so the post sidebar can render the same widgets
 * the CategoryList / TagList page sections render (taxonomy
 * navigation rather than per-post chips). Mirrors the fetch logic
 * inside those section components but lives here so the post route
 * owns its own data — `PostSidebar` stays "dumb" (just renders the
 * arrays it receives).
 */
async function fetchTaxonomy(
  tenantId: string,
  resource: "categories" | "tags",
  limit = 30,
): Promise<any[]> {
  try {
    const apiDomain = await getApiDomain();
    const httpClient = createHttpClient({
      baseURL: apiDomain,
      enableAuth: true,
      timeout: 10_000,
    });
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    // Anonymous taxonomy fetch — /public sibling pins status: 'Active'
    // server-side so we don't need to send it.
    const response: any = await httpClient.request(
      `/content/${resource}/public?${params.toString()}`,
      { method: "GET", tenantId, withAuth: false },
    );
    if (!response?.success) return [];
    let data: any = response.data;
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      "data" in data
    ) {
      data = data.data;
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(
      `[PostTypeSlugPage] fetchTaxonomy(${resource}) failed:`,
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

// Dynamic — pulls headers + per-tenant data
export const dynamic = "force-dynamic";

interface PostTypeSlugPageProps {
  params: Promise<{
    type: string;
    slug: string;
  }>;
}

/**
 * Public post-detail page.
 *
 * Pattern mirrors `(cms)/[slug]/page.tsx`:
 *   1. Resolve tenant + active theme from `getContentSettings`.
 *   2. Fetch the post by slug + light ancillaries (related posts).
 *      Categories/tags ride along on the post payload when populated.
 *   3. Build a `Home → /[type] → [title]` breadcrumb chain.
 *   4. Dispatch to the active theme's `PostPage` component, which
 *      branches between Article and Event templates internally.
 *
 * `params.type` segments off URL prettiness (`/post/news/foo`); the
 * authoritative discriminator is `post.postTypeSlug` returned by the
 * API. We don't 404 on type mismatch — admins might rename the type
 * slug and old URLs still resolve.
 */
export default async function PostTypeSlugPage({
  params,
}: PostTypeSlugPageProps) {
  const { type, slug } = await params;

  try {
    const middleware = await getMiddlewareDataFromHeaders();
    const tenantId = middleware.tenantId;
    const currentLanguage = middleware.language as "en" | "mm";

    if (!tenantId) {
      return (
        <ErrorPage
          type="critical"
          title="Configuration Error"
          message="Unable to determine tenant configuration. Please check your setup."
          showRetry={false}
        />
      );
    }

    // Resolve theme — Settings.themeName wins, with `default` fallback.
    let themeName: ThemeName = "default";
    try {
      const contentSettings = await getContentSettings(tenantId);
      const candidate = (contentSettings as any)?.themeName;
      if (candidate && isKnownTheme(candidate)) {
        themeName = candidate as ThemeName;
      }
    } catch (err) {
      console.warn(
        "PostTypeSlugPage: theme resolution failed; using default",
        err,
      );
    }
    const { PostPage } = getThemeTemplates(themeName);

    // Fetch the post (slug only — backend resolves the type from the doc).
    // Log the underlying error explicitly when the fetch fails so the
    // root cause (404 / auth / network) surfaces in server logs;
    // returning `null` keeps the user-facing "Post Not Found" UI
    // identical regardless of the failure mode.
    const post = await getPost(slug, true).catch((err: unknown) => {
      console.warn(
        `[PostTypeSlugPage] getPost("${slug}") failed:`,
        err instanceof Error ? err.message : err,
      );
      return null;
    });

    // Best-effort related-posts fetch. Failure is non-critical; the
    // sidebar just hides the widget when the list is empty.
    const related = post
      ? await getRelatedPosts(post as any, 5).catch(() => [])
      : [];

    // Categories / tags — site-wide taxonomy fetched fresh from the
    // gateway so the post sidebar shows the same data as the
    // CategoryList / TagList page-builder sections (full taxonomy
    // navigation), not the current post's own ids. Both fetches run
    // in parallel and degrade to `[]` on failure (sidebar then hides
    // the empty widget).
    const [categories, tags] = await Promise.all([
      fetchTaxonomy(tenantId, "categories"),
      fetchTaxonomy(tenantId, "tags"),
    ]);

    const titleStr = post
      ? (post as any).title?.[currentLanguage] || (post as any).title?.en
      : slug;

    // Crumb chain: Home → /post → /[type] (label-cased) → current title.
    // Type label uses the URL segment so visitors see the same word
    // they clicked. Casing is light-touch (capitalize first letter).
    const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Post";
    const crumbs: Array<{ label: string; href?: string }> = [
      { label: currentLanguage === "mm" ? "ပင်မ" : "Home", href: "/" },
      { label: typeLabel, href: `/post/${type}` },
      { label: titleStr || slug },
    ];

    return (
      <PostPage
        post={post}
        categories={categories}
        tags={tags}
        related={related}
        currentLanguage={currentLanguage}
        crumbs={crumbs}
        slug={slug}
      />
    );
  } catch (error) {
    console.error("Error in PostTypeSlugPage:", error);
    return (
      <ErrorPage
        type="page"
        title="Error Loading Post"
        message={`There was an error loading the post "${slug}". Please try refreshing the page or contact support if the problem persists.`}
        debugInfo={error instanceof Error ? error.message : String(error)}
      />
    );
  }
}
