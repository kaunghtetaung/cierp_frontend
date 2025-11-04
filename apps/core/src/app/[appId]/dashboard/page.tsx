import { QueryProvider } from '@/lib/providers/QueryProvider';
import { LibraryDashboardClient } from '@/components/library/dashboard/LibraryDashboardClient';

interface DashboardPageProps {
  params: Promise<{
    appId: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const resolvedParams = await params;

  // If appId is "library", render the library dashboard
  if (resolvedParams.appId === 'library') {
    return (
      <QueryProvider>
        <div className="container mx-auto py-8">
          <LibraryDashboardClient />
        </div>
      </QueryProvider>
    );
  }

  // Default dashboard for other apps
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="border-b border-border pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your application dashboard
          </p>
        </div>

        {/* Dashboard Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Stats Cards */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <div className="h-4 w-4 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="m22 21-3-3m0-6a3 3 0 1 0-6 0 3 3 0 0 0 6 0" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Sessions
                </p>
                <p className="text-2xl font-bold">456</p>
              </div>
              <div className="h-4 w-4 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                >
                  <rect width="7" height="18" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Modules
                </p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="h-4 w-4 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">
              Latest updates and changes in your application
            </p>
          </div>
          <div className="border-t border-border p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">System backup completed</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Configuration updated</p>
                  <p className="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}