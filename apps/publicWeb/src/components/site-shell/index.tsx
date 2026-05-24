// Common theme exports

// Footer components
export { FooterContainer } from './footer/FooterContainer';

// Header components
export { HeaderContainer } from './header/HeaderContainer';
export { default as HeaderBanner } from './header/HeaderBanner';
export { default as HeaderActions } from './header/components/Action/HeaderActions';

// Navigation components  
export { default as HeaderNavigation } from './navigation';
export { DesktopNavigation } from './navigation/DesktopNavigation';
export { MobileNavigation } from './navigation/MobileNavigation';
export { NavigationItem } from './navigation/NavigationItem';

// Types - only export what exists
export type { FooterContainerProps } from './footer/types';
export type { HeaderContainerProps } from './header/types';