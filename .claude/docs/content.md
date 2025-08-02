
# Content Library Documentation

This document provides an overview of the `@repo/content` library. This library is responsible for fetching and managing global, tenant-specific CMS settings.

**Important**: This library is for global content like headers, footers, navigation menus, and theme settings. It is **not** used for individual content items like pages, posts, or articles, which are handled by other modules.

## Core Concepts

The `content` library is a server-side service that provides a read-only interface to the CMS configuration for each tenant.

-   **Service-Oriented**: A central `ContentService` class handles all communication with the backend API to fetch content settings.
-   **Multi-Level Caching**: The library uses a two-tiered caching system for high performance:
    1.  **Request-Level Cache**: `React.cache` is used to ensure that settings for a given tenant are only fetched once per server request, no matter how many components need them.
    2.  **Shared Cache**: The results from the API are stored in a shared cache (Redis) for a longer period (e.g., 24 hours) to minimize traffic to the backend API.
-   **Tenant-Specific**: All functions are designed to be tenant-aware, using a `tenantId` to retrieve the correct settings.

---

## Usage

The `content` library is intended for **server-side use only** (in Server Components or API routes).

### Fetching Content Settings

The primary function is `getContentSettings(tenantId)`, which returns the entire content configuration object for a given tenant.

**Example (in a Server Component):**

```tsx
import { getContentSettings } from '@repo/content';
import { getCurrentTenantId } from '@repo/tenant/server';
import { headers } from 'next/headers';

export default async function Header() {
  const tenantId = await getCurrentTenantId(headers());
  
  if (!tenantId) {
    return null; // Or a default header
  }

  const contentSettings = await getContentSettings(tenantId);
  const logoUrl = contentSettings.header.logoUrl;

  return (
    <header>
      <img src={logoUrl} alt="Company Logo" />
    </header>
  );
}
```

### Convenience Functions

The library also provides several convenience functions to get specific parts of the settings object. These also use the same caching mechanism, so they are very efficient.

-   `getHeaderSettings(tenantId)`: Returns the `header` object.
-   `getFooterSettings(tenantId)`: Returns the `footer` object.
-   `getHeaderMenu(tenantId)`: Returns the array of header menu items.
-   `getFooterMenu(tenantId)`: Returns the array of footer menu items.
-   `getThemeName(tenantId)`: Returns the name of the current theme.

---

## Helper Utilities

### `getLocalizedText`

This utility function helps display text from a `MultiLanguageText` object in the correct language.

```tsx
import { getLocalizedText } from '@repo/content';

const multiLangText = {
  en: 'Hello',
  es: 'Hola'
};

// Assuming the current language is 'es'
const greeting = getLocalizedText(multiLangText, 'es'); // "Hola"

// It falls back to English if the requested language is not available
const greetingInGerman = getLocalizedText(multi-langText, 'de'); // "Hello"
```

### `shouldShowMenuItem`

This function is useful for building dynamic navigation menus. It checks if a menu item should be displayed based on the user's authentication status and roles.

```tsx
import { shouldShowMenuItem } from '@repo/content';

const menuItem = {
  // ... other menu item properties
  requiresAuth: true,
  allowedRoles: ['admin', 'editor']
};

// Example: User is an admin
const canShow = shouldShowMenuItem(menuItem, true, ['admin']); // true

// Example: User is authenticated but not an admin or editor
const canShowForUser = shouldShowMenuItem(menuItem, true, ['user']); // false

// Example: User is not authenticated
const canShowForGuest = shouldShowMenuItem(menuItem, false, []); // false
```
