import { NextResponse } from "next/server";
import { getApiDomain } from "@repo/utils/server/domain";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";

/**
 * Issue a math challenge from the upstream content service.
 *
 * The challenge encodes its operands into a server-signed seed so
 * the answer can be validated without per-session state. We just
 * pass-through here — the form fetches this on mount.
 */
export async function GET() {
  try {
    const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
    const tenantId = middleware?.tenantId;
    const apiDomain = await getApiDomain();
    const upstream = `${apiDomain.replace(/\/$/, "")}/content/public/contact/challenge`;

    const res = await fetch(upstream, {
      method: "GET",
      headers: {
        ...(tenantId ? { "x-tenant-id": tenantId } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type":
          res.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, errorCode: "CHALLENGE_FETCH_FAILED" },
      { status: 502 },
    );
  }
}
