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
  Save,
  Loader2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { TabsSectionFormData } from './tabs-types';
import { TiptapEditor } from '../../common/components/editor/TiptapEditor';

interface Props {
  form: UseFormReturn<TabsSectionFormData>;
  onSubmit: (data: TabsSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function TabsSectionForm({ form, onSubmit, onCancel, saving = false }: Props) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));

  const {
    fields: items,
    append: appendItem,
    remove: removeItem,
    move: moveItem,
  } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        {/* Headline with show/hide */}
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
              <TabsTrigger value="en" className="flex-1">EN</TabsTrigger>
              <TabsTrigger value="mm" className="flex-1">MM</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="mt-2">
              <FormField
                control={form.control}
                name="headline.en"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} placeholder="Section heading" />
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
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Description with show/hide */}
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
          {/* WYSIWYG so authors can author a description with marks /
              links / a list inline. Stored as HTML in `description.{en,mm}`
              — the public renderer paints it through `data-rich-html`
              so headings / lists / etc. pick up article styling. */}
          <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
            <TabsList className="h-8 w-full">
              <TabsTrigger value="en" className="flex-1">EN</TabsTrigger>
              <TabsTrigger value="mm" className="flex-1">MM</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="mt-2">
              <FormField
                control={form.control}
                name="description.en"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TiptapEditor
                        content={(field.value as any) ?? ''}
                        onChange={field.onChange}
                        outputFormat="html"
                        placeholder="Section description…"
                        minHeight="140px"
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
                name="description.mm"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TiptapEditor
                        content={(field.value as any) ?? ''}
                        onChange={field.onChange}
                        outputFormat="html"
                        placeholder="ဖော်ပြချက်…"
                        minHeight="140px"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Orientation + default index */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="orientation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orientation</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="horizontal">
                      Horizontal (top labels)
                    </SelectItem>
                    <SelectItem value="vertical">
                      Vertical (left rail)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="defaultIndex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default tab (0-indexed)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tab items */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Tabs</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                appendItem({
                  label: { en: '', mm: '' },
                  content: { en: '', mm: '' },
                  contentHtml: { en: '', mm: '' },
                });
                setExpandedItems((prev) => new Set([...prev, items.length]));
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Tab
            </Button>
          </div>

          {items.length === 0 && (
            <div className="text-center py-6 border-2 border-dashed rounded">
              <p className="text-sm text-muted-foreground">
                No tabs yet. Click "Add Tab" to create one.
              </p>
            </div>
          )}

          {items.map((field, index) => {
            const isExpanded = expandedItems.has(index);
            return (
              <div key={field.id} className="border rounded overflow-hidden">
                <div className="bg-muted/30 px-3 py-2 flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    className="flex-1 flex items-center justify-between text-left"
                  >
                    <span className="text-sm font-medium">
                      Tab {index + 1}
                      {form.watch(`items.${index}.label.en`) && (
                        <span className="ml-2 text-muted-foreground font-normal">
                          - {form.watch(`items.${index}.label.en`)?.substring(0, 40)}
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
                    {index < items.length - 1 && (
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

                {isExpanded && (
                  <div className="p-3 space-y-3">
                    {/* Label */}
                    <div className="space-y-2">
                      <FormLabel>Tab Label *</FormLabel>
                      <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
                        <TabsList className="h-8 w-full">
                          <TabsTrigger value="en" className="flex-1">EN</TabsTrigger>
                          <TabsTrigger value="mm" className="flex-1">MM</TabsTrigger>
                        </TabsList>
                        <TabsContent value="en" className="mt-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.label.en`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Tab title" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        <TabsContent value="mm" className="mt-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.label.mm`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* Plain content */}
                    <div className="space-y-2">
                      <FormLabel>Content (plain text)</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Short plain-text panel. Use the rich editor below
                        for lists / tables / images.
                      </p>
                      <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
                        <TabsList className="h-8 w-full">
                          <TabsTrigger value="en" className="flex-1">EN</TabsTrigger>
                          <TabsTrigger value="mm" className="flex-1">MM</TabsTrigger>
                        </TabsList>
                        <TabsContent value="en" className="mt-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.content.en`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    value={field.value ?? ''}
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
                            name={`items.${index}.content.mm`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    value={field.value ?? ''}
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

                    {/* Rich content (Tiptap WYSIWYG) */}
                    <div className="space-y-2">
                      <FormLabel>Content (rich)</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Rich-text editor — supports lists, tables, headings,
                        images. Wins over the plain field above when both
                        are filled.
                      </p>
                      <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
                        <TabsList className="h-8 w-full">
                          <TabsTrigger value="en" className="flex-1">EN</TabsTrigger>
                          <TabsTrigger value="mm" className="flex-1">MM</TabsTrigger>
                        </TabsList>
                        <TabsContent value="en" className="mt-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.contentHtml.en`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <TiptapEditor
                                    content={(field.value as any) ?? ''}
                                    onChange={field.onChange}
                                    outputFormat="html"
                                    placeholder="Write tab content in English…"
                                    minHeight="220px"
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
                            name={`items.${index}.contentHtml.mm`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <TiptapEditor
                                    content={(field.value as any) ?? ''}
                                    onChange={field.onChange}
                                    outputFormat="html"
                                    placeholder="အကြောင်းအရာ…"
                                    minHeight="220px"
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

        {/* Spacing — author-controlled padding / margin on the
            outer `<section>` wrapper. Tokens map to inline CSS via
            `getSectionSpacingStyles` on the public side. None / Small
            (1rem) / Medium (2rem) / Large (4rem) / Extra Large (6rem),
            same vocabulary the Hero + FAQ forms use. Six axes laid
            out in a 2-column grid for compactness. */}
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

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default TabsSectionForm;
