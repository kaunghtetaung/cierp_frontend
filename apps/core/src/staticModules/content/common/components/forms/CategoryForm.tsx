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
import { Input, Button, Checkbox, Textarea } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import { generateSlug } from '../../utils';
import { Loader2, Save, X, FolderTree } from 'lucide-react';
import { MultiLangInput } from './MultiLangInput';
import { createCategorySchema, type CreateCategoryFormData } from '../../schemas';
import { createCategory, updateCategory } from '../../actions';
import type { Category, CategoryTreeNode } from '../../types';

interface CategoryFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Category>;
  parentCategories?: CategoryTreeNode[];
  postTypeId?: string;
  onSuccess?: (category: Category) => void;
  onCancel?: () => void;
}

export function CategoryForm({
  mode,
  initialData,
  parentCategories = [],
  postTypeId,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [autoSlug, setAutoSlug] = useState(mode === 'create');

  const form = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: initialData?.name || { en: '', mm: '' },
      slug: initialData?.slug || '',
      description: initialData?.description || { en: '', mm: '' },
      parentId: initialData?.parentId || undefined,
      postTypeId: initialData?.postTypeId || postTypeId || '',
      icon: initialData?.icon || '',
      color: initialData?.color || '#000000',
      featured: initialData?.featured || false,
      showInMenu: initialData?.showInMenu ?? true,
      order: initialData?.order || 0,
      status: initialData?.status || 'active',
    },
  });

  const { watch, setValue } = form;
  const nameEn = watch('name.en');

  // Auto-generate slug from English name
  React.useEffect(() => {
    if (autoSlug && nameEn) {
      setValue('slug', generateSlug(nameEn));
    }
  }, [nameEn, autoSlug, setValue]);

  const onSubmit = (data: CreateCategoryFormData) => {
    startTransition(async () => {
      try {
        let result;
        if (mode === 'create') {
          result = await createCategory(data);
        } else if (initialData?._id) {
          result = await updateCategory(initialData._id, data);
        } else {
          throw new Error('Category ID is required for update');
        }

        if (result.success && result.data) {
          toastSuccess(
            mode === 'create'
              ? 'Category created successfully'
              : 'Category updated successfully'
          );
          onSuccess?.(result.data);
          if (!onSuccess) {
            router.push('/content/categories');
          }
        } else {
          toastError(result.error || 'Failed to save category');
        }
      } catch (error) {
        console.error('Category form error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  // Flatten category tree for select options
  const flattenCategories = (
    nodes: CategoryTreeNode[],
    level = 0,
    excludeId?: string
  ): Array<{ value: string; label: string; level: number }> => {
    const result: Array<{ value: string; label: string; level: number }> = [];
    for (const node of nodes) {
      if (node._id !== excludeId) {
        result.push({
          value: node._id,
          label: node.name.en || node.name.mm || 'Untitled',
          level,
        });
        if (node.children?.length) {
          result.push(...flattenCategories(node.children, level + 1, excludeId));
        }
      }
    }
    return result;
  };

  const parentOptions = flattenCategories(parentCategories, 0, initialData?._id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderTree className="h-5 w-5" />
          {mode === 'create' ? 'Create Category' : 'Edit Category'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Add a new category to organize your content'
            : 'Update category details'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <MultiLangInput
                    label="Name"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={{
                      en: 'Category name in English',
                      mm: 'အမျိုးအစား နာမည် (မြန်မာ)',
                    }}
                    error={form.formState.errors.name?.en?.message || form.formState.errors.name?.mm?.message}
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
                        placeholder="category-slug"
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
                        Auto-generate
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
                      en: 'Brief description of the category',
                      mm: 'အမျိုးအစား အကြောင်း အကျဉ်းချုပ်',
                    }}
                    multiline
                    rows={3}
                  />
                </FormItem>
              )}
            />

            {/* Parent Category */}
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select
                    value={field.value || ''}
                    onValueChange={(value) => field.onChange(value || undefined)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None (Root category)</SelectItem>
                      {parentOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {'—'.repeat(option.level)} {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color and Icon Row */}
            <div className="grid grid-cols-2 gap-4">
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
                          {...field}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          {...field}
                          placeholder="#000000"
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
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Icon name (e.g., Folder)"
                      />
                    </FormControl>
                    <FormDescription>Lucide icon name</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status and Order Row */}
            <div className="grid grid-cols-2 gap-4">
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-6">
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Featured</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showInMenu"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Show in Menu</FormLabel>
                  </FormItem>
                )}
              />
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
                    {mode === 'create' ? 'Create Category' : 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default CategoryForm;
