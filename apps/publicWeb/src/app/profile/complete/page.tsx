import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@repo/auth/server-api";
import { CompleteProfileClient } from "./CompleteProfileClient";

export const metadata: Metadata = {
  title: "Complete Your Profile",
  description: "Complete your profile information to access all features",
};

export default async function CompleteProfilePage() {
  // Get current user
  const user = await getCurrentUser();

  // Redirect if not authenticated
  if (!user) {
    redirect("/login");
  }

  // Check if user has guest role
  const isGuestUser = user.roles?.some(
    (roleObj: any) => roleObj.Role === "guest"
  ) ?? false;

  // Redirect if not a guest user
  if (!isGuestUser) {
    redirect("/");
  }

  return <CompleteProfileClient user={user} />;
}
