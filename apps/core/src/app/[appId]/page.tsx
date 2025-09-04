"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function AppRootRedirect() {
  const router = useRouter();
  const params = useParams();
  
  useEffect(() => {
    const appId = params.appId as string;
    if (appId) {
      // Redirect to dashboard within the same app
      router.replace(`/${appId}/dashboard`);
    }
  }, [router, params.appId]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}