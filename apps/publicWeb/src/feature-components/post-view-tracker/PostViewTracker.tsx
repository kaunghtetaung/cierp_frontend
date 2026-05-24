"use client";

/**
 * <PostViewTracker> — client-side beacon that fires exactly one
 * view-count bump per (visitor, post) per cookie TTL.
 *
 * Best-practice gates layered to filter noise:
 *   1. Renders only on the client → most bots/SSR crawlers skip it.
 *   2. IntersectionObserver → at least 50% of the post body has to be
 *      in the viewport. Drive-by previews and link unfurls don't fire.
 *   3. Dwell timer → visible continuously for ≥ DWELL_MS before we
 *      bump. Filters quick "wrong post, back out" hits.
 *   4. Cookie dedupe → `pv_<postId>` is set for COOKIE_TTL_HOURS so a
 *      visitor refreshing or revisiting the same post within the
 *      window doesn't keep inflating the count.
 *   5. requestIdleCallback → bump happens after the page is otherwise
 *      idle so we never compete with content rendering.
 *
 * Mount this once inside the post body container (ArticlePage /
 * EventPage). The anchor div is invisible & zero-height so it doesn't
 * shift the layout.
 */
import { useEffect, useRef } from "react";
import { bumpPostView } from "@/app/(cms)/post/[type]/[slug]/view-action";

interface PostViewTrackerProps {
  postId: string;
  slug: string;
}

const COOKIE_TTL_HOURS = 12;
const DWELL_MS = 2_000;
const VISIBILITY_THRESHOLD = 0.5;

function hasViewCookie(postId: string): boolean {
  if (typeof document === "undefined") return false;
  const name = `pv_${postId}=`;
  return document.cookie.split(";").some((c) => c.trim().startsWith(name));
}

function setViewCookie(postId: string) {
  if (typeof document === "undefined") return;
  // No `Secure` flag here intentionally — dev runs over http://. In
  // prod the cookie is fine without it; the value is a meaningless `1`
  // that doesn't grant any privilege.
  const maxAge = COOKIE_TTL_HOURS * 60 * 60;
  document.cookie = `pv_${postId}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function scheduleIdle(cb: () => void) {
  if (typeof window === "undefined") return;
  const ric = (window as any).requestIdleCallback as
    | ((fn: () => void, opts?: { timeout: number }) => number)
    | undefined;
  if (ric) {
    ric(cb, { timeout: 2_000 });
  } else {
    setTimeout(cb, 100);
  }
}

export function PostViewTracker({ postId, slug }: PostViewTrackerProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  // Guard against StrictMode double-mounts in dev and concurrent
  // observer fires racing each other.
  const firedRef = useRef(false);

  useEffect(() => {
    if (!postId || !slug) return;
    if (firedRef.current) return;
    if (hasViewCookie(postId)) {
      firedRef.current = true;
      return;
    }
    const node = anchorRef.current;
    if (!node) return;

    let dwellTimer: ReturnType<typeof setTimeout> | null = null;

    const fireBump = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      setViewCookie(postId);
      scheduleIdle(() => {
        // Server action; result intentionally ignored. The action
        // itself swallows errors so this never rejects.
        void bumpPostView(slug);
      });
    };

    // IO check + dwell timer.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const visible =
            entry.isIntersecting &&
            entry.intersectionRatio >= VISIBILITY_THRESHOLD;
          if (visible) {
            if (!dwellTimer && !firedRef.current) {
              dwellTimer = setTimeout(fireBump, DWELL_MS);
            }
          } else if (dwellTimer) {
            // Scrolled away before dwell completed — reset the timer
            // so a quick scroll-by doesn't accidentally accrue dwell
            // across separate visible spans.
            clearTimeout(dwellTimer);
            dwellTimer = null;
          }
        }
      },
      { threshold: [0, VISIBILITY_THRESHOLD, 1] },
    );
    observer.observe(node);

    // Also fire on tab visibility change while the IO already sees us
    // as visible — covers the case where the post fits in the viewport
    // and the IO entry was emitted on mount before our handler attached.
    const onVisibility = () => {
      if (
        !firedRef.current &&
        !dwellTimer &&
        document.visibilityState === "visible" &&
        anchorRef.current
      ) {
        const rect = anchorRef.current.getBoundingClientRect();
        const onScreen =
          rect.top < window.innerHeight && rect.bottom > 0 && rect.height > 0;
        if (onScreen) {
          dwellTimer = setTimeout(fireBump, DWELL_MS);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (dwellTimer) clearTimeout(dwellTimer);
    };
  }, [postId, slug]);

  return <div ref={anchorRef} aria-hidden style={{ height: 0, width: 0 }} />;
}

export default PostViewTracker;
