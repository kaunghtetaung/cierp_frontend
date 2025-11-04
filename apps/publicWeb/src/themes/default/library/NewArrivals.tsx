import type { Bibliography } from '@/actions/library/books.actions';
import { getAuthorName } from '@/lib/library-utils';
import Link from 'next/link';

interface NewArrivalsProps {
  books: Bibliography[];
}

export function NewArrivals({ books }: NewArrivalsProps) {
  if (!books || books.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">New Arrivals</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Recently added to our collection
          </p>
        </div>
        <Link
          href="/library?sortBy=createdAt&sortOrder=desc"
          className="text-primary hover:underline text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {books.map((book) => (
          <BookCard key={book._id} book={book} />
        ))}
      </div>
    </section>
  );
}

/**
 * Compact Book Card for New Arrivals
 */
function BookCard({ book }: { book: Bibliography }) {
  return (
    <Link href={`/library/${book._id}`} className="group cursor-pointer block">
      {/* Book Cover */}
      <div className="bg-muted rounded-lg overflow-hidden aspect-[2/3] mb-3 group-hover:shadow-md transition-shadow">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <svg
              className="h-12 w-12 text-muted-foreground"
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
          </div>
        )}
      </div>

      {/* Book Info */}
      <div>
        <h3
          className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors"
          title={book.title}
        >
          {book.title}
        </h3>
        {book.author && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {getAuthorName(book.author)}
          </p>
        )}
        {book.year && (
          <p className="text-xs text-muted-foreground mt-1">{book.year}</p>
        )}
      </div>
    </Link>
  );
}
