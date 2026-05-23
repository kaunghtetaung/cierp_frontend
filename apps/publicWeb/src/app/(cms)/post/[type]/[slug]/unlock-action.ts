"use server";

/**
 * Server action for the password-protected post gate.
 *
 * The flow is intentionally tight:
 *   1. The visitor submits the form rendered by `<PasswordGate />`.
 *   2. We call `POST /content/post/slug/:slug/access` server-side with
 *      the supplied password. The backend timing-safe-compares against
 *      the post's stored password and returns the unredacted doc on
 *      match (or 403 `PASSWORD_REQUIRED` / `INVALID_PASSWORD` otherwise).
 *   3. On success we store the password in an HTTP-only,
 *      AES-256-GCM-encrypted cookie keyed by post id. Subsequent renders
 *      of the post detail route decrypt the cookie and call `/access`
 *      again to fetch the body — meaning visitors don't need to retype
 *      their password while the cookie is valid.
 *
 * The action does not redirect — it returns a structured result so the
 * client can show inline error messaging without losing the typed
 * password on a network blip.
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getApiDomain } from "@repo/utils/server";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { createHttpClient } from "@repo/api/client";
import {
  cookieNameFor,
  encryptPassword,
  UNLOCK_COOKIE_MAX_AGE,
} from "@/lib/post-unlock";

export interface UnlockResult {
  success: boolean;
  /** i18n key the client maps to a localised message. */
  errorCode?: "INVALID_PASSWORD" | "MISSING_PASSWORD" | "NETWORK" | "CONFIG";
}

export async function unlockPost(
  postId: string,
  slug: string,
  type: string,
  password: string,
): Promise<UnlockResult> {
  if (!password) {
    return { success: false, errorCode: "MISSING_PASSWORD" };
  }
  if (!postId || !slug) {
    return { success: false, errorCode: "CONFIG" };
  }

  let tenantId: string | undefined;
  try {
    const middleware = await getMiddlewareDataFromHeaders();
    // `middleware.tenantId` is typed `string | null`; normalise to
    // `string | undefined` so the http-client option type matches.
    tenantId = middleware.tenantId ?? undefined;
  } catch {
    return { success: false, errorCode: "CONFIG" };
  }
  if (!tenantId) {
    return { success: false, errorCode: "CONFIG" };
  }

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
    const ok =
      resp?.success === true ||
      resp?.statusCode === 200 ||
      (resp?.data && (resp.data as any)._id);
    if (!ok) {
      return { success: false, errorCode: "INVALID_PASSWORD" };
    }
  } catch (err: any) {
    // Backend throws 403 PASSWORD_REQUIRED / INVALID_PASSWORD on
    // mismatch; the http client surfaces those as Error with message.
    // Treat anything with a 4xx-ish marker as a bad password rather
    // than a network failure so the user sees the actionable message.
    const msg = String(err?.message ?? "");
    if (
      /password/i.test(msg) ||
      /forbidden/i.test(msg) ||
      /403/.test(msg) ||
      /401/.test(msg)
    ) {
      return { success: false, errorCode: "INVALID_PASSWORD" };
    }
    return { success: false, errorCode: "NETWORK" };
  }

  let encrypted: string;
  try {
    encrypted = encryptPassword(password);
  } catch {
    // Misconfigured POST_UNLOCK_SECRET — we still verified the password
    // successfully, but can't persist the unlock. The caller will see
    // the gate again on next nav; surface as CONFIG so the UI can hint.
    return { success: false, errorCode: "CONFIG" };
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: cookieNameFor(postId),
    value: encrypted,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UNLOCK_COOKIE_MAX_AGE,
  });

  // Force a fresh render of the post page so the route's `getPost` +
  // unlock-aware fetch round-trip picks up the body.
  revalidatePath(`/post/${type}/${slug}`);
  return { success: true };
}
