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
import { Input, Button, Checkbox, Textarea } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import { Loader2, Save, X, Image as ImageIcon } from 'lucide-react';
import { createPostSchema, type CreatePostFormData } from '../common/schemas';
import { createPost, updatePost } from '../common/actions';
import { getTags, autocompleteTags } from '../common/actions';
import type { Post, Category, Tag } from '../common/types';
import { generateSlug } from '../common/utils';
import { TiptapEditor } from '../common/components/editor/TiptapEditor';

interface PostFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Post>;
  categories?: Category[];
  onSuccess?: (post: Post) => void;
  onCancel?: () => void;
}

export function PostForm({
  mode,
  initialData,
  categories = [],
  onSuccess,
  onCancel,
}: PostFormProps) {
  const [isPending, startTransition] = useTransition();
  const [autoSlug, setAutoSlug] = useState(mode === 'create');
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tagIds || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categoryIds || []);

  const form = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: initialData?.title || { en: '', mm: '' },
      slug: initialData?.slug || '',
      excerpt: initialData?.excerpt || { en: '', mm: '' },
      content: initialData?.content || { en: '', mm: '' },
      contentFormat: initialData?.contentFormat || 'html',
      featuredImage: initialData?.featuredImage || '',
      postTypeId: initialData?.postTypeId || 'default',
      categoryIds: initialData?.categoryIds || [],
      tagIds: initialData?.tagIds || [],
      visibility: initialData?.visibility || 'Public',
      allowComments: initialData?.allowComments ?? true,
      isPinned: initialData?.isPinned || false,
      isFeatured: initialData?.isFeatured || false,
      status: initialData?.status || 'Draft',
    },
  });

  const { watch, setValue } = form;
  const titleEn = watch('title.en');

  // Load tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const result = await getTags({ limit: 100 });
        if (result.success && result.data) {
          setTags(result.data.data || []);
        }
      } catch (error) {
        console.error('Load tags error:', error);
      }
    };
    loadTags();
  }, []);

  // Auto-generate slug from English title
  useEffect(() => {
    if (autoSlug && titleEn) {
      setValue('slug', generateSlug(titleEn));
    }
  }, [titleEn, autoSlug, setValue]);

  // Sync selected tags/categories to form
  useEffect(() => {
    setValue('tagIds', selectedTags);
  }, [selectedTags, setValue]);

  useEffect(() => {
    setValue('categoryIds', selectedCategories);
  }, [selectedCategories, setValue]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const onSubmit = (data: CreatePostFormData) => {
    startTransition(async () => {
      try {
        let result;
        if (mode === 'create') {
          result = await createPost(data as any);
        } else if (initialData?._id) {
          result = await updatePost(initialData._id, data as any);
        } else {
          throw new Error('Post ID is required for update');
        }

        if (result.success && result.data) {
          toastSuccess(
            mode === 'create'
              ? 'Post created successfully'
              : 'Post updated successfully'
          );
          onSuccess?.(result.data);
        } else {
          toastError(result.error || 'Failed to save post');
        }
      } catch (error) {
        console.error('Post form error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
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
                          <Input {...field} placeholder="Post title in English" />
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
                          <Input {...field} placeholder="ပို့စ် ခေါင်းစဉ် (မြန်မာ)" />
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
                        placeholder="post-slug"
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

            {/* Excerpt - Multi-language */}
            <div className="space-y-2">
              <FormLabel>Excerpt</FormLabel>
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
                    name="excerpt.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Brief summary in English..."
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="mm" className="mt-0">
                  <FormField
                    control={form.control}
                    name="excerpt.mm"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="အကျဉ်းချုပ် (မြန်မာ)..."
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Content - Multi-language with TiptapEditor */}
            <div className="space-y-2">
              <FormLabel>
                Content <span className="text-destructive">*</span>
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
                    name="content.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TiptapEditor
                            content={field.value}
                            onChange={field.onChange}
                            placeholder="Write your content in English..."
                            minHeight="300px"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="mm" className="mt-0">
                  <FormField
                    control={form.control}
                    name="content.mm"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TiptapEditor
                            content={field.value}
                            onChange={field.onChange}
                            placeholder="အကြောင်းအရာ ရေးပါ (မြန်မာ)..."
                            minHeight="300px"
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

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Status */}
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
                    <div className="mt-2 relative aspect-video rounded-lg overflow-hidden bg-muted">
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

            {/* Categories */}
            <div className="space-y-2">
              <FormLabel>Categories</FormLabel>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No categories available</p>
                ) : (
                  categories.map((category) => (
                    <div key={category._id} className="flex items-center gap-2">
                      <Checkbox
                        id={`cat-${category._id}`}
                        checked={selectedCategories.includes(category._id)}
                        onCheckedChange={() => toggleCategory(category._id)}
                      />
                      <label
                        htmlFor={`cat-${category._id}`}
                        className="text-sm cursor-pointer"
                      >
                        {category.name.en || category.name.mm || 'Untitled'}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags available</p>
                ) : (
                  tags.map((tag) => (
                    <button
                      key={tag._id}
                      type="button"
                      onClick={() => toggleTag(tag._id)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        selectedTags.includes(tag._id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted'
                      }`}
                    >
                      {tag.name.en || tag.name.mm || 'Untitled'}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="allowComments"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Allow Comments</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPinned"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Pin to Top</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Featured Post</FormLabel>
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
                {mode === 'create' ? 'Create Post' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default PostForm;
