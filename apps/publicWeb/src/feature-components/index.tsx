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
  LangSelectorWrapperProps
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

// Icons - re-export available icons from lucide-react
export {
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  X as XIcon,
  ChevronDown as ChevronDownIcon,
  Globe as GlobeIcon,
} from './icons';
export type {
  IconProps,
  IconComponent
} from './icons/types';