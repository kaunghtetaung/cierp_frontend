'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@repo/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@repo/ui';
import { Input, Button, Checkbox, Badge } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import { generateSlug } from '../../utils';
import {
  Loader2,
  Save,
  X,
  FileText,
  Settings,
  Search,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Pin,
  Star,
  Calendar,
} from 'lucide-react';
import { MultiLangInput } from './MultiLangInput';
import { MultiLangEditor } from '../editor';
import { createPostSchema, type CreatePostFormData } from '../../schemas';
import { createPost, updatePost } from '../../actions';
import type { Post, Category, Tag, PostType } from '../../types';

interface PostFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Post>;
  postTypes?: PostType[];
  categories?: Category[];
  tags?: Tag[];
  selectedPostTypeId?: string;
  onSuccess?: (post: Post) => void;
  onCancel?: () => void;
}

export function PostForm({
  mode,
  initialData,
  postTypes = [],
  categories = [],
  tags = [],
  selectedPostTypeId,
  onSuccess,
  onCancel,
}: PostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [autoSlug, setAutoSlug] = useState(mode === 'create');
  const [activeTab, setActiveTab] = useState('content');

  const defaultPostTypeId = selectedPostTypeId || postTypes[0]?._id || '';

  const form = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: initialData?.title || { en: '', mm: '' },
      slug: initialData?.slug || '',
      excerpt: initialData?.excerpt || { en: '', mm: '' },
      content: initialData?.content || { en: '', mm: '' },
      contentFormat: initialData?.contentFormat || 'html',
      featuredImage: initialData?.featuredImage || '',
      featuredImageAlt: initialData?.featuredImageAlt || { en: '', mm: '' },
      postTypeId: initialData?.postTypeId || defaultPostTypeId,
      categoryIds: initialData?.categoryIds || [],
      tagIds: initialData?.tagIds || [],
      visibility: initialData?.visibility || 'public',
      allowComments: initialData?.allowComments ?? true,
      isPinned: initialData?.isPinned || false,
      isFeatured: initialData?.isFeatured || false,
      status: initialData?.status || 'draft',
      seo: initialData?.seo || {
        metaTitle: { en: '', mm: '' },
        metaDescription: { en: '', mm: '' },
        metaKeywords: [],
      },
    },
  });

  const { watch, setValue } = form;
  const titleEn = watch('title.en');
  const selectedPostType = watch('postTypeId');
  const selectedCategoryIds = watch('categoryIds') || [];
  const selectedTagIds = watch('tagIds') || [];

  // Get the selected post type details
  const currentPostType = postTypes.find((pt) => pt._id === selectedPostType);

  // Auto-generate slug from English title
  React.useEffect(() => {
    if (autoSlug && titleEn) {
      setValue('slug', generateSlug(titleEn));
    }
  }, [titleEn, autoSlug, setValue]);

  const onSubmit = (data: CreatePostFormData) => {
    startTransition(async () => {
      try {
        let result;
        if (mode === 'create') {
          result = await createPost(data);
        } else if (initialData?._id) {
          result = await updatePost(initialData._id, data);
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
          if (!onSuccess) {
            router.push('/content/posts');
          }
        } else {
          toastError(result.error || 'Failed to save post');
        }
      } catch (error) {
        console.error('Post form error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  const toggleCategory = (categoryId: string) => {
    const current = selectedCategoryIds || [];
    if (current.includes(categoryId)) {
      setValue('categoryIds', current.filter((id) => id !== categoryId));
    } else {
      setValue('categoryIds', [...current, categoryId]);
    }
  };

  const toggleTag = (tagId: string) => {
    const current = selectedTagIds || [];
    if (current.includes(tagId)) {
      setValue('tagIds', current.filter((id) => id !== tagId));
    } else {
      setValue('tagIds', [...current, tagId]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {mode === 'create' ? 'Create Post' : 'Edit Post'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-4">
                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <MultiLangInput
                            label="Title"
                            required
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={{
                              en: 'Enter post title',
                              mm: 'ပို့စ် ခေါင်းစဉ် ရိုက်ထည့်ပါ',
                            }}
                            error={form.formState.errors.title?.en?.message}
                          />
                        </FormItem>
                      )}
                    />

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
                                placeholder="post-url-slug"
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

                    {/* Excerpt */}
                    <FormField
                      control={form.control}
                      name="excerpt"
                      render={({ field }) => (
                        <FormItem>
                          <MultiLangInput
                            label="Excerpt"
                            value={field.value || { en: '', mm: '' }}
                            onChange={field.onChange}
                            placeholder={{
                              en: 'Brief summary of the post',
                              mm: 'ပို့စ် အကျဉ်းချုပ်',
                            }}
                            multiline
                            rows={2}
                          />
                        </FormItem>
                      )}
                    />

                    {/* Content Editor */}
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <MultiLangEditor
                            label="Content"
                            required
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={{
                              en: 'Write your post content here...',
                              mm: 'သင့်ပို့စ် အကြောင်းအရာကို ဒီမှာ ရေးပါ...',
                            }}
                            minHeight="400px"
                            error={form.formState.errors.content?.en?.message}
                          />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="media" className="space-y-4">
                    {/* Featured Image */}
                    <FormField
                      control={form.control}
                      name="featuredImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Featured Image URL
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://example.com/image.jpg"
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the URL of the featured image
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Featured Image Alt */}
                    <FormField
                      control={form.control}
                      name="featuredImageAlt"
                      render={({ field }) => (
                        <FormItem>
                          <MultiLangInput
                            label="Featured Image Alt Text"
                            value={field.value || { en: '', mm: '' }}
                            onChange={field.onChange}
                            placeholder={{
                              en: 'Image description for accessibility',
                              mm: 'ပုံ ဖော်ပြချက်',
                            }}
                          />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="seo" className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Search Engine Optimization
                      </span>
                    </div>

                    {/* Meta Title */}
                    <FormField
                      control={form.control}
                      name="seo.metaTitle"
                      render={({ field }) => (
                        <FormItem>
                          <MultiLangInput
                            label="Meta Title"
                            value={field.value || { en: '', mm: '' }}
                            onChange={field.onChange}
                            placeholder={{
                              en: 'SEO title (max 60 characters)',
                              mm: 'SEO ခေါင်းစဉ် (အများဆုံး ၆၀ လုံး)',
                            }}
                          />
                          <FormDescription>
                            Recommended: 50-60 characters
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    {/* Meta Description */}
                    <FormField
                      control={form.control}
                      name="seo.metaDescription"
                      render={({ field }) => (
                        <FormItem>
                          <MultiLangInput
                            label="Meta Description"
                            value={field.value || { en: '', mm: '' }}
                            onChange={field.onChange}
                            placeholder={{
                              en: 'SEO description (max 160 characters)',
                              mm: 'SEO ဖော်ပြချက် (အများဆုံး ၁၆၀ လုံး)',
                            }}
                            multiline
                            rows={2}
                          />
                          <FormDescription>
                            Recommended: 150-160 characters
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Publish
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Visibility */}
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {field.value === 'public' ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                        Visibility
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="protected">Protected</SelectItem>
                          <SelectItem value="password">Password Protected</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Post Flags */}
                <div className="space-y-2">
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
                        <FormLabel className="!mt-0 flex items-center gap-1">
                          <Pin className="h-3 w-3" />
                          Pin to top
                        </FormLabel>
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
                        <FormLabel className="!mt-0 flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Featured post
                        </FormLabel>
                      </FormItem>
                    )}
                  />

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
                        <FormLabel className="!mt-0">Allow comments</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Post Type */}
            {postTypes.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Post Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="postTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select post type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {postTypes.map((pt) => (
                              <SelectItem key={pt._id} value={pt._id}>
                                {pt.name.en || pt.name.mm}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            {currentPostType?.supportsCategories && categories.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.map((category) => (
                      <div
                        key={category._id}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={`cat-${category._id}`}
                          checked={selectedCategoryIds.includes(category._id)}
                          onCheckedChange={() => toggleCategory(category._id)}
                        />
                        <label
                          htmlFor={`cat-${category._id}`}
                          className="text-sm cursor-pointer"
                        >
                          {category.name.en || category.name.mm}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {currentPostType?.supportsTags && tags.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag._id}
                        variant={selectedTagIds.includes(tag._id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag._id)}
                      >
                        {tag.name.en || tag.name.mm}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-background p-4">
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
