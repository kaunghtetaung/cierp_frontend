'use client';

/**
 * @deprecated Pages have been consolidated into the Post collection
 * (PostType.slug='page'). Authoring goes through `PostForm.tsx` +
 * `PageDetailsCard.tsx`. This file is orphaned (no importers as of
 * 2026-04-29) and will be removed when the legacy `pages` collection
 * is retired — see `project_deferred_work.md` item #8.
 */

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
  Home,
  LayoutTemplate,
  Navigation,
} from 'lucide-react';
import { MultiLangInput } from './MultiLangInput';
import { MultiLangEditor } from '../editor';
import { createPageSchema, type CreatePageFormData } from '../../schemas';
import { createPage, updatePage } from '../../actions';
import type { Page, PageTreeNode, PageTemplate } from '../../types';

interface PageFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Page>;
  parentPages?: PageTreeNode[];
  onSuccess?: (page: Page) => void;
  onCancel?: () => void;
}

const PAGE_TEMPLATES: Array<{ value: PageTemplate; label: string; description: string }> = [
  { value: 'default', label: 'Default', description: 'Standard page layout with sidebar' },
  { value: 'fullWidth', label: 'Full Width', description: 'Content spans the full width' },
  { value: 'sidebar', label: 'Sidebar', description: 'Page with sidebar navigation' },
  { value: 'landing', label: 'Landing', description: 'Landing page without header/footer' },
  { value: 'blog', label: 'Blog', description: 'Blog-style layout' },
  { value: 'blank', label: 'Blank', description: 'Empty canvas for custom design' },
];

export function PageForm({
  mode,
  initialData,
  parentPages = [],
  onSuccess,
  onCancel,
}: PageFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [autoSlug, setAutoSlug] = useState(mode === 'create');
  const [activeTab, setActiveTab] = useState('content');

  const form = useForm<CreatePageFormData>({
    resolver: zodResolver(createPageSchema),
    defaultValues: {
      title: initialData?.title || { en: '', mm: '' },
      slug: initialData?.slug || '',
      description: initialData?.description || { en: '', mm: '' },
      content: initialData?.content || { en: '', mm: '' },
      featuredImage: initialData?.featuredImage || '',
      featuredImageAlt: initialData?.featuredImageAlt || { en: '', mm: '' },
      template: initialData?.template || 'default',
      parentId: initialData?.parentId || undefined,
      order: initialData?.order || 0,
      showInNavigation: initialData?.showInNavigation ?? true,
      showBreadcrumbs: initialData?.showBreadcrumbs ?? true,
      showTitle: initialData?.showTitle ?? true,
      showFeaturedImage: initialData?.showFeaturedImage ?? true,
      visibility: initialData?.visibility || 'public',
      status: initialData?.status || 'draft',
      isHomePage: initialData?.isHomePage || false,
      seo: initialData?.seo || {
        metaTitle: { en: '', mm: '' },
        metaDescription: { en: '', mm: '' },
        metaKeywords: [],
      },
    },
  });

  const { watch, setValue } = form;
  const titleEn = watch('title.en');
  const selectedTemplate = watch('template');

  // Auto-generate slug from English title
  React.useEffect(() => {
    if (autoSlug && titleEn) {
      setValue('slug', generateSlug(titleEn));
    }
  }, [titleEn, autoSlug, setValue]);

  const onSubmit = (data: CreatePageFormData) => {
    startTransition(async () => {
      try {
        let result;
        if (mode === 'create') {
          result = await createPage(data);
        } else if (initialData?._id) {
          result = await updatePage(initialData._id, data);
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
          if (!onSuccess) {
            router.push('/content/pages');
          }
        } else {
          toastError(result.error || 'Failed to save page');
        }
      } catch (error) {
        console.error('Page form error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  // Flatten page tree for select options
  const flattenPages = (
    nodes: PageTreeNode[],
    level = 0,
    excludeId?: string
  ): Array<{ value: string; label: string; level: number }> => {
    const result: Array<{ value: string; label: string; level: number }> = [];
    for (const node of nodes) {
      if (node._id !== excludeId) {
        result.push({
          value: node._id,
          label: node.title.en || node.title.mm || 'Untitled',
          level,
        });
        if (node.children?.length) {
          result.push(...flattenPages(node.children, level + 1, excludeId));
        }
      }
    }
    return result;
  };

  const parentOptions = flattenPages(parentPages, 0, initialData?._id);

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
                  {mode === 'create' ? 'Create Page' : 'Edit Page'}
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
                              en: 'Enter page title',
                              mm: 'စာမျက်နှာ ခေါင်းစဉ် ရိုက်ထည့်ပါ',
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
                                placeholder="page-url-slug"
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

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <MultiLangInput
                            label="Description"
                            value={field.value || { en: '', mm: '' }}
                            onChange={field.onChange}
                            placeholder={{
                              en: 'Brief description of the page',
                              mm: 'စာမျက်နှာ အကျဉ်းချုပ်',
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
                            value={field.value || { en: '', mm: '' }}
                            onChange={field.onChange}
                            placeholder={{
                              en: 'Write your page content here...',
                              mm: 'သင့်စာမျက်နှာ အကြောင်းအရာကို ဒီမှာ ရေးပါ...',
                            }}
                            minHeight="400px"
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

                {/* Page Flags */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="isHomePage"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 flex items-center gap-1">
                          <Home className="h-3 w-3" />
                          Set as Home Page
                        </FormLabel>
                      </FormItem>
                    )}
                  />

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
                        <FormLabel className="!mt-0 flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          Show in Navigation
                        </FormLabel>
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
                        <FormLabel className="!mt-0">Show Title</FormLabel>
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
              </CardContent>
            </Card>

            {/* Template */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4" />
                  Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAGE_TEMPLATES.map((template) => (
                            <SelectItem key={template.value} value={template.value}>
                              <div>
                                <div className="font-medium">{template.label}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {PAGE_TEMPLATES.find((t) => t.value === selectedTemplate)?.description}
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Page Hierarchy */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Page Hierarchy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Parent Page */}
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Page</FormLabel>
                      <Select
                        value={field.value || ''}
                        onValueChange={(value) => field.onChange(value || undefined)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None (Root page)</SelectItem>
                          {parentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {'—'.repeat(option.level)} {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <FormDescription>
                        Lower numbers appear first
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
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
