"use client";

import React from "react";
import type { User } from "@repo/types";
import { StudentSelfRegistrationForm } from "./components/StudentSelfRegistrationForm";

interface CompleteProfileClientProps {
  user: User;
  showSuccess?: boolean;
}

export function CompleteProfileClient({ user, showSuccess = false }: CompleteProfileClientProps) {
  return <StudentSelfRegistrationForm user={user} initialSuccess={showSuccess} />;
}
