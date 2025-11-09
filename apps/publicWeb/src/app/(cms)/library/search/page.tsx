import { QueryProvider } from '@/lib/providers/QueryProvider';
import { LibrarySearchClient } from '@/themes/default/library/LibrarySearchClient';
import { getCurrentUser } from '@repo/auth/server';

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : undefined;
  const searchType = typeof params.searchType === 'string' ? params.searchType : 'contains';
  const catalogType = typeof params['catalogType.name'] === 'string' ? params['catalogType.name'] : '';
  const sortBy = typeof params.sortBy === 'string' ? params.sortBy : 'year';
  const sortOrder = typeof params.sortOrder === 'string' ? params.sortOrder : 'desc';

  // Get current user for eBook access control
  const user = await getCurrentUser();
  const canAccessEbooks = user && user.role !== 'guest';

  return (
    <QueryProvider>
      <LibrarySearchClient
        initialQuery={query}
        initialSearchType={searchType as 'exact' | 'contains'}
        initialCatalogType={catalogType}
        initialSortBy={sortBy as 'title' | 'year' | 'author' | 'publisher'}
        initialSortOrder={sortOrder as 'asc' | 'desc'}
        canAccessEbooks={canAccessEbooks}
      />
    </QueryProvider>
  );
}

// Dynamic metadata based on search query
export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : undefined;

  return {
    title: query ? `Search: ${query} | Library Catalog` : 'Search | Library Catalog',
    description: query
      ? `Search results for "${query}" in our library catalog`
      : 'Search our extensive collection of books, journals, and digital resources.'
  };
}
