// Server component that fetches user data and filters apps on the server side
import { getCurrentUser } from "@repo/auth/server-api";
import type { TenantSettings, TenantApplication, User } from "@repo/types";
import { hasApplicationAccess } from "@repo/auth/login-utils";
import { ClientAppSelector } from "./ClientAppSelector";

interface ServerAppSelectorProps {
  tenant: TenantSettings | null;
  currentLanguage: string;
}

/**
 * Server component that handles user data fetching and app filtering
 * Passes pre-filtered apps to the client component for interaction
 */
export async function ServerAppSelector({
  tenant,
  currentLanguage,
}: ServerAppSelectorProps) {
  // Fetch user data on the server
  const user = await getCurrentUser();
  
  // Filter apps on the server side
  const getFilteredApps = (): TenantApplication[] => {
    if (!tenant?.applications || tenant.applications.length === 0) {
      return [];
    }

    // Filter only active applications
    let activeApps = tenant.applications.filter((app) => app.status);

    // Further filter by user permissions if user is available
    if (user) {
      activeApps = activeApps.filter((app) =>
        hasApplicationAccess(user, app.acceptRolesList)
      );
    }

    return activeApps;
  };

  const filteredApps = getFilteredApps();

  // Pass filtered apps to client component
  return (
    <ClientAppSelector
      tenant={tenant}
      filteredApps={filteredApps}
      currentLanguage={currentLanguage}
    />
  );
}

export default ServerAppSelector;