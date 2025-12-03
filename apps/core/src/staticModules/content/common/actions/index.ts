/**
 * CMS Server Actions - Central Export
 */

// Category actions
export {
  createCategory,
  getCategories,
  getCategoryTree,
  getCategoryById,
  updateCategory,
  deleteCategory,
  moveCategory,
  reorderCategories,
  restoreCategory,
} from './category.actions';

// Tag actions
export {
  createTag,
  getTags,
  getTagById,
  updateTag,
  deleteTag,
  autocompleteTags,
  getPopularTags,
  mergeTags,
  restoreTag,
} from './tag.actions';

// Post actions
export {
  createPost,
  getPosts,
  getPostById,
  getPostBySlug,
  updatePost,
  deletePost,
  publishPost,
  unpublishPost,
  schedulePost,
  archivePost,
  searchPosts,
  getRelatedPosts,
  getPostStatistics,
  getPostRevisions,
  restorePostRevision,
  bulkPostOperation,
  restorePost,
} from './post.actions';

// Page actions
export {
  createPage,
  getPages,
  getPageById,
  getPageBySlug,
  updatePage,
  deletePage,
  publishPage,
  unpublishPage,
  movePage,
  reorderPages,
  duplicatePage,
  addSectionToPage,
  removeSectionFromPage,
  reorderPageSections,
  getPageRevisions,
  getPageStatistics,
  bulkPageOperation,
  restorePage,
  setPageAsHomePage,
} from './page.actions';

// Section actions
export {
  createSection,
  getSections,
  getReusableSections,
  getSectionById,
  updateSection,
  deleteSection,
  findSectionsByIds,
  duplicateSection,
  toggleSectionVisibility,
  restoreSection,
  getSectionsByType,
} from './section.actions';

// Navigation actions
export {
  createNavigationItem,
  getNavigationItems,
  getMenuTree,
  getFilteredMenuTree,
  getNavigationItemById,
  updateNavigationItem,
  deleteNavigationItem,
  reorderNavigationItems,
  moveNavigationItem,
  bulkNavigationOperation,
  restoreNavigationItem,
  getNavigationFlatList,
} from './navigation.actions';

// Settings actions
export {
  getSettings,
  getPublicSettings,
  initializeSettings,
  updateSettings,
  updateTheme,
  updateLayout,
  updateHeaderSettings,
  updateFooterSettings,
  updateSeoSettings,
  updateLanguageSettings,
  setHomePage,
  toggleHeaderMenu,
  toggleFooterMenu,
} from './settings.actions';

// Post Type actions
export {
  createPostType,
  getPostTypes,
  getPostTypeById,
  getPostTypeBySlug,
  updatePostType,
  deletePostType,
  addPostTypeAttribute,
  updatePostTypeAttribute,
  removePostTypeAttribute,
  reorderPostTypeAttributes,
  restorePostType,
} from './post-type.actions';
