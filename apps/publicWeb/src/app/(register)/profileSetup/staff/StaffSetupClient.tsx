"use client";

import { useState } from "react";
import { MiniStaffForm } from "./components/MiniStaffForm";
import { FullStaffWizard } from "./components/FullStaffWizard";

interface StaffSetupClientProps {
  user: any;
  initialProfile: any;
}

type Mode = "mini" | "full";

/**
 * Staff onboarding entry point. Defaults to the Mini form for a fast
 * onboarding path, with a footer CTA to switch into the Full wizard
 * for users who want to fill everything at once. Switching either
 * direction transfers the in-flight form values via the shared `draft`
 * state, so partially-typed input survives the swap without a save.
 *
 * `initialProfile` is the server-fetched Staff record (null if the
 * user hasn't registered yet). The draft is seeded with that and
 * mutated by either form's onSwitch callback before re-mounting the
 * other form so its initialProfile prop carries the latest values.
 */
export function StaffSetupClient({
  user,
  initialProfile,
}: StaffSetupClientProps) {
  const hasExisting = Boolean(initialProfile);
  const [mode, setMode] = useState<Mode>("mini");
  const [draft, setDraft] = useState<any>(initialProfile || null);

  const switchToFull = (currentValues?: any) => {
    if (currentValues) setDraft({ ...(draft || {}), ...currentValues });
    setMode("full");
  };
  const switchToMini = (currentValues?: any) => {
    if (currentValues) setDraft({ ...(draft || {}), ...currentValues });
    setMode("mini");
  };

  if (mode === "full") {
    return (
      <FullStaffWizard
        user={user}
        initialProfile={draft}
        // PATCH /me when a record already exists; otherwise POST.
        isUpdate={hasExisting}
        onSwitchToMini={switchToMini}
      />
    );
  }

  return (
    <MiniStaffForm
      user={user}
      initialProfile={draft}
      // PATCH /me when a record already exists; otherwise POST.
      isUpdate={hasExisting}
      onSwitchToFull={switchToFull}
    />
  );
}
