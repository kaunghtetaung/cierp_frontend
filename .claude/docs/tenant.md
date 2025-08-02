
# Tenant Library Documentation

This document provides an overview of the `@repo/tenant` library, which provides a complete solution for managing multi-tenancy in the application.

## Core Concepts

The `tenant` library is designed to identify the current tenant based on the request's hostname and make that tenant's specific configuration available throughout the application, on both the server and the client.

-   **Middleware-First**: The process begins with a Next.js middleware that resolves the tenant from the hostname. It then injects the tenant's ID into the request headers (`x-tenant-id`) for downstream use.
-   **Server-Side Service**: A cached, server-side `tenant-service` acts as the single source of truth for fetching tenant settings. It uses the `x-tenant-id` header to retrieve the correct data.
-   **Client-Side Context**: A React Context Provider (`TenantProvider`) is used to hydrate the client-side with the tenant information fetched on the server, making it available to all React components.

---

## The Flow of Tenant Information

1.  **Request**: A user makes a request to a domain (e.g., `customer-a.yourapp.com`).
2.  **Middleware (`middleware-core.ts`)**:
    -   The middleware intercepts the request.
    -   It calls an API endpoint (e.g., `/api/tenant/initialize`) with the hostname.
    -   The API returns the corresponding `tenantId` (e.g., `tenant-a`).
    -   The middleware adds the `x-tenant-id: tenant-a` header to the request and forwards it to the Next.js application.
3.  **Server-Side (`tenant-service.ts`)**:
    -   When a Server Component or API route needs tenant data, it calls `getTenantSetting()`.
    -   This function reads the `x-tenant-id` from the headers and fetches the detailed settings for that tenant from a cache (Redis) or the database.
    -   The data is cached per-request using `React.cache` to avoid redundant fetches.
4.  **Client-Side (`providers.tsx`)**:
    -   In the root layout (a Server Component), the application fetches the tenant settings using `getTenantSetting()`.
    -   It then passes these settings as a prop to the `<TenantProvider>` component.
    -   The provider makes the tenant data available to all client-side components via the `useTenant` hook.

---

## Server-Side Usage

On the server, you can get tenant information using functions from `tenant-service.ts`.

### `getTenantSetting(tenantId)`

This is the primary function for fetching all settings for a given tenant. It's cached and should be used whenever you need tenant configuration in Server Components or API routes.

### `getCurrentTenant(headers)`

This is a convenience function that reads the `x-tenant-id` from the request headers and returns the full, client-safe `TenantSettings` object.

**Example (in a Server Component):**

```tsx
import { getCurrentTenant } from '@repo/tenant/server';
import { headers } from 'next/headers';

export default async function Page() {
  // headers() is a Next.js function that provides the request headers.
  const tenant = await getCurrentTenant(headers());

  return (
    <h1 style={{ color: tenant?.brandInfo?.primaryColor || '#000' }}>
      Welcome to {tenant?.displayName}
    </h1>
  );
}
```

---

## Client-Side Usage

On the client, tenant information is accessed through the `TenantProvider` and the `useTenant` hook.

### `TenantProvider`

This provider must wrap your application's root layout. It's initialized with the tenant data fetched on the server.

**Example (`app/layout.tsx`):**

```tsx
import { TenantProvider } from '@repo/tenant';
import { getCurrentTenant } from '@repo/tenant/server';
import { headers } from 'next/headers';

export default async function RootLayout({ children }) {
  const tenant = await getCurrentTenant(headers());

  return (
    <html lang="en">
      <body>
        <TenantProvider initialTenant={tenant}>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
```

### `useTenant()` Hook

Any client component rendered within the `TenantProvider` can use the `useTenant` hook to access the tenant data.

**Example (Client Component):**

```tsx
'use client';

import { useTenant } from '@repo/tenant';

export function TenantWelcome() {
  const { tenant, isLoading } = useTenant();

  if (isLoading) {
    return <p>Loading tenant...</p>;
  }

  return <h1>{tenant?.displayName}</h1>;
}
```
