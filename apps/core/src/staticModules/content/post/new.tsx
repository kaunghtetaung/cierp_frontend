"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PostForm } from "./PostForm";

interface PostNewPageProps {
  appId: string;
}

export default function PostNewPage({ appId }: PostNewPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Carries the originating PostType so we can route the user back to
  // the *type-specific* list (e.g. `/content/page` for pages,
  // `/content/news` for news) instead of a generic /post fallback.
  // The list views set this when navigating to "+ New" — see
  // `DefaultPostListView.handleNew`.
  const postTypeSlug = searchParams?.get("postTypeSlug") ?? null;

  // URL layout — `/{appId}/{module}` where `appId` = content / core /
  // library / etc. (selects the running app), and `module` = the
  // staticModules folder under it. So pages live at
  // `/content/page`, news at `/content/news`, etc. — there's NO
  // `/content/content/page` double-nest.
  const listUrl = postTypeSlug
    ? `/${appId}/${postTypeSlug}`
    : `/${appId}/post`;

  const goBack = () => router.push(listUrl);

  // Title + back button live INSIDE the form's `Content metadata`
  // card now (see `formTitle` / `onBack` props on `PostForm`). Keeps
  // the page chrome paired with the form's first card instead of as
  // a separate page-level header.
  return (
    <PostForm
      mode="create"
      onSuccess={goBack}
      onCancel={goBack}
      formTitle="Create New Post"
      formSubtitle="Fill in the details below. Drafts can be saved at any time."
      onBack={goBack}
    />
  );
}
