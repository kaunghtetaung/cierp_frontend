// Footer components export
// Based on managementpanel architecture

import FooterContainer from './FooterContainer';

// Export individual components for flexibility
export { default as FooterContainer } from './FooterContainer';
export { default as FooterContent } from './FooterContent';

// Export types
export type {
  FooterContainerProps,
  FooterData,
  FooterSettings,
  SocialLink,
  FooterColumn
} from './types';

// Default export
export default FooterContainer;