'use client';

import React, { useState } from 'react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui';
import {
  Input,
  Button,
  Textarea,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui';
import { IconSelector } from '@repo/ui';
import {
  Plus,
  Trash2,
  Settings2,
  Type,
  Layout,
  Palette,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Image as ImageIcon,
  Link2,
} from 'lucide-react';
import { MediaBrowserButton } from '@/components/media/MediaBrowserButton';
import { EditorSection } from './_shared/EditorSection';
import { LinkPickerInput } from './_shared/LinkPickerInput';
import type {
  FeatureListSectionFormData,
  FeatureItemFormData,
} from './feature-list-types';

interface FeatureListSectionFormProps {
  form: UseFormReturn<FeatureListSectionFormData>;
  onSubmit: (data: FeatureListSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

const blankFeature = (): FeatureItemFormData => ({
  title: { en: '', mm: '' },
  description: { en: '', mm: '' },
  icon: '',
  image: '',
  link: undefined,
});

export function FeatureListSectionForm({
  form,
  onSubmit,
  tenantId,
}: FeatureListSectionFormProps) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(
    new Set([0]),
  );

  const {
    fields: features,
    append,
    remove,
    move,
  } = useFieldArray({
    control: form.control,
    name: 'features',
  });

  const toggleFeature = (idx: number) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const showIcons = form.watch('showIcons');
  const showImages = form.watch('showImages');

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
                    placeholder="e.g., Homepage Features · Programme Highlights"
                  />
                </FormControl>
                <FormDescription className="text-[11px]">
                  Used in the section library — not shown on the public site.
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

        {/* ───────── Section header ───────── */}
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
                        placeholder="What we offer"
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
                        rows={2}
                        placeholder="Optional supporting text"
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
                    <FormLabel>ခေါင်းစဉ် (မြန်မာ)</FormLabel>
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

          {/* Header presentation knobs — icon (Lucide), alignment, size,
              colour. Apply to both languages (the icon is language-
              agnostic, alignment shifts the whole header block). */}
          <div className="pt-3 border-t space-y-3">
            <FormField
              control={form.control}
              name="headlineIcon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Header icon</FormLabel>
                  <FormControl>
                    <IconSelector
                      value={field.value}
                      onSelect={field.onChange}
                      placeholder="Select an icon… (optional)"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="headlineAlign"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Alignment</FormLabel>
                    <Select
                      value={field.value || 'center'}
                      onValueChange={field.onChange}
                    >
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
              <FormField
                control={form.control}
                name="headlineIconSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Icon size (px)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={12}
                        max={96}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          )
                        }
                        className="h-8"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="headlineIconColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Icon color</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || '#000000'}
                        type="color"
                        className="h-8 p-1"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </EditorSection>

        {/* ───────── Features (always-open primary surface) ───────── */}
        <EditorSection
          title="Features"
          icon={<ListChecks className="h-3.5 w-3.5" />}
          badge={
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {features.length}
            </span>
          }
          alwaysOpen
        >
          <div className="flex items-center justify-end -mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                append(blankFeature());
                setExpandedFeatures((prev) =>
                  new Set(prev).add(features.length),
                );
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add feature
            </Button>
          </div>

          {features.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              At least one feature is required.
            </p>
          )}

          {features.map((feature, idx) => {
            const isOpen = expandedFeatures.has(idx);
            const titleText =
              form.watch(`features.${idx}.title.en`) ||
              form.watch(`features.${idx}.title.mm`) ||
              `Feature ${idx + 1}`;
            const iconValue = form.watch(`features.${idx}.icon`);

            return (
              <div
                key={feature.id}
                className="rounded-md border bg-background"
              >
                <div className="flex items-center gap-2 p-2 bg-muted/40">
                  <button
                    type="button"
                    onClick={() => toggleFeature(idx)}
                    className="flex-1 flex items-center gap-2 text-left min-w-0"
                  >
                    {isOpen ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {iconValue && (
                      <span className="text-[10px] text-muted-foreground shrink-0 truncate max-w-[60px]">
                        {iconValue}
                      </span>
                    )}
                    <span className="text-xs font-medium truncate">
                      {titleText}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      disabled={idx === 0}
                      onClick={() => move(idx, idx - 1)}
                      title="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      disabled={idx === features.length - 1}
                      onClick={() => move(idx, idx + 1)}
                      title="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-destructive"
                      disabled={features.length <= 1}
                      onClick={() => remove(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="p-3 border-t space-y-3">
                    {/* Icon picker — gated on the Layout > "Show icons" toggle */}
                    {showIcons && (
                      <FormField
                        control={form.control}
                        name={`features.${idx}.icon`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Icon</FormLabel>
                            <FormControl>
                              <IconSelector
                                value={field.value}
                                onSelect={field.onChange}
                                placeholder="Select an icon…"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Multilang title + description */}
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
                      <TabsContent value="en" className="space-y-2 mt-3">
                        <FormField
                          control={form.control}
                          name={`features.${idx}.title.en`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Title (EN) *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-8"
                                  placeholder="Feature title"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`features.${idx}.description.en`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Description (EN) *
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  rows={2}
                                  className="text-sm"
                                  placeholder="Feature description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      <TabsContent value="mm" className="space-y-2 mt-3">
                        <FormField
                          control={form.control}
                          name={`features.${idx}.title.mm`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Title (MM)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} className="h-8" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`features.${idx}.description.mm`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Description (MM)
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  rows={2}
                                  className="text-sm"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>

                    {/* Image — gated on the Layout > "Show images" toggle */}
                    {showImages && (
                      <FormField
                        control={form.control}
                        name={`features.${idx}.image`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs flex items-center gap-1.5">
                              <ImageIcon className="h-3 w-3" />
                              Image
                            </FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input
                                  {...field}
                                  placeholder="https://example.com/image.jpg"
                                  className="h-8"
                                />
                                <MediaBrowserButton
                                  onSelect={(url) => {
                                    if (url) field.onChange(url);
                                  }}
                                  currentValue={field.value}
                                  label=""
                                  variant="outline"
                                  size="sm"
                                  tenantId={tenantId}
                                  config={{
                                    selectionMode: 'single',
                                    allowedTypes: ['image/*'],
                                    basePath: 'public',
                                    dialogSize: 'xl',
                                  }}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Optional link — collapsed inline group */}
                    <div className="rounded-md border p-2 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        Link (optional)
                      </div>
                      <FormField
                        control={form.control}
                        name={`features.${idx}.link.url`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">URL</FormLabel>
                            <FormControl>
                              <LinkPickerInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="https://example.com or /about"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name={`features.${idx}.link.text.en`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Label (EN)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Learn more"
                                  className="h-8"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`features.${idx}.link.text.mm`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Label (MM)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} className="h-8" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`features.${idx}.link.openInNewTab`}
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-md border p-2">
                            <FormLabel className="text-xs font-normal">
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

                    {/* Per-card colour overrides */}
                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name={`features.${idx}.textColor`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Text</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || '#000000'}
                                type="color"
                                className="h-8 p-1"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {showIcons && (
                        <FormField
                          control={form.control}
                          name={`features.${idx}.iconColor`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Icon</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || '#000000'}
                                  type="color"
                                  className="h-8 p-1"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name={`features.${idx}.background.solid`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Background</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || '#ffffff'}
                                type="color"
                                className="h-8 p-1"
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  // Set the background type to 'solid' when a
                                  // colour is picked so the renderer shows it.
                                  form.setValue(
                                    `features.${idx}.background.type`,
                                    'solid',
                                  );
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Alignment + size knobs (compact 2-col rows) */}
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`features.${idx}.titleAlign`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Title align
                            </FormLabel>
                            <Select
                              value={field.value || 'left'}
                              onValueChange={field.onChange}
                            >
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
                      <FormField
                        control={form.control}
                        name={`features.${idx}.descriptionAlign`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Description align
                            </FormLabel>
                            <Select
                              value={field.value || 'left'}
                              onValueChange={field.onChange}
                            >
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
                      <FormField
                        control={form.control}
                        name={`features.${idx}.titleSize`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Title size (px)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={12}
                                max={72}
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  )
                                }
                                className="h-8"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`features.${idx}.descriptionSize`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Description size (px)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={10}
                                max={48}
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  )
                                }
                                className="h-8"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </EditorSection>

        {/* ───────── Layout ───────── */}
        <EditorSection
          title="Layout"
          icon={<Layout className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="layout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Layout</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            {form.watch('layout') === 'grid' && (
              <FormField
                control={form.control}
                name="columns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Columns</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 column</SelectItem>
                        <SelectItem value="2">2 columns</SelectItem>
                        <SelectItem value="3">3 columns</SelectItem>
                        <SelectItem value="4">4 columns</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="containerSettings.width"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Container width</FormLabel>
                <Select
                  value={field.value || 'contained'}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="contained">Contained</SelectItem>
                    <SelectItem value="fullWidth">Full width</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="showIcons"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs font-normal">
                    Show icons
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
              name="showImages"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs font-normal">
                    Show images
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

        {/* ───────── Section visuals ───────── */}
        <EditorSection
          title="Section visuals"
          icon={<Palette className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          {/* Section-wide content alignment — applies to every feature
              card (icon, title, description, button, image position).
              Per-feature `titleAlign` / `descriptionAlign` / `iconAlign`
              still override on a per-card basis. When `headlineAlign`
              is unset, the header block follows this value too. */}
          <FormField
            control={form.control}
            name="contentAlign"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">
                  Section alignment
                </FormLabel>
                <Select
                  value={field.value || 'left'}
                  onValueChange={field.onChange}
                >
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
                <p className="text-[10px] text-muted-foreground mt-1">
                  Default alignment for all feature cards. Per-feature
                  overrides still apply when set.
                </p>
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="textColors.headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Headline color</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || '#000000'}
                      type="color"
                      className="h-8 p-1"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="textColors.description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Description color</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || '#666666'}
                      type="color"
                      className="h-8 p-1"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="headlineSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    Headline size (px)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={16}
                      max={72}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      className="h-8"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descriptionSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    Description size (px)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={12}
                      max={48}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      className="h-8"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </EditorSection>

        {/* Hidden submit so Cmd+S still triggers form submit when focus is in
            an input — top-bar Save button is the primary affordance. */}
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Form>
  );
}
