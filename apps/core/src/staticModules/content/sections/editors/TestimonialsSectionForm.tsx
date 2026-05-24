'use client';

import React, { useState } from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@repo/ui';
import { Input, Button, Textarea, Switch, Badge } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Star,
  Settings2,
  Type,
  Layout,
  Quote,
} from 'lucide-react';
import { MediaBrowserButton } from '@/components/media/MediaBrowserButton';
import type { MediaFile } from '@repo/media';
import type { TestimonialsSectionFormData } from './testimonials-types';
import { EditorSection } from './_shared/EditorSection';

interface TestimonialsSectionFormProps {
  form: UseFormReturn<TestimonialsSectionFormData>;
  onSubmit: (data: TestimonialsSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

export function TestimonialsSectionForm({
  form,
  onSubmit,
  saving = false,
}: TestimonialsSectionFormProps) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const {
    fields: items,
    append,
    remove,
    move,
  } = useFieldArray({
    control: form.control,
    name: 'testimonials',
  });

  const toggle = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const layout = form.watch('layout');
  const showRatings = form.watch('showRatings');
  const showAvatars = form.watch('showAvatars');

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3 p-3"
      >
        {/* ───────── Section settings ───────── */}
        <EditorSection
          title="Section settings"
          icon={<Settings2 className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Internal name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Student Testimonials · Alumni Stories"
                  />
                </FormControl>
                <FormDescription className="text-[11px]">
                  Library label only; not shown on the public site.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isReusable"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-between rounded-md border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel className="text-xs">Reusable</FormLabel>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isVisible"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-between rounded-md border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel className="text-xs">Visible</FormLabel>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                </FormItem>
              )}
            />
          </div>
        </EditorSection>

        {/* ───────── Section header (headline + description) ───────── */}
        <EditorSection
          title="Section header"
          icon={<Type className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <Tabs
            value={langTab}
            onValueChange={(v) => setLangTab(v as 'en' | 'mm')}
          >
            <TabsList className="h-8">
              <TabsTrigger value="en" className="text-xs px-3 py-1">
                EN
              </TabsTrigger>
              <TabsTrigger value="mm" className="text-xs px-3 py-1">
                MM
              </TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="space-y-3 mt-3">
              <FormField
                control={form.control}
                name="headline.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="What our students say"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Brief intro under the headline…"
                        rows={2}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>
            <TabsContent value="mm" className="space-y-3 mt-3">
              <FormField
                control={form.control}
                name="headline.mm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ခေါင်းစဥ် (မြန်မာ)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ခေါင်းစဥ်" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description.mm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ဖော်ပြချက် (မြန်မာ)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </EditorSection>

        {/* ───────── Testimonial items (always-open primary) ───────── */}
        <EditorSection
          title="Testimonials"
          icon={<Quote className="h-3.5 w-3.5" />}
          badge={
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {items.length}
            </span>
          }
          alwaysOpen
        >
          <div className="flex items-center justify-end -mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  quote: { en: '', mm: '' },
                  author: { name: { en: '', mm: '' } },
                })
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add testimonial
            </Button>
          </div>

          {items.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              At least one testimonial is required.
            </p>
          )}

          {items.map((item, idx) => {
            const isOpen = expanded.has(idx);
            const author = form.watch(`testimonials.${idx}.author`);
            const rating = form.watch(`testimonials.${idx}.rating`);
            return (
              <div
                key={item.id}
                className="rounded-md border bg-muted/20 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/40">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      #{idx + 1}
                    </Badge>
                    <span className="text-xs font-medium truncate">
                      {author?.name?.en || author?.name?.mm || 'New testimonial'}
                      {author?.company && (
                        <span className="text-muted-foreground ml-1">
                          · {author.company}
                        </span>
                      )}
                    </span>
                    {rating && (
                      <span className="flex items-center gap-0.5 shrink-0 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < rating ? 'fill-current' : 'text-muted'
                            }`}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => idx > 0 && move(idx, idx - 1)}
                      disabled={idx === 0}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        idx < items.length - 1 && move(idx, idx + 1)
                      }
                      disabled={idx === items.length - 1}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => toggle(idx)}
                    >
                      {isOpen ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => remove(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="p-3 space-y-3">
                    {/* Language tabs cover the THREE multilang fields:
                        quote, author.name, author.title. Single-lang
                        fields (company, avatar) and rating live below. */}
                    <Tabs
                      value={langTab}
                      onValueChange={(v) => setLangTab(v as 'en' | 'mm')}
                    >
                      <TabsList className="h-7">
                        <TabsTrigger value="en" className="text-xs px-2">
                          EN
                        </TabsTrigger>
                        <TabsTrigger value="mm" className="text-xs px-2">
                          MM
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="en" className="mt-2 space-y-3">
                        <FormField
                          control={form.control}
                          name={`testimonials.${idx}.quote.en`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Quote *</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="The course completely changed my career…"
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name={`testimonials.${idx}.author.name.en`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Author name (EN) *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Prof. Dr. Aye Aye Thant"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`testimonials.${idx}.author.title.en`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Job title (EN)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Department of Internal Medicine"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                      <TabsContent value="mm" className="mt-2 space-y-3">
                        <FormField
                          control={form.control}
                          name={`testimonials.${idx}.quote.mm`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Quote (MM)
                              </FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name={`testimonials.${idx}.author.name.mm`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Author name (MM)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="ပါမောက္ခ ဒေါက်တာ အေးအေးသန့်"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`testimonials.${idx}.author.title.mm`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Job title (MM)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="အတွင်းကု ဌာန"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Single-lang fields + rating live outside the
                        language tabs since they apply to both views. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`testimonials.${idx}.author.company`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Company / Institute
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="UM1" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`testimonials.${idx}.rating`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Rating</FormLabel>
                            <Select
                              value={field.value ? String(field.value) : ''}
                              onValueChange={(v) =>
                                field.onChange(v ? Number(v) : undefined)
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="No rating" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">No rating</SelectItem>
                                {[1, 2, 3, 4, 5].map((r) => (
                                  <SelectItem key={r} value={String(r)}>
                                    {Array.from({ length: r })
                                      .map(() => '★')
                                      .join('')}{' '}
                                    ({r}/5)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`testimonials.${idx}.author.avatar`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5" />
                            Avatar URL
                          </FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://…"
                                className="font-mono text-xs"
                              />
                            </FormControl>
                            <MediaBrowserButton
                              label="Browse"
                              variant="outline"
                              size="sm"
                              config={{
                                allowedTypes: ['image/*'],
                                selectionMode: 'single',
                              }}
                              onSelectMedia={(media: MediaFile[]) => {
                                const m = media[0];
                                if (m?.url) field.onChange(m.url);
                              }}
                            />
                            {field.value && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => field.onChange('')}
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </EditorSection>

        {/* ───────── Layout & display ───────── */}
        <EditorSection
          title="Layout & display"
          icon={<Layout className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <SelectItem value="grid">Grid (3 columns)</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                      <SelectItem value="single">Single (one at a time)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="containerSettings.width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Container width</FormLabel>
                  <Select
                    value={field.value ?? 'contained'}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fullWidth">Full width</SelectItem>
                      <SelectItem value="contained">Contained</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="showAvatars"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                  <FormLabel className="text-xs cursor-pointer">
                    Show avatars
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
              name="showRatings"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                  <FormLabel className="text-xs cursor-pointer">
                    Show ratings
                  </FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
          </div>
          {layout === 'carousel' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="autoplay"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                    <FormLabel className="text-xs cursor-pointer">
                      Autoplay
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
                name="autoplaySpeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Speed (ms)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1000}
                        step={500}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          )
                        }
                        placeholder="5000"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
        </EditorSection>

        {/* Hidden submit so Cmd+S / Enter still works inside fields. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Form>
  );
}
