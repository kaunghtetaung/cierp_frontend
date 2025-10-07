import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@repo/auth/server-api";
import { CompleteProfileClient } from "./CompleteProfileClient";

export const metadata: Metadata = {
  title: "Complete Your Profile",
  description: "Complete your profile information to access all features",
};

export default async function CompleteProfilePage() {
  try {
    console.log(`📄 [PAGE LOAD] Profile setup page loading`);

    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    // Check if user has guest role
    const isGuestUser =
      user.roles?.some((roleObj: any) => roleObj.Role === "guest") ?? false;

    // Redirect non-guest users to home (they already completed registration)
    if (!isGuestUser) {
      redirect("/");
    }

    return <CompleteProfileClient user={user} />;
  } catch (error) {
    // Handle token expiration or authentication errors
    console.error("❌ [PAGE LOAD] Authentication error:", error);
    redirect("/login?error=session_expired");
  }
}
