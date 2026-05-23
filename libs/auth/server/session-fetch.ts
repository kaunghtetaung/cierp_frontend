/**
 * Session-aware content fetch helper for publicWeb.
 *
 * publicWeb is "anonymous read" by default — it hits the `/content/*…/public`
 * endpoints with `withAuth: false`. That path serves only `Public` content;
 * Private / Protected / Password posts are intentionally filtered out
 * server-side.
 *
 * When a visitor IS logged in (cookie session present), we want them to
 * also see the Private / Protected / Password rows their role / group /
 * membership grants. The backend's authenticated routes
 * (`/content/post/slug/:slug`, `/content/post`, etc.) already apply the
 * `VisibilityInterceptor` against the request's user context — that's the
 * canonical filter — so all we need on the frontend is to switch the
 * endpoint + ship the token when the session exists.
 *
 * `resolveAuthMode()` is the single decision point. Each fetch site picks
 * its URL + httpClient options from the returned mode. The session lookup
 * itself is cached for the request via `getAuthenticationStatus`'s
 * `react.cache` wrapper so calling it from every section/loader is cheap.
 *
 * Lives in `@repo/auth` (not `@repo/utils`) because `@repo/utils` cannot
 * depend on `@repo/auth` — `@repo/auth` already depends on `@repo/utils`,
 * and pnpm flags the reverse direction as a cyclic workspace dep.
 */
import { getAuthenticationStatus } from "./server-api";

export interface AuthMode {
  /** True when the current request carries a valid session cookie. */
  authenticated: boolean;
  /** Strict-typed flag passed straight into `httpClient.request`. */
  withAuth: boolean;
  /**
   * Token-source strategy for the http client. Only set when
   * `authenticated`. `'auto'` lets the client pull from the session
   * cookie via the standard server-API helpers.
   */
  tokenStrategy?: "auto";
  /** The authenticated user id, or null when anonymous. */
  userId: string | null;
}

/**
 * Read once per request whether the visitor is authenticated. Memoised by
 * `getAuthenticationStatus`'s React `cache()` so call cost is one
 * cookie-decode per request even when many loaders consult it.
 *
 * Swallows lookup errors and falls back to anonymous mode — a broken
 * session validator should not take down the public site.
 */
export async function resolveAuthMode(): Promise<AuthMode> {
  try {
    const status = await getAuthenticationStatus();
    if (status?.isAuthenticated && status.user) {
      return {
        authenticated: true,
        withAuth: true,
        tokenStrategy: "auto",
        userId: status.user.id ?? null,
      };
    }
  } catch {
    // Anonymous fallback below.
  }
  return {
    authenticated: false,
    withAuth: false,
    userId: null,
  };
}

/**
 * Pick the right endpoint for a content read. When authenticated we hit
 * the bare admin/auth route (VisibilityInterceptor applies role-based
 * filtering server-side). When anonymous we hit the `/public` sibling
 * (server forces `visibility: 'Public'`).
 *
 * `publicPath` and `authedPath` are taken as arguments rather than
 * computed because the paths often differ in more than the suffix
 * (e.g. `/content/post/slug/:slug/public` vs `/content/post/slug/:slug`,
 * or `/content/post/public?postTypeSlug=x` vs `/content/post?postTypeId=…`).
 */
export function pickContentPath(
  mode: AuthMode,
  paths: { authed: string; publicAnon: string },
): string {
  return mode.authenticated ? paths.authed : paths.publicAnon;
}
