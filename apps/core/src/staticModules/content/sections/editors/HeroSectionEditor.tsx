'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Input, Button, Textarea } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Slider } from '@repo/ui';
import { Switch } from '@repo/ui';
import { Badge } from '@repo/ui';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Eye,
  Palette,
  Type,
  Link as LinkIcon,
  ArrowUpDown,
} from 'lucide-react';
import type { HeroSection } from '../../common/types';

// Hero section form schema
const heroSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }),
  headline: z.object({
    en: z.string().min(1, 'Headline (EN) is required'),
    mm: z.string().optional(),
  }),
  subheadline: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  backgroundImage: z.string().optional(),
  backgroundVideo: z.string().optional(),
  overlay: z.object({
    enabled: z.boolean(),
    color: z.string(),
    opacity: z.number().min(0).max(1),
  }).optional(),
  textAlignment: z.enum(['left', 'center', 'right']),
  height: z.enum(['small', 'medium', 'large', 'fullscreen']),
  buttons: z.array(
    z.object({
      text: z.object({
        en: z.string().min(1, 'Button text required'),
        mm: z.string().optional(),
      }),
      url: z.string().min(1, 'Button URL required'),
      style: z.enum(['primary', 'secondary', 'outline']),
      openInNewTab: z.boolean(),
    })
  ),
  isVisible: z.boolean(),
  isReusable: z.boolean(),
  status: z.enum(['Active', 'Inactive']),
  order: z.number().min(0).optional(),
});

type HeroSectionFormData = z.infer<typeof heroSectionSchema>;

interface HeroSectionEditorProps {
  initialData?: Partial<HeroSection>;
  onSave: (data: HeroSectionFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function HeroSectionEditor({
  initialData,
  onSave,
  onCancel,
  saving = false,
}: HeroSectionEditorProps) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const [previewMode, setPreviewMode] = useState(false);

  const form = useForm<HeroSectionFormData>({
    resolver: zodResolver(heroSectionSchema),
    defaultValues: {
      name: initialData?.name || '',
      title: initialData?.title || { en: '', mm: '' },
      headline: initialData?.headline || { en: '', mm: '' },
      subheadline: initialData?.subheadline || { en: '', mm: '' },
      backgroundImage: initialData?.backgroundImage || '',
      backgroundVideo: initialData?.backgroundVideo || '',
      overlay: initialData?.overlay || {
        enabled: false,
        color: '#000000',
        opacity: 0.5,
      },
      textAlignment: initialData?.textAlignment || 'center',
      height: initialData?.height || 'medium',
      buttons: initialData?.buttons || [],
      isVisible: initialData?.isVisible ?? true,
      isReusable: initialData?.isReusable ?? false,
      status: initialData?.status || 'Active',
      order: initialData?.order || 0,
    },
  });

  const { fields: buttonFields, append: appendButton, remove: removeButton } = useFieldArray({
    control: form.control,
    name: 'buttons',
  });

  const watchedValues = form.watch();

  const heightLabels = {
    small: '300px',
    medium: '500px',
    large: '700px',
    fullscreen: '100vh',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Section Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Homepage Hero" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Internal name for managing this section
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="isVisible"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Visible</FormLabel>
                          <FormDescription className="text-xs">
                            Show on website
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isReusable"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Reusable</FormLabel>
                          <FormDescription className="text-xs">
                            Use on multiple pages
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="mm">Myanmar</TabsTrigger>
                  </TabsList>

                  <TabsContent value="en" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="headline.en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Headline <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Enter your main headline"
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subheadline.en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subheadline</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Optional supporting text"
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="mm" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="headline.mm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Headline (Myanmar)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="မြန်မာဘာသာ ခေါင်းစဉ်"
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subheadline.mm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subheadline (Myanmar)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="ခေါင်းစဉ်ခွဲ (ရွေးချယ်)"
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Background & Styling Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Background & Styling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="backgroundImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Background Image
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            {...field}
                            placeholder="Enter image URL or click to browse"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              // TODO: Open image browser
                              alert('Image browser will be implemented');
                            }}
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        Hero Height
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">Small ({heightLabels.small})</SelectItem>
                          <SelectItem value="medium">Medium ({heightLabels.medium})</SelectItem>
                          <SelectItem value="large">Large ({heightLabels.large})</SelectItem>
                          <SelectItem value="fullscreen">Fullscreen ({heightLabels.fullscreen})</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="textAlignment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Text Alignment</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Overlay Controls */}
                <div className="space-y-3 p-3 border rounded-lg">
                  <FormField
                    control={form.control}
                    name="overlay.enabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Enable Overlay</FormLabel>
                          <FormDescription className="text-xs">
                            Darken background for better text visibility
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {watchedValues.overlay?.enabled && (
                    <>
                      <FormField
                        control={form.control}
                        name="overlay.color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Overlay Color</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input type="color" {...field} className="h-10 w-20" />
                              </FormControl>
                              <Input {...field} placeholder="#000000" className="flex-1" />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="overlay.opacity"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between mb-2">
                              <FormLabel>Overlay Opacity</FormLabel>
                              <span className="text-sm text-muted-foreground">
                                {Math.round(field.value * 100)}%
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                min={0}
                                max={1}
                                step={0.1}
                                value={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Buttons Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Call-to-Action Buttons
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendButton({
                        text: { en: '', mm: '' },
                        url: '',
                        style: 'primary',
                        openInNewTab: false,
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Button
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {buttonFields.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No buttons added yet. Click "Add Button" to create one.
                  </div>
                ) : (
                  buttonFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">Button {index + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeButton(index)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <FormField
                        control={form.control}
                        name={`buttons.${index}.text.en`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Button Text (EN) *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Click Here" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`buttons.${index}.url`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">URL *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name={`buttons.${index}.style`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Style</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="primary">Primary</SelectItem>
                                  <SelectItem value="secondary">Secondary</SelectItem>
                                  <SelectItem value="outline">Outline</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`buttons.${index}.openInNewTab`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-y-0 pt-7">
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <FormLabel className="text-xs font-normal">
                                    New Tab
                                  </FormLabel>
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Section'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Preview Section */}
      <div className="lg:sticky lg:top-4 lg:h-fit">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live Preview
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              className="relative overflow-hidden"
              style={{
                height: heightLabels[watchedValues.height || 'medium'],
                backgroundImage: watchedValues.backgroundImage
                  ? `url(${watchedValues.backgroundImage})`
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Overlay */}
              {watchedValues.overlay?.enabled && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: watchedValues.overlay.color || '#000000',
                    opacity: watchedValues.overlay.opacity || 0.5,
                  }}
                />
              )}

              {/* Content */}
              <div className="relative h-full flex items-center justify-center p-8">
                <div
                  className={`max-w-4xl w-full space-y-6 text-${watchedValues.textAlignment || 'center'}`}
                >
                  {/* Headline */}
                  {watchedValues.headline?.[langTab] && (
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                      {watchedValues.headline[langTab]}
                    </h1>
                  )}

                  {/* Subheadline */}
                  {watchedValues.subheadline?.[langTab] && (
                    <p className="text-lg md:text-xl text-white/90">
                      {watchedValues.subheadline[langTab]}
                    </p>
                  )}

                  {/* Buttons */}
                  {watchedValues.buttons && watchedValues.buttons.length > 0 && (
                    <div className={`flex gap-3 ${watchedValues.textAlignment === 'center' ? 'justify-center' : watchedValues.textAlignment === 'right' ? 'justify-end' : 'justify-start'}`}>
                      {watchedValues.buttons.map((btn, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                            btn.style === 'primary'
                              ? 'bg-white text-gray-900 hover:bg-gray-100'
                              : btn.style === 'secondary'
                              ? 'bg-gray-800 text-white hover:bg-gray-700'
                              : 'border-2 border-white text-white hover:bg-white hover:text-gray-900'
                          }`}
                        >
                          {btn.text?.[langTab] || 'Button'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
