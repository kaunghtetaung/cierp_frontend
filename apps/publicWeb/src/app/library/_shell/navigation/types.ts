/**
 * Navigation Types
 * Clean interfaces for header navigation components
 */

export interface MultiLanguageText {
  en: string;
  mm: string;
  _id?: string;
}

export interface NavigationItem {
  id: string;
  title: MultiLanguageText;
  url?: string;
  pageId?: string;
  icon?: string;
  cssClass?: string;
  openInNewTab?: boolean;
  requiresAuth?: boolean;
  allowedRoles?: string[];
  children?: NavigationItem[];
  order?: number;
  isActive?: boolean;
}

export interface BaseNavigationProps {
  items: NavigationItem[];
  currentLanguage?: "en" | "mm";
  className?: string;
  isAuthenticated: boolean;
  userRoles: string[];
}

export interface HeaderNavigationProps extends BaseNavigationProps {}

export interface DesktopNavigationProps extends BaseNavigationProps {}

export interface MobileNavigationProps extends BaseNavigationProps {
  isOpen: boolean;

  onOpenChange: (open: boolean) => void;
}

export interface NavigationItemProps {
  item: NavigationItem;
  currentLanguage?: "en" | "mm";
  isAuthenticated: boolean;
  userRoles: string[];
  isMobile?: boolean;
  onItemClick?: () => void;
}
