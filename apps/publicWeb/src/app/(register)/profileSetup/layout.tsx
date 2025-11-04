import React from "react";
import { cookies } from "next/headers";
import ProfileSetupLayoutClient from "./ProfileSetupLayoutClient";

interface ProfileSetupLayoutProps {
  children: React.ReactNode;
}

export default async function ProfileSetupLayout({
  children,
}: ProfileSetupLayoutProps) {
  // Get current language from cookie
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("x-lang");
  const currentLanguage = langCookie?.value || "en";

  return (
    <ProfileSetupLayoutClient initialLanguage={currentLanguage}>
      {children}
    </ProfileSetupLayoutClient>
  );
}
