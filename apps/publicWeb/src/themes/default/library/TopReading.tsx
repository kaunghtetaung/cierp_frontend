import type { Bibliography } from '@/actions/library/books.actions';
import { getAuthorName } from '@/lib/library-utils';
import Link from 'next/link';

interface TopReadingProps {
  books: Bibliography[];
  error?: string | null;
}

export function TopReading({ books, error }: TopReadingProps) {
  // Show error state
  if (error) {
    return (
      <div className="py-10 px-8 rounded-xl bg-gradient-to-br from-[#F6F7FA] to-[#ECEEF5]">
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to Load Top Reading List
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We're having trouble loading the popular books. Please try refreshing the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!books || books.length === 0) {
    return null;
  }

  return (
    <div className="py-10 px-8 rounded-xl bg-gradient-to-br from-[#F6F7FA] to-[#ECEEF5]">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Top Reading List</h2>
          <p className="text-sm text-gray-600 mt-2">
            Most popular books in our library
          </p>
        </div>
        <Link
          href="/library"
          className="text-primary hover:text-primary/80 text-sm font-semibold flex items-center gap-1 transition-colors"
        >
          View All
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Books List (Table-like layout) */}
      <div className="bg-white rounded-xl overflow-hidden shadow">
        <div className="divide-y divide-border">
          {books.map((book, index) => (
            <BookRow key={book._id} book={book} rank={index + 1} />
          ))}
        </div>
      </div>
    </div>
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
        {book.bookCoverImage ? (
          <img
            src={book.bookCoverImage}
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
