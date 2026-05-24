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
import { Input, Button, Textarea, Switch } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { Plus, Trash2, Save, Loader2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import type { FaqSectionFormData } from './faq-types';
import { TiptapEditor } from '../../common/components/editor/TiptapEditor';

interface FaqSectionFormProps {
  form: UseFormReturn<FaqSectionFormData>;
  onSubmit: (data: FaqSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

export function FaqSectionForm({
  form,
  onSubmit,
  onCancel,
  saving = false,
  tenantId,
}: FaqSectionFormProps) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));

  const { fields: faqItems, append: appendItem, remove: removeItem, move: moveItem } = useFieldArray({
    control: form.control,
    name: 'faqs',
  });

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Info */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Internal reference name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Headline — value lives on the doc regardless; the `Show
            Headline` switch only controls whether the public renderer
            paints it. Lets authors keep a value for SEO / future
            reuse while hiding it on a specific page. */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>Headline</FormLabel>
            <FormField
              control={form.control}
              name="showHeadline"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs font-normal text-muted-foreground">
                    Show on page
                  </FormLabel>
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
          <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
            <TabsList className="h-8 w-full">
              <TabsTrigger value="en" className="flex-1">English</TabsTrigger>
              <TabsTrigger value="mm" className="flex-1">မြန်မာ</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="mt-2">
              <FormField
                control={form.control}
                name="headline.en"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="Frequently Asked Questions" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            <TabsContent value="mm" className="mt-2">
              <FormField
                control={form.control}
                name="headline.mm"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="မေးလေ့ရှိသောမေးခွန်းများ" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Description — same show/hide pattern as Headline. */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>Description</FormLabel>
            <FormField
              control={form.control}
              name="showDescription"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs font-normal text-muted-foreground">
                    Show on page
                  </FormLabel>
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
          <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
            <TabsList className="h-8 w-full">
              <TabsTrigger value="en" className="flex-1">English</TabsTrigger>
              <TabsTrigger value="mm" className="flex-1">မြန်မာ</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="mt-2">
              <FormField
                control={form.control}
                name="description.en"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea {...field} placeholder="Find answers to common questions" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            <TabsContent value="mm" className="mt-2">
              <FormField
                control={form.control}
                name="description.mm"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea {...field} placeholder="အများသောမေးခွန်းများအတွက် အဖြေများကို ရှာဖွေပါ" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Layout Settings */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="layout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Layout Style</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="accordion">Accordion</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allowMultipleOpen"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                  <FormLabel className="text-sm font-normal">Allow Multiple Open</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Text Colors */}
        <div className="space-y-3 border rounded p-3">
          <FormLabel className="text-sm">Text Colors</FormLabel>

          <FormField
            control={form.control}
            name="textColors.headline"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Headline Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      {...field}
                      value={field.value || '#000000'}
                      className="h-8 w-20"
                    />
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="#000000 or inherit"
                      className="h-8 flex-1"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="textColors.description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Description Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      {...field}
                      value={field.value || '#666666'}
                      className="h-8 w-20"
                    />
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="#666666 or inherit"
                      className="h-8 flex-1"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="textColors.question"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Question Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      {...field}
                      value={field.value || '#000000'}
                      className="h-8 w-20"
                    />
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="#000000 or inherit"
                      className="h-8 flex-1"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="textColors.answer"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Answer Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      {...field}
                      value={field.value || '#666666'}
                      className="h-8 w-20"
                    />
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="#666666 or inherit"
                      className="h-8 flex-1"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Text Size Controls */}
        <div className="space-y-3 border rounded p-3">
          <FormLabel className="text-sm">Text Sizes</FormLabel>

          <FormField
            control={form.control}
            name="headlineSize"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs">Headline Size</FormLabel>
                  <span className="text-xs text-muted-foreground">{field.value || 32}px</span>
                </div>
                <FormControl>
                  <input
                    type="range"
                    min={16}
                    max={72}
                    step={1}
                    value={field.value || 32}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    aria-label="Headline Size"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descriptionSize"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs">Description Size</FormLabel>
                  <span className="text-xs text-muted-foreground">{field.value || 16}px</span>
                </div>
                <FormControl>
                  <input
                    type="range"
                    min={12}
                    max={48}
                    step={1}
                    value={field.value || 16}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    aria-label="Description Size"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="questionSize"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs">Question Size</FormLabel>
                  <span className="text-xs text-muted-foreground">{field.value || 18}px</span>
                </div>
                <FormControl>
                  <input
                    type="range"
                    min={14}
                    max={48}
                    step={1}
                    value={field.value || 18}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    aria-label="Question Size"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="answerSize"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs">Answer Size</FormLabel>
                  <span className="text-xs text-muted-foreground">{field.value || 14}px</span>
                </div>
                <FormControl>
                  <input
                    type="range"
                    min={12}
                    max={36}
                    step={1}
                    value={field.value || 14}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    aria-label="Answer Size"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel>FAQ Items *</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                appendItem({
                  question: { en: '', mm: '' },
                  answer: { en: '', mm: '' },
                  answerHtml: { en: '', mm: '' },
                });
                setExpandedItems((prev) => new Set([...prev, faqItems.length]));
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {faqItems.length === 0 && (
            <div className="text-center py-6 border-2 border-dashed rounded">
              <p className="text-sm text-muted-foreground">
                No FAQ items yet. Click "Add Item" to create one.
              </p>
            </div>
          )}

          {faqItems.map((field, index) => {
            const isExpanded = expandedItems.has(index);
            return (
              <div key={field.id} className="border rounded overflow-hidden">
                {/* Item Header */}
                <div className="bg-muted/30 px-3 py-2 flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    className="flex-1 flex items-center justify-between text-left"
                  >
                    <span className="text-sm font-medium">
                      FAQ Item {index + 1}
                      {form.watch(`faqs.${index}.question.en`) && (
                        <span className="ml-2 text-muted-foreground font-normal">
                          - {form.watch(`faqs.${index}.question.en`)?.substring(0, 40)}...
                        </span>
                      )}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveItem(index, index - 1)}
                      >
                        ↑
                      </Button>
                    )}
                    {index < faqItems.length - 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveItem(index, index + 1)}
                      >
                        ↓
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Item Content */}
                {isExpanded && (
                  <div className="p-3 space-y-3">
                    {/* Question */}
                    <div className="space-y-2">
                      <FormLabel>Question *</FormLabel>
                      <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
                        <TabsList className="h-8 w-full">
                          <TabsTrigger value="en" className="flex-1">EN</TabsTrigger>
                          <TabsTrigger value="mm" className="flex-1">MM</TabsTrigger>
                        </TabsList>
                        <TabsContent value="en" className="mt-2">
                          <FormField
                            control={form.control}
                            name={`faqs.${index}.question.en`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="What is your question?" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        <TabsContent value="mm" className="mt-2">
                          <FormField
                            control={form.control}
                            name={`faqs.${index}.question.mm`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="သင့်မေးခွန်းက ဘာလဲ?" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* Answer (plain text) — short Q&A use case. */}
                    <div className="space-y-2">
                      <FormLabel>Answer (plain text)</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Short plain-text answer. For lists / tables /
                        images use the HTML field below instead.
                      </p>
                      <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
                        <TabsList className="h-8 w-full">
                          <TabsTrigger value="en" className="flex-1">EN</TabsTrigger>
                          <TabsTrigger value="mm" className="flex-1">MM</TabsTrigger>
                        </TabsList>
                        <TabsContent value="en" className="mt-2">
                          <FormField
                            control={form.control}
                            name={`faqs.${index}.answer.en`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    value={field.value ?? ''}
                                    placeholder="Provide a short plain-text answer (optional)..."
                                    rows={3}
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
                            name={`faqs.${index}.answer.mm`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    value={field.value ?? ''}
                                    placeholder="အသေးစိတ် အဖြေ ပေးပါ..."
                                    rows={3}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* Answer HTML — rich content authored in the
                        TiptapEditor. The editor emits HTML
                        (`outputFormat='html'`) so the value lives in
                        `answerHtml.en` / `answerHtml.mm` as plain
                        HTML strings, and the public renderer drops it
                        straight into `dangerouslySetInnerHTML` inside
                        a `[data-rich-html]` container that styles
                        headings, lists, tables, images. Takes
                        priority over the plain `answer` above. */}
                    <div className="space-y-2">
                      <FormLabel>Answer (rich)</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Rich-text editor — supports lists, tables,
                        headings, images. Wins over the plain Answer
                        above when both are filled.
                      </p>
                      <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
                        <TabsList className="h-8 w-full">
                          <TabsTrigger value="en" className="flex-1">EN</TabsTrigger>
                          <TabsTrigger value="mm" className="flex-1">MM</TabsTrigger>
                        </TabsList>
                        <TabsContent value="en" className="mt-2">
                          <FormField
                            control={form.control}
                            name={`faqs.${index}.answerHtml.en`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <TiptapEditor
                                    content={(field.value as any) ?? ''}
                                    onChange={field.onChange}
                                    outputFormat="html"
                                    placeholder="Write the answer in English…"
                                    minHeight="240px"
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
                            name={`faqs.${index}.answerHtml.mm`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <TiptapEditor
                                    content={(field.value as any) ?? ''}
                                    onChange={field.onChange}
                                    outputFormat="html"
                                    placeholder="အဖြေကို မြန်မာဘာသာဖြင့် ရေးပါ…"
                                    minHeight="240px"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Layout Settings */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold">Layout Settings</h3>

          {/* Spacing Controls */}
          <div className="space-y-3 border rounded p-3">
            <FormLabel className="text-sm">Spacing</FormLabel>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="spacing.paddingTop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Padding Top</FormLabel>
                    <Select value={field.value || 'none'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small (1rem)</SelectItem>
                        <SelectItem value="md">Medium (2rem)</SelectItem>
                        <SelectItem value="lg">Large (4rem)</SelectItem>
                        <SelectItem value="xl">Extra Large (6rem)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spacing.paddingBottom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Padding Bottom</FormLabel>
                    <Select value={field.value || 'none'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small (1rem)</SelectItem>
                        <SelectItem value="md">Medium (2rem)</SelectItem>
                        <SelectItem value="lg">Large (4rem)</SelectItem>
                        <SelectItem value="xl">Extra Large (6rem)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spacing.paddingLeft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Padding Left</FormLabel>
                    <Select value={field.value || 'none'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small (1rem)</SelectItem>
                        <SelectItem value="md">Medium (2rem)</SelectItem>
                        <SelectItem value="lg">Large (4rem)</SelectItem>
                        <SelectItem value="xl">Extra Large (6rem)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spacing.paddingRight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Padding Right</FormLabel>
                    <Select value={field.value || 'none'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small (1rem)</SelectItem>
                        <SelectItem value="md">Medium (2rem)</SelectItem>
                        <SelectItem value="lg">Large (4rem)</SelectItem>
                        <SelectItem value="xl">Extra Large (6rem)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spacing.marginTop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Margin Top</FormLabel>
                    <Select value={field.value || 'none'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small (1rem)</SelectItem>
                        <SelectItem value="md">Medium (2rem)</SelectItem>
                        <SelectItem value="lg">Large (4rem)</SelectItem>
                        <SelectItem value="xl">Extra Large (6rem)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spacing.marginBottom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Margin Bottom</FormLabel>
                    <Select value={field.value || 'none'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small (1rem)</SelectItem>
                        <SelectItem value="md">Medium (2rem)</SelectItem>
                        <SelectItem value="lg">Large (4rem)</SelectItem>
                        <SelectItem value="xl">Extra Large (6rem)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Container Settings */}
          <div className="space-y-3 border rounded p-3">
            <FormLabel className="text-sm">Container</FormLabel>
            <FormField
              control={form.control}
              name="containerSettings.width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Width</FormLabel>
                  <Select value={field.value || 'contained'} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fullWidth">Full Width</SelectItem>
                      <SelectItem value="contained">Contained (1200px)</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {form.watch('containerSettings.width') === 'custom' && (
              <FormField
                control={form.control}
                name="containerSettings.maxWidth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Max Width</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1400px" className="h-8" />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Responsive Settings */}
          <div className="space-y-3 border rounded p-3">
            <FormLabel className="text-sm">Responsive Visibility</FormLabel>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="responsiveSettings.hideOnMobile"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="text-xs font-normal">Hide on Mobile</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="responsiveSettings.hideOnTablet"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="text-xs font-normal">Hide on Tablet</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="responsiveSettings.hideOnDesktop"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="text-xs font-normal">Hide on Desktop</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4 border-t pt-4">
          <FormField
            control={form.control}
            name="isVisible"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Visible</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isReusable"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Reusable</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 sticky bottom-0 bg-background border-t -mx-4 px-4 py-3">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Section
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
