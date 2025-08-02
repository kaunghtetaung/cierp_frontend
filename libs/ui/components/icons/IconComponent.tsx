// Text-to-Icon Component
// Converts text icon names to actual Lucide icon components and custom social icons
import React from 'react';
import { getIconComponent, isValidIcon, getIconInfo } from './icon-registry';
import { getCustomSocialIcon, isCustomSocialIcon } from './custom-icons';

export interface IconComponentProps {
  /** The name of the icon (e.g., "Home", "User", "Settings") */
  name: string;
  /** Icon size in pixels or CSS units */
  size?: number | string;
  /** Icon color */
  color?: string;
  /** CSS class name */
  className?: string;
  /** Additional props passed to the icon component */
  iconProps?: Record<string, any>;
  /** Fallback icon name if the primary icon doesn't exist */
  fallback?: string;
  /** Whether to show debug info when icon is not found */
  showDebug?: boolean;
}

/**
 * IconComponent - Text-to-Icon converter for frontend rendering
 * 
 * Usage:
 * <IconComponent name="Home" size={24} />
 * <IconComponent name="User" size="1.5rem" color="blue" />
 * <IconComponent name="CustomIcon" fallback="HelpCircle" />
 */
export function IconComponent({
  name,
  size = 24,
  color,
  className = '',
  iconProps = {},
  fallback = 'HelpCircle',
  showDebug = false,
}: IconComponentProps) {
  // Check if it's a custom social icon first
  if (isCustomSocialIcon(name)) {
    const CustomIcon = getCustomSocialIcon(name);
    
    if (CustomIcon) {
      return (
        <CustomIcon
          size={size}
          color={color}
          className={`icon-component icon-custom-social ${className}`}
          title={showDebug ? `Custom Social Icon: ${name}` : undefined}
          {...iconProps}
        />
      );
    }
  }
  
  // Get the regular Lucide icon component
  const IconElement = getIconComponent(name);
  const iconInfo = getIconInfo(name);
  
  // If icon doesn't exist and we have a fallback, use it
  if (!iconInfo.exists && fallback && fallback !== name) {
    // Check if fallback is a custom social icon
    if (isCustomSocialIcon(fallback)) {
      const FallbackIcon = getCustomSocialIcon(fallback);
      if (FallbackIcon) {
        return (
          <FallbackIcon
            size={size}
            color={color}
            className={`icon-component icon-fallback icon-custom-social ${className}`}
            title={showDebug ? `Icon "${name}" not found, showing custom social fallback "${fallback}"` : undefined}
            {...iconProps}
          />
        );
      }
    }
    
    const FallbackIcon = getIconComponent(fallback);
    
    return (
      <FallbackIcon
        size={size}
        color={color}
        className={`icon-component icon-fallback ${className}`}
        title={showDebug ? `Icon "${name}" not found, showing fallback "${fallback}"` : undefined}
        {...iconProps}
      />
    );
  }
  
  // Debug mode: show icon name in title
  const title = showDebug 
    ? `Icon: ${name} (${iconInfo.exists ? 'found' : 'not found'}) - Category: ${iconInfo.categoryLabel}`
    : undefined;
  
  return (
    <IconElement
      size={size}
      color={color}
      className={`icon-component ${iconInfo.exists ? 'icon-valid' : 'icon-invalid'} ${className}`}
      title={title}
      {...iconProps}
    />
  );
}

// Convenience wrapper with common sizes
export function SmallIcon(props: Omit<IconComponentProps, 'size'>) {
  return <IconComponent {...props} size={16} />;
}

export function MediumIcon(props: Omit<IconComponentProps, 'size'>) {
  return <IconComponent {...props} size={24} />;
}

export function LargeIcon(props: Omit<IconComponentProps, 'size'>) {
  return <IconComponent {...props} size={32} />;
}

// Wrapper for themed icons (uses CSS custom properties)
export function ThemedIcon({
  name,
  variant = 'default',
  ...props
}: IconComponentProps & { variant?: 'default' | 'muted' | 'accent' | 'primary' | 'destructive' }) {
  const variantClass = `icon-${variant}`;
  
  return (
    <IconComponent
      {...props}
      name={name}
      className={`${variantClass} ${props.className || ''}`}
    />
  );
}

export default IconComponent;