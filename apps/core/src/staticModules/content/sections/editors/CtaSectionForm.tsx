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
  Type,
  MousePointerClick,
  Layout,
  Settings2,
} from 'lucide-react';
import { MediaBrowserButton } from '@/components/media/MediaBrowserButton';
import type { MediaFile } from '@repo/media';
import type { CtaSectionFormData } from './cta-types';
import { EditorSection } from './_shared/EditorSection';
import { LinkPickerInput } from './_shared/LinkPickerInput';

interface CtaSectionFormProps {
  form: UseFormReturn<CtaSectionFormData>;
  onSubmit: (data: CtaSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

export function CtaSectionForm({
  form,
  onSubmit,
  saving = false,
}: CtaSectionFormProps) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const [expandedButtons, setExpandedButtons] = useState<Set<number>>(
    new Set([0]),
  );

  const {
    fields: buttons,
    append: appendButton,
    remove: removeButton,
    move: moveButton,
  } = useFieldArray({
    control: form.control,
    name: 'buttons',
  });

  const toggleButton = (index: number) => {
    setExpandedButtons((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
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
                    placeholder="e.g., Homepage CTA · Sign-up Banner"
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
                <FormItem className="flex flex-col justify-between rounded-md border p-2 h-full">
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel className="text-xs">Reusable</FormLabel>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                  <FormDescription className="text-[10px]">
                    Show in the section library for other pages.
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isVisible"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-between rounded-md border p-2 h-full">
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel className="text-xs">Visible</FormLabel>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                  <FormDescription className="text-[10px]">
                    Toggle off to hide on the public site.
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </EditorSection>

        {/* ───────── Content (always-open primary section) ───────── */}
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
                    <FormLabel>
                      Headline <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ready to get started?"
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
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
                        placeholder="Brief supporting text under the headline…"
                        rows={2}
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
                      <Input
                        {...field}
                        placeholder="ခေါင်းစဥ်ထည့်ပါ"
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
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
                      <Textarea
                        {...field}
                        placeholder="ထောက်ခံစာသား"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </EditorSection>

        {/* ───────── Buttons (1-4) ───────── */}
        <EditorSection
          title="Buttons"
          icon={<MousePointerClick className="h-3.5 w-3.5" />}
          badge={
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {buttons.length}/4
            </span>
          }
          defaultOpen
        >
          <div className="flex items-center justify-end -mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendButton({
                  text: { en: '', mm: '' },
                  url: '',
                  style: 'primary',
                  openInNewTab: false,
                })
              }
              disabled={buttons.length >= 4}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add button
            </Button>
          </div>

          {buttons.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              At least one button is required for a CTA.
            </p>
          )}

          {buttons.map((btn, idx) => {
            const isOpen = expandedButtons.has(idx);
            return (
              <div
                key={btn.id}
                className="rounded-md border bg-muted/20 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/40">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      #{idx + 1}
                    </Badge>
                    <span className="text-xs font-medium truncate">
                      {form.watch(`buttons.${idx}.text.en`) || `Button ${idx + 1}`}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0 capitalize"
                    >
                      {form.watch(`buttons.${idx}.style`) || 'primary'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => idx > 0 && moveButton(idx, idx - 1)}
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
                        idx < buttons.length - 1 && moveButton(idx, idx + 1)
                      }
                      disabled={idx === buttons.length - 1}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => toggleButton(idx)}
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
                      onClick={() => removeButton(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="p-3 space-y-3">
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
                          name={`buttons.${idx}.text.en`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Button text *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Get Started"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      <TabsContent value="mm" className="mt-2">
                        <FormField
                          control={form.control}
                          name={`buttons.${idx}.text.mm`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Button text (MM)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="စတင်ပါ" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>
                    <FormField
                      control={form.control}
                      name={`buttons.${idx}.url`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">URL *</FormLabel>
                          <FormControl>
                            <LinkPickerInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="/contact or https://…"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`buttons.${idx}.style`}
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
                                <SelectItem value="secondary">
                                  Secondary
                                </SelectItem>
                                <SelectItem value="outline">Outline</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`buttons.${idx}.openInNewTab`}
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
                  </div>
                )}
              </div>
            );
          })}
        </EditorSection>

        {/* ───────── Layout & visuals ───────── */}
        <EditorSection
          title="Layout & visuals"
          icon={<Layout className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="alignment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Text alignment</FormLabel>
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
          <FormField
            control={form.control}
            name="backgroundImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Background image
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
                <FormDescription className="text-[11px]">
                  Optional. Sits behind the headline + buttons with an
                  auto-applied dark overlay for legibility.
                </FormDescription>
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="backgroundColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Background color</FormLabel>
                  <FormControl>
                    <Input
                      type="color"
                      {...field}
                      className="h-10 w-full p-1"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="textColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Text color</FormLabel>
                  <FormControl>
                    <Input
                      type="color"
                      {...field}
                      className="h-10 w-full p-1"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </EditorSection>

        {/* Hidden submit so Cmd+S / Enter still works inside fields. The
            visible Save button lives in the editor's top header bar. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Form>
  );
}
