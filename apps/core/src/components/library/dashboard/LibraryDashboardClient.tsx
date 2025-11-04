'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, Button } from '@repo/ui';
import { getDashboardSummary } from '@/actions/library/dashboard.actions';
import { DashboardSummary } from './DashboardSummary';

export function LibraryDashboardClient() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library-dashboard-summary'],
    queryFn: async () => {
      const response = await getDashboardSummary();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch dashboard summary');
      }
      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library Dashboard</h1>
          <p className="text-muted-foreground">Overview of your library collection and statistics</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">Error loading dashboard</p>
                <p className="text-sm">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-8 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Summary */}
      {!isLoading && !error && data && <DashboardSummary initialData={data} />}
    </div>
  );
}
