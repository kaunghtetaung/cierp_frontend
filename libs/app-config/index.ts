// Main exports for app configuration and hostname utilities

// Configuration exports
export {
  APP_CONFIGS,
  DEV_HOSTNAME_MAPPINGS,
  PROD_HOSTNAME_MAPPINGS,
  getHostnameMappings,
  getAvailableApps,
  getDefaultApp,
  isValidAppId
} from './configs';

// Hostname utility exports
export {
  getAppFromHostname,
  getHostnameForApp,
  getAppConfig,
  getAppConfigByHostname,
  createAppContext,
  buildAppSwitchUrl,
  switchToApp,
  isCurrentApp,
  getDevSetupInstructions
} from './hostname-utils';

// React context exports
export {
  AppProvider,
  useApp,
  useCurrentApp,
  useAppConfig,
  useAppSwitcher
} from './app-context';

// Component exports
export {
  AppSelector,
  AdvancedAppSelector,
  AppSwitcherNav
} from './app-selector';

// Type exports
export type {
  AppConfig,
  AppContext,
  HostnameMapping,
  AppSwitchOptions
} from './types';