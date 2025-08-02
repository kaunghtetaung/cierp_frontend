import React from "react";
// import { getPostBySlug, isPostAccessible } from "@repo/post";
import { getApiDomain } from "@repo/utils/server";
import { safeAsync } from "@repo/utils";
import { notFound } from "next/navigation";

interface PostTypeSlugPageProps {
  params: Promise<{
    type: string;
    slug: string;
  }>;
}

export default async function PostTypeSlugPage({
  params,
}: PostTypeSlugPageProps) {
  const { type, slug } = await params;

  // Get post data using refactored post service
  const apiUrl = await getApiDomain();
  // const postService = new PostService(apiUrl);

  // Temporary fallback - replace with proper post service when module is fixed
  const result = await safeAsync(
    async () => {
      // TODO: Replace with actual post service call
      return null; // Placeholder for post data
    },
    {
      operation: "fetch_post",
      component: "PostTypeSlugPage",
    }
  );

  if (!result.success || !result.data) {
    console.error("Failed to fetch post:", result.error);
    notFound();
  }

  const post = result.data;

  // Verify post accessibility
  if (!postService.isPostPublished(post)) {
    notFound();
  }

  // Increment post views (fire and forget)
  safeAsync(
    async () => {
      await postService.incrementPostViews(slug);
    },
    {
      operation: "increment_views",
      component: "PostTypeSlugPage",
    }
  ).catch(() => {
    // Silently handle view increment failures
  });

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">
          {postService.getLocalizedText(post.title)}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-gray-600 mb-4">
            {postService.getLocalizedText(post.excerpt)}
          </p>
        )}

        <div className="flex items-center text-sm text-gray-500 space-x-4">
          <span>Type: {type}</span>
          {post.publishedAt && (
            <time dateTime={post.publishedAt.toString()}>
              {new Date(post.publishedAt).toLocaleDateString()}
            </time>
          )}
          {post.stats?.readingTime?.minutes && (
            <span>{post.stats.readingTime.minutes} min read</span>
          )}
        </div>
      </header>

      <div className="prose max-w-none">
        <div
          dangerouslySetInnerHTML={{
            __html: postService.getLocalizedText(post.content),
          }}
        />
      </div>

      {post.categories && post.categories.length > 0 && (
        <footer className="mt-8 pt-8 border-t">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Categories:</span>
            {post.categories.map((category: any) => (
              <span
                key={category._id}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {postService.getLocalizedText(category.name)}
              </span>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}
