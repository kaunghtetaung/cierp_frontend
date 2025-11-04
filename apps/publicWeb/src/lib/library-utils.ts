import type { Author } from '@/actions/library/books.actions';

/**
 * Helper function to get author name from various possible formats
 * API returns different field structures, so we need to handle all cases
 */
export function getAuthorName(author?: Author): string {
  if (!author) return '-';

  // Try different possible field names from API
  if (author.name) return author.name;
  if (author.fullName) return author.fullName;

  // Fallback to firstName + lastName
  const firstName = author.firstName || '';
  const lastName = author.lastName || '';
  const combined = `${firstName} ${lastName}`.trim();

  return combined || '-';
}
