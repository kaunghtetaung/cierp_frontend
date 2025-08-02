
# App Schema Library Documentation

This document provides an overview of the `@repo/appSchema` library. This server-side library is responsible for fetching and managing "application schemas" which define the structure, behavior, and access policies of core application modules.

**Note**: This is a **server-side only** library.

## Core Concepts

The `appSchema` library is designed to fetch configuration data from a backend API endpoint (`/core/initialize`) and make it available to the rest of the server-side application. This allows for the dynamic generation of user interfaces and enforcement of access control based on a centralized configuration.

-   **Schema-Driven UI**: The library fetches schemas that describe how to build forms, data tables, and other UI components. This means the UI can be changed without deploying new frontend code.
-   **Service-Oriented**: A central `AppSchemaService` handles all communication with the backend API.
-   **Multi-Level Caching**: For high performance, the library uses both per-request caching (`React.cache`) and a long-term shared cache (`@repo/cache` via Redis).
-   **Tenant-Specific**: All schemas are fetched on a per-tenant basis, allowing for different configurations for each tenant.

---

## Usage

The primary way to use this library is through the set of exported server-side functions. These functions are designed to be used within Server Components or API routes.

### Fetching All Schemas

The main function is `getModuleSchemas(tenantId)`, which fetches the entire `InitializeResponseDto` object from the `/core/initialize` endpoint. This object contains all the module schemas for the given tenant.

**Example (in a Server Component):**

```tsx
import { getModuleSchemas } from '@repo/appSchema';
import { getCurrentTenantId } from '@repo/tenant/server';
import { headers } from 'next/headers';

export default async function Dashboard() {
  const tenantId = await getCurrentTenantId(headers());

  if (!tenantId) {
    return <p>Tenant not found.</p>;
  }

  // Fetches all schemas for the tenant
  const appSchema = await getModuleSchemas(tenantId);
  const modules = appSchema.modules;

  return (
    <ul>
      {modules.map(module => (
        <li key={module.slug}>{module.name.en}</li>
      ))}
    </ul>
  );
}
```

### Fetching Specific Module Schemas

It's often more convenient to get the schema for a specific module. The `getModuleBySlug(tenantId, slug)` function is used for this.

**Example (Dynamically building a form):**

```tsx
import { getModuleBySlug } from '@repo/appSchema';
import { getCurrentTenantId } from '@repo/tenant/server';
import { headers } from 'next/headers';
import { DynamicForm } from '@/components/dynamic-form';

export default async function UserCreatePage() {
  const tenantId = await getCurrentTenantId(headers());
  
  if (!tenantId) return null;

  // Get the schema for the "users" module
  const userModule = await getModuleBySlug(tenantId, 'users');
  
  if (!userModule) {
    return <p>Users module not configured.</p>;
  }

  // Pass the formFields schema to a component that can render it
  return <DynamicForm fields={userModule.formFields} />;
}
```

### Other Convenience Functions

The library provides many other functions to access specific parts of the schema:

-   `getModules(tenantId)`: Get a list of all available modules.
-   `getModuleFormFields(tenantId, slug)`: Get the `formFields` for a specific module.
-   `getModuleTableSchema(tenantId, slug)`: Get the `dataTableSchema` for a module.
-   `getModuleAccessPolicy(tenantId, slug)`: Get the access control policy for a module.

All of these functions are efficiently cached, so you can call them wherever you need them without worrying about redundant API calls.
