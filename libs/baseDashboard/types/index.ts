// Common dashboard types and interfaces
import type { TenantSettings, User, AuthSession, TenantApplication } from "@repo/types"
import type { ReactNode } from "react"

// Layout related types
export interface DashboardLayoutData {
  middlewareData: MiddlewareData
  tenant: TenantSettings | null
  tenantError: string | null
  appSchemaData: AppSchemaData | null
}

export interface MiddlewareData {
  language: string
  appId?: string
  subdomain?: string
}

export interface AppSchemaData {
  modules: any[]
  supportedLanguages: string[]
  serviceName: string
  timestamp: string
  appId: string
}

// Auth data types
export interface AuthData {
  user: User | null
  session: AuthSession | null
  isAuthenticated: boolean
  error: string | null
}

// Provider types
export interface DashboardProvidersProps {
  children: ReactNode
  initialLanguage: string
  initialTenant: TenantSettings | null
  initialError: string | null
  initialAuth?: AuthData | null
  filteredApps?: TenantApplication[]
}

// Layout component types
export interface DashboardLayoutProps {
  children: ReactNode
  tenant: TenantSettings | null
  appSchemaData: AppSchemaData | null
}

// Error handling types
export interface DashboardErrorInfo {
  errorBoundary?: boolean
  fallback?: ReactNode
}

// Metadata types
export interface DashboardMetadata {
  title: string
  description: string
}

// Configuration types
export interface DashboardConfig {
  showSidebar?: boolean
  sidebarCollapsible?: boolean
  headerTitle?: string
  enableErrorBoundaries?: boolean
  multilingual?: boolean
}