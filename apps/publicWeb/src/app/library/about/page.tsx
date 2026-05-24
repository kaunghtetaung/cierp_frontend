import React from "react";
import Link from "next/link";
import { BookOpen, Search, BookMarked, Clock, Library, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About the Library",
  description: "About the library OPAC — what it is, what it offers, and how to use it.",
};

/**
 * Static About page for the library OPAC.
 *
 * This is intentionally NOT CMS-authored — it's a fixed marketing /
 * help page that explains what the OPAC is and how visitors can use
 * it. Authors who want a different About page on a per-tenant basis
 * can later override this with a CMS page.
 */
export default function LibraryAboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
          <Library className="h-8 w-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          About the Library
        </h1>
        <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          The Online Public Access Catalogue (OPAC) — your gateway to
          discovering, borrowing, and managing library resources.
        </p>
      </header>

      <section className="prose prose-slate dark:prose-invert max-w-none">
        <h2>What is the OPAC?</h2>
        <p>
          The OPAC is a digital catalogue that lets students, faculty,
          and staff search the entire library collection from
          anywhere. Find books, journals, theses, and electronic
          resources without leaving your desk — and reserve a copy
          before you walk in.
        </p>
      </section>

      <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Search className="h-5 w-5" />}
          title="Search the catalogue"
          description="Full-text search across titles, authors, subjects, ISBNs, and call numbers — with advanced filters for catalogue type, publisher, and language."
        />
        <FeatureCard
          icon={<BookMarked className="h-5 w-5" />}
          title="Reserve titles"
          description="When a copy is on loan, place a hold and we'll notify you the moment it's returned. Track every reservation under My Reservations."
        />
        <FeatureCard
          icon={<BookOpen className="h-5 w-5" />}
          title="Browse new arrivals"
          description="Stay on top of what's just been catalogued. The library home page surfaces the most recent additions to the collection."
        />
        <FeatureCard
          icon={<Users className="h-5 w-5" />}
          title="Your library card"
          description="View your borrower profile, current loans, due dates, and a digital library card you can show at the circulation desk."
        />
        <FeatureCard
          icon={<Clock className="h-5 w-5" />}
          title="Real-time availability"
          description="Every record shows live copy counts and lending status — no need to phone the desk to check if something is in."
        />
        <FeatureCard
          icon={<Library className="h-5 w-5" />}
          title="One catalogue, multiple branches"
          description="Search the union catalogue across every department library at once, or filter to a single branch."
        />
      </section>

      <section className="mt-12 rounded-lg border bg-card p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-3">
          Need help getting started?
        </h2>
        <p className="text-muted-foreground mb-5">
          Head to the search page and try a keyword — the simple search
          covers titles, authors, and subjects. For complex queries
          (date ranges, multi-field filters), switch to the advanced
          search tab.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Library className="h-4 w-4" />
            Browse the library
          </Link>
          <Link
            href="/library/search"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Search className="h-4 w-4" />
            Search the catalogue
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
