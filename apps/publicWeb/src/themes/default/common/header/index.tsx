// Header components export
// Based on managementpanel architecture

import HeaderContainer from './HeaderContainer';

// Export individual components for flexibility
export { default as HeaderBanner } from './HeaderBanner';
export { default as HeaderActions } from './components/Action/HeaderActions';
export { default as HeaderContainer } from './HeaderContainer';

// Export types
export type {
  HeaderBannerProps,
  HeaderActionsProps,
  HeaderContainerProps,
  HeaderSettings,
  HeaderData,
  TenantBrandInfo,
} from './types';

// Default export
export default HeaderContainer;