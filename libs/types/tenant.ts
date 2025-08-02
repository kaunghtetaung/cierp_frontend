// Enhanced tenant types with multilingual support
export interface MultilingualText {
  readonly en?: string;
  readonly mm?: string;
  readonly [key: string]: string | undefined;
}

export interface TenantBrandInfo {
  readonly title: string;
  readonly subTitle?: string;
  readonly description: MultilingualText;
  readonly logoUrl?: string;
  readonly corverPhotoURL?: string;
}

export interface TenantContact {
  readonly email?: string;
  readonly phoneNo?: string;
  readonly webSiteUrl?: string;
  readonly faceBookUrl?: string;
  readonly address?: string;
}

export interface TenantApplication {
  readonly displayName: MultilingualText;
  readonly displayShortName: MultilingualText;
  readonly localizedDescription: MultilingualText;
  readonly slug: string;
  readonly logoUrl?: string;
  readonly iconName: string;
  readonly status: boolean;
  readonly licenseType: string;
  readonly customerSupportTerms: string;
}

export interface TenantSettings {
  readonly id: string;
  readonly rootDomain: string;
  readonly langSupport: string[];
  readonly displayName: MultilingualText;
  readonly displayShortName: MultilingualText;
  readonly localizedDescription: MultilingualText;
  readonly slug: string;
  readonly brandInfo: TenantBrandInfo;
  readonly contact: TenantContact;
  readonly applications?: TenantApplication[];
}

export interface TenantSecrets {
  readonly apiAccess: {
    readonly clientId?: string;
    readonly clientSecret?: string;
    readonly enabled?: boolean;
    readonly redirectUris?: string[];
    readonly scope?: string;
  };
  readonly logInFlow: {
    readonly clientId?: string;
    readonly clientSecret?: string;
    readonly enabled?: boolean;
    readonly redirectUris?: string[];
    readonly scope?: string;
  };
}

export interface TenantSettingsDto extends TenantSettings {
  readonly secret?: TenantSecrets;
}

export interface TenantContextValue {
  readonly tenant: TenantSettings | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  refreshTenant: () => Promise<void>;
}

export interface TenantProviderProps {
  readonly children: React.ReactNode;
  readonly initialTenant?: TenantSettings | null;
  readonly initialError?: string | null;
}

export interface TenantInitializeResponse {
  readonly id: string;
  readonly organizationId: string;
  readonly domain: string;
  readonly isActive: boolean;
  readonly settings: TenantSettings;
}

export interface TenantResolver {
  resolveTenant: (domain: string) => Promise<TenantSettings | null>;
  getTenantById: (id: string) => Promise<TenantSettings | null>;
  validateTenant: (tenantId: string) => Promise<boolean>;
}
