export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Results count skeleton */}
      <div className="h-6 w-48 bg-muted animate-pulse rounded" />

      {/* Book cards skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-4 space-y-3">
            {/* Cover image skeleton */}
            <div className="h-48 bg-muted animate-pulse rounded" />

            {/* Title skeleton */}
            <div className="h-5 bg-muted animate-pulse rounded w-3/4" />

            {/* Author skeleton */}
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />

            {/* Publisher skeleton */}
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />

            {/* Status badge skeleton */}
            <div className="h-6 bg-muted animate-pulse rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
