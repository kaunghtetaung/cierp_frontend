"use client";

import React from "react";
import type { User } from "@repo/types";
import { StudentSelfRegistrationForm } from "./components/StudentSelfRegistrationForm";
import type { StudentProfileData } from "@/app/profile/student/actions";

interface CompleteProfileClientProps {
  user: User;
  mode: 'create' | 'edit';
  existingProfile: StudentProfileData | null;
}

export function CompleteProfileClient({ user, mode, existingProfile }: CompleteProfileClientProps) {
  return (
    <StudentSelfRegistrationForm
      user={user}
      mode={mode}
      existingProfile={existingProfile}
    />
  );
}
