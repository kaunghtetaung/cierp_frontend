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
import { toastSuccess, toastError } from '@repo/utils';
import { Loader2, Save, X } from 'lucide-react';
import { createCategorySchema, type CreateCategoryFormData } from '../common/schemas';
import { createCategory, updateCategory } from '../common/actions';
import type { Category, CategoryTreeNode } from '../common/types';

// Generate slug from text
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface CategoryFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Category> | CategoryTreeNode;
  parentCategories?: CategoryTreeNode[];
  onSuccess?: (category: Category) => void;
  onCancel?: () => void;
}

export function CategoryForm({
  mode,
  initialData,
  parentCategories = [],
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [autoSlug, setAutoSlug] = useState(mode === 'create');
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');

  const form = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: initialData?.name || { en: '', mm: '' },
      slug: initialData?.slug || '',
      description: initialData?.description || { en: '', mm: '' },
      parentId: initialData?.parentId || undefined,
      icon: initialData?.icon || '',
      color: initialData?.color || '#3b82f6',
      order: initialData?.order || 0,
      isVisible: initialData?.isVisible ?? true,
      isDefault: initialData?.isDefault || false,
      status: initialData?.status || 'Active',
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

  const onSubmit = (data: CreateCategoryFormData) => {
    console.log('onSubmit called with data:', data);
    startTransition(async () => {
      try {
        let result;
        if (mode === 'create') {
          console.log('Creating category...');
          result = await createCategory(data);
        } else if (initialData?._id) {
          console.log('Updating category:', initialData._id);
          result = await updateCategory(initialData._id, data);
        } else {
          throw new Error('Category ID is required for update');
        }

        console.log('API result:', result);
        if (result.success && result.data) {
          toastSuccess(
            mode === 'create'
              ? 'Category created successfully'
              : 'Category updated successfully'
          );
          onSuccess?.(result.data);
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

  const handleFormSubmit = form.handleSubmit(
    onSubmit,
    (errors) => {
      console.log('Form validation errors:', errors);
      // Switch to the tab with errors
      if (errors.name?.mm) {
        setLangTab('mm');
      } else if (errors.name?.en) {
        setLangTab('en');
      }
    }
  );

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Name - Multi-language */}
        <div className="space-y-2">
          <FormLabel>
            Name <span className="text-destructive">*</span>
          </FormLabel>
          <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
            <TabsList className="h-8 mb-2">
              <TabsTrigger value="en" className="text-xs px-2 py-1">
                🇬🇧 EN
              </TabsTrigger>
              <TabsTrigger value="mm" className="text-xs px-2 py-1">
                🇲🇲 MM
              </TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="mt-0">
              <FormField
                control={form.control}
                name="name.en"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="Category name in English" />
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
                      <Input {...field} placeholder="အမျိုးအစား နာမည် (မြန်မာ)" />
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
                    Auto
                  </label>
                </div>
              </div>
              <FormMessage />
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
                value={field.value || '__none__'}
                onValueChange={(value) => field.onChange(value === '__none__' ? undefined : value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">None (Root category)</SelectItem>
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

        {/* Color and Status Row */}
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
                    <SelectItem value="Draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-6">
          <FormField
            control={form.control}
            name="isVisible"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">Visible</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">Default Category</FormLabel>
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
  );
}

export default CategoryForm;
