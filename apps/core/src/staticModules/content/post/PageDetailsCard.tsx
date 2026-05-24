'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
  FormDescription,
} from '@repo/ui';
import { Button } from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import {
  Layout,
  FileText as FileTextIcon,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { TiptapEditor } from '../common/components/editor/TiptapEditor';
import type { CreatePostFormData } from '../common/schemas';
import { PageLayoutBuilder } from './PageLayoutBuilder';

interface PageDetailsCardProps {
  form: UseFormReturn<CreatePostFormData>;
  /** Edit mode → exclude self from parent picker. */
  editingPostId?: string;
  /** Active language tab driven by the parent form. */
  langTab: 'en' | 'mm';
  setLangTab: (lang: 'en' | 'mm') => void;
  /**
   * When true, skip the outer `<Card>` + `<CardHeader>` chrome and
   * return only the inner content. Used by the page editor to embed
   * the body + settings inside the unified `Content metadata` card
   * so authors see Title and Body in one cohesive surface.
   */
  unwrapped?: boolean;
}

/**
 * Body editor for `postType.slug === 'page'` — Tiptap rich text OR
 * section composition (page-builder tree). Page-level settings
 * (hierarchy / nav flags / template) live in the right sheet via
 * `PageSettingsForm`, not here.
 */
export function PageDetailsCard({
  form,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  editingPostId,
  langTab,
  setLangTab,
  unwrapped = false,
}: PageDetailsCardProps) {
  const layoutMode =
    (form.watch('layoutMode') as 'tiptap' | 'sections') ?? 'tiptap';

  // Inner content — the body editor + collapsible page settings.
  // Rendered either inside a standalone `<Card>` (default) or directly
  // (when `unwrapped`) so the parent form can embed it into a unified
  // page-editor card alongside Title / Slug / Excerpt.
  const inner = (
    <div className="flex flex-col gap-5">
        {/* (Page settings — hierarchy / nav flags / template — moved
             into the right settings sheet via `PageSettingsForm`.
             This card now only owns the body editor.) */}

        {/* ───── Body channel toggle + editor ─────
             Promoted to the top of the card (`order-1`) so authors land
             on the body — the field they spend most time in — instead
             of scrolling past hierarchy / nav / template settings every
             time they open a page. */}
        <FormField
          control={form.control}
          name="layoutMode"
          render={({ field }) => {
            const mode = (field.value ?? 'tiptap') as 'tiptap' | 'sections';
            return (
              <FormItem className="order-1 space-y-2">
                {/* Header row — minimal "Page body" label + the
                     Tiptap/Sections toggle. The previous bordered-card
                     wrapper was removed so the editor blends straight
                     into the form flow rather than feeling like a
                     nested panel. */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <FormLabel className="text-sm font-semibold">
                      Page body
                    </FormLabel>
                    <FormDescription className="text-[11px]">
                      Pick how the body renders on the public site.
                    </FormDescription>
                  </div>
                  <div className="flex items-center gap-1 border rounded-md p-1 bg-background shrink-0">
                    <Button
                      type="button"
                      variant={mode === 'tiptap' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => field.onChange('tiptap')}
                      className="h-7 px-3 gap-1.5"
                    >
                      <FileTextIcon className="h-3.5 w-3.5" />
                      Tiptap body
                    </Button>
                    <Button
                      type="button"
                      variant={mode === 'sections' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => field.onChange('sections')}
                      className="h-7 px-3 gap-1.5"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      Sections
                    </Button>
                  </div>
                </div>
                <div>
                  {mode === 'tiptap' ? (
                    <>
                      {form.watch('templateId') && (
                        <div
                          className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs flex items-start gap-2 mb-2"
                        >
                          <Layout className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <strong>Wrapper template active.</strong>{' '}
                            The template&apos;s layout (sidebar widgets,
                            hero band, etc.) renders around the body
                            you author below. Update the template to
                            change the surrounding chrome — your body
                            content lives only on this page.
                          </div>
                        </div>
                      )}
                      <Tabs
                        value={langTab}
                        onValueChange={(v) =>
                          setLangTab(v as 'en' | 'mm')
                        }
                      >
                        <TabsList className="h-8 mb-2">
                          <TabsTrigger
                            value="en"
                            className="text-xs px-3 py-1"
                          >
                            EN
                          </TabsTrigger>
                          <TabsTrigger
                            value="mm"
                            className="text-xs px-3 py-1"
                          >
                            MM
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="en" className="mt-0">
                          <FormField
                            control={form.control}
                            name="body.en"
                            render={({ field: bodyField }) => (
                              <FormItem>
                                <FormControl>
                                  <TiptapEditor
                                    content={(bodyField.value as any) ?? ''}
                                    onChange={bodyField.onChange}
                                    outputFormat="json"
                                    placeholder="Write the page body in English…"
                                    minHeight="320px"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        <TabsContent value="mm" className="mt-0">
                          <FormField
                            control={form.control}
                            name="body.mm"
                            render={({ field: bodyField }) => (
                              <FormItem>
                                <FormControl>
                                  <TiptapEditor
                                    content={(bodyField.value as any) ?? ''}
                                    onChange={bodyField.onChange}
                                    outputFormat="json"
                                    placeholder="ပို့စ်ဇာတ်ကြောင်း (မြန်မာ)…"
                                    minHeight="320px"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      </Tabs>
                    </>
                  ) : (
                      <FormField
                        control={form.control}
                        name="layout"
                        render={({ field: layoutField }) => (
                          <FormItem>
                            <FormControl>
                              <PageLayoutBuilder
                                value={layoutField.value as any}
                                onChange={layoutField.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                </div>
              </FormItem>
            );
          }}
        />
      </div>
  );

  if (unwrapped) return inner;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Layout className="h-4 w-4 text-muted-foreground" />
          Page content
        </CardTitle>
      </CardHeader>
      <CardContent>{inner}</CardContent>
    </Card>
  );
}
