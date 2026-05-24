'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button } from '@repo/ui';
import { ArrowRight, Layout } from 'lucide-react';

interface PagesRedirectProps {
  appId: string;
}

/**
 * Legacy `/content/pages` list — replaced by the unified Posts editor at
 * `/content/page` (PostType.slug='page'). This page now acts as a soft
 * redirect:
 *   1. Auto-pushes to the new URL on mount.
 *   2. Renders a fallback notice + manual link in case the redirect is
 *      blocked or scripts haven't loaded.
 *
 * Why not delete the folder? Existing bookmarks, links from older
 * sessions, and the legacy `/api/pages/*` HTTP routes still expect this
 * URL to exist. Once item #8 in `project_deferred_work.md` (retire the
 * `pages` collection) is done, this folder can be removed.
 */
export default function LegacyPagesRedirect({
  appId = 'core',
}: PagesRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${appId}/content/page`);
  }, [router, appId]);

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-xl mx-auto">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <Layout className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold">Pages have moved</h1>
          <p className="text-sm text-muted-foreground">
            The old "Pages" admin has been folded into the unified Posts
            editor. Your existing pages are still here — just under a new
            URL.
          </p>
          <p className="text-xs text-muted-foreground">
            Redirecting to <code className="bg-muted px-1 py-0.5 rounded">{`/${appId}/content/page`}</code>…
          </p>
          <Button onClick={() => router.replace(`/${appId}/content/page`)}>
            Go to Pages
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
