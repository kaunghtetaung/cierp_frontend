import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@repo/auth/server-api";
import { UserProfileView } from "./UserProfileView";

export const metadata: Metadata = {
  title: "Profile | My Account",
  description: "View and manage your profile information",
};

export default async function ProfilePage() {
  try {
    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    return <UserProfileView user={user} />;
  } catch (error) {
    console.error("❌ [PROFILE] Authentication error:", error);
    redirect("/login?error=session_expired");
  }
}
