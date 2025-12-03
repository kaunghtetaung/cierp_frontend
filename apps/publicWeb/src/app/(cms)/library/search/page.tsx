import { QueryProvider } from '@/lib/providers/QueryProvider';
import { LibrarySearchClient } from '@/themes/default/library/LibrarySearchClient';
import { getCurrentUser } from '@repo/auth/server';

// Roles allowed to access eBooks
const EBOOK_ALLOWED_ROLES = [
  'student',
  'staff',
  'organizationadmin',
  'organizationmember',
  'departmentadmin',
  'departmentstaff',
  'systemadmin'
];

// Helper to extract role name from role object or string
function getRoleName(role: any): string {
  if (typeof role === 'string') return role.toLowerCase();
  if (role && typeof role === 'object' && role.Role) return role.Role.toLowerCase();
  return '';
}

// Check if user has any of the allowed roles for eBook access
function canUserAccessEbooks(user: any): boolean {
  if (!user?.roles || !Array.isArray(user.roles)) return false;
  return user.roles.some((role: any) => EBOOK_ALLOWED_ROLES.includes(getRoleName(role)));
}

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
  const canAccessEbooks = canUserAccessEbooks(user);

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
