import type { Bibliography } from '@/actions/library/books.actions';
import { getAuthorName } from '@/lib/library-utils';
import Link from 'next/link';

interface TopReadingProps {
  books: Bibliography[];
}

export function TopReading({ books }: TopReadingProps) {
  if (!books || books.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Top Reading List</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Most popular books in our library
          </p>
        </div>
        <Link
          href="/library"
          className="text-primary hover:underline text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Books List (Table-like layout) */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="divide-y divide-border">
          {books.map((book, index) => (
            <BookRow key={book._id} book={book} rank={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Book Row for Top Reading List
 */
function BookRow({ book, rank }: { book: Bibliography; rank: number }) {
  return (
    <Link href={`/library/${book._id}`} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
      {/* Rank Badge */}
      <div className="flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            rank <= 3
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {rank}
        </div>
      </div>

      {/* Book Cover Thumbnail */}
      <div className="flex-shrink-0 w-12 h-16 bg-muted rounded overflow-hidden">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <svg
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{book.title}</h3>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
          {book.author && (
            <span className="truncate">
              {getAuthorName(book.author)}
            </span>
          )}
          {book.year && (
            <>
              <span>•</span>
              <span>{book.year}</span>
            </>
          )}
          {book.catalogType && (
            <>
              <span>•</span>
              <span className="truncate">{book.catalogType.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Call Number (hidden on mobile) */}
      {book.callNo && (
        <div className="hidden md:block flex-shrink-0 text-sm text-muted-foreground font-mono">
          {book.callNo}
        </div>
      )}

      {/* Status Badge */}
      <div className="flex-shrink-0">
        <span
          className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
            book.status === 'Active'
              ? 'bg-success/10 text-success'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {book.status === 'Active' ? 'Available' : book.status}
        </span>
      </div>
    </Link>
  );
}
