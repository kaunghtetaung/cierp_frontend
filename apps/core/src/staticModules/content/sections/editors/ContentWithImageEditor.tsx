'use client';

/**
 * @deprecated Replaced by the production split-pane editor at
 * `editors/ContentWithImageSectionForm.tsx` + `ContentWithImageSectionPreview.tsx`,
 * which is wired into `SectionEditorPage.tsx`. This legacy file is kept
 * for reference only and is no longer imported by any route. Remove
 * after one release cycle of confidence in the new editor.
 */

import React, { useState } from 'react';
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
import { Switch } from '@repo/ui';
import { Badge } from '@repo/ui';
import { RadioGroup, RadioGroupItem } from '@repo/ui';
import {
  Image as ImageIcon,
  Eye,
  Type,
  Layout,
  ArrowLeftRight,
  LayoutGrid,
  Link as LinkIcon,
} from 'lucide-react';
import type { ContentWithImageSection } from '../../common/types';

// Content with Image section form schema
const contentWithImageSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }),
  headline: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  content: z.object({
    en: z.string().min(1, 'Content (EN) is required'),
    mm: z.string().optional(),
  }),
  image: z.string().min(1, 'Image is required'),
  imageAlt: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }),
  imagePosition: z.enum(['left', 'right']),
  imageRatio: z.enum(['square', 'landscape', 'portrait']),
  contentAlignment: z.enum(['left', 'center', 'right']),
  button: z.object({
    text: z.object({
      en: z.string().min(1, 'Button text required'),
      mm: z.string().optional(),
    }),
    url: z.string().min(1, 'Button URL required'),
    style: z.enum(['primary', 'secondary', 'outline']),
    openInNewTab: z.boolean(),
  }).optional(),
  isVisible: z.boolean(),
  isReusable: z.boolean(),
  status: z.enum(['Active', 'Inactive']),
  order: z.number().min(0).optional(),
});

type ContentWithImageFormData = z.infer<typeof contentWithImageSchema>;

interface ContentWithImageEditorProps {
  initialData?: Partial<ContentWithImageSection>;
  onSave: (data: ContentWithImageFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function ContentWithImageEditor({
  initialData,
  onSave,
  onCancel,
  saving = false,
}: ContentWithImageEditorProps) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const [includeButton, setIncludeButton] = useState(!!initialData?.button);

  const form = useForm<ContentWithImageFormData>({
    resolver: zodResolver(contentWithImageSchema),
    defaultValues: {
      name: initialData?.name || '',
      title: initialData?.title || { en: '', mm: '' },
      headline: initialData?.headline || { en: '', mm: '' },
      content: initialData?.content || { en: '', mm: '' },
      image: initialData?.image || '',
      imageAlt: initialData?.imageAlt || { en: '', mm: '' },
      imagePosition: initialData?.imagePosition || 'right',
      imageRatio: initialData?.imageRatio || 'landscape',
      contentAlignment: initialData?.contentAlignment || 'left',
      button: initialData?.button || undefined,
      isVisible: initialData?.isVisible ?? true,
      isReusable: initialData?.isReusable ?? false,
      status: initialData?.status || 'Active',
      order: initialData?.order || 0,
    },
  });

  const watchedValues = form.watch();

  const imageRatioClasses = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
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
                        <Input {...field} placeholder="e.g., About Us Section" />
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
                          <FormLabel>Headline (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Section headline"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content.en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Content <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Enter your content here..."
                              rows={8}
                              className="resize-y"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Rich text editor would be integrated here
                          </FormDescription>
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
                            <Input
                              {...field}
                              placeholder="ခေါင်းစဉ်"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content.mm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content (Myanmar)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="မြန်မာဘာသာ အကြောင်းအရာ"
                              rows={8}
                              className="resize-y"
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

            {/* Image Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Image Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Image URL <span className="text-destructive">*</span>
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
                  name="imageAlt.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Alt Text (EN)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Describe the image for accessibility" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Important for SEO and accessibility
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageRatio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        Image Ratio
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-3 gap-3"
                        >
                          <div>
                            <RadioGroupItem
                              value="square"
                              id="square"
                              className="peer sr-only"
                            />
                            <label
                              htmlFor="square"
                              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <div className="w-full aspect-square bg-muted rounded mb-2" />
                              <span className="text-xs font-medium">Square</span>
                            </label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="landscape"
                              id="landscape"
                              className="peer sr-only"
                            />
                            <label
                              htmlFor="landscape"
                              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <div className="w-full aspect-video bg-muted rounded mb-2" />
                              <span className="text-xs font-medium">Landscape</span>
                            </label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="portrait"
                              id="portrait"
                              className="peer sr-only"
                            />
                            <label
                              htmlFor="portrait"
                              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <div className="w-full aspect-[3/4] bg-muted rounded mb-2" />
                              <span className="text-xs font-medium">Portrait</span>
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Layout Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Layout Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="imagePosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4" />
                        Image Position
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-2 gap-3"
                        >
                          <div>
                            <RadioGroupItem
                              value="left"
                              id="left"
                              className="peer sr-only"
                            />
                            <label
                              htmlFor="left"
                              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <div className="flex gap-2 w-full mb-2">
                                <div className="w-1/2 h-12 bg-primary/20 rounded" />
                                <div className="w-1/2 h-12 bg-muted rounded" />
                              </div>
                              <span className="text-sm font-medium">Image Left</span>
                            </label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="right"
                              id="right"
                              className="peer sr-only"
                            />
                            <label
                              htmlFor="right"
                              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <div className="flex gap-2 w-full mb-2">
                                <div className="w-1/2 h-12 bg-muted rounded" />
                                <div className="w-1/2 h-12 bg-primary/20 rounded" />
                              </div>
                              <span className="text-sm font-medium">Image Right</span>
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contentAlignment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Alignment</FormLabel>
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
              </CardContent>
            </Card>

            {/* Call-to-Action Button Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Call-to-Action Button
                  </CardTitle>
                  <Switch
                    checked={includeButton}
                    onCheckedChange={(checked) => {
                      setIncludeButton(checked);
                      if (!checked) {
                        form.setValue('button', undefined);
                      } else {
                        form.setValue('button', {
                          text: { en: '', mm: '' },
                          url: '',
                          style: 'primary',
                          openInNewTab: false,
                        });
                      }
                    }}
                  />
                </div>
              </CardHeader>
              {includeButton && (
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="button.text.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Text (EN) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Learn More" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="button.url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button URL *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="button.style"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Style</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
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
                      name="button.openInNewTab"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-y-0 pt-7">
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <FormLabel className="text-xs font-normal">
                                Open in New Tab
                              </FormLabel>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              )}
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
              <Badge variant="outline">Content with Image</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div
              className={`flex gap-6 items-center ${
                watchedValues.imagePosition === 'left' ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              {/* Image */}
              <div className={`flex-1 ${imageRatioClasses[watchedValues.imageRatio || 'landscape']}`}>
                {watchedValues.image ? (
                  <img
                    src={watchedValues.image}
                    alt={watchedValues.imageAlt?.[langTab] || 'Preview'}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 space-y-4 text-${watchedValues.contentAlignment || 'left'}`}>
                {watchedValues.headline?.[langTab] && (
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    {watchedValues.headline[langTab]}
                  </h2>
                )}

                {watchedValues.content?.[langTab] && (
                  <div className="text-base text-muted-foreground whitespace-pre-wrap">
                    {watchedValues.content[langTab]}
                  </div>
                )}

                {includeButton && watchedValues.button?.text?.[langTab] && (
                  <div className={`flex ${watchedValues.contentAlignment === 'center' ? 'justify-center' : watchedValues.contentAlignment === 'right' ? 'justify-end' : 'justify-start'}`}>
                    <button
                      type="button"
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        watchedValues.button.style === 'primary'
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : watchedValues.button.style === 'secondary'
                          ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                          : 'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                      }`}
                    >
                      {watchedValues.button.text[langTab]}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
