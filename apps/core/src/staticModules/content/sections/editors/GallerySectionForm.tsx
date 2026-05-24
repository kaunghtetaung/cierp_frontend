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
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Images,
  ImagePlus,
  ExternalLink,
  Settings2,
  Type,
  Layout,
} from 'lucide-react';
import { MediaBrowserButton } from '@/components/media/MediaBrowserButton';
import type { MediaFile } from '@repo/media';
import type { GallerySectionFormData } from './gallery-types';
import { EditorSection } from './_shared/EditorSection';
import { LinkPickerInput } from './_shared/LinkPickerInput';

interface GallerySectionFormProps {
  form: UseFormReturn<GallerySectionFormData>;
  onSubmit: (data: GallerySectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

export function GallerySectionForm({
  form,
  onSubmit,
  saving = false,
}: GallerySectionFormProps) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const {
    fields: images,
    append,
    remove,
    move,
  } = useFieldArray({
    control: form.control,
    name: 'images',
  });

  const toggle = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Bulk-add helper — pass an array of selected media into the field array
  // in one go so authors can pick 10 photos at once.
  const handleBulkAdd = (media: MediaFile[]) => {
    media.forEach((m) => {
      append({
        url: m.url,
        mediaId: m.id,
        alt: {
          en: m.alt?.en || m.alt?.mm || '',
          mm: m.alt?.mm,
        },
        caption: m.caption
          ? { en: m.caption.en || '', mm: m.caption.mm }
          : undefined,
      });
    });
  };

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
                    placeholder="e.g., Campus Photo Gallery"
                  />
                </FormControl>
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
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs">Reusable</FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isVisible"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs">Visible</FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
          </div>
        </EditorSection>

        {/* ───────── Section header (optional) ───────── */}
        <EditorSection
          title="Section header"
          icon={<Type className="h-3.5 w-3.5" />}
          defaultOpen={false}
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
                        placeholder="Life on campus"
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
                      <Textarea {...field} rows={2} />
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
                      <Input {...field} />
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

        {/* ───────── Images (always-open primary) ───────── */}
        <EditorSection
          title="Images"
          icon={<Images className="h-3.5 w-3.5" />}
          badge={
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {images.length}
            </span>
          }
          alwaysOpen
        >
          <div className="flex items-center justify-end -mt-1">
            <div className="flex items-center gap-2">
              <MediaBrowserButton
                label="Browse media"
                variant="outline"
                size="sm"
                icon={<ImagePlus className="h-3.5 w-3.5 mr-1" />}
                config={{
                  allowedTypes: ['image/*'],
                  selectionMode: 'multiple',
                  maxFileSize: 10 * 1024 * 1024,
                }}
                onSelectMedia={handleBulkAdd}
              />
            </div>
          </div>

          {images.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              At least one image is required. Use Browse media to add several
              at once.
            </p>
          )}

          {/* Thumbnail strip — visual + click-to-expand. Keeps the editor
              compact when a gallery has 20+ images. */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {images.map((img, idx) => {
              const url = form.watch(`images.${idx}.url`);
              const isOpen = expanded.has(idx);
              return (
                <div
                  key={img.id}
                  className={`relative aspect-square rounded-md overflow-hidden border group cursor-pointer ${
                    isOpen ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => toggle(idx)}
                >
                  {url ? (
                    <img
                      src={url}
                      alt={form.watch(`images.${idx}.alt.en`) || ''}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                      <Images className="h-6 w-6" />
                    </div>
                  )}
                  <div className="absolute top-1 left-1">
                    <Badge variant="secondary" className="text-[10px]">
                      #{idx + 1}
                    </Badge>
                  </div>
                  <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (idx > 0) move(idx, idx - 1);
                      }}
                      disabled={idx === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (idx < images.length - 1) move(idx, idx + 1);
                      }}
                      disabled={idx === images.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(idx);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded editor for selected image */}
          {Array.from(expanded).map((idx) => {
            if (idx >= images.length) return null;
            const img = images[idx];
            return (
              <div
                key={`expand-${img.id}`}
                className="rounded-md border bg-muted/20 p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge variant="secondary" className="text-[10px]">
                      Image #{idx + 1}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggle(idx)}
                  >
                    Close
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name={`images.${idx}.url`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Image URL *</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://…"
                            className="font-mono text-xs"
                          />
                        </FormControl>
                        <MediaBrowserButton
                          label=""
                          variant="outline"
                          size="sm"
                          config={{
                            allowedTypes: ['image/*'],
                            selectionMode: 'single',
                          }}
                          onSelectMedia={(media: MediaFile[]) => {
                            const m = media[0];
                            if (!m) return;
                            field.onChange(m.url);
                            form.setValue(
                              `images.${idx}.mediaId`,
                              m.id || '',
                            );
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  <TabsContent value="en" className="space-y-2 mt-2">
                    <FormField
                      control={form.control}
                      name={`images.${idx}.alt.en`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Alt text *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Describe the image for screen readers"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`images.${idx}.caption.en`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Caption</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Visible caption under the image"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  <TabsContent value="mm" className="space-y-2 mt-2">
                    <FormField
                      control={form.control}
                      name={`images.${idx}.alt.mm`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            Alt text (MM)
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`images.${idx}.caption.mm`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            Caption (MM)
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
                <FormField
                  control={form.control}
                  name={`images.${idx}.link`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Click-through URL (optional)
                      </FormLabel>
                      <FormControl>
                        <LinkPickerInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="https://… (leave empty for no link)"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="masonry">Masonry</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
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
                  <Select
                    value={String(field.value ?? 3)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aspectRatio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Aspect ratio</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="square">Square (1:1)</SelectItem>
                      <SelectItem value="landscape">
                        Landscape (16:9)
                      </SelectItem>
                      <SelectItem value="portrait">Portrait (3:4)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="showCaptions"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                  <FormLabel className="text-xs cursor-pointer">
                    Show captions
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
              name="lightbox"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                  <FormLabel className="text-xs cursor-pointer">
                    Lightbox on click
                  </FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
          </div>
        </EditorSection>

        {/* Hidden submit so Cmd+S / Enter still works inside fields. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Form>
  );
}
