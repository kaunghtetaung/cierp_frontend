import { QueryProvider } from '@/lib/providers/QueryProvider';
import { LibraryHome } from '@/themes/default/library/LibraryHome';
import { getNewArrivals } from '@/actions/library/books.actions';

export default async function LibraryPage() {
  // Fetch homepage data only - no search results
  // IMPORTANT: Explicitly pass page=1 to ensure page parameter is not null
  const newArrivalsResponse = await getNewArrivals(10, 1).catch((error) => {
    console.error('Failed to fetch new arrivals:', error);
    return { success: false, error: 'Failed to load new arrivals' };
  });

  const newArrivalsData = {
    books: newArrivalsResponse?.success && newArrivalsResponse.data
      ? newArrivalsResponse.data
      : [],
    pagination: newArrivalsResponse?.success && newArrivalsResponse.pagination
      ? newArrivalsResponse.pagination
      : undefined,
    error: !newArrivalsResponse?.success ? (newArrivalsResponse?.error || 'Failed to load new arrivals') : null
  };

  return (
    <QueryProvider>
      <LibraryHome
        newArrivals={newArrivalsData}
      />
    </QueryProvider>
  );
}

// Metadata for SEO
export const metadata = {
  title: 'Library Catalog | University Library',
  description: 'Search and explore our extensive collection of books, journals, and digital resources.'
};
