// Icon System Type Definitions
// TypeScript types for the icon system

import { ICON_REGISTRY, ICON_CATEGORIES } from './icon-registry';

// Extract types from the icon registry
export type IconCategory = keyof typeof ICON_CATEGORIES;
export type IconName = string;

// Icon component props
export interface BaseIconProps {
  /** Icon size in pixels or CSS units */
  size?: number | string;
  /** Icon color */
  color?: string;
  /** CSS class name */
  className?: string;
  /** Icon title for accessibility */
  title?: string;
  /** Whether the icon is decorative (hidden from screen readers) */
  'aria-hidden'?: boolean;
}

// Icon metadata
export interface IconInfo {
  iconName: string;
  category: IconCategory;
  categoryLabel: string;
  exists: boolean;
}

// Search result type
export interface IconSearchResult {
  iconName: string;
  category: IconCategory;
}

// Icon category info
export interface IconCategoryInfo {
  label: string;
  description: string;
}

// Icon validation result
export interface IconValidationResult {
  isValid: boolean;
  iconName: string;
  suggestion?: string;
  category?: IconCategory;
}

// Icon selector props (for form integration)
export interface IconFieldProps {
  /** Field name for forms */
  name?: string;
  /** Field value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Whether the field is required */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Field label */
  label?: string;
}

// Icon button props
export interface IconButtonProps extends BaseIconProps {
  /** Button variant */
  variant?: 'default' | 'primary' | 'destructive' | 'ghost';
  /** Button size */
  buttonSize?: 'sm' | 'md' | 'lg';
  /** Button text */
  children?: React.ReactNode;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
}

// Theme variant for styled icons
export type IconThemeVariant = 'default' | 'muted' | 'accent' | 'primary' | 'destructive';

// Icon registry constants
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  '2xl': 64,
} as const;

export type IconSize = keyof typeof ICON_SIZES;