"use client";

import { useEffect, useState } from "react";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { getMyStaffCompletion } from "@/app/(register)/profileSetup/staff/staff-actions";

interface StaffProfilePrompt {
  /** 0–100 from backend's profile-completion utility */
  percentage: number;
  filledCount: number;
  totalCount: number;
  /** True when there's a staff record that's not yet 100% complete —
   *  the signal to show the "Complete when you have time" nag. */
  needsCompletion: boolean;
  /** True while the initial fetch is in flight (avoid flashing the
   *  nag on first render). */
  loading: boolean;
}

/**
 * Polls `GET /cpms/staffs/me/completion` once when the user lands
 * authenticated. Returns a percentage + a `needsCompletion` flag the
 * header dropdown and `/profile/staff` use to surface "Profile X%
 * complete — finish later".
 *
 * Trigger logic:
 *   - 0%        → user hasn't started staff registration → no nag
 *                 (they might be a student or unrelated user)
 *   - 1-99%     → mini submitted, full not done → show nag
 *   - 100%      → fully populated → no nag
 *
 * The hook intentionally does NOT distinguish guest vs staff role —
 * the existence of a non-zero completion % is enough proof that a
 * staff record exists for this user.
 */
export function useStaffProfilePrompt(): StaffProfilePrompt {
  const { isAuthenticated, isLoading: authLoading } = useSafeAuth();
  const [percentage, setPercentage] = useState(0);
  const [filledCount, setFilledCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await getMyStaffCompletion();
        if (cancelled) return;
        if (r.success && r.data) {
          setPercentage(Number((r.data as any).percentage) || 0);
          setFilledCount(Number((r.data as any).filledCount) || 0);
          setTotalCount(Number((r.data as any).totalCount) || 0);
        }
      } catch {
        /* silent — no staff record is a valid state */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  const needsCompletion = percentage > 0 && percentage < 100;

  return { percentage, filledCount, totalCount, needsCompletion, loading };
}
