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
import { IconSelector } from '@repo/ui';
import {
  Plus,
  Trash2,
  Settings2,
  Type,
  Layout,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Palette,
} from 'lucide-react';
import { type StatsSectionFormData } from './stats-types';
import { EditorSection } from './_shared/EditorSection';

interface StatsSectionFormProps {
  form: UseFormReturn<StatsSectionFormData>;
  onSubmit: (data: StatsSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

export function StatsSectionForm({
  form,
  onSubmit,
}: StatsSectionFormProps) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const [expandedCounters, setExpandedCounters] = useState<Set<number>>(
    new Set([0]),
  );

  const {
    fields: counters,
    append,
    remove,
    move,
  } = useFieldArray({
    control: form.control,
    name: 'counters',
  });

  const toggleCounter = (idx: number) => {
    setExpandedCounters((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
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
                    placeholder="e.g., Enrollment Stats · Alumni Counters"
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
                        placeholder="By the numbers"
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

        {/* ───────── Counters (always-open primary) ───────── */}
        <EditorSection
          title="Counters"
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          badge={
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {counters.length}/8
            </span>
          }
          alwaysOpen
        >
          <div className="flex items-center justify-end -mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={counters.length >= 8}
              onClick={() => {
                append({
                  title: { en: '', mm: '' },
                  description: { en: '', mm: '' },
                  icon: 'Users',
                  iconColor: '#ffffff',
                  count: '0',
                  bgColor: '#3182ce',
                  textColor: '#ffffff',
                });
                setExpandedCounters((prev) =>
                  new Set(prev).add(counters.length),
                );
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add counter
            </Button>
          </div>

          {counters.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              At least one counter is required.
            </p>
          )}

          {counters.map((counter, idx) => {
            const isOpen = expandedCounters.has(idx);
            const titleText =
              form.watch(`counters.${idx}.title.en`) ||
              form.watch(`counters.${idx}.title.mm`) ||
              `Counter ${idx + 1}`;
            const countText = form.watch(`counters.${idx}.count`) || '—';
            const bg = form.watch(`counters.${idx}.bgColor`);

            return (
              <div
                key={counter.id}
                className="rounded-md border bg-background"
              >
                <div className="flex items-center gap-2 p-2 bg-muted/40">
                  <button
                    type="button"
                    onClick={() => toggleCounter(idx)}
                    className="flex-1 flex items-center gap-2 text-left min-w-0"
                  >
                    {isOpen ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span
                      className="h-5 w-5 rounded shrink-0 border"
                      style={{ backgroundColor: bg || '#e5e7eb' }}
                    />
                    <span className="text-xs font-medium truncate">
                      {titleText}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                      {countText}
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
                      disabled={idx === counters.length - 1}
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
                      disabled={counters.length <= 1}
                      onClick={() => remove(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="p-3 border-t space-y-3">
                    {/* Icon picker — uses the shared IconSelector with
                        search, category filter, and grid preview. */}
                    <FormField
                      control={form.control}
                      name={`counters.${idx}.icon`}
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
                          name={`counters.${idx}.title.en`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Title (EN)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-8"
                                  placeholder="Total Students"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`counters.${idx}.description.en`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Description (EN)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-8"
                                  placeholder="All Years"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      <TabsContent value="mm" className="space-y-2 mt-3">
                        <FormField
                          control={form.control}
                          name={`counters.${idx}.title.mm`}
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
                          name={`counters.${idx}.description.mm`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Description (MM)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} className="h-8" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>

                    {/* Count value */}
                    <FormField
                      control={form.control}
                      name={`counters.${idx}.count`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            Count value
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-8 tabular-nums"
                              placeholder="2,500 · 500+ · 98%"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Per-card colour overrides */}
                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name={`counters.${idx}.bgColor`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Background
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="color"
                                className="h-8 p-1"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`counters.${idx}.textColor`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Text</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="color"
                                className="h-8 p-1"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`counters.${idx}.iconColor`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Icon</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="color"
                                className="h-8 p-1"
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="row">Row (horizontal)</SelectItem>
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
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v) as 1 | 2 | 3 | 4)}
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
        </EditorSection>

        {/* ───────── Section visuals ───────── */}
        <EditorSection
          title="Section visuals"
          icon={<Palette className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="textColors.headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Headline color</FormLabel>
                  <FormControl>
                    <Input {...field} type="color" className="h-8 p-1" />
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
                    <Input {...field} type="color" className="h-8 p-1" />
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
