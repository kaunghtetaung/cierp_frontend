import type { LibraryNews as NewsItem } from '@/actions/library/news.actions';

interface LibraryNewsProps {
  news: NewsItem[];
}

export function LibraryNews({ news }: LibraryNewsProps) {
  if (!news || news.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Library News & Updates</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Latest announcements from the library department
        </p>
      </div>

      {/* News Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item) => (
          <NewsCard key={item.id} news={item} />
        ))}
      </div>
    </section>
  );
}

/**
 * Individual News Card Component
 */
function NewsCard({ news }: { news: NewsItem }) {
  const publishedDate = new Date(news.publishedDate);
  const formattedDate = publishedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <article className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      {/* News Image (if available) */}
      {news.imageUrl && (
        <div className="h-48 bg-muted overflow-hidden">
          <img
            src={news.imageUrl}
            alt={news.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* News Content */}
      <div className="p-5">
        {/* Date & Author */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <time dateTime={news.publishedDate}>{formattedDate}</time>
          {news.author && (
            <>
              <span>•</span>
              <span>{news.author}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2">
          {news.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {news.excerpt}
        </p>

        {/* Read More Link */}
        <div className="mt-4">
          <span className="text-sm text-primary hover:underline font-medium">
            Read more →
          </span>
        </div>
      </div>
    </article>
  );
}
