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
} from '@repo/ui';
import { Input, Switch } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { Settings2, Type, Layout, Folder } from 'lucide-react';
import { type CategoryListSectionFormData } from './category-list-types';
import { EditorSection } from './_shared/EditorSection';

interface Props {
  form: UseFormReturn<CategoryListSectionFormData>;
  onSubmit: (data: CategoryListSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

export function CategoryListSectionForm({ form, onSubmit }: Props) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');

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
                    placeholder="e.g. Sidebar Categories · Departments Index"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              name="isVisible"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 pt-6">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Visible</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </EditorSection>

        {/* ───────── Headline (multilingual) ───────── */}
        <EditorSection
          title="Headline"
          icon={<Type className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <Tabs
            value={langTab}
            onValueChange={(v) => setLangTab(v as 'en' | 'mm')}
          >
            <TabsList>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="mm">မြန်မာ</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="space-y-3">
              <FormField
                control={form.control}
                name="headline.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline (EN)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Categories" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>
            <TabsContent value="mm" className="space-y-3">
              <FormField
                control={form.control}
                name="headline.mm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline (MM)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="အမျိုးအစားများ" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </EditorSection>

        {/* ───────── Display ───────── */}
        <EditorSection
          title="Display"
          icon={<Layout className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <FormField
            control={form.control}
            name="displayMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display mode</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="list">
                      List — vertical list with counts
                    </SelectItem>
                    <SelectItem value="tree">
                      Tree — hierarchical (parent / child)
                    </SelectItem>
                    <SelectItem value="badge">
                      Badge — pill-style chips
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <FormField
              control={form.control}
              name="showCount"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Show post counts</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limit (0 = no cap)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={200}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </EditorSection>

        {/* ───────── View-all link ───────── */}
        <EditorSection
          title="View-all link (optional)"
          icon={<Folder className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <FormField
            control={form.control}
            name="viewAllUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="/category" />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="viewAllLabel.en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label (EN)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="View all" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="viewAllLabel.mm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label (MM)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="အားလုံးကြည့်ရန်" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </EditorSection>
      </form>
    </Form>
  );
}

export default CategoryListSectionForm;
