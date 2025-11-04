'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui';
import { getCustomStatistics } from '@/actions/library/dashboard.actions';
import type { StatisticsFilters } from '@/types/library-dashboard';

export function CustomStatistics() {
  const [filters, setFilters] = useState<StatisticsFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<StatisticsFilters>({});

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['custom-statistics', appliedFilters],
    queryFn: async () => {
      const response = await getCustomStatistics(appliedFilters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch custom statistics');
      }
      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setFilters({});
    setAppliedFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Statistics Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Year Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Year</label>
              <input
                type="number"
                value={filters.startYear || ''}
                onChange={(e) => setFilters({ ...filters, startYear: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="e.g., 2000"
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Year</label>
              <input
                type="number"
                value={filters.endYear || ''}
                onChange={(e) => setFilters({ ...filters, endYear: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="e.g., 2024"
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Catalog Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Catalog Type</label>
              <input
                type="text"
                value={filters.catalogType || ''}
                onChange={(e) => setFilters({ ...filters, catalogType: e.target.value || undefined })}
                placeholder="e.g., Book, Journal"
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <input
                type="text"
                value={filters.language || ''}
                onChange={(e) => setFilters({ ...filters, language: e.target.value || undefined })}
                placeholder="e.g., English, Myanmar"
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <input
                type="text"
                value={filters.subject || ''}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value || undefined })}
                placeholder="e.g., Science, History"
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Publisher */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Publisher</label>
              <input
                type="text"
                value={filters.publisher || ''}
                onChange={(e) => setFilters({ ...filters, publisher: e.target.value || undefined })}
                placeholder="e.g., Oxford Press"
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilters} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Apply Filters'}
            </Button>
            <Button variant="outline" onClick={handleResetFilters} disabled={isLoading}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">Error loading statistics</p>
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
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
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
      )}

      {/* Statistics Display */}
      {!isLoading && !error && data && (
        <div className="grid gap-6">
          {/* Total Books */}
          <Card>
            <CardHeader>
              <CardTitle>Filtered Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalBooks.toLocaleString()} Books</div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Books by Year */}
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Books by Publication Year</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(data?.booksByYear ?? []).slice(0, 15).map((item) => {
                    const maxCount = Math.max(...(data?.booksByYear ?? []).map(i => i.count));
                    const percentage = (item.count / maxCount) * 100;

                    return (
                      <div key={item._id} className="flex items-center gap-4">
                        <div className="w-16 text-sm font-medium">{item._id}</div>
                        <div className="flex-1">
                          <div className="h-8 bg-muted rounded-md overflow-hidden">
                            <div
                              className="h-full bg-primary flex items-center justify-end pr-2"
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-xs font-medium text-primary-foreground">
                                {item.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Books by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Books by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data?.booksByType ?? []).map((item) => {
                    const totalBooks = (data?.booksByType ?? []).reduce((sum, i) => sum + i.count, 0);
                    const percentage = totalBooks > 0 ? ((item.count / totalBooks) * 100).toFixed(1) : '0';

                    return (
                      <div key={item._id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate">{item._id || 'Unknown'}</span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Books by Language */}
            <Card>
              <CardHeader>
                <CardTitle>Books by Language</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data?.booksByLanguage ?? []).map((item) => {
                    const totalBooks = (data?.booksByLanguage ?? []).reduce((sum, i) => sum + i.count, 0);
                    const percentage = totalBooks > 0 ? ((item.count / totalBooks) * 100).toFixed(1) : '0';

                    return (
                      <div key={item._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-primary" />
                          <span className="text-sm font-medium">{item._id || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{percentage}%</span>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Books by Subject */}
            <Card>
              <CardHeader>
                <CardTitle>Top Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(data?.booksBySubject ?? []).slice(0, 10).map((item) => {
                    const maxCount = Math.max(...(data?.booksBySubject ?? []).slice(0, 10).map(i => i.count));
                    const percentage = (item.count / maxCount) * 100;

                    return (
                      <div key={item._id} className="flex items-center gap-2">
                        <div className="flex-1 text-sm truncate">{item._id || 'Unknown'}</div>
                        <div className="w-24 h-6 bg-muted rounded-md overflow-hidden">
                          <div
                            className="h-full bg-primary flex items-center justify-center"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-xs font-medium text-primary-foreground">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Books by Publisher */}
            <Card>
              <CardHeader>
                <CardTitle>Top Publishers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(data?.booksByPublisher ?? []).slice(0, 10).map((item) => {
                    const maxCount = Math.max(...(data?.booksByPublisher ?? []).slice(0, 10).map(i => i.count));
                    const percentage = (item.count / maxCount) * 100;

                    return (
                      <div key={item._id} className="flex items-center gap-2">
                        <div className="flex-1 text-sm truncate">{item._id || 'Unknown'}</div>
                        <div className="w-24 h-6 bg-muted rounded-md overflow-hidden">
                          <div
                            className="h-full bg-primary flex items-center justify-center"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-xs font-medium text-primary-foreground">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
