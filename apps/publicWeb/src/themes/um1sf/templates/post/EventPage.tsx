import React from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { PostHero } from "./PostHero";
import { PostSidebar } from "./PostSidebar";
import { PostBody } from "@/themes/default/templates/post/body/PostBody";
import { RelatedPostsBlock } from "@/themes/default/templates/post/RelatedPostsBlock";

interface EventPageProps {
  post: any;
  categories?: any[];
  tags?: any[];
  related?: any[];
  currentLanguage?: "en" | "mm";
  crumbs?: Array<{ label: string; href?: string }>;
}

/**
 * um1sf event-style post page. Same chrome as ArticlePage but the
 * meta strip is replaced with a prominent event detail card showing
 * date, time, venue from `post.eventContext` (standard fields only:
 * `startAt`, `endAt`, `location`, `isAllDay`).
 */
export function EventPage({
  post,
  categories,
  tags,
  related,
  currentLanguage = "en",
  crumbs,
}: EventPageProps) {
  if (!post) return null;

  const title = post.title?.[currentLanguage] || post.title?.en;
  const excerpt = post.excerpt?.[currentLanguage] || post.excerpt?.en;
  const featuredImageUrl =
    typeof post.featuredImage === "string"
      ? post.featuredImage
      : post.featuredImage?.url;

  const ec = post.eventContext as
    | {
        startAt?: string;
        endAt?: string;
        location?: string;
        isAllDay?: boolean;
      }
    | undefined;

  const start = ec?.startAt ? new Date(ec.startAt) : null;
  const end = ec?.endAt ? new Date(ec.endAt) : null;
  const isAllDay = !!ec?.isAllDay;

  return (
    <div className="w-full">
      <PostHero
        title={title}
        excerpt={excerpt}
        featuredImageUrl={featuredImageUrl}
        crumbs={crumbs}
        showTitle={post.showTitle !== false}
        showBreadcrumbs={post.showBreadcrumbs !== false}
      />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <main className="lg:col-span-8 min-w-0">
            {ec && (start || ec.location) && (
              <div
                className="border-l-4 pl-5 py-4 mb-8"
                style={{
                  borderColor: "var(--color-primary)",
                  backgroundColor: "var(--color-muted, rgba(0,0,0,0.03))",
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {start && (
                    <EventStat icon={Calendar} label="Date">
                      <time dateTime={start.toISOString()}>
                        {formatDate(start, currentLanguage)}
                      </time>
                      {end && !sameDay(start, end) && (
                        <>
                          {" — "}
                          <time dateTime={end.toISOString()}>
                            {formatDate(end, currentLanguage)}
                          </time>
                        </>
                      )}
                    </EventStat>
                  )}
                  {start && !isAllDay && (
                    <EventStat icon={Clock} label="Time">
                      {formatTime(start, currentLanguage)}
                      {end && (
                        <>
                          {" – "}
                          {formatTime(end, currentLanguage)}
                        </>
                      )}
                    </EventStat>
                  )}
                  {start && isAllDay && (
                    <EventStat icon={Clock} label="Time">
                      All day
                    </EventStat>
                  )}
                  {ec.location && (
                    <EventStat icon={MapPin} label="Location">
                      {ec.location}
                    </EventStat>
                  )}
                </div>
              </div>
            )}

            <PostBody post={post} currentLanguage={currentLanguage} />
          </main>

          <div
            className="lg:col-span-4 lg:border-l lg:pl-10"
            style={{ borderColor: "var(--color-border)" }}
          >
            <PostSidebar
              categories={categories}
              tags={tags}
              related={undefined}
              currentLanguage={currentLanguage}
            />
          </div>
        </div>

        <RelatedPostsBlock
          posts={related as any[]}
          currentLanguage={currentLanguage}
        />
      </div>
    </div>
  );
}

function EventStat({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        className="h-4 w-4 shrink-0 mt-0.5"
        style={{ color: "var(--color-primary)" }}
      />
      <div className="min-w-0">
        <p
          className="text-[10px] uppercase tracking-wider font-bold"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          {label}
        </p>
        <p
          className="text-sm font-semibold mt-0.5"
          style={{ color: "var(--color-foreground)" }}
        >
          {children}
        </p>
      </div>
    </div>
  );
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(d: Date, lang: "en" | "mm"): string {
  return d.toLocaleDateString(lang === "mm" ? "my-MM" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(d: Date, lang: "en" | "mm"): string {
  return d.toLocaleTimeString(lang === "mm" ? "my-MM" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default EventPage;
