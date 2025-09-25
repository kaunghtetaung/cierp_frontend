// Layout-specific TypeScript interfaces
// Defines types for layout components and data structures

import type { TenantSettings, ModuleSchema, User, AuthSession, TenantApplication } from "@repo/types"

/**
 * Middleware data from Next.js headers
 */
export interface MiddlewareData {
  tenantId: string | null
  language: string
  requestId: string | null
  hostname: string | null
  protocol: string
  appId: string
  appConfig?: any
  pathname?: string
}

/**
 * Clean module data for client-side (without sensitive access policies)
 */
export interface ClientModule {
  id: number
  name: any // MultilingualText
  slug: string
  serviceName: string
  description: any // MultilingualText
  iconName: string

  // Include necessary schema properties for page functionality (non-sensitive)
  formLayout?: string
  formFields?: any[]
  dataTableSchema?: {
    layout?: string
    columns?: any[]
    pagination?: {
      enabled?: boolean
      defaultLimit?: number
      allowedLimits?: number[]
      isClientSidePaging?: boolean
    }
    sorting?: any
    filtering?: any
    actions?: any
  }
  detailViewSchema?: any
  extraActionForms?: any[]
  wizardConfig?: any

  // Sensitive moduleAccessPolicy is excluded for security
}

/**
 * App schema data from backend API
 */
export interface AppSchemaData {
  modules: ModuleSchema[]
  supportedLanguages: any[]
  serviceName: string
  timestamp: string
  appId: string
}

/**
 * Clean app schema data for client-side (without sensitive access policies)
 */
export interface ClientAppSchemaData {
  modules: ClientModule[]
  supportedLanguages: any[]
  serviceName: string
  timestamp: string
  appId: string
}

/**
 * Authentication data from session validation
 */
export interface AuthData {
  user: User | null
  session: AuthSession | null
  isAuthenticated: boolean
  error: string | null
}

/**
 * Complete layout data structure
 */
export interface LayoutData {
  middlewareData: MiddlewareData
  tenant: TenantSettings | null
  tenantError: string | null
  appSchemaData: ClientAppSchemaData | null
  authData: AuthData | null
  filteredApps: TenantApplication[]
  currentAppAccess?: {
    hasAccess: boolean
    app: TenantApplication | null
    reason?: string
  } | null
}

/**
 * App providers props
 */
export interface AppProvidersProps {
  children: React.ReactNode
  initialLanguage: string
  initialTenant: TenantSettings | null
  initialError: string | null
  initialAuth: AuthData | null
  filteredApps: TenantApplication[]
}

/**
 * App layout props
 */
export interface AppLayoutProps {
  children: React.ReactNode
  tenant: TenantSettings | null
  appSchemaData: ClientAppSchemaData | null
  filteredApps: TenantApplication[]
  authData?: AuthData | null
}

/**
 * Root layout props
 */
export interface RootLayoutProps {
  children: React.ReactNode
}

/**
 * Page metadata structure
 */
export interface PageMetadata {
  title: string
  description: string
}

/**
 * User permissions for module operations
 */
export interface ModulePermissions {
  read: boolean
  create: boolean
  update: boolean
  softDelete: boolean
  hardDelete: boolean
}

/**
 * Layout configuration options
 */
export interface LayoutConfig {
  enableSidebar: boolean
  enableHeader: boolean
  enableErrorBoundaries: boolean
  sidebarCollapsible: boolean
  theme: 'light' | 'dark' | 'system'
}

/**
 * Layout context data
 */
export interface LayoutContextData {
  tenant: TenantSettings | null
  appSchemaData: AppSchemaData | null
  middlewareData: MiddlewareData
  config: LayoutConfig
}

export default {
  MiddlewareData,
  AppSchemaData,
  LayoutData,
  AppProvidersProps,
  AppLayoutProps,
  RootLayoutProps,
  PageMetadata,
  LayoutConfig,
  LayoutContextData
}