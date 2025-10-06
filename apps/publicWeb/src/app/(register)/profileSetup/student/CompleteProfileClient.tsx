"use client";

import React from "react";
import type { User } from "@repo/types";
import { StudentSelfRegistrationForm } from "./components/StudentSelfRegistrationForm";

interface CompleteProfileClientProps {
  user: User;
}

export function CompleteProfileClient({ user }: CompleteProfileClientProps) {
  return <StudentSelfRegistrationForm user={user} />;
}
