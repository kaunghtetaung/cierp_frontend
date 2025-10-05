import { QueryProvider } from '@/lib/providers/QueryProvider';
import { LibraryHome } from '@/themes/default/library/LibraryHome';
import { getNewArrivals, getTopReading } from '@/actions/library/books.actions';
import { getLibraryNews } from '@/actions/library/news.actions';

export default async function LibraryPage() {
  // Fetch homepage data only - no search results
  const [newArrivalsResponse, topReadingResponse, newsResponse] = await Promise.all([
    getNewArrivals(10),
    getTopReading(10),
    getLibraryNews(6)
  ]);

  const newArrivals = newArrivalsResponse?.success && newArrivalsResponse.data
    ? newArrivalsResponse.data
    : [];

  const topReading = topReadingResponse?.success && topReadingResponse.data
    ? topReadingResponse.data
    : [];

  const news = newsResponse?.success && newsResponse.data?.data
    ? newsResponse.data.data
    : [];

  return (
    <QueryProvider>
      <LibraryHome
        newArrivals={newArrivals}
        topReading={topReading}
        news={news}
      />
    </QueryProvider>
  );
}

// Metadata for SEO
export const metadata = {
  title: 'Library Catalog | University Library',
  description: 'Search and explore our extensive collection of books, journals, and digital resources.'
};
