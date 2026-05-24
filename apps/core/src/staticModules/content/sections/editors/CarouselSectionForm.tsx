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
} from '@repo/ui';
import { Input, Button, Textarea, Switch } from '@repo/ui';
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
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { MediaBrowserButton } from '@/components/media/MediaBrowserButton';
import type { CarouselSectionFormData } from './carousel-types';
import { LinkPickerInput } from './_shared/LinkPickerInput';

interface CarouselSectionFormProps {
  form: UseFormReturn<CarouselSectionFormData>;
  onSubmit: (data: CarouselSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

const blankSlide = () => ({
  id: `slide-${Date.now()}`,
  backgroundImage: '',
  backgroundVideo: '',
  overlay: { enabled: false, color: '#000000', opacity: 0.4 },
  image: '',
  title: { en: '', mm: '' },
  subtitle: { en: '', mm: '' },
  description: { en: '', mm: '' },
  buttons: [],
  layout: 'centered' as const,
  contentStyle: 'flat' as const,
  textAlignment: 'center' as const,
});

export function CarouselSectionForm({
  form,
  onSubmit,
  onCancel: _onCancel,
  saving: _saving = false,
  tenantId,
}: CarouselSectionFormProps) {
  const [expandedSlide, setExpandedSlide] = useState<number | null>(0);

  const {
    fields: slideFields,
    append: appendSlide,
    remove: removeSlide,
    move: moveSlide,
  } = useFieldArray({
    control: form.control,
    name: 'slides',
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="h-full flex flex-col"
      >
        <Tabs defaultValue="slides" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 h-10 mb-2 shrink-0 mx-4 mt-3" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="slides" className="text-xs">Slides</TabsTrigger>
            <TabsTrigger value="behavior" className="text-xs">Behavior</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
          </TabsList>

          {/* Slides tab — main authoring surface */}
          <TabsContent value="slides" className="mt-0 flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Section Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. home_hero_um1"
                      className="h-8"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm">
                  Slides ({slideFields.length})
                </FormLabel>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => {
                    appendSlide(blankSlide());
                    setExpandedSlide(slideFields.length);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add slide
                </Button>
              </div>

              {slideFields.length === 0 && (
                <div className="text-xs text-muted-foreground text-center border border-dashed rounded p-4">
                  No slides yet. Click "Add slide" to start.
                </div>
              )}

              {slideFields.map((slideField, slideIdx) => {
                const isExpanded = expandedSlide === slideIdx;
                return (
                  <div
                    key={slideField.id}
                    className="border rounded overflow-hidden bg-card"
                  >
                    {/* Slide header — collapse / drag / delete */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
                      <button
                        type="button"
                        onClick={() => setExpandedSlide(isExpanded ? null : slideIdx)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        <span className="text-sm font-medium truncate">
                          Slide {slideIdx + 1}
                          {form.watch(`slides.${slideIdx}.title.en`) && (
                            <span className="text-muted-foreground font-normal ml-2">
                              · {form.watch(`slides.${slideIdx}.title.en`)}
                            </span>
                          )}
                        </span>
                      </button>
                      {slideIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => moveSlide(slideIdx, slideIdx - 1)}
                          className="p-1 hover:bg-background rounded"
                          aria-label="Move up"
                        >
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          removeSlide(slideIdx);
                          setExpandedSlide(null);
                        }}
                        className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                        aria-label="Remove slide"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Slide body — show only when expanded */}
                    {isExpanded && (
                      <div className="px-4 py-4 space-y-3 border-t">
                        <SlideEditor
                          form={form}
                          slideIdx={slideIdx}
                          tenantId={tenantId}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Behavior tab */}
          <TabsContent value="behavior" className="mt-0 flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Carousel Height</FormLabel>
                    <Select value={field.value || 'large'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="fullscreen">Fullscreen</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transitionEffect"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Transition Effect</FormLabel>
                    <Select value={field.value || 'fade'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="slide">Slide</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="transitionDuration"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs">
                      Transition Duration
                    </FormLabel>
                    <span className="text-xs text-muted-foreground">
                      {field.value || 600}ms
                    </span>
                  </div>
                  <FormControl>
                    <input
                      type="range"
                      min={100}
                      max={3000}
                      step={50}
                      value={field.value || 600}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      aria-label="Transition Duration"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoplay"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between border rounded p-3">
                  <FormLabel className="text-xs m-0">Autoplay</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoplaySpeed"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs">Autoplay Speed</FormLabel>
                    <span className="text-xs text-muted-foreground">
                      {((field.value || 8000) / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <FormControl>
                    <input
                      type="range"
                      min={1000}
                      max={30000}
                      step={500}
                      value={field.value || 8000}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      aria-label="Autoplay Speed"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="showDots"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between border rounded p-3">
                    <FormLabel className="text-xs m-0">Show Dots</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="showArrows"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between border rounded p-3">
                    <FormLabel className="text-xs m-0">Show Arrows</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Settings tab */}
          <TabsContent value="settings" className="mt-0 flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <FormField
              control={form.control}
              name="isVisible"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between border rounded p-3">
                  <FormLabel className="text-xs m-0">Visible on site</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isReusable"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between border rounded p-3">
                  <FormLabel className="text-xs m-0">Reusable across pages</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-8">
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
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}

interface SlideEditorProps {
  form: UseFormReturn<CarouselSectionFormData>;
  slideIdx: number;
  tenantId?: string;
}

/**
 * Editor for a single slide. Split out so the parent component stays
 * readable; uses sub-tabs (content / media / layout / buttons) so authors
 * can focus on one aspect at a time without scrolling 30+ fields.
 */
function SlideEditor({ form, slideIdx, tenantId }: SlideEditorProps) {
  const buttonsName = `slides.${slideIdx}.buttons` as const;
  const {
    fields: buttonFields,
    append: appendButton,
    remove: removeButton,
  } = useFieldArray({
    control: form.control,
    name: buttonsName as any,
  });

  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-9 mb-3 gap-1 p-1">
        <TabsTrigger value="content" className="text-xs px-2">Content</TabsTrigger>
        <TabsTrigger value="media" className="text-xs px-2">Media</TabsTrigger>
        <TabsTrigger value="layout" className="text-xs px-2">Layout</TabsTrigger>
        <TabsTrigger value="buttons" className="text-xs px-2">Buttons</TabsTrigger>
      </TabsList>

      {/* Content sub-tab — title / subtitle / description in EN + MM */}
      <TabsContent value="content" className="mt-3 space-y-3">
        <Tabs defaultValue="en">
          <TabsList className="h-8 gap-1 p-1">
            <TabsTrigger value="en" className="text-xs px-3">EN</TabsTrigger>
            <TabsTrigger value="mm" className="text-xs px-3">MM</TabsTrigger>
          </TabsList>

          {(['en', 'mm'] as const).map((lang) => (
            <TabsContent key={lang} value={lang} className="mt-2 space-y-2">
              <FormField
                control={form.control}
                name={`slides.${slideIdx}.title.${lang}` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Title {lang === 'mm' ? '(မြန်မာ)' : ''}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8" placeholder="Slide title" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`slides.${slideIdx}.subtitle.${lang}` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Subtitle {lang === 'mm' ? '(မြန်မာ)' : ''}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8" placeholder="Eyebrow / degrees / etc" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`slides.${slideIdx}.description.${lang}` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Description {lang === 'mm' ? '(မြန်မာ)' : ''}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        className="text-sm resize-none"
                        placeholder="Long-form text for the slide"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>
          ))}
        </Tabs>
      </TabsContent>

      {/* Media sub-tab — bg image, bg video, foreground image, overlay */}
      <TabsContent value="media" className="mt-3 space-y-3">
        <FormField
          control={form.control}
          name={`slides.${slideIdx}.backgroundImage` as const}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Background Image</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input {...field} placeholder="Image URL" className="h-8 flex-1" />
                  {tenantId && (
                    <MediaBrowserButton
                      tenantId={tenantId}
                      onSelect={(url) => {
                        // `MediaBrowserButton.onSelect` receives a
                        // single URL string (the first selected file's
                        // URL), not an array — the wrong signature was
                        // making `field.onChange(undefined)` no-op.
                        if (url) field.onChange(url);
                      }}
                      config={{ allowedTypes: ['image/*'], selectionMode: 'single' }}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      label="Browse"
                    />
                  )}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`slides.${slideIdx}.backgroundVideo` as const}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">
                Background Video <span className="text-muted-foreground">(takes priority over image when set)</span>
              </FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input {...field} placeholder="Video URL (mp4 / webm)" className="h-8 flex-1" />
                  {tenantId && (
                    <MediaBrowserButton
                      tenantId={tenantId}
                      onSelect={(url) => {
                        // `MediaBrowserButton.onSelect` receives a
                        // single URL string (the first selected file's
                        // URL), not an array — the wrong signature was
                        // making `field.onChange(undefined)` no-op.
                        if (url) field.onChange(url);
                      }}
                      config={{ allowedTypes: ['video/*'], selectionMode: 'single' }}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      label="Browse"
                    />
                  )}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`slides.${slideIdx}.image` as const}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">
                Foreground Image <span className="text-muted-foreground">(logo / portrait — sits on the content layer)</span>
              </FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input {...field} placeholder="Image URL" className="h-8 flex-1" />
                  {tenantId && (
                    <MediaBrowserButton
                      tenantId={tenantId}
                      onSelect={(url) => {
                        // `MediaBrowserButton.onSelect` receives a
                        // single URL string (the first selected file's
                        // URL), not an array — the wrong signature was
                        // making `field.onChange(undefined)` no-op.
                        if (url) field.onChange(url);
                      }}
                      config={{ allowedTypes: ['image/*'], selectionMode: 'single' }}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      label="Browse"
                    />
                  )}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {/* Overlay group */}
        <div className="border rounded p-3 space-y-3">
          <FormField
            control={form.control}
            name={`slides.${slideIdx}.overlay.enabled` as const}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between m-0">
                <FormLabel className="text-xs m-0">Overlay (dim background)</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {form.watch(`slides.${slideIdx}.overlay.enabled`) && (
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name={`slides.${slideIdx}.overlay.color` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Color</FormLabel>
                    <FormControl>
                      <Input
                        type="color"
                        {...field}
                        value={field.value || '#000000'}
                        className="h-8 w-full"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`slides.${slideIdx}.overlay.opacity` as const}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs">Opacity</FormLabel>
                      <span className="text-xs text-muted-foreground">
                        {((field.value ?? 0.4) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <FormControl>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={field.value ?? 0.4}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        aria-label="Overlay opacity"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
      </TabsContent>

      {/* Layout sub-tab — content position + alignment + box style */}
      <TabsContent value="layout" className="mt-3 space-y-3">
        <FormField
          control={form.control}
          name={`slides.${slideIdx}.layout` as const}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Layout</FormLabel>
              <Select value={field.value || 'centered'} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="centered">Centered (image stacked above text)</SelectItem>
                  <SelectItem value="split-left">Split — image on left</SelectItem>
                  <SelectItem value="split-right">Split — image on right</SelectItem>
                  <SelectItem value="flat">Flat (text only, no image)</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`slides.${slideIdx}.contentStyle` as const}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Content Style</FormLabel>
              <Select value={field.value || 'flat'} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="flat">Flat — text directly on background</SelectItem>
                  <SelectItem value="boxed">Boxed — content sits in a panel</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`slides.${slideIdx}.textAlignment` as const}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Text Alignment</FormLabel>
              <Select value={field.value || 'center'} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </TabsContent>

      {/* Buttons sub-tab — field array nested inside slide */}
      <TabsContent value="buttons" className="mt-3 space-y-3">
        <div className="flex items-center justify-between">
          <FormLabel className="text-xs">
            Buttons ({buttonFields.length})
          </FormLabel>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() =>
              appendButton({
                text: { en: '', mm: '' },
                url: '',
                style: 'primary',
                openInNewTab: false,
              } as any)
            }
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add button
          </Button>
        </div>

        {buttonFields.map((btnField, btnIdx) => (
          <div key={btnField.id} className="border rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Button {btnIdx + 1}</span>
              <button
                type="button"
                onClick={() => removeButton(btnIdx)}
                className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                aria-label="Remove button"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name={`slides.${slideIdx}.buttons.${btnIdx}.text.en` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Text (EN)</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`slides.${slideIdx}.buttons.${btnIdx}.text.mm` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Text (MM)</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name={`slides.${slideIdx}.buttons.${btnIdx}.url` as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">URL</FormLabel>
                  <FormControl>
                    <LinkPickerInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="/about or https://…"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name={`slides.${slideIdx}.buttons.${btnIdx}.style` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Style</FormLabel>
                    <Select value={field.value || 'primary'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`slides.${slideIdx}.buttons.${btnIdx}.openInNewTab` as const}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between border rounded p-2 m-0">
                    <FormLabel className="text-xs m-0">New tab</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}

        {buttonFields.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No buttons. The slide will render text only.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
