"use client";

export function SectionCards() {
  return (
    <div className="px-4 lg:px-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <h3 className="text-2xl font-bold">{i * 1234}</h3>
            <p className="text-sm text-muted-foreground">Metric {i}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
