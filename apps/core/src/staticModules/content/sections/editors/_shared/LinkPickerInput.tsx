'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import {
  Input,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui';
import { Link2, Loader2, Search, X } from 'lucide-react';
import { getPages, getPosts } from '../../../common/actions';

interface LinkPickerInputProps {
  value: string | undefined;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
  // Restrict the picker — only show "Pages" tab, only "Posts", or both
  // (the default). Useful for fields that are conceptually one or the
  // other (e.g. "Read more" linking out to an article = posts only).
  modes?: Array<'pages' | 'posts' | 'custom'>;
}

interface SimpleResult {
  id: string;
  label: string;
  url: string;
  hint?: string;
}

// Resolve a Page/Post into the public URL used by the renderer. Pages
// live at `/<slug>`; Posts live at `/<postTypeSlug>/<slug>` (falling back
// to `/post/<slug>` when postType isn't set on the doc).
function pageToResult(p: any): SimpleResult {
  const slug = p?.slug ?? '';
  return {
    id: String(p?._id ?? p?.id ?? slug),
    label: p?.title?.en || p?.title?.mm || slug,
    url: slug ? `/${slug}` : '/',
    hint: p?.path?.length
      ? `/${p.path.join('/')}/${slug}`
      : slug
        ? `/${slug}`
        : undefined,
  };
}

function postToResult(p: any): SimpleResult {
  const slug = p?.slug ?? '';
  const typeSlug = p?.postTypeSlug || 'post';
  return {
    id: String(p?._id ?? p?.id ?? slug),
    label: p?.title?.en || p?.title?.mm || slug,
    url: slug ? `/${typeSlug}/${slug}` : '',
    hint: typeSlug,
  };
}

export function LinkPickerInput({
  value,
  onChange,
  placeholder = 'https://example.com or /about',
  className,
  modes = ['pages', 'posts'],
}: LinkPickerInputProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-2 items-center">
      <Input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className ?? 'h-8'}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 shrink-0"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        title="Browse pages or posts"
      >
        <Link2 className="h-3.5 w-3.5 mr-1" />
        Browse
      </Button>

      {open && (
        <PickerPortal
          onClose={() => setOpen(false)}
          onSelect={(url) => {
            onChange(url);
            setOpen(false);
          }}
          modes={modes}
          currentValue={value ?? ''}
        />
      )}
    </div>
  );
}

// ───────────────── Portal-based picker ───────────────────────────────
//
// The section editor renders inside a Radix Dialog. Nesting another
// Radix Dialog inside it triggers Radix's focus trap / pointer-events
// lock interactions, which silently swallow the nested dialog. Bypass
// the whole primitive: render a backdrop + panel directly to
// `document.body` via React portal at z-index 1200 (well above the
// parent dialog's z=1050). No focus trap, no aria-hidden cascade —
// just a plain modal we control end-to-end.
function PickerPortal({
  onClose,
  onSelect,
  modes,
  currentValue,
}: {
  onClose: () => void;
  onSelect: (url: string) => void;
  modes: Array<'pages' | 'posts' | 'custom'>;
  currentValue: string;
}) {
  const [mounted, setMounted] = useState(false);

  // Escape closes; lock body scroll while the picker is open.
  // Also force body's `pointer-events: auto` — the parent Radix Dialog
  // sometimes sets `pointer-events: none` on the body itself which
  // would make every nested popup inert. We restore the previous value
  // on unmount so the parent's modal lock continues to work afterwards.
  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    const prevPointerEvents = document.body.style.pointerEvents;
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'auto';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.pointerEvents = prevPointerEvents;
    };
  }, [onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  const showPages = modes.includes('pages');
  const showPosts = modes.includes('posts');
  const defaultTab = showPages ? 'pages' : showPosts ? 'posts' : 'custom';

  return createPortal(
    <div
      // Backdrop — closes on click. Z-index sits above the parent
      // section editor's dialog (z=1050). `pointerEvents: 'auto'` is
      // critical: the parent Radix Dialog sets `pointer-events: none`
      // on every body child that isn't its own portal, which would
      // otherwise make this entire popup inert.
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        pointerEvents: 'auto',
      }}
    >
      <div
        // Stop click propagation so clicks inside the panel don't close it.
        onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-lg border shadow-xl"
        style={{
          width: '100%',
          maxWidth: '40rem',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1201,
          pointerEvents: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 border-b">
          <div>
            <h2 className="text-base font-semibold">Pick a link</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse pages or posts to link to, or paste a custom URL.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-muted text-muted-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1">
          <Tabs defaultValue={defaultTab} className="flex flex-col">
            <TabsList className="grid grid-cols-3 h-9 mb-3">
              {showPages && (
                <TabsTrigger value="pages" className="text-xs">
                  Pages
                </TabsTrigger>
              )}
              {showPosts && (
                <TabsTrigger value="posts" className="text-xs">
                  Posts
                </TabsTrigger>
              )}
              <TabsTrigger value="custom" className="text-xs">
                Custom URL
              </TabsTrigger>
            </TabsList>

            {showPages && (
              <TabsContent value="pages" className="mt-0">
                <BrowseList kind="pages" onSelect={onSelect} />
              </TabsContent>
            )}
            {showPosts && (
              <TabsContent value="posts" className="mt-0">
                <BrowseList kind="posts" onSelect={onSelect} />
              </TabsContent>
            )}
            <TabsContent value="custom" className="mt-0 space-y-3">
              <CustomUrlPanel
                initialValue={currentValue}
                onSubmit={onSelect}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ───────────────── Browse list ────────────────────────────────────────
function BrowseList({
  kind,
  onSelect,
}: {
  kind: 'pages' | 'posts';
  onSelect: (url: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SimpleResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Debounce search input — 250 ms is enough to feel snappy without
  // firing a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Lazy load on mount / query change.
  useEffect(() => {
    startTransition(async () => {
      try {
        if (kind === 'pages') {
          const res = await getPages({
            search: debouncedQuery || undefined,
            limit: 30,
          } as any);
          const data = (res as any)?.data?.data ?? [];
          setResults(data.map(pageToResult));
        } else {
          const res = await getPosts({
            search: debouncedQuery || undefined,
            limit: 30,
          } as any);
          const data = (res as any)?.data?.data ?? [];
          setResults(data.map(postToResult));
        }
        setLoaded(true);
      } catch (err) {
        console.error('LinkPicker fetch error:', err);
      }
    });
  }, [kind, debouncedQuery]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${kind}…`}
          className="h-9 pl-7"
        />
      </div>

      <div className="border rounded max-h-[360px] overflow-y-auto">
        {isPending && !loaded && (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {loaded && results.length === 0 && (
          <div className="text-xs text-muted-foreground italic text-center py-6">
            No {kind} found{debouncedQuery ? ` for "${debouncedQuery}"` : ''}.
          </div>
        )}
        <ul className="divide-y">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelect(r.url)}
                className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{r.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate font-mono">
                    {r.url}
                  </div>
                </div>
                {r.hint && (
                  <span className="text-[10px] text-muted-foreground shrink-0 uppercase tracking-wide">
                    {r.hint}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ───────────────── Custom URL panel ───────────────────────────────────
function CustomUrlPanel({
  initialValue,
  onSubmit,
}: {
  initialValue: string;
  onSubmit: (url: string) => void;
}) {
  const [url, setUrl] = useState(initialValue);
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Paste any URL — internal anchors (<code>#contact</code>), relative
        paths (<code>/about</code>), or full external URLs.
      </p>
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com or /about"
        className="h-9"
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={() => onSubmit(url)}
          disabled={!url}
        >
          Use this URL
        </Button>
      </div>
    </div>
  );
}
