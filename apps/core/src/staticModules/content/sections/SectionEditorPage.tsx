'use client';

import React, { useState, useTransition, useEffect, useMemo } from 'react';
import { useForm, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Layers,
  Monitor,
  Tablet,
  Smartphone,
  PanelLeft,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@repo/ui';
import { Tabs, TabsList, TabsTrigger } from '@repo/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui';
import {
  useSectionDraftPersistence,
  loadDraft,
  clearDraft,
  buildDraftKey,
  formatRelativeTime,
  type DraftEntry,
} from './editors/_shared/useSectionDraftPersistence';
import { toastSuccess, toastError } from '@repo/utils';
import { createSection, updateSection } from '../common/actions';
import type { Section, SectionType } from '../common/types';
import { HeroSectionForm } from './editors/HeroSectionForm';
import { HeroSectionPreview } from './editors/HeroSectionPreview';
import { heroSectionSchema, type HeroSectionFormData } from './editors/hero-types';
import { FaqSectionForm } from './editors/FaqSectionForm';
import { FaqSectionPreview } from './editors/FaqSectionPreview';
import { faqSectionSchema, type FaqSectionFormData } from './editors/faq-types';
import { FeatureListSectionForm } from './editors/FeatureListSectionForm';
import { FeatureListSectionPreview } from './editors/FeatureListSectionPreview';
import { featureListSectionSchema, type FeatureListSectionFormData } from './editors/feature-list-types';
import { CtaSectionForm } from './editors/CtaSectionForm';
import { CtaSectionPreview } from './editors/CtaSectionPreview';
import { ctaSectionSchema, type CtaSectionFormData } from './editors/cta-types';
import { TestimonialsSectionForm } from './editors/TestimonialsSectionForm';
import { TestimonialsSectionPreview } from './editors/TestimonialsSectionPreview';
import {
  testimonialsSectionSchema,
  type TestimonialsSectionFormData,
} from './editors/testimonials-types';
import { GallerySectionForm } from './editors/GallerySectionForm';
import { GallerySectionPreview } from './editors/GallerySectionPreview';
import {
  gallerySectionSchema,
  type GallerySectionFormData,
} from './editors/gallery-types';
import { ContentWithImageSectionForm } from './editors/ContentWithImageSectionForm';
import { ContentWithImageSectionPreview } from './editors/ContentWithImageSectionPreview';
import {
  contentWithImageSectionSchema,
  type ContentWithImageSectionFormData,
} from './editors/content-with-image-types';
import { PricingSectionForm } from './editors/PricingSectionForm';
import { PricingSectionPreview } from './editors/PricingSectionPreview';
import {
  pricingSectionSchema,
  type PricingSectionFormData,
} from './editors/pricing-types';
import { DataTableSectionForm } from './editors/DataTableSectionForm';
import { DataTableSectionPreview } from './editors/DataTableSectionPreview';
import {
  dataTableSectionSchema,
  type DataTableSectionFormData,
} from './editors/data-table-types';
import { StatsSectionForm } from './editors/StatsSectionForm';
import { StatsSectionPreview } from './editors/StatsSectionPreview';
import {
  statsSectionSchema,
  type StatsSectionFormData,
} from './editors/stats-types';
import { CarouselSectionForm } from './editors/CarouselSectionForm';
import { CarouselSectionPreview } from './editors/CarouselSectionPreview';
import {
  carouselSectionSchema,
  type CarouselSectionFormData,
} from './editors/carousel-types';
import { RecentPostsSectionForm } from './editors/RecentPostsSectionForm';
import { RecentPostsSectionPreview } from './editors/RecentPostsSectionPreview';
import {
  recentPostsSectionSchema,
  type RecentPostsSectionFormData,
} from './editors/recent-posts-types';
import { CategoryListSectionForm } from './editors/CategoryListSectionForm';
import { CategoryListSectionPreview } from './editors/CategoryListSectionPreview';
import {
  categoryListSectionSchema,
  type CategoryListSectionFormData,
} from './editors/category-list-types';
import { TagListSectionForm } from './editors/TagListSectionForm';
import { TagListSectionPreview } from './editors/TagListSectionPreview';
import {
  tagListSectionSchema,
  type TagListSectionFormData,
} from './editors/tag-list-types';
import { PostBodySectionForm } from './editors/PostBodySectionForm';
import { PostBodySectionPreview } from './editors/PostBodySectionPreview';
import {
  postBodySectionSchema,
  type PostBodySectionFormData,
} from './editors/post-body-types';
import { NavigationMenuSectionForm } from './editors/NavigationMenuSectionForm';
import {
  navigationMenuSectionSchema,
  type NavigationMenuSectionFormData,
} from './editors/navigation-menu-types';
import { TabsSectionForm } from './editors/TabsSectionForm';
import { TabsSectionPreview } from './editors/TabsSectionPreview';
import {
  tabsSectionSchema,
  type TabsSectionFormData,
} from './editors/tabs-types';

interface SectionEditorPageProps {
  mode: 'create' | 'edit';
  sectionType: SectionType;
  initialData?: Partial<Section>;
  onClose: () => void;
  onSuccess: () => void;
  tenantId?: string;
}

export function SectionEditorPage({
  mode,
  sectionType,
  initialData,
  onClose,
  onSuccess,
  tenantId,
}: SectionEditorPageProps) {
  const [dialogOpen, setDialogOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewLang, setPreviewLang] = useState<'en' | 'mm'>('en');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPending, startTransition] = useTransition();

  const sectionTypeLabels: Record<SectionType, string> = {
    hero: 'Hero Section',
    contentWithImage: 'Content with Image',
    cta: 'Call to Action',
    featureList: 'Feature List',
    testimonials: 'Testimonials',
    gallery: 'Gallery',
    faq: 'FAQ',
    pricing: 'Pricing',
    dataTable: 'Data Table',
    stats: 'Stats Counter',
    rector: 'Rector',
    organizationStructure: 'Organization Structure',
    carousel: 'Carousel',
    recentPosts: 'Recent Posts',
    categoryList: 'Category List',
    tagList: 'Tag List',
    postBody: 'Post Body Placeholder',
    navigationMenu: 'Navigation Menu',
    tabs: 'Tabs',
  };

  // Hero Section Form
  const heroForm = useForm<HeroSectionFormData>({
    resolver: zodResolver(heroSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      subheadline: (initialData as any)?.subheadline || { en: '', mm: '' },
      backgroundImage: (initialData as any)?.backgroundImage || '',
      backgroundVideo: (initialData as any)?.backgroundVideo || '',
      overlay: (initialData as any)?.overlay || {
        enabled: false,
        color: '#000000',
        opacity: 0.5,
      },
      textAlignment: (initialData as any)?.textAlignment || 'center',
      height: (initialData as any)?.height || 'medium',
      buttons: (initialData as any)?.buttons || [],
      spacing: (initialData as any)?.spacing || {
        paddingTop: 'none',
        paddingBottom: 'none',
        paddingLeft: 'none',
        paddingRight: 'none',
        marginTop: 'none',
        marginBottom: 'none',
      },
      containerSettings: (initialData as any)?.containerSettings || {
        width: 'contained',
      },
      responsiveSettings: (initialData as any)?.responsiveSettings || {
        hideOnMobile: false,
        hideOnTablet: false,
        hideOnDesktop: false,
      },
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });

  const watchedHeroData = heroForm.watch();

  // FAQ Section Form
  const faqForm = useForm<FaqSectionFormData>({
    resolver: zodResolver(faqSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      description: (initialData as any)?.description || { en: '', mm: '' },
      faqs: (initialData as any)?.faqs || (initialData as any)?.items || [],
      layout: (initialData as any)?.layout || 'accordion',
      allowMultipleOpen: (initialData as any)?.allowMultipleOpen ?? false,
      // Show-headline / show-description default to `true` so existing
      // FAQ docs (saved before these flags existed) keep rendering
      // their headline + description on the public site.
      showHeadline: (initialData as any)?.showHeadline ?? true,
      showDescription: (initialData as any)?.showDescription ?? true,
      showCategories: (initialData as any)?.showCategories ?? false,
      searchable: (initialData as any)?.searchable ?? true,
      spacing: (initialData as any)?.spacing || {
        paddingTop: 'none',
        paddingBottom: 'none',
        paddingLeft: 'none',
        paddingRight: 'none',
        marginTop: 'none',
        marginBottom: 'none',
      },
      containerSettings: (initialData as any)?.containerSettings || {
        width: 'contained',
      },
      responsiveSettings: (initialData as any)?.responsiveSettings || {
        hideOnMobile: false,
        hideOnTablet: false,
        hideOnDesktop: false,
      },
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });

  const watchedFaqData = faqForm.watch();

  // Feature List Section Form
  const featureListForm = useForm<FeatureListSectionFormData>({
    resolver: zodResolver(featureListSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      headlineIcon: (initialData as any)?.headlineIcon || undefined,
      headlineIconColor: (initialData as any)?.headlineIconColor || undefined,
      headlineIconSize: (initialData as any)?.headlineIconSize || undefined,
      headlineAlign: (initialData as any)?.headlineAlign || 'center',
      description: (initialData as any)?.description || { en: '', mm: '' },
      features: (initialData as any)?.features || [],
      layout: (initialData as any)?.layout || 'grid',
      // `columns` lives as a STRING enum in the Zod form schema
      // (`'1'|'2'|'3'|'4'`) but the backend Mongoose schema's
      // `enum: [1, 2, 3, 4]` casts the value to a NUMBER on save. When
      // editing an existing section the API returns `columns: 4` (number)
      // and the Select can't match it against its string SelectItem
      // values, so the field renders empty. Coerce to string here so the
      // round-trip stays lossless.
      columns: (String((initialData as any)?.columns ?? '3') as '1' | '2' | '3' | '4'),
      showIcons: (initialData as any)?.showIcons ?? true,
      showImages: (initialData as any)?.showImages ?? true,
      contentAlign: (initialData as any)?.contentAlign || 'left',
      textColors: (initialData as any)?.textColors || undefined,
      headlineSize: (initialData as any)?.headlineSize || undefined,
      descriptionSize: (initialData as any)?.descriptionSize || undefined,
      spacing: (initialData as any)?.spacing || {
        paddingTop: 'none',
        paddingBottom: 'none',
        paddingLeft: 'none',
        paddingRight: 'none',
        marginTop: 'none',
        marginBottom: 'none',
      },
      containerSettings: (initialData as any)?.containerSettings || {
        width: 'contained',
      },
      responsiveSettings: (initialData as any)?.responsiveSettings || {
        hideOnMobile: false,
        hideOnTablet: false,
        hideOnDesktop: false,
      },
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });

  const watchedFeatureListData = featureListForm.watch();

  // ───────── CTA Section Form
  const ctaForm = useForm<CtaSectionFormData>({
    resolver: zodResolver(ctaSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      description: (initialData as any)?.description || { en: '', mm: '' },
      buttons:
        (initialData as any)?.buttons ?? [
          {
            text: { en: '', mm: '' },
            url: '',
            style: 'primary',
            openInNewTab: false,
          },
        ],
      alignment: (initialData as any)?.alignment || 'center',
      backgroundImage: (initialData as any)?.backgroundImage || '',
      backgroundColor: (initialData as any)?.backgroundColor || '',
      textColor: (initialData as any)?.textColor || '',
      spacing: (initialData as any)?.spacing,
      containerSettings: (initialData as any)?.containerSettings || {
        width: 'contained',
      },
      responsiveSettings: (initialData as any)?.responsiveSettings,
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });
  const watchedCtaData = ctaForm.watch();

  // ───────── Testimonials Section Form
  // Author `name` and `title` were single-string until 2026-05-06.
  // Legacy docs may carry plain strings; wrap them as MultiLanguageText
  // before handing to react-hook-form so the new EN/MM tabs render
  // existing data without throwing zod errors on load.
  const normalizeTestimonials = (raw: any[]): any[] => {
    if (!Array.isArray(raw)) return raw;
    return raw.map((t) => ({
      ...t,
      author: {
        ...(t?.author ?? {}),
        name:
          typeof t?.author?.name === 'string'
            ? { en: t.author.name, mm: '' }
            : t?.author?.name ?? { en: '', mm: '' },
        title:
          typeof t?.author?.title === 'string'
            ? { en: t.author.title, mm: '' }
            : t?.author?.title,
      },
    }));
  };

  const testimonialsForm = useForm<TestimonialsSectionFormData>({
    resolver: zodResolver(testimonialsSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      description: (initialData as any)?.description || { en: '', mm: '' },
      testimonials: (initialData as any)?.testimonials
        ? normalizeTestimonials((initialData as any).testimonials)
        : [
            {
              quote: { en: '', mm: '' },
              author: { name: { en: '', mm: '' } },
            },
          ],
      layout: (initialData as any)?.layout || 'grid',
      showRatings: (initialData as any)?.showRatings ?? true,
      showAvatars: (initialData as any)?.showAvatars ?? true,
      autoplay: (initialData as any)?.autoplay,
      autoplaySpeed: (initialData as any)?.autoplaySpeed,
      spacing: (initialData as any)?.spacing,
      containerSettings: (initialData as any)?.containerSettings || {
        width: 'contained',
      },
      responsiveSettings: (initialData as any)?.responsiveSettings,
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });
  const watchedTestimonialsData = testimonialsForm.watch();

  // ───────── Gallery Section Form
  const galleryForm = useForm<GallerySectionFormData>({
    resolver: zodResolver(gallerySectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      description: (initialData as any)?.description || { en: '', mm: '' },
      images: (initialData as any)?.images ?? [],
      layout: (initialData as any)?.layout || 'grid',
      columns: (initialData as any)?.columns ?? 3,
      showCaptions: (initialData as any)?.showCaptions ?? true,
      lightbox: (initialData as any)?.lightbox ?? true,
      aspectRatio: (initialData as any)?.aspectRatio || 'auto',
      spacing: (initialData as any)?.spacing,
      containerSettings: (initialData as any)?.containerSettings || {
        width: 'contained',
      },
      responsiveSettings: (initialData as any)?.responsiveSettings,
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });
  const watchedGalleryData = galleryForm.watch();

  // ───────── Content with Image Section Form
  const contentWithImageForm = useForm<ContentWithImageSectionFormData>({
    resolver: zodResolver(contentWithImageSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      content: (initialData as any)?.content || { en: '', mm: '' },
      image: (initialData as any)?.image || '',
      imageAlt: (initialData as any)?.imageAlt || { en: '', mm: '' },
      imagePosition: (initialData as any)?.imagePosition || 'right',
      imageRatio: (initialData as any)?.imageRatio || 'landscape',
      contentAlignment: (initialData as any)?.contentAlignment || 'left',
      button: (initialData as any)?.button,
      spacing: (initialData as any)?.spacing,
      containerSettings: (initialData as any)?.containerSettings || {
        width: 'contained',
      },
      responsiveSettings: (initialData as any)?.responsiveSettings,
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });
  const watchedContentWithImageData = contentWithImageForm.watch();

  // ───────── Pricing Section Form
  const pricingForm = useForm<PricingSectionFormData>({
    resolver: zodResolver(pricingSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      description: (initialData as any)?.description || { en: '', mm: '' },
      plans:
        (initialData as any)?.plans ?? [
          {
            name: { en: '', mm: '' },
            price: { amount: 0, currency: 'USD', period: 'month' },
            features: [],
            button: {
              text: { en: 'Get Started', mm: '' },
              url: '',
              style: 'primary',
            },
            popular: false,
          },
        ],
      billing: (initialData as any)?.billing || 'both',
      layout: (initialData as any)?.layout || 'cards',
      showComparison: (initialData as any)?.showComparison ?? false,
      spacing: (initialData as any)?.spacing,
      containerSettings: (initialData as any)?.containerSettings || {
        width: 'contained',
      },
      responsiveSettings: (initialData as any)?.responsiveSettings,
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });
  const watchedPricingData = pricingForm.watch();

  // ───────── Data Table Section Form
  const dataTableForm = useForm<DataTableSectionFormData>({
    resolver: zodResolver(dataTableSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      description: (initialData as any)?.description || { en: '', mm: '' },
      caption: (initialData as any)?.caption || { en: '', mm: '' },
      table: (initialData as any)?.table ?? {
        columns: [
          {
            key: 'col_1',
            label: { en: 'Column 1', mm: '' },
            type: 'text',
            sortable: true,
            filterable: true,
          },
        ],
        rows: [],
      },
      features: (initialData as any)?.features ?? {
        search: true,
        sort: true,
        filter: true,
        pagination: true,
        export: false,
      },
      styling: (initialData as any)?.styling ?? {
        striped: true,
        bordered: true,
        hover: true,
        compact: false,
      },
      rowsPerPage: (initialData as any)?.rowsPerPage ?? 10,
      spacing: (initialData as any)?.spacing,
      containerSettings: (initialData as any)?.containerSettings || {
        width: 'contained',
      },
      responsiveSettings: (initialData as any)?.responsiveSettings,
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });
  const watchedDataTableData = dataTableForm.watch();

  // ───────── Stats Counter Section Form
  const statsForm = useForm<StatsSectionFormData>({
    resolver: zodResolver(statsSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      description: (initialData as any)?.description || { en: '', mm: '' },
      counters:
        (initialData as any)?.counters ?? [
          {
            title: { en: '', mm: '' },
            description: { en: '', mm: '' },
            icon: 'Users',
            iconColor: '#ffffff',
            count: '0',
            bgColor: '#3182ce',
            textColor: '#ffffff',
          },
        ],
      layout: (initialData as any)?.layout || 'grid',
      columns: (initialData as any)?.columns ?? 4,
      spacing: (initialData as any)?.spacing,
      containerSettings: (initialData as any)?.containerSettings || {
        width: 'contained',
      },
      responsiveSettings: (initialData as any)?.responsiveSettings,
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });
  const watchedStatsData = statsForm.watch();

  // ───────── Carousel Section Form
  const carouselForm = useForm<CarouselSectionFormData>({
    resolver: zodResolver(carouselSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      slides:
        (initialData as any)?.slides ?? [
          {
            id: 'slide-1',
            backgroundImage: '',
            backgroundVideo: '',
            overlay: { enabled: false, color: '#000000', opacity: 0.4 },
            image: '',
            title: { en: '', mm: '' },
            subtitle: { en: '', mm: '' },
            description: { en: '', mm: '' },
            buttons: [],
            layout: 'centered',
            contentStyle: 'flat',
            textAlignment: 'center',
          },
        ],
      autoplay: (initialData as any)?.autoplay ?? true,
      autoplaySpeed: (initialData as any)?.autoplaySpeed ?? 8000,
      showDots: (initialData as any)?.showDots ?? true,
      showArrows: (initialData as any)?.showArrows ?? true,
      transitionEffect: (initialData as any)?.transitionEffect ?? 'fade',
      transitionDuration: (initialData as any)?.transitionDuration ?? 600,
      height: (initialData as any)?.height ?? 'large',
      spacing: (initialData as any)?.spacing,
      containerSettings: (initialData as any)?.containerSettings || {
        width: 'fullWidth',
      },
      responsiveSettings: (initialData as any)?.responsiveSettings,
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });
  const watchedCarouselData = carouselForm.watch();

  // ───────── Recent Posts Section Form (dynamic widget — stores query +
  // display config; the publicWeb renderer fetches matching posts).
  const recentPostsForm = useForm<RecentPostsSectionFormData>({
    resolver: zodResolver(recentPostsSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      headlineIcon: (initialData as any)?.headlineIcon || '',
      subheadline: (initialData as any)?.subheadline || { en: '', mm: '' },
      viewAllLabel: (initialData as any)?.viewAllLabel || { en: '', mm: '' },
      viewAllUrl: (initialData as any)?.viewAllUrl || '',
      query: (initialData as any)?.query || {
        postTypeSlug: null,
        categoryIds: [],
        tagIds: [],
        featuredOnly: false,
        limit: 6,
        sort: 'latest',
      },
      layout: (initialData as any)?.layout || 'grid',
      columns: (initialData as any)?.columns ?? 3,
      showImage: (initialData as any)?.showImage ?? true,
      showExcerpt: (initialData as any)?.showExcerpt ?? true,
      showDate: (initialData as any)?.showDate ?? true,
      showAuthor: (initialData as any)?.showAuthor ?? false,
      showCategory: (initialData as any)?.showCategory ?? true,
      enablePaging: (initialData as any)?.enablePaging ?? false,
      spacing: (initialData as any)?.spacing,
      containerSettings: (initialData as any)?.containerSettings || {
        width: 'contained',
      },
      responsiveSettings: (initialData as any)?.responsiveSettings,
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });
  const watchedRecentPostsData = recentPostsForm.watch();

  // ── Watched form data is read here so the preview branch below
  //    can re-render live as the author edits. Earlier this was only
  //    set for the existing section types — without it the new
  //    sidebar widgets would render against undefined.
  // ───────── CategoryList Section Form ─────────────────────────────
  const categoryListForm = useForm<CategoryListSectionFormData>({
    resolver: zodResolver(categoryListSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      displayMode: (initialData as any)?.displayMode || 'list',
      categoryIds: (initialData as any)?.categoryIds || [],
      showCount: (initialData as any)?.showCount ?? true,
      limit: (initialData as any)?.limit ?? 0,
      viewAllUrl: (initialData as any)?.viewAllUrl || '',
      viewAllLabel: (initialData as any)?.viewAllLabel || { en: '', mm: '' },
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });

  // ───────── TagList Section Form ──────────────────────────────────
  const tagListForm = useForm<TagListSectionFormData>({
    resolver: zodResolver(tagListSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      displayMode: (initialData as any)?.displayMode || 'cloud',
      tagIds: (initialData as any)?.tagIds || [],
      showCount: (initialData as any)?.showCount ?? true,
      limit: (initialData as any)?.limit ?? 30,
      sort: (initialData as any)?.sort || 'popular',
      viewAllUrl: (initialData as any)?.viewAllUrl || '',
      viewAllLabel: (initialData as any)?.viewAllLabel || { en: '', mm: '' },
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? false,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });

  // Live form-watch for sidebar-widget previews. `useForm.watch()`
  // returns a snapshot that re-renders the consuming component as
  // fields change — feeding the preview pane.
  const watchedCategoryListData = categoryListForm.watch();
  const watchedTagListData = tagListForm.watch();

  // ───────── PostBody Section Form ────────────────────────────────
  const postBodyForm = useForm<PostBodySectionFormData>({
    resolver: zodResolver(postBodySectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || 'Post Body',
      title: (initialData as any)?.title || { en: '', mm: '' },
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? true,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });
  const watchedPostBodyData = postBodyForm.watch();

  // Navigation Menu form — references a Navigation tree by `menuType`.
  const navigationMenuForm = useForm<NavigationMenuSectionFormData>({
    resolver: zodResolver(navigationMenuSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      menuType: (initialData as any)?.menuType || 'sidebar',
      displayMode: (initialData as any)?.displayMode || 'tree',
      showIcons: (initialData as any)?.showIcons ?? false,
      expandActive: (initialData as any)?.expandActive ?? true,
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? true,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });
  const watchedNavigationMenuData = navigationMenuForm.watch();

  // Tabs form.
  const tabsForm = useForm<TabsSectionFormData>({
    resolver: zodResolver(tabsSectionSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      headline: (initialData as any)?.headline || { en: '', mm: '' },
      description: (initialData as any)?.description || { en: '', mm: '' },
      showHeadline: (initialData as any)?.showHeadline ?? true,
      showDescription: (initialData as any)?.showDescription ?? true,
      items: (initialData as any)?.items || [],
      orientation: (initialData as any)?.orientation || 'horizontal',
      defaultIndex: (initialData as any)?.defaultIndex ?? 0,
      // Spacing / container / responsive — same shape the FAQ form
      // seeds. Defaults to `none` on each axis so existing Tabs docs
      // saved BEFORE this change open with the dropdowns at None
      // rather than empty, and the public renderer keeps using its
      // hardcoded `py-12` (since `hasAnySpacing` stays false when
      // every axis is the `none` token).
      spacing: (initialData as any)?.spacing || {
        paddingTop: 'none',
        paddingBottom: 'none',
        paddingLeft: 'none',
        paddingRight: 'none',
        marginTop: 'none',
        marginBottom: 'none',
      },
      containerSettings: (initialData as any)?.containerSettings || {
        width: 'contained',
      },
      responsiveSettings: (initialData as any)?.responsiveSettings || {
        hideOnMobile: false,
        hideOnTablet: false,
        hideOnDesktop: false,
      },
      isVisible: (initialData as any)?.isVisible ?? true,
      isReusable: (initialData as any)?.isReusable ?? true,
      status: (initialData as any)?.status || 'Active',
      order: (initialData as any)?.order || 0,
    },
  });
  const watchedTabsData = tabsForm.watch();

  // ───────── Draft persistence (localStorage) ───────────────────────
  // Pick the form matching the active section type. All other forms
  // are dormant — we don't persist their (untouched) defaults.
  // Keyed by section id when editing, by `<type>::new` when creating.
  // Survives accidental browser-tab close, refresh, navigation away.
  const draftKey = useMemo(
    () => buildDraftKey(sectionType, initialData?._id),
    [sectionType, initialData?._id],
  );

  const activeForm = useMemo<UseFormReturn<FieldValues>>(() => {
    // Per-type forms have narrow generic params; collapse to the
    // structural FieldValues shape the persistence hook expects.
    // Casting via `unknown` because TS rightly flags the direct cast
    // (each form's data type doesn't structurally overlap with
    // FieldValues' index signature).
    const pick = (() => {
      switch (sectionType) {
        case 'hero': return heroForm;
        case 'faq': return faqForm;
        case 'featureList': return featureListForm;
        case 'cta': return ctaForm;
        case 'testimonials': return testimonialsForm;
        case 'gallery': return galleryForm;
        case 'contentWithImage': return contentWithImageForm;
        case 'pricing': return pricingForm;
        case 'dataTable': return dataTableForm;
        case 'stats': return statsForm;
        case 'carousel': return carouselForm;
        case 'recentPosts': return recentPostsForm;
        case 'categoryList': return categoryListForm;
        case 'tagList': return tagListForm;
        case 'postBody': return postBodyForm;
        case 'navigationMenu': return navigationMenuForm;
        case 'tabs': return tabsForm;
        default: return heroForm;
      }
    })();
    return pick as unknown as UseFormReturn<FieldValues>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionType]);

  useSectionDraftPersistence(activeForm, draftKey);

  // Restore prompt — runs once per (key) on mount. The prompt is shown
  // only when a draft is actually present; the user picks Restore (apply
  // to the active form) or Discard (clear and start clean).
  const [pendingDraft, setPendingDraft] = useState<DraftEntry | null>(null);
  useEffect(() => {
    const draft = loadDraft(draftKey);
    if (draft) setPendingDraft(draft);
  }, [draftKey]);

  const handleRestoreDraft = () => {
    if (pendingDraft) {
      activeForm.reset(pendingDraft.values as FieldValues);
    }
    setPendingDraft(null);
  };

  const handleDiscardDraft = () => {
    clearDraft(draftKey);
    setPendingDraft(null);
  };

  // Generic submit handler — every section save flows through the same
  // create-or-update path; only the field shape differs. Keeps the
  // per-type submit functions as 1-line wrappers.
  const submitSection = (data: any) => {
    startTransition(async () => {
      try {
        // The base Section schema requires a multilingual `title`,
        // but compact section editors (categoryList / tagList sidebar
        // widgets) don't always expose a title input — they rely on
        // the internal `name` doubling as the title. If title arrives
        // empty, seed it from `name` here so the request body always
        // carries something Mongoose accepts.
        const titleEn = (data?.title?.en || '').trim();
        const titleMm = (data?.title?.mm || '').trim();
        const seededTitle =
          !titleEn && !titleMm && data?.name
            ? { en: data.name, mm: data.name }
            : data.title;
        const sectionData = {
          ...data,
          title: seededTitle,
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
          // Successful save — drop the local draft so the next visit
          // doesn't offer to restore stale state.
          clearDraft(draftKey);
          toastSuccess(
            mode === 'create'
              ? 'Section created successfully'
              : 'Section updated successfully',
          );
          onSuccess();
        } else {
          toastError(result.error || 'Failed to save section');
        }
      } catch (error) {
        console.error('Section save error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  const handleCtaSubmit = (data: CtaSectionFormData) => submitSection(data);
  const handleTestimonialsSubmit = (data: TestimonialsSectionFormData) =>
    submitSection(data);
  const handleGallerySubmit = (data: GallerySectionFormData) =>
    submitSection(data);
  const handleContentWithImageSubmit = (
    data: ContentWithImageSectionFormData,
  ) => submitSection(data);
  const handlePricingSubmit = (data: PricingSectionFormData) =>
    submitSection(data);
  const handleDataTableSubmit = (data: DataTableSectionFormData) =>
    submitSection(data);
  const handleStatsSubmit = (data: StatsSectionFormData) =>
    submitSection(data);
  const handleCarouselSubmit = (data: CarouselSectionFormData) =>
    submitSection(data);
  const handleRecentPostsSubmit = (data: RecentPostsSectionFormData) =>
    submitSection(data);
  const handleCategoryListSubmit = (data: CategoryListSectionFormData) =>
    submitSection(data);
  const handleTagListSubmit = (data: TagListSectionFormData) =>
    submitSection(data);
  const handlePostBodySubmit = (data: PostBodySectionFormData) =>
    submitSection(data);
  const handleNavigationMenuSubmit = (data: NavigationMenuSectionFormData) =>
    submitSection(data);
  const handleTabsSubmit = (data: TabsSectionFormData) =>
    submitSection(data);

  const handleHeroSubmit = (data: HeroSectionFormData) => {
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
          clearDraft(draftKey);
          toastSuccess(
            mode === 'create'
              ? 'Section created successfully'
              : 'Section updated successfully'
          );
          onSuccess();
        } else {
          toastError(result.error || 'Failed to save section');
        }
      } catch (error) {
        console.error('Section save error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  const handleFaqSubmit = (data: FaqSectionFormData) => {
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
          clearDraft(draftKey);
          toastSuccess(
            mode === 'create'
              ? 'Section created successfully'
              : 'Section updated successfully'
          );
          onSuccess();
        } else {
          toastError(result.error || 'Failed to save section');
        }
      } catch (error) {
        console.error('Section save error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  const handleFeatureListSubmit = (data: FeatureListSectionFormData) => {
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
          clearDraft(draftKey);
          toastSuccess(
            mode === 'create'
              ? 'Section created successfully'
              : 'Section updated successfully'
          );
          onSuccess();
        } else {
          toastError(result.error || 'Failed to save section');
        }
      } catch (error) {
        console.error('Section save error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Walks the react-hook-form errors object and returns dotted paths
  // of every field with a validation message. Nested fields like
  // `features.0.title.en` are surfaced as-is so the user can locate
  // the offending field.
  const flattenFieldErrors = (errors: any, prefix = ''): string[] => {
    const out: string[] = [];
    for (const key of Object.keys(errors || {})) {
      const val = errors[key];
      if (!val) continue;
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof val === 'object' && 'message' in val && val.message) {
        out.push(path);
      } else if (typeof val === 'object') {
        out.push(...flattenFieldErrors(val, path));
      }
    }
    return out;
  };

  // Shared invalid-form handler — without this, react-hook-form silently
  // refuses to submit when zod validation fails and the user has no
  // signal that anything went wrong (the field-level messages are
  // hidden under collapsed accordions / unfocused tabs).
  const notifyInvalid = (errors: any) => {
    const paths = flattenFieldErrors(errors).slice(0, 3);
    const more = flattenFieldErrors(errors).length - paths.length;
    const list = paths.length
      ? paths.join(', ') + (more > 0 ? ` (+${more} more)` : '')
      : 'required fields';
    toastError(`Please fix: ${list}`);
  };

  // Promote save action to the top header — the active form's submit
  // handler is dispatched based on the current section type. Each
  // form's internal Save button still works (redundant safety) but
  // authors no longer need to scroll to find it.
  const triggerSave = () => {
    switch (sectionType) {
      case 'hero':
        heroForm.handleSubmit(handleHeroSubmit, notifyInvalid)();
        break;
      case 'faq':
        faqForm.handleSubmit(handleFaqSubmit, notifyInvalid)();
        break;
      case 'featureList':
        featureListForm.handleSubmit(handleFeatureListSubmit, notifyInvalid)();
        break;
      case 'cta':
        ctaForm.handleSubmit(handleCtaSubmit, notifyInvalid)();
        break;
      case 'testimonials':
        testimonialsForm.handleSubmit(handleTestimonialsSubmit, notifyInvalid)();
        break;
      case 'gallery':
        galleryForm.handleSubmit(handleGallerySubmit, notifyInvalid)();
        break;
      case 'contentWithImage':
        contentWithImageForm.handleSubmit(handleContentWithImageSubmit, notifyInvalid)();
        break;
      case 'pricing':
        pricingForm.handleSubmit(handlePricingSubmit, notifyInvalid)();
        break;
      case 'dataTable':
        dataTableForm.handleSubmit(handleDataTableSubmit, notifyInvalid)();
        break;
      case 'stats':
        statsForm.handleSubmit(handleStatsSubmit, notifyInvalid)();
        break;
      case 'carousel':
        carouselForm.handleSubmit(handleCarouselSubmit, notifyInvalid)();
        break;
      case 'recentPosts':
        recentPostsForm.handleSubmit(handleRecentPostsSubmit, notifyInvalid)();
        break;
      case 'categoryList':
        categoryListForm.handleSubmit(
          handleCategoryListSubmit,
          notifyInvalid,
        )();
        break;
      case 'tagList':
        tagListForm.handleSubmit(handleTagListSubmit, notifyInvalid)();
        break;
      case 'postBody':
        postBodyForm.handleSubmit(handlePostBodySubmit, notifyInvalid)();
        break;
      case 'navigationMenu':
        navigationMenuForm.handleSubmit(
          handleNavigationMenuSubmit,
          notifyInvalid,
        )();
        break;
      case 'tabs':
        tabsForm.handleSubmit(handleTabsSubmit, notifyInvalid)();
        break;
      default:
        toastError('No editor available for this section type yet');
    }
  };

  // Cmd/Ctrl + S to save from anywhere in the editor
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        triggerSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionType]);

  return (
    <>
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton={false}
        // `!flex !flex-col` overrides shadcn DialogContent's default
        // `grid` layout — without this the inner `h-full` references
        // a circularly-sized grid row, breaking `overflow-y-auto` on
        // the editor sidebar (sidebar contents extend past the
        // viewport with no scrollbar).
        className="max-w-[100vw] h-[100vh] p-0 rounded-none !flex !flex-col gap-0"
        style={{
          top: 0,
          left: 0,
          transform: 'none',
          width: '100vw',
          height: '100vh',
          zIndex: 1050,
        }}
      >
        <div className="flex-1 min-h-0 flex flex-col">
          {/* ───────── Top Header Bar — Save now lives here, always visible
              regardless of editor scroll. Layout: section title (left) ·
              device + lang toggles (center-right) · Save + close (right). */}
          <div className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0 bg-background gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Layers className="h-5 w-5 text-muted-foreground shrink-0" />
              <h2 className="text-base md:text-lg font-semibold truncate">
                {mode === 'create' ? 'Create' : 'Edit'}{' '}
                {sectionTypeLabels[sectionType]}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Device Mode Selector */}
              <div className="hidden md:flex items-center gap-1 border rounded p-1">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                  className="h-7 px-2"
                  title="Desktop View"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('tablet')}
                  className="h-7 px-2"
                  title="Tablet View"
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                  className="h-7 px-2"
                  title="Mobile View"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>

              <Tabs
                value={previewLang}
                onValueChange={(v) => setPreviewLang(v as 'en' | 'mm')}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="en" className="text-xs px-3">
                    EN
                  </TabsTrigger>
                  <TabsTrigger value="mm" className="text-xs px-3">
                    MM
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Editor toggle — collapses the editor pane on narrow screens */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-9"
                title={sidebarOpen ? 'Hide editor' : 'Show editor'}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>

              {/* Save — the primary action. Cmd/Ctrl+S also triggers this. */}
              <Button
                size="sm"
                onClick={triggerSave}
                disabled={isPending}
                className="h-9"
                title="Save (Cmd/Ctrl+S)"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save section
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                title="Close editor"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* ───────── Body — split-pane: editor (left, fixed-ish width)
              + preview (right, fills rest). No more overlay; both panes
              are always visible side-by-side when sidebarOpen. */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Editor pane. Inner padding lives here (not on each
                section-type form) so every form gets a consistent
                gutter without each component re-declaring `p-*`.
                `pb-12` adds extra breathing room at the bottom so the
                last field doesn't sit flush against the bottom edge
                when the form scrolls. */}
            {sidebarOpen && (
              <aside
                className="w-full md:w-[420px] lg:w-[460px] xl:w-[500px] shrink-0 border-r bg-background overflow-y-auto px-5 py-4 pb-12"
                aria-label="Section editor"
              >
                {sectionType === 'hero' && (
                  <HeroSectionForm
                    form={heroForm}
                    onSubmit={handleHeroSubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'faq' && (
                  <FaqSectionForm
                    form={faqForm}
                    onSubmit={handleFaqSubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'featureList' && (
                  <FeatureListSectionForm
                    form={featureListForm}
                    onSubmit={handleFeatureListSubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'cta' && (
                  <CtaSectionForm
                    form={ctaForm}
                    onSubmit={handleCtaSubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'testimonials' && (
                  <TestimonialsSectionForm
                    form={testimonialsForm}
                    onSubmit={handleTestimonialsSubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'gallery' && (
                  <GallerySectionForm
                    form={galleryForm}
                    onSubmit={handleGallerySubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'contentWithImage' && (
                  <ContentWithImageSectionForm
                    form={contentWithImageForm}
                    onSubmit={handleContentWithImageSubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'pricing' && (
                  <PricingSectionForm
                    form={pricingForm}
                    onSubmit={handlePricingSubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'dataTable' && (
                  <DataTableSectionForm
                    form={dataTableForm}
                    onSubmit={handleDataTableSubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'stats' && (
                  <StatsSectionForm
                    form={statsForm}
                    onSubmit={handleStatsSubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'carousel' && (
                  <CarouselSectionForm
                    form={carouselForm}
                    onSubmit={handleCarouselSubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'recentPosts' && (
                  <RecentPostsSectionForm
                    form={recentPostsForm}
                    onSubmit={handleRecentPostsSubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'categoryList' && (
                  <CategoryListSectionForm
                    form={categoryListForm}
                    onSubmit={handleCategoryListSubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'tagList' && (
                  <TagListSectionForm
                    form={tagListForm}
                    onSubmit={handleTagListSubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'postBody' && (
                  <PostBodySectionForm
                    form={postBodyForm}
                    onSubmit={handlePostBodySubmit}
                    onCancel={onClose}
                    saving={isPending}
                    tenantId={tenantId}
                  />
                )}

                {sectionType === 'navigationMenu' && (
                  <NavigationMenuSectionForm
                    form={navigationMenuForm}
                    onSubmit={handleNavigationMenuSubmit}
                    onCancel={onClose}
                    saving={isPending}
                  />
                )}

                {sectionType === 'tabs' && (
                  <TabsSectionForm
                    form={tabsForm}
                    onSubmit={handleTabsSubmit}
                    onCancel={onClose}
                    saving={isPending}
                  />
                )}

                {![
                  'hero',
                  'faq',
                  'featureList',
                  'cta',
                  'testimonials',
                  'gallery',
                  'contentWithImage',
                  'pricing',
                  'dataTable',
                  'stats',
                  'carousel',
                  'recentPosts',
                  'categoryList',
                  'tagList',
                  'postBody',
                  'navigationMenu',
                  'tabs',
                ].includes(sectionType) && (
                  <div className="text-center text-muted-foreground py-6 px-4">
                    <p className="text-sm">
                      Editor for {sectionTypeLabels[sectionType]} not yet
                      implemented.
                    </p>
                  </div>
                )}
              </aside>
            )}

            {/* Preview pane */}
            <div className="flex-1 overflow-auto bg-muted/20">
              <div className="min-h-full flex items-start justify-center p-6 md:p-10">
                <div
                  className="transition-all duration-300 w-full"
                  style={{
                    width:
                      previewMode === 'mobile'
                        ? '375px'
                        : previewMode === 'tablet'
                          ? '768px'
                          : '100%',
                    maxWidth: previewMode === 'desktop' ? '1200px' : undefined,
                  }}
                >
                {sectionType === 'hero' && (
                  <HeroSectionPreview data={watchedHeroData} language={previewLang} />
                )}

                {sectionType === 'faq' && (
                  <FaqSectionPreview data={watchedFaqData} language={previewLang} />
                )}

                {sectionType === 'featureList' && (
                  <FeatureListSectionPreview data={watchedFeatureListData} language={previewLang} />
                )}

                {sectionType === 'cta' && (
                  <CtaSectionPreview data={watchedCtaData} language={previewLang} />
                )}

                {sectionType === 'testimonials' && (
                  <TestimonialsSectionPreview
                    data={watchedTestimonialsData}
                    language={previewLang}
                  />
                )}

                {sectionType === 'gallery' && (
                  <GallerySectionPreview
                    data={watchedGalleryData}
                    language={previewLang}
                  />
                )}

                {sectionType === 'contentWithImage' && (
                  <ContentWithImageSectionPreview
                    data={watchedContentWithImageData}
                    language={previewLang}
                  />
                )}

                {sectionType === 'pricing' && (
                  <PricingSectionPreview
                    data={watchedPricingData}
                    language={previewLang}
                  />
                )}

                {sectionType === 'dataTable' && (
                  <DataTableSectionPreview
                    data={watchedDataTableData}
                    language={previewLang}
                  />
                )}

                {sectionType === 'stats' && (
                  <StatsSectionPreview
                    data={watchedStatsData}
                    language={previewLang}
                  />
                )}

                {sectionType === 'carousel' && (
                  <CarouselSectionPreview
                    data={watchedCarouselData}
                    language={previewLang}
                  />
                )}

                {sectionType === 'recentPosts' && (
                  <RecentPostsSectionPreview
                    data={watchedRecentPostsData}
                    language={previewLang}
                  />
                )}

                {sectionType === 'categoryList' && (
                  <CategoryListSectionPreview
                    data={watchedCategoryListData}
                    language={previewLang}
                  />
                )}

                {sectionType === 'tagList' && (
                  <TagListSectionPreview
                    data={watchedTagListData}
                    language={previewLang}
                  />
                )}

                {sectionType === 'postBody' && (
                  <PostBodySectionPreview
                    data={watchedPostBodyData}
                    language={previewLang}
                  />
                )}

                {sectionType === 'tabs' && (
                  <TabsSectionPreview
                    data={watchedTabsData}
                    language={previewLang}
                  />
                )}

                {!['hero', 'faq', 'featureList', 'cta', 'testimonials', 'gallery', 'contentWithImage', 'pricing', 'dataTable', 'stats', 'carousel', 'recentPosts', 'categoryList', 'tagList', 'postBody', 'tabs'].includes(sectionType) && (
                  <div className="bg-background rounded shadow-lg border p-4">
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">Preview for {sectionTypeLabels[sectionType]} coming soon...</p>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      </Dialog>

      {/* Restore-draft prompt — kept OUTSIDE the parent <Dialog> tree
          and bumped to z-[1100]/z-[1110] (above the parent dialog's
          zIndex: 1050). Without this it renders behind the full-screen
          editor and Radix's modal lock disables pointer-events on the
          parent, making every form field appear frozen. */}
      <AlertDialog
        open={!!pendingDraft}
        onOpenChange={(open) => {
          if (!open) setPendingDraft(null);
        }}
      >
        <AlertDialogContent
          className="z-[1110]"
          style={{ zIndex: 1110 }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Restore unsaved draft?</AlertDialogTitle>
            <AlertDialogDescription>
              You left this {sectionTypeLabels[sectionType].toLowerCase()} editor
              with unsaved changes
              {pendingDraft
                ? ` ${formatRelativeTime(pendingDraft.savedAt)}`
                : ''}
              . Restore your draft, or discard it and start from the saved
              version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>
              Discard draft
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreDraft}>
              Restore draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
