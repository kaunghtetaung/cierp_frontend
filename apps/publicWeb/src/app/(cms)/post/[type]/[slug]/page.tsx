import React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getApiDomain } from "@repo/utils/server";
import { createHttpClient } from "@repo/api/client";
import { buildContentMetadata } from "@/themes/default/lib/seo-metadata";
// `getPost` is the public alias for `getPostBySlug` exported from
// the `@repo/post` barrel. The barrel does NOT re-export the
// underlying `getPostBySlug` symbol, so importing it directly fails
// at runtime with "is not a function".
import { getPost, getRelatedPosts } from "@repo/post";
import { getContentSettings } from "@repo/content";
import { isKnownTheme } from "@repo/types";
import { getThemeTemplates, type ThemeName } from "@/themes";
import { ErrorPage } from "../../../../../feature-components/error";
import { PasswordGate } from "@/feature-components/password-gate/PasswordGate";
import { cookieNameFor, decryptPassword } from "@/lib/post-unlock";

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

/**
 * Try to unlock a Password-protected post using the previously-stored
 * `pw_<postId>` cookie. If the cookie is present and decryptable, we
 * re-call `POST /content/post/slug/:slug/access` with the cached
 * password and return the unredacted body. Any failure (missing cookie,
 * tampered value, wrong password against rotated post password) is
 * silently treated as "still locked" so the gate re-renders.
 */
async function tryUnlockWithCookie(
  slug: string,
  postId: string,
  tenantId: string,
): Promise<any | null> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(cookieNameFor(postId))?.value;
  const password = decryptPassword(stored);
  if (!password) return null;
  try {
    const apiDomain = await getApiDomain();
    const httpClient = createHttpClient({
      baseURL: apiDomain,
      enableAuth: false,
      timeout: 10_000,
    });
    const resp: any = await httpClient.request(
      `/content/post/slug/${encodeURIComponent(slug)}/access`,
      {
        method: "POST",
        tenantId,
        withAuth: false,
        body: { password },
      },
    );
    const unlocked =
      (resp?.data && (resp.data as any)._id && resp.data) ||
      (resp && (resp as any)._id ? resp : null);
    return unlocked;
  } catch (err) {
    console.warn(
      `[PostTypeSlugPage] cookie unlock failed for slug='${slug}':`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

interface PostTypeSlugPageProps {
  params: Promise<{
    type: string;
    slug: string;
  }>;
}

/**
 * Per-route SEO metadata for post detail pages. Pulls `metaTitle`,
 * `metaDescription`, `metaKeywords` straight off the post doc (with
 * title/excerpt fallback) so news/announcement/blog posts get proper
 * search-result + social-card surfaces.
 */
export async function generateMetadata({
  params,
}: PostTypeSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
  const language = (middleware?.language as "en" | "mm") || "en";
  const post = await getPost(slug, false).catch(() => null);
  return buildContentMetadata(post as any, {
    language,
    fallbackTitle: slug,
    ogType: "article",
  });
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
    let post: any = await getPost(slug, true).catch((err: unknown) => {
      console.warn(
        `[PostTypeSlugPage] getPost("${slug}") failed:`,
        err instanceof Error ? err.message : err,
      );
      return null;
    });

    // Password-protected post → try to swap in the unredacted version
    // using the visitor's previously-set unlock cookie. If the swap
    // succeeds, the rest of the route renders the full post normally.
    // If it doesn't, we leave `post` as the redacted form so the gate
    // below can render with the title/feature image still intact.
    let needsGate = false;
    if (post && (post as any).visibility === "Password" && post._id) {
      const unlocked = await tryUnlockWithCookie(
        slug,
        String(post._id),
        tenantId,
      );
      if (unlocked) {
        post = unlocked;
      } else {
        needsGate = true;
      }
    }

    // Best-effort related-posts fetch. Failure is non-critical; the
    // sidebar just hides the widget when the list is empty. Skip when
    // the post is still locked — we have no taxonomy ids to suggest by
    // and the gate page shouldn't tease "related" content.
    const related =
      post && !needsGate
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

    if (needsGate && post) {
      // Reuse the theme's PostPage shell so the gate sits inside the
      // normal hero / header / sidebar chrome — visitors see the post
      // title and feature image but the body slot is replaced with the
      // PasswordGate form. We pass a redacted post (body stripped by
      // the backend interceptor) so the template renders title/image
      // safely; the gate component handles its own messaging.
      return (
        <PostPage
          post={post}
          categories={categories}
          tags={tags}
          related={[]}
          currentLanguage={currentLanguage}
          crumbs={crumbs}
          slug={slug}
          bodySlot={
            <PasswordGate
              postId={String((post as any)._id)}
              slug={slug}
              type={type}
              title={titleStr}
              currentLanguage={currentLanguage}
            />
          }
        />
      );
    }

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
