'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Separator } from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import { Loader2, Save, X } from 'lucide-react';
import { createPostTypeSchema, type CreatePostTypeFormData } from '../common/schemas';
import { createPostType, updatePostType } from '../common/actions';
import type { PostType } from '../common/types';

// Generate slug from text
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface PostTypeFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<PostType>;
  onSuccess?: (postType: PostType) => void;
  onCancel?: () => void;
}

export function PostTypeForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: PostTypeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [autoSlug, setAutoSlug] = useState(mode === 'create');
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');

  const form = useForm<CreatePostTypeFormData>({
    resolver: zodResolver(createPostTypeSchema),
    defaultValues: {
      name: initialData?.name || { en: '', mm: '' },
      slug: initialData?.slug || '',
      description: initialData?.description || { en: '', mm: '' },
      icon: initialData?.icon || '',
      color: initialData?.color || '#3b82f6',
      attributes: initialData?.attributes || [],
      supportsCategories: initialData?.supportsCategories ?? true,
      supportsTags: initialData?.supportsTags ?? true,
      supportsComments: initialData?.supportsComments ?? true,
      supportsRevisions: initialData?.supportsRevisions ?? true,
      enableFeaturedImage: initialData?.enableFeaturedImage ?? true,
      enableExcerpt: initialData?.enableExcerpt ?? true,
      enableSeo: initialData?.enableSeo ?? true,
      status: initialData?.status || 'active',
      menuOrder: initialData?.menuOrder || 0,
    },
  });

  const { watch, setValue } = form;
  const nameEn = watch('name.en');

  // Auto-generate slug from English name
  useEffect(() => {
    if (autoSlug && nameEn) {
      setValue('slug', generateSlug(nameEn));
    }
  }, [nameEn, autoSlug, setValue]);

  const onSubmit = (data: CreatePostTypeFormData) => {
    startTransition(async () => {
      try {
        let result;
        if (mode === 'create') {
          result = await createPostType(data);
        } else if (initialData?._id) {
          result = await updatePostType(initialData._id, data);
        } else {
          throw new Error('Post Type ID is required for update');
        }

        if (result.success && result.data) {
          toastSuccess(
            mode === 'create'
              ? 'Post type created successfully'
              : 'Post type updated successfully'
          );
          onSuccess?.(result.data);
        } else {
          toastError(result.error || 'Failed to save post type');
        }
      } catch (error) {
        console.error('Post type form error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name - Multi-language */}
        <div className="space-y-2">
          <FormLabel>
            Name <span className="text-destructive">*</span>
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
                name="name.en"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="Post type name in English" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            <TabsContent value="mm" className="mt-0">
              <FormField
                control={form.control}
                name="name.mm"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="Post type name (Myanmar)" />
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
                    placeholder="post-type-slug"
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
                      <Input {...field} placeholder="Description in English" />
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
                      <Input {...field} placeholder="Description (Myanmar)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Color, Icon, and Status Row */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={field.value || '#3b82f6'}
                      onChange={field.onChange}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      {...field}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="FileText" />
                </FormControl>
                <FormDescription className="text-xs">Lucide icon name</FormDescription>
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Menu Order */}
        <FormField
          control={form.control}
          name="menuOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Menu Order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>Lower numbers appear first in menus</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Feature Toggles */}
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base">Content Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supportsCategories"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-normal">
                      Supports Categories
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportsTags"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-normal">
                      Supports Tags
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportsComments"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-normal">
                      Supports Comments
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportsRevisions"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-normal">
                      Supports Revisions
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableFeaturedImage"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-normal">
                      Enable Featured Image
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableExcerpt"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-normal">
                      Enable Excerpt
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableSeo"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-normal">
                      Enable SEO Settings
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

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
                {mode === 'create' ? 'Create Post Type' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default PostTypeForm;
