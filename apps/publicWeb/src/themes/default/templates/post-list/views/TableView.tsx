import React from "react";
import Link from "next/link";
import {
  type PostListItem,
  formatDate,
  getAuthorName,
  getDate,
  getPopulatedTaxonomy,
  getPostHref,
  getTitle,
  pickTaxonomyLabel,
} from "../helpers";
import { DraftBadge } from "@/feature-components/draft-badge/DraftBadge";

interface TableViewProps {
  posts: PostListItem[];
  currentLanguage?: "en" | "mm";
  fallbackType?: string;
}

/**
 * Compact tabular list — Title / Author / Date / Categories / Tags.
 * Best on lg+ viewports where there's horizontal room; on small
 * screens the table overflows horizontally inside the wrapping
 * `overflow-x-auto` so cells stay readable rather than crammed.
 */
export function TableView({
  posts,
  currentLanguage = "en",
  fallbackType,
}: TableViewProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <div
      className="overflow-x-auto border rounded-lg"
      style={{ borderColor: "var(--color-border)" }}
    >
      <table className="min-w-full text-sm">
        <thead
          className="text-left"
          style={{
            backgroundColor: "var(--color-muted, rgba(0,0,0,0.03))",
            color: "var(--color-muted-foreground)",
          }}
        >
          <tr>
            <Th>Title</Th>
            <Th>Author</Th>
            <Th>Date</Th>
            <Th>Categories</Th>
            <Th>Tags</Th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const title = getTitle(post, currentLanguage);
            const href = getPostHref(post, fallbackType);
            const date = getDate(post);
            const author = getAuthorName(post.createdBy);
            const cats = getPopulatedTaxonomy(post.categoryIds);
            const tags = getPopulatedTaxonomy(post.tagIds);

            return (
              <tr
                key={post._id}
                className="border-t transition-colors hover:bg-[var(--color-muted)]"
                style={{ borderColor: "var(--color-border)" }}
              >
                <Td>
                  {(post as any).status === "Draft" && (
                    <DraftBadge
                      language={currentLanguage}
                      className="mr-2 align-middle"
                    />
                  )}
                  <Link
                    href={href}
                    className="font-medium hover:underline underline-offset-2 line-clamp-2"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    {title}
                  </Link>
                </Td>
                <Td>
                  <span style={{ color: "var(--color-foreground)" }}>
                    {author}
                  </span>
                </Td>
                <Td>
                  {date ? (
                    <time
                      dateTime={date.toISOString()}
                      style={{ color: "var(--color-foreground)" }}
                    >
                      {formatDate(date, currentLanguage)}
                    </time>
                  ) : (
                    <span style={{ color: "var(--color-muted-foreground)" }}>
                      —
                    </span>
                  )}
                </Td>
                <Td>
                  {cats.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {cats.map((c) => (
                        <Link
                          key={c._id}
                          href={`/category/${c.slug}`}
                          className="inline-flex items-center px-2 py-0.5 text-xs border rounded hover:underline underline-offset-2"
                          style={{
                            borderColor: "var(--color-border)",
                            color: "var(--color-foreground)",
                          }}
                        >
                          {pickTaxonomyLabel(c.name, c.slug, currentLanguage)}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: "var(--color-muted-foreground)" }}>
                      —
                    </span>
                  )}
                </Td>
                <Td>
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((t) => (
                        <Link
                          key={t._id}
                          href={`/tags/${t.slug}`}
                          className="inline-flex items-center px-2 py-0.5 text-xs border rounded-full hover:underline underline-offset-2"
                          style={{
                            borderColor: "var(--color-border)",
                            color: "var(--color-foreground)",
                          }}
                        >
                          {pickTaxonomyLabel(t.name, t.slug, currentLanguage)}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: "var(--color-muted-foreground)" }}>
                      —
                    </span>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-4 py-2 font-medium text-[11px] uppercase tracking-wide"
    >
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}

export default TableView;
