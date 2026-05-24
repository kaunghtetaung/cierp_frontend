'use client';

import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui';
import { Input, Switch, Textarea } from '@repo/ui';
import { IconSelector } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { Newspaper, Filter, LayoutGrid, Eye } from 'lucide-react';
import {
  getPostTypeReference,
  getCategoryReference,
} from '../../common/actions';
import type { RecentPostsSectionFormData } from './recent-posts-types';

interface RecentPostsSectionFormProps {
  form: UseFormReturn<RecentPostsSectionFormData>;
  onSubmit: (data: RecentPostsSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

interface RefItem {
  id: string;
  label: string;
  slug?: string;
}

/**
 * Editor for the "Recent Posts" dynamic section. The author configures a
 * query (post type, categories, sort, limit) and a display layout; the
 * publicWeb renderer fetches matching posts at render time.
 */
export function RecentPostsSectionForm({
  form,
  onSubmit,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCancel,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saving = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tenantId,
}: RecentPostsSectionFormProps) {
  const [postTypes, setPostTypes] = useState<RefItem[]>([]);
  const [categories, setCategories] = useState<RefItem[]>([]);
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [pt, cat] = await Promise.all([
        getPostTypeReference({ limit: 200 }),
        getCategoryReference({ limit: 200 }),
      ]);
      if (cancelled) return;
      if (pt.success && Array.isArray(pt.data)) {
        setPostTypes(
          (pt.data as any[]).map((p) => ({
            id: p.id,
            label: p.label,
            slug: p.slug,
          })),
        );
      }
      if (cat.success && Array.isArray(cat.data)) {
        setCategories(
          (cat.data as any[]).map((c) => ({ id: c.id, label: c.label })),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5 p-4"
      >
        {/* ───────── Section identity */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5 text-sm">
                <Newspaper className="h-3.5 w-3.5 text-muted-foreground" />
                Section name
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. Latest News (Home)"
                />
              </FormControl>
              <FormDescription className="text-[11px]">
                Internal reference — not shown on the public site.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ───────── Heading (optional) */}
        <div className="rounded-md border p-3 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Heading (optional)
          </div>

          {/* Headline icon — single string shared across languages, so it
               lives outside the EN/MM tabs as its own standalone field. */}
          <FormField
            control={form.control}
            name="headlineIcon"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Headline icon</FormLabel>
                <FormControl>
                  <IconSelector
                    value={field.value}
                    onSelect={field.onChange}
                    placeholder="Pick an icon (optional)…"
                  />
                </FormControl>
                <FormDescription className="text-[11px]">
                  Rendered next to the headline on the public site.
                </FormDescription>
              </FormItem>
            )}
          />

          <Tabs
            value={langTab}
            onValueChange={(v) => setLangTab(v as 'en' | 'mm')}
          >
            <TabsList className="h-8">
              <TabsTrigger value="en" className="text-xs px-3">
                EN
              </TabsTrigger>
              <TabsTrigger value="mm" className="text-xs px-3">
                MM
              </TabsTrigger>
            </TabsList>
            {(['en', 'mm'] as const).map((lang) => (
              <TabsContent key={lang} value={lang} className="space-y-3 mt-3">
                <FormField
                  control={form.control}
                  name={`headline.${lang}` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Headline</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder={
                            lang === 'en'
                              ? 'Latest News'
                              : 'နောက်ဆုံးသတင်းများ'
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`subheadline.${lang}` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Subheadline</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          rows={2}
                          placeholder="Optional supporting text"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`viewAllLabel.${lang}` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        &quot;View all&quot; label
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder={
                            lang === 'en' ? 'View all' : 'အားလုံးကြည့်ရန်'
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            ))}
          </Tabs>
          <FormField
            control={form.control}
            name="viewAllUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">
                  &quot;View all&quot; URL
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="/post/news"
                  />
                </FormControl>
                <FormDescription className="text-[11px]">
                  Public list page for this post type — pattern is
                  &nbsp;<code>/post/&lt;postTypeSlug&gt;</code>
                  &nbsp;(e.g. <code>/post/news</code>,&nbsp;
                  <code>/post/announcements</code>,&nbsp;
                  <code>/post/events</code>). Leave blank to hide the link.
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        {/* ───────── Query */}
        <div className="rounded-md border p-3 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Query — what to fetch
          </div>

          <FormField
            control={form.control}
            name="query.postTypeSlug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Post type</FormLabel>
                <Select
                  value={field.value ?? '__any__'}
                  onValueChange={(v) =>
                    field.onChange(v === '__any__' ? null : v)
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Any post type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__any__">Any post type</SelectItem>
                    {postTypes.map((pt) => (
                      <SelectItem key={pt.id} value={pt.slug ?? pt.id}>
                        {pt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-[11px]">
                  Scope to one post type (news, announcements…) or leave open.
                </FormDescription>
              </FormItem>
            )}
          />

          {/* Category multi-select via checkboxes */}
          <FormField
            control={form.control}
            name="query.categoryIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Categories</FormLabel>
                <div className="rounded-md border p-2 max-h-40 overflow-y-auto space-y-1">
                  {categories.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground p-1">
                      No categories.
                    </p>
                  ) : (
                    categories.map((c) => {
                      const checked = (field.value ?? []).includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 text-xs cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(field.value ?? []);
                              if (e.target.checked) next.add(c.id);
                              else next.delete(c.id);
                              field.onChange(Array.from(next));
                            }}
                          />
                          <span>{c.label}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                <FormDescription className="text-[11px]">
                  Empty = any category.
                </FormDescription>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="query.limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value) || 1)
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="query.sort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Sort by</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="popular">Most viewed</SelectItem>
                      <SelectItem value="pinned">Pinned first</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="query.featuredOnly"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                <FormLabel className="text-xs cursor-pointer">
                  Featured only
                </FormLabel>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              </FormItem>
            )}
          />
        </div>

        {/* ───────── Display */}
        <div className="rounded-md border p-3 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5" />
            Display
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="layout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Layout</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="grid">Grid (cards)</SelectItem>
                      <SelectItem value="list">List (rows)</SelectItem>
                      <SelectItem value="overlay">
                        Overlay (text on image)
                      </SelectItem>
                      <SelectItem value="mosaic">
                        Mosaic (editorial — 4 posts)
                      </SelectItem>
                      <SelectItem value="duo">
                        Duo (2-hero diagonal — 6 posts)
                      </SelectItem>
                      <SelectItem value="compact">Compact (titles)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="columns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Columns</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={6}
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value) || 1)
                      }
                    />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Grid layout only.
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

          {/* Pagination toggle. When on, the publicWeb renderer shows
               page controls and treats the Limit field above as the
               per-page size. When off, the section is a static
               "latest N" snapshot with no controls. */}
          <FormField
            control={form.control}
            name="enablePaging"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <FormLabel className="text-xs cursor-pointer">
                    Enable pagination
                  </FormLabel>
                  <p className="text-[10px] text-muted-foreground">
                    Adds Prev/Next controls. &quot;Limit&quot; becomes the
                    page size.
                  </p>
                </div>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              </FormItem>
            )}
          />

          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Card fields
            </div>
            {[
              { name: 'showImage' as const, label: 'Featured image' },
              { name: 'showExcerpt' as const, label: 'Excerpt' },
              { name: 'showDate' as const, label: 'Published date' },
              { name: 'showCategory' as const, label: 'Category' },
              { name: 'showAuthor' as const, label: 'Author' },
            ].map((opt) => (
              <FormField
                key={opt.name}
                control={form.control}
                name={opt.name}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border px-3 py-1.5">
                    <FormLabel className="text-xs cursor-pointer">
                      {opt.label}
                    </FormLabel>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* ───────── Visibility / state */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="isVisible"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                <FormLabel className="text-xs cursor-pointer">
                  Visible
                </FormLabel>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isReusable"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                <FormLabel className="text-xs cursor-pointer">
                  Reusable
                </FormLabel>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
