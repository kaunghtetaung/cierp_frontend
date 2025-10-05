import { SimpleSearch } from "./SimpleSearch";
import { SearchResults } from "./SearchResults";
import type { Bibliography } from "@/actions/library/books.actions";

interface LibrarySearchProps {
  searchResults?: {
    books: Bibliography[];
    query?: string;
    total?: number;
    pagination?: any;
  };
}

export function LibrarySearch({ searchResults }: LibrarySearchProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <section className="bg-gradient-to-br from-primary/5 via-accent/5 to-background border-b border-border">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
              Search Library Catalog
            </h1>

            {/* Search Bar */}
            <div className="bg-background rounded-xl shadow-lg p-6 border border-border">
              <SimpleSearch
                initialQuery={searchResults?.query}
                onSearch={() => {}}
                isLoading={false}
                initialSearchType="contains"
                initialCatalogType=""
              />
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {searchResults && searchResults.query ? (
            <SearchResults
              books={searchResults.books}
              query={searchResults.query}
              total={searchResults.total}
            />
          ) : (
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Enter a search term
              </h3>
              <p className="text-muted-foreground">
                Search by title, author, publisher, ISBN, or call number
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
