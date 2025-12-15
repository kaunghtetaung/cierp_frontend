import { QueryProvider } from "@/lib/providers/QueryProvider";
import { LibraryDashboardClient } from "@/components/library/dashboard/LibraryDashboardClient";

interface DashboardPageProps {
  params: Promise<{
    appId: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const resolvedParams = await params;

  // If appId is "library", render the library dashboard
  if (resolvedParams.appId === "library") {
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"></div>
      </div>
    </div>
  );
}
