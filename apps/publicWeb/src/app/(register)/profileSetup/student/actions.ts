"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@repo/auth/server-api";

export interface CompleteProfileData {
  phone: string;
  address: string;
  dateOfBirth: string;
  bio?: string;
}

export interface CompleteProfileResult {
  success: boolean;
  error?: string;
}

export async function completeProfile(
  formData: CompleteProfileData
): Promise<CompleteProfileResult> {
  try {
    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user has guest role
    const isGuestUser = user.roles?.some(
      (roleObj: any) => roleObj.Role === "guest"
    ) ?? false;

    if (!isGuestUser) {
      return {
        success: false,
        error: "Only guest users can complete their profile",
      };
    }

    // Validate required fields
    if (!formData.phone || !formData.address || !formData.dateOfBirth) {
      return {
        success: false,
        error: "Phone, address, and date of birth are required",
      };
    }

    // TODO: Call your backend API to update user profile
    // Example:
    // const apiUrl = await getApiDomain();
    // const response = await fetch(`${apiUrl}/api/users/${user.id}/complete-profile`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     phone: formData.phone,
    //     address: formData.address,
    //     dateOfBirth: formData.dateOfBirth,
    //     bio: formData.bio,
    //   }),
    // });
    //
    // if (!response.ok) {
    //   throw new Error('Failed to update profile');
    // }

    // For now, just log the data
    console.log("Profile completion data:", {
      userId: user.id,
      phone: formData.phone,
      address: formData.address,
      dateOfBirth: formData.dateOfBirth,
      bio: formData.bio,
    });

    // Revalidate the user session and home page
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Profile completion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete profile",
    };
  }
}
