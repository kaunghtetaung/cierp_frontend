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
} from '@repo/ui';
import { Input, Button } from '@repo/ui';
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
import { createTagSchema, type CreateTagFormData } from '../common/schemas';
import { createTag, updateTag } from '../common/actions';
import type { Tag } from '../common/types';
import { generateSlug } from '../common/utils';

interface TagFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Tag>;
  onSuccess?: (tag: Tag) => void;
  onCancel?: () => void;
}

export function TagForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: TagFormProps) {
  const [isPending, startTransition] = useTransition();
  const [autoSlug, setAutoSlug] = useState(mode === 'create');
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');

  const form = useForm<CreateTagFormData>({
    resolver: zodResolver(createTagSchema),
    defaultValues: {
      name: initialData?.name || { en: '', mm: '' },
      slug: initialData?.slug || '',
      description: initialData?.description || { en: '', mm: '' },
      color: initialData?.color || '#3b82f6',
      status: (initialData?.status?.toLowerCase() as 'active' | 'inactive') || 'active',
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

  const onSubmit = (data: CreateTagFormData) => {
    startTransition(async () => {
      try {
        // Convert status to PascalCase for API
        const apiData = {
          ...data,
          status: data.status === 'active' ? 'Active' : 'Inactive',
        };

        let result;
        if (mode === 'create') {
          result = await createTag(apiData as any);
        } else if (initialData?._id) {
          result = await updateTag(initialData._id, apiData as any);
        } else {
          throw new Error('Tag ID is required for update');
        }

        if (result.success && result.data) {
          toastSuccess(
            mode === 'create'
              ? 'Tag created successfully'
              : 'Tag updated successfully'
          );
          onSuccess?.(result.data);
        } else {
          toastError(result.error || 'Failed to save tag');
        }
      } catch (error) {
        console.error('Tag form error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <Input {...field} placeholder="Tag name in English" />
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
                      <Input {...field} placeholder="တဂ် နာမည် (မြန်မာ)" />
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
                    placeholder="tag-slug"
                    disabled={autoSlug}
                  />
                </FormControl>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoSlug"
                    checked={autoSlug}
                    onChange={(e) => setAutoSlug(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description - Multi-language */}
        <div className="space-y-2">
          <FormLabel>Description</FormLabel>
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
                name="description.en"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="Description in English (optional)" />
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
                {mode === 'create' ? 'Create Tag' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default TagForm;
