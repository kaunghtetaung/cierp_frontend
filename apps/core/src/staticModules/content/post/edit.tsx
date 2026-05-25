'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@repo/ui';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toastError } from '@repo/utils';
import { PostForm } from './PostForm';
import { getPostById } from '../common/actions';
import type { Post } from '../common/types';

interface PostEditPageProps {
  appId: string;
  itemId: string;
}

export default function PostEditPage({ appId, itemId }: PostEditPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive the post-type slug so save-and-close lands on the *same*
  // list the user came from (e.g. `/content/page` for pages,
  // `/content/news` for news). Priority:
  //   1. `?postTypeSlug=` query — set by `DefaultPostListView.handleEdit`
  //      so the list view passes its own slug through.
  //   2. The loaded post's denormalised `postTypeSlug` (when the
  //      backend populates it).
  //   3. Generic `/post` fallback.
  // Without this, edit.tsx always shipped users to `/post`, ignoring
  // whichever PostType the page-as-post belongs to.
  const postTypeSlug =
    searchParams?.get('postTypeSlug') ||
    (post as any)?.postTypeSlug ||
    'post';

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getPostById(itemId);
      if (r.success && r.data) {
        setPost(r.data as Post);
      } else {
        setError(r.error || 'Failed to load post');
        toastError(r.error || 'Failed to load post');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load post';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const goBack = () => router.push(`/${appId}/${postTypeSlug}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm text-muted-foreground">
          {error || 'Post not found'}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={reload}>
          Retry
        </Button>
      </div>
    );
  }

  // Title + back button live INSIDE the form's `Content metadata`
  // card now (see `formTitle` / `onBack` props on `PostForm`).
  return (
    <PostForm
      mode="edit"
      initialData={post}
      onSuccess={goBack}
      onCancel={goBack}
      formTitle="Edit Post"
      formSubtitle={
        post.title?.en || post.title?.mm || 'Untitled post'
      }
      onBack={goBack}
    />
  );
}
