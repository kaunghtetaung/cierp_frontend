// Icon System Exports
// Complete icon system for frontend and CMS management

// Core components
export { IconComponent, SmallIcon, MediumIcon, LargeIcon, ThemedIcon } from './IconComponent';
export { IconSelector } from './IconSelector';

// Custom social icons
export {
  FacebookIcon,
  XIcon,
  GoogleIcon,
  MicrosoftIcon,
  LinkedInIcon,
  InstagramIcon,
  YouTubeIcon,
  GitHubIcon,
  TikTokIcon,
  CUSTOM_SOCIAL_ICONS,
  getCustomSocialIcon,
  isCustomSocialIcon,
  type CustomSocialIconName,
  type CustomIconProps,
} from './custom-icons';

// Registry and utilities
export {
  ICON_CATEGORIES,
  ICON_REGISTRY,
  ALL_ICONS,
  getIconComponent,
  isValidIcon,
  getIconsByCategory,
  searchIcons,
  getIconInfo,
  type IconCategory,
  type IconName,
} from './icon-registry';

// Re-export types
export type { IconComponentProps } from './IconComponent';
export type { IconSelectorProps } from './IconSelector';

// Default export for convenience
export { IconComponent as default } from './IconComponent';