// libs/tenant/middleware/types.ts
export interface MiddlewareConfig {
  tenantApi: {
    baseUrl?: string;
    timeout?: number;
  };
  cookies: {
    domain?: string;
    secure?: boolean;
    maxAge?: number;
    sameSite?: "strict" | "lax" | "none";
  };
  security: {
    csrf?: boolean;
    excludePaths?: string[];
  };
  headers: {
    tenantHeader?: string;
    langHeader?: string;
    requestIdHeader?: string;
    hostnameHeader?: string;
    protocolHeader?: string;
    appHeader?: string;
  };
  defaultLanguage?: string;
  excludePaths?: string[];
  enableLogging?: boolean;
}
