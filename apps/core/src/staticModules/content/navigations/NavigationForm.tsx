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
import { createNavigationItem, updateNavigationItem } from '../common/actions';
import type { Navigation, MenuTreeNode, MenuType, NavigationType } from '../common/types';
import { generateSlug } from '../common/utils';

// Navigation form schema
const navigationFormSchema = z.object({
  title: z.object({
    en: z.string().min(1, 'English title is required'),
    mm: z.string().optional().default(''),
  }),
  slug: z.string().optional(),
  url: z.string().optional(),
  type: z.enum(['internal', 'external', 'page', 'post', 'category', 'custom']),
  parentId: z.string().optional(),
  order: z.number().min(0).optional(),
  icon: z.string().optional(),
  isVisible: z.boolean().default(true),
  openInNewTab: z.boolean().default(false),
  requiresAuth: z.boolean().default(false),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

type NavigationFormData = z.infer<typeof navigationFormSchema>;

interface NavigationFormProps {
  mode: 'create' | 'edit';
  menuType: MenuType;
  parentId?: string;
  menuTree?: MenuTreeNode[];
  initialData?: Partial<Navigation> | MenuTreeNode;
  onSuccess?: (item: Navigation) => void;
  onCancel?: () => void;
}

// Navigation type labels
const navigationTypeLabels: Record<NavigationType, string> = {
  internal: 'Internal Link',
  external: 'External URL',
  page: 'Page',
  post: 'Post',
  category: 'Category',
  custom: 'Custom',
};

export function NavigationForm({
  mode,
  menuType,
  parentId: defaultParentId,
  menuTree = [],
  initialData,
  onSuccess,
  onCancel,
}: NavigationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [autoSlug, setAutoSlug] = useState(mode === 'create');
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');

  const form = useForm<NavigationFormData>({
    resolver: zodResolver(navigationFormSchema),
    defaultValues: {
      title: initialData?.title || { en: '', mm: '' },
      slug: initialData?.slug || '',
      url: initialData?.url || '',
      type: initialData?.type || 'internal',
      parentId: initialData?.parentId || defaultParentId || undefined,
      order: initialData?.order || 0,
      icon: initialData?.icon || '',
      isVisible: initialData?.isVisible ?? true,
      openInNewTab: initialData?.openInNewTab ?? false,
      requiresAuth: initialData?.requiresAuth ?? false,
      status: initialData?.status || 'Active',
    },
  });

  const { watch, setValue } = form;
  const titleEn = watch('title.en');
  const navigationType = watch('type');

  // Auto-generate slug from English title
  useEffect(() => {
    if (autoSlug && titleEn) {
      setValue('slug', generateSlug(titleEn));
    }
  }, [titleEn, autoSlug, setValue]);

  // Flatten menu tree for parent select
  const flattenMenuTree = (
    nodes: MenuTreeNode[],
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
          result.push(...flattenMenuTree(node.children, level + 1, excludeId));
        }
      }
    }
    return result;
  };

  const parentOptions = flattenMenuTree(menuTree, 0, initialData?._id);

  const onSubmit = (data: NavigationFormData) => {
    startTransition(async () => {
      try {
        const submitData = {
          ...data,
          menuType,
          parentId: data.parentId || undefined,
        };

        let result;
        if (mode === 'create') {
          result = await createNavigationItem(submitData as any);
        } else if (initialData?._id) {
          result = await updateNavigationItem(initialData._id, submitData as any);
        } else {
          throw new Error('Navigation item ID is required for update');
        }

        if (result.success && result.data) {
          toastSuccess(
            mode === 'create'
              ? 'Menu item created successfully'
              : 'Menu item updated successfully'
          );
          onSuccess?.(result.data);
        } else {
          toastError(result.error || 'Failed to save menu item');
        }
      } catch (error) {
        console.error('Navigation form error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <Input {...field} placeholder="Menu item title in English" />
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
                      <Input {...field} placeholder="မီနူး ခေါင်းစဉ် (မြန်မာ)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Link Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(navigationTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* URL or Slug based on type */}
        {navigationType === 'external' ? (
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>External URL</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug / Path</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="menu-slug"
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
        )}

        {/* Parent Item */}
        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Item</FormLabel>
              <Select
                value={field.value || '_none'}
                onValueChange={(value) => field.onChange(value === '_none' ? undefined : value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="_none">None (Top level)</SelectItem>
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

        {/* Order and Status */}
        <div className="grid grid-cols-2 gap-4">
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

        {/* Icon */}
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon (optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Icon name or class" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Options */}
        <div className="space-y-3">
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
            name="openInNewTab"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">Open in new tab</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requiresAuth"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">Requires authentication</FormLabel>
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
                {mode === 'create' ? 'Add Item' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default NavigationForm;
