// Extra Action Form System - All extraAction-related components

// Main components
export { ExtraActionModal } from './ExtraActionModal';
export { ExtraActionFormRouter, type PreBuiltFormProps } from './ExtraActionFormRouter';
export { DynamicExtraActionForm } from './DynamicExtraActionForm';
export { DynamicExtraActionFormWithSections } from './DynamicExtraActionFormWithSections';

// Legacy (for backward compatibility if needed)
export { DynamicExtraActionForm as DynamicExtraActionFormLegacy } from './DynamicExtraActionFormLegacy';

// Pre-built forms
export { UserPasswordChangeForm } from './pre-built/UserPasswordChangeForm';
export { RoleAssignForm } from './pre-built/RoleAssignForm';
export { AccessionNumberManagementForm } from './pre-built/AccessionNumberManagementForm';
