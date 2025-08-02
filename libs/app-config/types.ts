// App configuration types for hostname-based app detection

export interface AppConfig {
  id: string;
  hostname: string;
  name: string;
  description: string;
  primaryColor: string;
  icon: string;
  isDefault?: boolean;
  environment?: 'development' | 'production' | 'staging';
}

export interface AppContext {
  currentApp: string;
  config: AppConfig;
  hostname: string;
  isValidApp: boolean;
}

export interface HostnameMapping {
  hostname: string;
  appId: string;
  environment: 'development' | 'production' | 'staging';
}

export interface AppSwitchOptions {
  preservePath?: boolean;
  preserveQuery?: boolean;
  newTab?: boolean;
}