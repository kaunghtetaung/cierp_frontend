import { QueryProvider } from '@/lib/providers/QueryProvider';
import { BookDetails } from '@/themes/default/library/BookDetails';
import { getLibraryModuleItem } from '@/lib/library-module-wrapper';
import type { Bibliography } from '@/actions/library/books.actions';
import { notFound } from 'next/navigation';

interface BookPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params;

  try {
    // Fetch book details
    const book = await getLibraryModuleItem<Bibliography>('bibliographies', id);

    if (!book) {
      notFound();
    }

    return (
      <QueryProvider>
        <BookDetails book={book} />
      </QueryProvider>
    );
  } catch (error) {
    console.error('Error loading book details:', error);
    notFound();
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BookPageProps) {
  const { id } = await params;

  try {
    const book = await getLibraryModuleItem<Bibliography>('bibliographies', id);

    if (!book) {
      return {
        title: 'Book Not Found | Library'
      };
    }

    return {
      title: `${book.title} | Library Catalog`,
      description: book.description || `${book.title} by ${book.author?.name || 'Unknown Author'}`
    };
  } catch (error) {
    return {
      title: 'Book Not Found | Library'
    };
  }
}
