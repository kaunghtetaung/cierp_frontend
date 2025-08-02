import React from 'react';
import { PostService } from '@repo/post';
import { getApiDomain } from '@repo/utils/server';
import { safeAsync } from '@repo/utils';
import Link from 'next/link';

interface PostPageSearchParams {
  searchParams: Promise<{
    page?: string;
    category?: string;
    search?: string;
  }>;
}

export default async function PostPage({ searchParams }: PostPageSearchParams) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const category = params.category;
  const search = params.search;
  
  // Get posts using refactored post service
  const apiUrl = await getApiDomain();
  const postService = new PostService(apiUrl);
  
  const result = await safeAsync(async () => {
    if (search) {
      return await postService.searchPosts(search, { page, limit: 10 });
    } else {
      return await postService.getPublicPosts({ page, limit: 10 });
    }
  }, {
    operation: 'fetch_posts_list',
    component: 'PostPage'
  });

  if (!result.success) {
    console.error('Failed to fetch posts:', result.error);
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Posts</h1>
        <p className="text-red-600">Failed to load posts. Please try again later.</p>
      </div>
    );
  }

  const { posts, pagination } = result.data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">
          {search ? `Search Results for "${search}"` : 'Posts'}
        </h1>
        {category && (
          <p className="text-lg text-gray-600">Category: {category}</p>
        )}
      </header>

      {posts.length === 0 ? (
        <p className="text-gray-600">No posts found.</p>
      ) : (
        <>
          <div className="space-y-6 mb-8">
            {posts.map((post) => (
              <article key={post._id} className="border-b pb-6">
                <h2 className="text-2xl font-semibold mb-2">
                  <Link
                    href={`/post/article/${post.slug}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {postService.getLocalizedText(post.title)}
                  </Link>
                </h2>
                
                {post.excerpt && (
                  <p className="text-gray-600 mb-3">
                    {postService.getLocalizedText(post.excerpt)}
                  </p>
                )}
                
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  {post.publishedAt && (
                    <time dateTime={post.publishedAt.toString()}>
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </time>
                  )}
                  {post.stats?.readingTime?.minutes && (
                    <span>{post.stats.readingTime.minutes} min read</span>
                  )}
                  {post.stats?.views && (
                    <span>{post.stats.views} views</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <nav className="flex justify-center space-x-2">
              {pagination.currentPage > 1 && (
                <Link
                  href={`/post?page=${pagination.currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              
              <span className="px-4 py-2 bg-blue-500 text-white rounded">
                {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              {pagination.currentPage < pagination.totalPages && (
                <Link
                  href={`/post?page=${pagination.currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}