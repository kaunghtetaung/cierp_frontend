'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui';
import { getDashboardSummary } from '@/actions/library/dashboard.actions';
import type { DashboardSummary as DashboardSummaryType } from '@/types/library-dashboard';

interface DashboardSummaryProps {
  initialData: DashboardSummaryType;
}

export function DashboardSummary({ initialData }: DashboardSummaryProps) {
  const [data, setData] = useState<DashboardSummaryType>(initialData);
  const [limit, setLimit] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState<string>('');
  const [publisherFilter, setPublisherFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');

  // Pagination states
  const [publisherPage, setPublisherPage] = useState<number>(1);
  const [subjectPage, setSubjectPage] = useState<number>(1);
  const [yearPage, setYearPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  const handleLimitChange = async (newLimit: number) => {
    setLimit(newLimit);
    setIsLoading(true);
    try {
      const response = await getDashboardSummary(newLimit);
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      handleLimitChange(parseInt(value));
    }
  };

  const handleCustomSubmit = () => {
    const value = parseInt(customValue);
    if (!isNaN(value) && value > 0 && value <= 1000) {
      handleLimitChange(value);
      setShowCustomInput(false);
      setCustomValue('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Limit Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Display Limit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <label htmlFor="limit-select" className="text-sm text-muted-foreground">Show top:</label>
            <select
              id="limit-select"
              value={showCustomInput ? 'custom' : limit.toString()}
              onChange={(e) => handleSelectChange(e.target.value)}
              disabled={isLoading}
              className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="custom">Custom...</option>
            </select>

            {showCustomInput && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="Enter limit (1-1000)"
                  min="1"
                  max="1000"
                  className="w-40 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                />
                <Button
                  size="sm"
                  onClick={handleCustomSubmit}
                  disabled={isLoading || !customValue}
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomValue('');
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data?.totalBooks ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Book Copies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data?.totalCopies ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Authors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data?.totalAuthors ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Publishers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data?.totalPublishers ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data?.totalSubjects ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Books by Catalog Type */}
        <Card>
          <CardHeader>
            <CardTitle>Books by Catalog Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.totalByCatalogType ?? []).map((item, index) => {
                const totalBooks = (data?.totalByCatalogType ?? []).reduce((sum, i) => sum + i.count, 0);
                const percentage = totalBooks > 0 ? ((item.count / totalBooks) * 100).toFixed(1) : '0';

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{item.catalogType}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{item.count} books</span>
                        <span className="text-xs text-muted-foreground">({item.copyCount} copies)</span>
                      </div>
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
              {(data?.totalByLanguage ?? []).map((item, index) => {
                const totalBooks = (data?.totalByLanguage ?? []).reduce((sum, i) => sum + i.count, 0);
                const percentage = totalBooks > 0 ? ((item.count / totalBooks) * 100).toFixed(1) : '0';

                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{item.language}</span>
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

        {/* Books by Media Type */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader>
            <CardTitle>Books by Media Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.totalByMediaType ?? []).map((item, index) => {
                const totalBooks = (data?.totalByMediaType ?? []).reduce((sum, i) => sum + i.count, 0);
                const percentage = totalBooks > 0 ? ((item.count / totalBooks) * 100).toFixed(1) : '0';

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.mediaType}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Accession Groups */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader>
            <CardTitle>Books by Accession Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.totalByAccessionGroup ?? []).map((item, index) => {
                const totalBooks = (data?.totalByAccessionGroup ?? []).reduce((sum, i) => sum + i.count, 0);
                const percentage = totalBooks > 0 ? ((item.count / totalBooks) * 100).toFixed(1) : '0';

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.accessionGroup}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{item.count}</span>
                        <span className="text-xs text-muted-foreground">({item.copyCount})</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Books by Year */}
        <Card className="col-span-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Books by Publication Year (Top {limit})</CardTitle>
              <input
                type="text"
                placeholder="Filter years..."
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  setYearPage(1);
                }}
                className="w-48 px-3 py-1.5 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">Year</th>
                    <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">Books</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredYears = (data?.totalByYear ?? [])
                      .filter((item) =>
                        item.year.toString().includes(yearFilter)
                      )
                      .slice(0, limit);
                    const startIndex = (yearPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedYears = filteredYears.slice(startIndex, endIndex);

                    return paginatedYears.map((item, index) => (
                      <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-2 px-2 text-sm">{item.year}</td>
                        <td className="py-2 px-2 text-sm text-right font-medium">{item.count}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
              {(() => {
                const filteredYears = (data?.totalByYear ?? [])
                  .filter((item) => item.year.toString().includes(yearFilter))
                  .slice(0, limit);

                if (filteredYears.length === 0) {
                  return (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No years found matching &quot;{yearFilter}&quot;
                    </div>
                  );
                }

                const totalPages = Math.ceil(filteredYears.length / itemsPerPage);

                return totalPages > 1 ? (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Showing {((yearPage - 1) * itemsPerPage) + 1} to {Math.min(yearPage * itemsPerPage, filteredYears.length)} of {filteredYears.length} years
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setYearPage(p => Math.max(1, p - 1))}
                        disabled={yearPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {yearPage} of {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setYearPage(p => Math.min(totalPages, p + 1))}
                        disabled={yearPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Top Publishers */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Publishers (Top {limit})</CardTitle>
              <input
                type="text"
                placeholder="Filter publishers..."
                value={publisherFilter}
                onChange={(e) => {
                  setPublisherFilter(e.target.value);
                  setPublisherPage(1);
                }}
                className="w-48 px-3 py-1.5 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">Publisher</th>
                    <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">Books</th>
                    <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">Copies</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredPublishers = (data?.totalByPublisher ?? [])
                      .filter((item) =>
                        item.publisher.toLowerCase().includes(publisherFilter.toLowerCase())
                      )
                      .slice(0, limit);
                    const startIndex = (publisherPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedPublishers = filteredPublishers.slice(startIndex, endIndex);

                    return paginatedPublishers.map((item, index) => (
                      <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-2 px-2 text-sm">{item.publisher}</td>
                        <td className="py-2 px-2 text-sm text-right font-medium">{item.count}</td>
                        <td className="py-2 px-2 text-sm text-right text-muted-foreground">{item.copyCount}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
              {(() => {
                const filteredPublishers = (data?.totalByPublisher ?? [])
                  .filter((item) => item.publisher.toLowerCase().includes(publisherFilter.toLowerCase()))
                  .slice(0, limit);

                if (filteredPublishers.length === 0) {
                  return (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No publishers found matching &quot;{publisherFilter}&quot;
                    </div>
                  );
                }

                const totalPages = Math.ceil(filteredPublishers.length / itemsPerPage);

                return totalPages > 1 ? (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Showing {((publisherPage - 1) * itemsPerPage) + 1} to {Math.min(publisherPage * itemsPerPage, filteredPublishers.length)} of {filteredPublishers.length} publishers
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPublisherPage(p => Math.max(1, p - 1))}
                        disabled={publisherPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {publisherPage} of {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPublisherPage(p => Math.min(totalPages, p + 1))}
                        disabled={publisherPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Top Subjects */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Subjects (Top {limit})</CardTitle>
              <input
                type="text"
                placeholder="Filter subjects..."
                value={subjectFilter}
                onChange={(e) => {
                  setSubjectFilter(e.target.value);
                  setSubjectPage(1);
                }}
                className="w-48 px-3 py-1.5 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">Subject</th>
                    <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">Books</th>
                    <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">Copies</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredSubjects = (data?.totalBySubject ?? [])
                      .filter((item) =>
                        item.subject.toLowerCase().includes(subjectFilter.toLowerCase())
                      )
                      .slice(0, limit);
                    const startIndex = (subjectPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedSubjects = filteredSubjects.slice(startIndex, endIndex);

                    return paginatedSubjects.map((item, index) => (
                      <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-2 px-2 text-sm">{item.subject}</td>
                        <td className="py-2 px-2 text-sm text-right font-medium">{item.count}</td>
                        <td className="py-2 px-2 text-sm text-right text-muted-foreground">{item.copyCount}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
              {(() => {
                const filteredSubjects = (data?.totalBySubject ?? [])
                  .filter((item) => item.subject.toLowerCase().includes(subjectFilter.toLowerCase()))
                  .slice(0, limit);

                if (filteredSubjects.length === 0) {
                  return (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No subjects found matching &quot;{subjectFilter}&quot;
                    </div>
                  );
                }

                const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);

                return totalPages > 1 ? (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Showing {((subjectPage - 1) * itemsPerPage) + 1} to {Math.min(subjectPage * itemsPerPage, filteredSubjects.length)} of {filteredSubjects.length} subjects
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSubjectPage(p => Math.max(1, p - 1))}
                        disabled={subjectPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {subjectPage} of {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSubjectPage(p => Math.min(totalPages, p + 1))}
                        disabled={subjectPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
