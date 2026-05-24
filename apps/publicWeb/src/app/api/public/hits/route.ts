import { NextRequest, NextResponse } from "next/server";
import { getApiDomain } from "@repo/utils/server/domain";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";

/**
 * Public hit-counter proxy.
 *
 * The browser hits same-origin (`/api/public/hits`) so we don't have
 * to expose the gateway URL or wrestle with cross-origin cookie
 * rules. This route stamps the visitor's IP onto `x-forwarded-for`
 * (so geoip lookup runs on the actual client, not on the
 * publicWeb→gateway hop), pulls `x-tenant-id` from the resolved
 * tenant, and forwards to the content service.
 *
 * We always return 204 — counter failures must never surface as
 * errors on the page that called us.
 */
export async function POST(request: NextRequest) {
  try {
    const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
    const tenantId = middleware?.tenantId;
    if (!tenantId) {
      console.warn("[hits-proxy] no tenantId resolved from middleware");
      return new NextResponse(null, { status: 204 });
    }

    const body = await request.text();

    // Pick the visitor's IP from whatever the upstream proxy gave us.
    // The left-most XFF entry is the original client; if absent we
    // fall back to the connection IP (request.ip on Vercel, or
    // x-real-ip via nginx).
    const xff = request.headers.get("x-forwarded-for") || "";
    const realIp =
      request.headers.get("x-real-ip") ||
      (request as unknown as { ip?: string }).ip ||
      "";
    const clientIp = xff.split(",")[0]?.trim() || realIp;

    const apiDomain = await getApiDomain();
    const upstream = `${apiDomain.replace(/\/$/, "")}/content/public/hits`;

    // Await + status-check so a guard rejection (e.g. 401 from a
    // gateway that hasn't picked up the public-paths allowlist) is
    // visible in publicWeb logs instead of being silently swallowed.
    // We still return 204 to the browser — counter failures must
    // never surface to the page that called us — but we now LOG.
    try {
      const upstreamRes = await fetch(upstream, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          ...(clientIp ? { "x-forwarded-for": clientIp } : {}),
        },
        body: body || "{}",
        signal: AbortSignal.timeout(5000),
      });
      if (!upstreamRes.ok && upstreamRes.status !== 204) {
        console.warn(
          `[hits-proxy] upstream ${upstream} returned ${upstreamRes.status} for tenant=${tenantId}`,
        );
      }
    } catch (err) {
      console.warn(
        `[hits-proxy] upstream POST failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.warn(
      `[hits-proxy] handler error: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return new NextResponse(null, { status: 204 });
  }
}
