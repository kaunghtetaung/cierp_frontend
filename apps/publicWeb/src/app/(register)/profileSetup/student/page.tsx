import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@repo/auth/server-api";
import { CompleteProfileClient } from "./CompleteProfileClient";

export const metadata: Metadata = {
  title: "Complete Your Profile",
  description: "Complete your profile information to access all features",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CompleteProfilePage({ searchParams }: PageProps) {
  try {
    const params = await searchParams;
    const showSuccess = params.success === "true";

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

    // Allow non-guest users to see success screen if coming from successful registration
    // Otherwise redirect non-guest users to home
    if (!isGuestUser && !showSuccess) {
      redirect("/");
    }

    return <CompleteProfileClient user={user} showSuccess={showSuccess} />;
  } catch (error) {
    // Handle token expiration or authentication errors
    console.error("Authentication error:", error);
    redirect("/login?error=session_expired");
  }
}
