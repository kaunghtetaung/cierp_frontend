/**
 * CMS Zod Schemas - Central Export
 * Validation schemas for all CMS forms
 */

// Common schemas
export {
  multiLanguageTextSchema,
  multiLanguageTextEnRequiredSchema,
  optionalMultiLanguageTextSchema,
  slugSchema,
  seoMetaSchema,
  fullSeoMetaSchema,
  layoutSchema,
  optionalEmailSchema,
  sectionButtonSchema,
  type MultiLanguageTextFormData,
  type SeoMetaFormData,
  type FullSeoMetaFormData,
  type LayoutFormData,
  type SectionButtonFormData,
} from './common.schema';

// Category schemas
export {
  createCategorySchema,
  updateCategorySchema,
  moveCategorySchema,
  reorderCategoriesSchema,
  categoryQuerySchema,
  type CreateCategoryFormData,
  type UpdateCategoryFormData,
  type MoveCategoryFormData,
  type ReorderCategoriesFormData,
  type CategoryQueryFormData,
} from './category.schema';

// Tag schemas
export {
  createTagSchema,
  updateTagSchema,
  mergeTagsSchema,
  tagQuerySchema,
  type CreateTagFormData,
  type UpdateTagFormData,
  type MergeTagsFormData,
  type TagQueryFormData,
} from './tag.schema';

// Post Type schemas
export {
  attributeValidationSchema,
  attributeOptionSchema,
  attributeDefinitionSchema,
  createPostTypeSchema,
  updatePostTypeSchema,
  addAttributeSchema,
  updateAttributeSchema,
  removeAttributeSchema,
  reorderAttributesSchema,
  postTypeQuerySchema,
  type AttributeValidationFormData,
  type AttributeOptionFormData,
  type AttributeDefinitionFormData,
  type CreatePostTypeFormData,
  type UpdatePostTypeFormData,
  type AddAttributeFormData,
  type UpdateAttributeFormData,
  type RemoveAttributeFormData,
  type ReorderAttributesFormData,
  type PostTypeQueryFormData,
} from './post-type.schema';

// Post schemas
export {
  createPostSchema,
  updatePostSchema,
  postQuerySchema,
  postSearchSchema,
  schedulePostSchema,
  bulkPostOperationSchema,
  type CreatePostFormData,
  type UpdatePostFormData,
  type PostQueryFormData,
  type PostSearchFormData,
  type SchedulePostFormData,
  type BulkPostOperationFormData,
} from './post.schema';

// Page schemas
export {
  createPageSchema,
  updatePageSchema,
  movePageSchema,
  reorderPagesSchema,
  duplicatePageSchema,
  addSectionToPageSchema,
  reorderPageSectionsSchema,
  pageQuerySchema,
  bulkPageOperationSchema,
  type CreatePageFormData,
  type UpdatePageFormData,
  type MovePageFormData,
  type ReorderPagesFormData,
  type DuplicatePageFormData,
  type AddSectionToPageFormData,
  type ReorderPageSectionsFormData,
  type PageQueryFormData,
  type BulkPageOperationFormData,
} from './page.schema';

// Section schemas
export {
  heroSectionSchema,
  featureListSectionSchema,
  contentWithImageSectionSchema,
  ctaSectionSchema,
  testimonialsSectionSchema,
  gallerySectionSchema,
  faqSectionSchema,
  pricingSectionSchema,
  sectionSchema,
  sectionQuerySchema,
  type HeroSectionFormData,
  type FeatureListSectionFormData,
  type ContentWithImageSectionFormData,
  type CtaSectionFormData,
  type TestimonialsSectionFormData,
  type GallerySectionFormData,
  type FaqSectionFormData,
  type PricingSectionFormData,
  type SectionFormData,
  type SectionQueryFormData,
} from './section.schema';

// Navigation schemas
export {
  createNavigationSchema,
  updateNavigationSchema,
  reorderNavigationSchema,
  moveNavigationSchema,
  bulkNavigationOperationSchema,
  navigationQuerySchema,
  type CreateNavigationFormData,
  type UpdateNavigationFormData,
  type ReorderNavigationFormData,
  type MoveNavigationFormData,
  type BulkNavigationOperationFormData,
  type NavigationQueryFormData,
} from './navigation.schema';

// Settings schemas
export {
  headerSettingsSchema,
  socialLinkSchema,
  footerColumnLinkSchema,
  footerColumnSchema,
  contactInfoSchema,
  footerSettingsSchema,
  updateSettingsSchema,
  generalSettingsSchema,
  seoSettingsSchema,
  type HeaderSettingsFormData,
  type SocialLinkFormData,
  type FooterColumnFormData,
  type ContactInfoFormData,
  type FooterSettingsFormData,
  type UpdateSettingsFormData,
  type GeneralSettingsFormData,
  type SeoSettingsFormData,
} from './settings.schema';

// Template schemas
export {
  templateBaseSchema,
  createTemplateSchema,
  updateTemplateSchema,
  templateQuerySchema,
  type CreateTemplateFormData,
  type UpdateTemplateFormData,
  type TemplateQueryFormData,
} from './template.schema';
