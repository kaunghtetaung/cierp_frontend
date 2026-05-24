import { NextRequest, NextResponse } from "next/server";
import { getApiDomain } from "@repo/utils/server/domain";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getCurrentUser } from "@repo/auth/server";

/**
 * Public contact-form proxy.
 *
 * Browser POSTs same-origin (`/api/public/contact`); we resolve the
 * tenantId from middleware headers, attach the visitor's IP onto
 * `x-forwarded-for`, and forward to the content service. When the
 * caller is authenticated we also stamp `x-user-id` so the saved
 * record links back to the user account.
 *
 * Errors from the upstream are returned to the browser verbatim
 * (status + body) so the form can show "verification failed" vs
 * "generic error" feedback distinctly.
 */
export async function POST(request: NextRequest) {
  try {
    const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
    const tenantId = middleware?.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, errorCode: "TENANT_ID_REQUIRED" },
        { status: 400 },
      );
    }

    const body = await request.text();

    const xff = request.headers.get("x-forwarded-for") || "";
    const realIp =
      request.headers.get("x-real-ip") ||
      (request as unknown as { ip?: string }).ip ||
      "";
    const clientIp = xff.split(",")[0]?.trim() || realIp;

    // Stamp the user id when authenticated so the upstream service
    // can persist a userId on the saved message. Anonymous callers
    // are still allowed — the gateway frontend (and this proxy)
    // gate the SUBMIT button at the form level, but nothing in the
    // backend hard-rejects an anonymous payload.
    const user = await getCurrentUser().catch(() => null);
    const userId = user ? (user as any).id : "";

    const apiDomain = await getApiDomain();
    const upstream = `${apiDomain.replace(/\/$/, "")}/content/public/contact`;

    const upstreamRes = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
        ...(clientIp ? { "x-forwarded-for": clientIp } : {}),
        ...(userId ? { "x-user-id": String(userId) } : {}),
      },
      body: body || "{}",
      signal: AbortSignal.timeout(10_000),
    });

    const upstreamBody = await upstreamRes.text();
    return new NextResponse(upstreamBody, {
      status: upstreamRes.status,
      headers: {
        "Content-Type":
          upstreamRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.warn(
      `[contact-proxy] handler error: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return NextResponse.json(
      { success: false, errorCode: "CONTACT_PROXY_ERROR" },
      { status: 500 },
    );
  }
}
