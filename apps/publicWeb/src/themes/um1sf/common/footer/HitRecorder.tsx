"use client";

import { useEffect } from "react";

/**
 * Fire-and-forget visitor recorder. Posts a single hit to the public
 * hit-counter endpoint on first mount of the footer for this session,
 * then sets a sessionStorage flag so reloads don't double-count.
 *
 * The endpoint is a same-origin POST (`/api/public/hits`) — the
 * publicWeb's middleware/route layer proxies to the content service
 * with the `x-tenant-id` header already attached, so we don't need to
 * reach across origins or expose the gateway URL to the browser.
 *
 * The component renders nothing. It's deliberately hosted in the
 * footer so it lands at the bottom of the document and doesn't
 * compete with above-the-fold work.
 */
export function HitRecorder() {
  useEffect(() => {
    const KEY = "um1sf:hit-recorded";
    try {
      if (sessionStorage.getItem(KEY)) return;
    } catch {
      // sessionStorage may be disabled (incognito + restrictive
      // settings); fall through and just record this load.
    }

    const controller = new AbortController();
    const t = window.setTimeout(() => {
      // Defer to idle to avoid contending with hydration / above-the-
      // fold rendering work.
      const fire = () => {
        fetch("/api/public/hits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          signal: controller.signal,
          keepalive: true,
        })
          .then((res) => {
            // Only persist the "already recorded" flag when the
            // server confirms it took the hit. Earlier this lived
            // in `.finally()`, which permanently disabled retries
            // for the session even if the request was rejected by
            // an upstream guard or a transient network blip — that
            // hid real bugs (the counter just stayed at 0).
            if (res.ok || res.status === 204) {
              try {
                sessionStorage.setItem(KEY, "1");
              } catch {
                /* sessionStorage may be disabled */
              }
            }
          })
          .catch(() => {
            /* swallow — never surface counter failures */
          });
      };

      const ric = (window as any).requestIdleCallback as
        | ((cb: () => void, opts?: { timeout: number }) => number)
        | undefined;
      if (typeof ric === "function") {
        ric(fire, { timeout: 2000 });
      } else {
        fire();
      }
    }, 200);

    return () => {
      window.clearTimeout(t);
      controller.abort();
    };
  }, []);

  return null;
}

export default HitRecorder;
