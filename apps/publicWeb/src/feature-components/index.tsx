// Main components library export
// Centralized export for all reusable logic components

// Language Selector
export { default as LangSelectorWrapper } from './lang-selector';
export { 
  LangSelectorProvider, 
  useLangSelector,
  DEFAULT_LANGUAGES,
  getLanguageByCode,
  getBrowserLanguage
} from './lang-selector';
export type { 
  Language, 
  LangSelectorContextValue,
  LangSelectorWrapperProps,
  LangSelectorUIProps 
} from './lang-selector';

// User Menu
export { default as UserMenu } from './user-menu';
export { 
  UserMenuProvider,
  useUserMenu,
  UserAvatar,
  SignInButton,
  UserDropdown
} from './user-menu';
export type {
  User,
  UserMenuContextValue,
  UserMenuProps,
  UserAvatarProps,
  SignInButtonProps,
  UserDropdownProps
} from './user-menu';

// Search
export { default as SearchWrapper } from './search';
export { 
  SearchProvider,
  useSearch,
  SearchBox
} from './search';
export type {
  SearchResult,
  SearchContextValue,
  SearchBoxProps,
  SearchWrapperProps
} from './search';

// Icons
export { default as IconComponent } from './icons';
export {
  IconComponent as Icon,
  IconSelector,
  SmallIcon,
  MediumIcon,
  LargeIcon,
  ThemedIcon,
  ICON_CATEGORIES,
  ICON_REGISTRY,
  ALL_ICONS,
  getIconComponent,
  isValidIcon,
  getIconsByCategory,
  searchIcons,
  getIconInfo
} from './icons';
export type {
  IconComponentProps,
  IconSelectorProps,
  IconCategory,
  IconName,
  IconInfo,
  IconSearchResult,
  IconCategoryInfo,
  IconValidationResult,
  IconFieldProps,
  IconButtonProps,
  IconThemeVariant,
  IconSize
} from './icons/types';