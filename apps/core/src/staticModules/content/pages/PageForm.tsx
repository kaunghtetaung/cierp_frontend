'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@repo/ui';
import { Input, Button, Checkbox } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import { Loader2, Save, X } from 'lucide-react';
import { createPage, updatePage } from '../common/actions';
import type { Page, PageTemplate } from '../common/types';
import { generateSlug } from '../common/utils';

// Page form schema
const pageFormSchema = z.object({
  title: z.object({
    en: z.string().min(1, 'English title is required'),
    mm: z.string().min(1, 'Myanmar title is required'),
  }),
  slug: z.string().optional(),
  description: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  template: z.enum(['default', 'fullWidth', 'sidebar', 'landing', 'blog', 'blank']).default('default'),
  order: z.number().min(0).optional(),
  showInNavigation: z.boolean().default(true),
  showBreadcrumbs: z.boolean().default(true),
  showTitle: z.boolean().default(true),
  showFeaturedImage: z.boolean().default(false),
  visibility: z.enum(['Public', 'Private', 'Protected', 'Password']).default('Public'),
  status: z.enum(['Draft', 'Published', 'Scheduled']).default('Draft'),
  featuredImage: z.string().optional(),
});

type PageFormData = z.infer<typeof pageFormSchema>;

interface PageFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Page>;
  onSuccess?: (page: Page) => void;
  onCancel?: () => void;
}

export function PageForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: PageFormProps) {
  const [isPending, startTransition] = useTransition();
  const [autoSlug, setAutoSlug] = useState(mode === 'create');
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');

  const form = useForm<PageFormData>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      title: initialData?.title || { en: '', mm: '' },
      slug: initialData?.slug || '',
      description: initialData?.description || { en: '', mm: '' },
      template: initialData?.template || 'default',
      order: initialData?.order || 0,
      showInNavigation: initialData?.showInNavigation ?? true,
      showBreadcrumbs: initialData?.showBreadcrumbs ?? true,
      showTitle: initialData?.showTitle ?? true,
      showFeaturedImage: initialData?.showFeaturedImage ?? false,
      visibility: initialData?.visibility || 'Public',
      status: initialData?.status || 'Draft',
      featuredImage: initialData?.featuredImage || '',
    },
  });

  const { watch, setValue } = form;
  const titleEn = watch('title.en');

  // Auto-generate slug from English title
  useEffect(() => {
    if (autoSlug && titleEn) {
      setValue('slug', generateSlug(titleEn));
    }
  }, [titleEn, autoSlug, setValue]);

  const onSubmit = (data: PageFormData) => {
    startTransition(async () => {
      try {
        let result;
        if (mode === 'create') {
          result = await createPage(data as any);
        } else if (initialData?._id) {
          result = await updatePage(initialData._id, data as any);
        } else {
          throw new Error('Page ID is required for update');
        }

        if (result.success && result.data) {
          toastSuccess(
            mode === 'create'
              ? 'Page created successfully'
              : 'Page updated successfully'
          );
          onSuccess?.(result.data);
        } else {
          toastError(result.error || 'Failed to save page');
        }
      } catch (error) {
        console.error('Page form error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Title - Multi-language */}
            <div className="space-y-2">
              <FormLabel>
                Title <span className="text-destructive">*</span>
              </FormLabel>
              <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
                <TabsList className="h-8 mb-2">
                  <TabsTrigger value="en" className="text-xs px-2 py-1">
                    EN
                  </TabsTrigger>
                  <TabsTrigger value="mm" className="text-xs px-2 py-1">
                    MM
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="en" className="mt-0">
                  <FormField
                    control={form.control}
                    name="title.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="Page title in English" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="mm" className="mt-0">
                  <FormField
                    control={form.control}
                    name="title.mm"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="စာမျက်နှာ ခေါင်းစဉ် (မြန်မာ)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="page-slug"
                        disabled={autoSlug}
                      />
                    </FormControl>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="autoSlug"
                        checked={autoSlug}
                        onCheckedChange={(checked) => setAutoSlug(checked as boolean)}
                      />
                      <label htmlFor="autoSlug" className="text-sm text-muted-foreground">
                        Auto
                      </label>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description - Multi-language */}
            <div className="space-y-2">
              <FormLabel>Description</FormLabel>
              <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
                <TabsList className="h-8 mb-2">
                  <TabsTrigger value="en" className="text-xs px-2 py-1">
                    EN
                  </TabsTrigger>
                  <TabsTrigger value="mm" className="text-xs px-2 py-1">
                    MM
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="en" className="mt-0">
                  <FormField
                    control={form.control}
                    name="description.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="Brief description in English" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="mm" className="mt-0">
                  <FormField
                    control={form.control}
                    name="description.mm"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="ဖော်ပြချက် (မြန်မာ)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Featured Image */}
            <FormField
              control={form.control}
              name="featuredImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured Image URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  {field.value && (
                    <div className="mt-2 relative aspect-video rounded-lg overflow-hidden bg-muted max-w-xs">
                      <img
                        src={field.value}
                        alt="Featured"
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
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Template and Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="fullWidth">Full Width</SelectItem>
                        <SelectItem value="sidebar">With Sidebar</SelectItem>
                        <SelectItem value="landing">Landing Page</SelectItem>
                        <SelectItem value="blog">Blog Layout</SelectItem>
                        <SelectItem value="blank">Blank</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Published">Published</SelectItem>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Visibility */}
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                      <SelectItem value="Protected">Protected</SelectItem>
                      <SelectItem value="Password">Password Protected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Order */}
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>Lower numbers appear first</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Options */}
            <div className="space-y-3">
              <FormLabel>Display Options</FormLabel>

              <FormField
                control={form.control}
                name="showInNavigation"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Show in Navigation</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showBreadcrumbs"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Show Breadcrumbs</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showTitle"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Show Page Title</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showFeaturedImage"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Show Featured Image</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mode === 'create' ? 'Create Page' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default PageForm;
