import React from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { PostHero } from "./PostHero";
import { PostSidebar } from "./PostSidebar";
import { PostBody } from "./body/PostBody";
import { RelatedPostsBlock } from "./RelatedPostsBlock";
import { DraftBadge } from "@/feature-components/draft-badge/DraftBadge";
import { PostViewTracker } from "@/feature-components/post-view-tracker/PostViewTracker";

interface EventPageProps {
  post: any;
  categories?: any[];
  tags?: any[];
  related?: any[];
  currentLanguage?: "en" | "mm";
  crumbs?: Array<{ label: string; href?: string }>;
  /** See ArticlePage.bodySlot — used by the password gate flow. */
  bodySlot?: React.ReactNode;
}

/**
 * Default-theme event-style post page. Same chrome as ArticlePage but
 * the meta strip is replaced with a prominent event card showing
 * date, time, venue (from `post.eventContext`).
 *
 * Event fields used (standard schema, no custom additions):
 *   - `startAt`  → start date + time
 *   - `endAt`    → end date + time (optional)
 *   - `location` → venue text (optional)
 *   - `isAllDay` → suppresses the time portion
 *
 * Body still routes through `PostBody` so authors can mix content
 * types (an event might have an article description, a gallery, or a
 * downloadable agenda PDF).
 */
export function EventPage({
  post,
  categories,
  tags,
  related,
  currentLanguage = "en",
  crumbs,
  bodySlot,
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
        titleAdornment={
          post.status === "Draft" ? (
            <DraftBadge language={currentLanguage} />
          ) : null
        }
      />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <main className="lg:col-span-8 min-w-0">
            {/* Event detail card — prominent date / time / location
                 above the body so visitors see the essentials at a
                 glance. Hidden when no eventContext is set. */}
            {ec && (start || ec.location) && (
              <div className="rounded-lg border bg-card p-5 md:p-6 mb-8">
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

            {bodySlot ?? (
              <PostBody post={post} currentLanguage={currentLanguage} />
            )}
            {/* See ArticlePage for the gate rationale. */}
            {!bodySlot && post?._id && post?.slug && (
              <PostViewTracker
                postId={String(post._id)}
                slug={String(post.slug)}
              />
            )}
          </main>

          <div className="lg:col-span-4 lg:border-l lg:border-border lg:pl-10">
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
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          {label}
        </p>
        <p className="text-sm font-medium mt-0.5">{children}</p>
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
