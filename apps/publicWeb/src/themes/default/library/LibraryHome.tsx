'use client';

import { useRouter } from 'next/navigation';
import { SearchType, SortBy, SortOrder } from './SimpleSearch';
import { SearchHero } from './SearchHero';
import { NewArrivals } from './NewArrivals';
import { TopReading } from './TopReading';
import { LibraryNews } from './LibraryNews';
import type { Bibliography } from '@/actions/library/books.actions';
import type { LibraryNews as NewsItem } from '@/actions/library/news.actions';

interface LibraryHomeProps {
  newArrivals: Bibliography[];
  topReading: Bibliography[];
  news: NewsItem[];
}

export function LibraryHome({
  newArrivals,
  topReading,
  news
}: LibraryHomeProps) {
  const router = useRouter();

  const handleSearch = (
    query: string,
    searchType: SearchType,
    catalogTypeName: string,
    sortBy: SortBy,
    sortOrder: SortOrder
  ) => {
    // Build query params
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('searchType', searchType);
    if (catalogTypeName) {
      params.set('catalogType', catalogTypeName);
    }
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);

    router.push(`/library/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Search */}
      <SearchHero onSearch={handleSearch} />

      {/* Main Content - Homepage Sections */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* New Arrivals Section */}
          {newArrivals && newArrivals.length > 0 && (
            <NewArrivals books={newArrivals} />
          )}

          {/* Top Reading List Section */}
          {topReading && topReading.length > 0 && (
            <TopReading books={topReading} />
          )}

          {/* Library News Section */}
          {news && news.length > 0 && (
            <LibraryNews news={news} />
          )}

          {/* Empty State */}
          {(!newArrivals || newArrivals.length === 0) &&
            (!topReading || topReading.length === 0) &&
            (!news || news.length === 0) && (
              <div className="text-center py-16">
                <svg
                  className="mx-auto h-16 w-16 text-muted-foreground mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Content Available
                </h3>
                <p className="text-muted-foreground">
                  Library content is being updated. Please check back later.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
