'use client';

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
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
  Image as ImageIcon,
  ArrowLeftRight,
  Type,
  Layout,
  Settings2,
  MousePointerClick,
  X,
} from 'lucide-react';
import { MediaBrowserButton } from '@/components/media/MediaBrowserButton';
import type { MediaFile } from '@repo/media';
import type { ContentWithImageSectionFormData } from './content-with-image-types';
import { EditorSection } from './_shared/EditorSection';
import { LinkPickerInput } from './_shared/LinkPickerInput';

interface ContentWithImageSectionFormProps {
  form: UseFormReturn<ContentWithImageSectionFormData>;
  onSubmit: (data: ContentWithImageSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

export function ContentWithImageSectionForm({
  form,
  onSubmit,
}: ContentWithImageSectionFormProps) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const hasButton = !!form.watch('button');

  const toggleButton = (on: boolean) => {
    if (on) {
      form.setValue('button', {
        text: { en: '', mm: '' },
        url: '',
        style: 'primary',
        openInNewTab: false,
      });
    } else {
      form.setValue('button', undefined);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 p-3">
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
                    placeholder="e.g., About Us · Mission Statement"
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

        {/* ───────── Content (always-open primary) ───────── */}
        <EditorSection
          title="Content"
          icon={<Type className="h-3.5 w-3.5" />}
          alwaysOpen
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
                        placeholder="A short headline above the body…"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Body <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Write the body content…"
                        rows={6}
                      />
                    </FormControl>
                    <FormMessage />
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
                name="content.mm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>စာသား (မြန်မာ)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={6} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </EditorSection>

        {/* ───────── Image ───────── */}
        <EditorSection
          title="Image"
          icon={<ImageIcon className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Image URL <span className="text-destructive">*</span>
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
                {field.value && (
                  <div className="mt-2 aspect-video max-w-xs rounded-md border bg-muted overflow-hidden">
                    <img
                      src={field.value}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
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
            <TabsContent value="en" className="mt-2">
              <FormField
                control={form.control}
                name="imageAlt.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Alt text</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Describe the image for screen readers"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>
            <TabsContent value="mm" className="mt-2">
              <FormField
                control={form.control}
                name="imageAlt.mm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Alt text (MM)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </EditorSection>

        {/* ───────── Optional button ───────── */}
        <EditorSection
          title="Action button"
          icon={<MousePointerClick className="h-3.5 w-3.5" />}
          badge={
            hasButton ? (
              <Badge variant="secondary" className="text-[10px]">
                Enabled
              </Badge>
            ) : undefined
          }
          defaultOpen={hasButton}
        >
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <FormLabel className="text-xs cursor-pointer">
              Show CTA button
            </FormLabel>
            <Switch
              checked={hasButton}
              onCheckedChange={(v) => toggleButton(v === true)}
            />
          </div>
          {hasButton && (
            <>
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
                <TabsContent value="en" className="mt-2">
                  <FormField
                    control={form.control}
                    name="button.text.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Button text *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Learn more" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="mm" className="mt-2">
                  <FormField
                    control={form.control}
                    name="button.text.mm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Button text (MM)
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
                name="button.url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">URL *</FormLabel>
                    <FormControl>
                      <LinkPickerInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="/about or https://…"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="button.style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Style</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
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
                  name="button.openInNewTab"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border px-3 h-10">
                      <FormLabel className="text-xs cursor-pointer">
                        Open in new tab
                      </FormLabel>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}
        </EditorSection>

        {/* ───────── Layout ───────── */}
        <EditorSection
          title="Layout & visuals"
          icon={<Layout className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="imagePosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs flex items-center gap-1">
                    <ArrowLeftRight className="h-3 w-3" />
                    Image side
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageRatio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Image ratio</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
            <FormField
              control={form.control}
              name="contentAlignment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Text alignment</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
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
          </div>
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
        </EditorSection>

        {/* Hidden submit so Cmd+S / Enter still works inside fields. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Form>
  );
}
