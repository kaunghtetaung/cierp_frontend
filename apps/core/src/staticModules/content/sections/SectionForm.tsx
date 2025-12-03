'use client';

import React, { useState, useTransition } from 'react';
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
import { Loader2, Save, X, ArrowLeft } from 'lucide-react';
import { createSection, updateSection } from '../common/actions';
import type { Section, SectionType } from '../common/types';

// Base section form schema
const baseSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }),
  isVisible: z.boolean().default(true),
  isReusable: z.boolean().default(false),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  order: z.number().min(0).optional(),
});

// Hero section schema
const heroSectionSchema = baseSectionSchema.extend({
  type: z.literal('hero'),
  headline: z.object({
    en: z.string().min(1, 'Headline is required'),
    mm: z.string().optional(),
  }),
  subheadline: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  backgroundImage: z.string().optional(),
  textAlignment: z.enum(['left', 'center', 'right']).default('center'),
  height: z.enum(['small', 'medium', 'large', 'fullscreen']).default('medium'),
});

// Generic section schema for simpler types
const genericSectionSchema = baseSectionSchema.extend({
  type: z.string(),
  headline: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  description: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
});

type SectionFormData = z.infer<typeof genericSectionSchema>;

interface SectionFormProps {
  mode: 'create' | 'edit';
  sectionType: SectionType;
  initialData?: Partial<Section>;
  onSuccess?: (section: Section) => void;
  onCancel?: () => void;
}

export function SectionForm({
  mode,
  sectionType,
  initialData,
  onSuccess,
  onCancel,
}: SectionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');

  const form = useForm<SectionFormData>({
    resolver: zodResolver(genericSectionSchema),
    defaultValues: {
      name: initialData?.name || '',
      title: initialData?.title || { en: '', mm: '' },
      type: sectionType,
      isVisible: initialData?.isVisible ?? true,
      isReusable: initialData?.isReusable ?? false,
      status: initialData?.status || 'Active',
      order: initialData?.order || 0,
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      description: (initialData as any)?.description || { en: '', mm: '' },
    },
  });

  const onSubmit = (data: SectionFormData) => {
    startTransition(async () => {
      try {
        const sectionData = {
          ...data,
          type: sectionType,
        };

        let result;
        if (mode === 'create') {
          result = await createSection(sectionData as any);
        } else if (initialData?._id) {
          result = await updateSection(initialData._id, sectionData as any);
        } else {
          throw new Error('Section ID is required for update');
        }

        if (result.success && result.data) {
          toastSuccess(
            mode === 'create'
              ? 'Section created successfully'
              : 'Section updated successfully'
          );
          onSuccess?.(result.data);
        } else {
          toastError(result.error || 'Failed to save section');
        }
      } catch (error) {
        console.error('Section form error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Section Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Internal name for this section" />
                </FormControl>
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

        {/* Title - Multi-language */}
        <div className="space-y-2">
          <FormLabel>Display Title</FormLabel>
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
                      <Input {...field} placeholder="Section title in English" />
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
                      <Input {...field} placeholder="အပိုင်း ခေါင်းစဉ် (မြန်မာ)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Headline - Multi-language (for applicable types) */}
        {['hero', 'cta', 'featureList', 'testimonials', 'gallery', 'faq', 'pricing'].includes(sectionType) && (
          <div className="space-y-2">
            <FormLabel>Headline</FormLabel>
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
                  name="headline.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Main headline in English" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="mm" className="mt-0">
                <FormField
                  control={form.control}
                  name="headline.mm"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="ခေါင်းစဉ်ကြီး (မြန်မာ)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

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
                      <Input {...field} placeholder="ဖော်ပြချက် (မြန်မာ)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Status and Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="space-y-3 pt-6">
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
              name="isReusable"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Reusable (can be used on multiple pages)</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {mode === 'create' ? 'Back' : 'Cancel'}
          </Button>
          <div className="flex gap-3">
            {onCancel && mode === 'edit' && (
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
                  {mode === 'create' ? 'Create Section' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export default SectionForm;
