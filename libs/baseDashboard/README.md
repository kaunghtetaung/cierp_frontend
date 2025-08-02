# Base Dashboard Library

A shared library providing common dashboard components, layouts, and utilities for multiple dashboard applications (core, library, ctms, cmps).

## Overview

This library extracts common dashboard patterns and components to ensure consistency and maintainability across different dashboard applications. It provides:

- **Reusable Components**: Error boundaries, loading pages, layout components
- **Layout Patterns**: Full dashboard layouts, minimal layouts
- **Provider Architecture**: Extensible provider composition system
- **Utilities**: Common data fetching patterns, error handling, metadata generation

## Installation

This library is part of the workspace and can be imported as:

```typescript
import { FullDashboardLayout, DashboardLoadingPage } from '@repo/base-dashboard'
```

## Quick Start

### Basic Dashboard Layout

```tsx
import { FullDashboardLayout } from '@repo/base-dashboard'

export default function MyApp({ children }) {
  return (
    <FullDashboardLayout
      tenant={tenant}
      appSchemaData={appSchemaData}
      initialTenant={tenant}
      initialError={null}
      config={{
        showSidebar: true,
        enableErrorBoundaries: true,
        multilingual: true
      }}
    >
      {children}
    </FullDashboardLayout>
  )
}
```

### Minimal Layout for Simple Pages

```tsx
import { MinimalDashboardLayout } from '@repo/base-dashboard'

export default function SimplePage() {
  return (
    <MinimalDashboardLayout 
      config={{ headerTitle: 'My Simple Dashboard' }}
    >
      <div>Your content here</div>
    </MinimalDashboardLayout>
  )
}
```

### Custom Loading Page

```tsx
import { DashboardLoadingPage } from '@repo/base-dashboard'

export default function Loading() {
  return (
    <DashboardLoadingPage
      title={{ en: 'Loading Dashboard...', mm: 'ဒက်ရှ်ဘုတ် ရယူနေသည်...' }}
      currentLanguage="en"
      showProgress={true}
    />
  )
}
```

## Architecture

### Components

- **DashboardLayout**: Core layout structure with sidebar and main content
- **DashboardErrorBoundary**: Reusable error boundary with consistent UI
- **DashboardLoadingPage**: Configurable loading page with progress indicators

### Layouts

- **FullDashboardLayout**: Complete layout with providers, error boundaries, and sidebar
- **MinimalDashboardLayout**: Lightweight layout for simple applications

### Providers

- **DashboardProviders**: Base provider composition (Auth, Tenant)
- **Provider Factory**: Extensible system for adding custom providers

### Utilities

- **generateDashboardMetadata**: Consistent metadata generation
- **createTenantErrorHandler**: Standardized tenant error handling
- **createAppSchemaErrorHandler**: App schema error handling patterns

## Extending for Specific Applications

### Core Application Example

```tsx
// apps/core/src/components/providers/AppProviders.tsx
import { createStandardDashboardProviders } from '@repo/base-dashboard'
import { LanguageProvider } from './LanguageProvider'
import ErrorProvider from './ErrorProvider'

export const AppProviders = createStandardDashboardProviders(
  LanguageProvider,
  ErrorProvider
)
```

### Custom Layout Example

```tsx
// apps/library/src/components/layout/LibraryLayout.tsx
import { FullDashboardLayout } from '@repo/base-dashboard'
import { LibrarySidebar } from './LibrarySidebar'
import { LibraryHeader } from './LibraryHeader'

export function LibraryLayout({ children, ...props }) {
  return (
    <FullDashboardLayout {...props}>
      <LibrarySidebar />
      <LibraryHeader />
      {children}
    </FullDashboardLayout>
  )
}
```

## Configuration Options

### DashboardConfig

```typescript
interface DashboardConfig {
  showSidebar?: boolean          // Show/hide sidebar
  sidebarCollapsible?: boolean   // Enable sidebar collapse
  headerTitle?: string           // Header title text
  enableErrorBoundaries?: boolean // Wrap components in error boundaries
  multilingual?: boolean         // Enable multilingual support
}
```

## Usage Patterns

### 1. Full Dashboard Application

Use `FullDashboardLayout` for complete dashboard applications with authentication, tenant management, and complex layouts.

### 2. Embedded Dashboard Components

Use `MinimalDashboardLayout` for embedded dashboard components or simple administrative interfaces.

### 3. Loading States

Use `DashboardLoadingPage` for consistent loading experiences across all dashboard applications.

### 4. Error Handling

Use `DashboardErrorBoundary` to wrap components and provide consistent error UI.

## Migration from Existing Code

If you have existing dashboard code in apps/core, you can gradually migrate by:

1. Replace layout components with `FullDashboardLayout`
2. Replace loading pages with `DashboardLoadingPage`
3. Replace error boundaries with `DashboardErrorBoundary`
4. Use provider factory for custom provider compositions

## Dependencies

- `@repo/ui`: UI components and design system
- `@repo/types`: Shared type definitions
- `@repo/utils`: Common utilities
- `@repo/auth`: Authentication providers
- `@repo/tenant`: Tenant management
- `react`: React library
- `next`: Next.js framework

## Development

The library follows the workspace structure and can be developed alongside other packages. Changes are automatically reflected in consuming applications during development.