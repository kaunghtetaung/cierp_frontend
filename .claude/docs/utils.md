
# Utils Library Documentation

This document provides an overview of the `@repo/utils` library, which is a collection of shared utility functions used across the entire project.

## Core Concepts

The `@repo/utils` library is a foundational module that provides reusable, cross-cutting helper functions. Its primary architectural feature is a strict separation of code based on the environment in which it can be executed.

-   **`common`**: Utilities that are environment-agnostic. They are pure JavaScript/TypeScript and can run on both the server (Node.js) and the client (browser).
-   **`client`**: Utilities that are designed exclusively for the client-side and can safely use browser-specific APIs like `window` and `document`.
-   **`server`**: Utilities that are designed exclusively for the server-side and can use Node.js-specific APIs and access request data like headers.

This separation is crucial for preventing server-side code from being accidentally bundled and sent to the browser, which optimizes performance and prevents errors.

---

## How to Use

When importing from this library, you should be specific about the environment you are in.

-   **In Server Components or other server-side files:**
    ```tsx
    import { someServerUtil } from '@repo/utils/server';
    import { someCommonUtil } from '@repo/utils/common';
    ```

-   **In Client Components (`'use client'`)**:
    ```tsx
    import { someClientUtil } from '@repo/utils/client';
    import { someCommonUtil } from '@repo/utils/common';
    ```

-   **Never import from `@repo/utils/server` in a client component.**

---

## Key Utilities by Module

### `common` (Client & Server)

This is the largest part of the library and contains helpers that are safe to use anywhere.

-   **Validation (`/common/validation`)**: A rich set of functions for validating data formats.
    -   `isValidEmail(email)`
    -   `isValidTenantId(id)`
    -   And many more...
-   **URL Manipulation (`/common/url`)**: Functions for parsing and building URLs without relying on a browser context.
    -   `isValidUrl(url)`
    -   `parseQueryParams(queryString)`
-   **Security (`/common/security`)**: Low-level, environment-agnostic security helpers.
    -   `generateSecureRandomString(length)`: For creating cryptographically secure tokens or IDs.
-   **Formatting (`/common/formatters`)**: Functions to format data for display.
    -   `formatDate(date)`
    -   `formatCurrency(amount, currency)`
-   **Localization (`/common/localization`)**:
    -   `getLocalizedText(textObject, language)`: A key function for extracting the correct string from a multi-language object.
-   **Object and Date Utilities (`/common/object-utils`, `/common/date`)**: A standard library of helpers for common data manipulation tasks (`deepMerge`, `omit`, `sleep`, etc.).

### `client` (Client-Side Only)

These utilities are for use in React components marked with `'use client'`.

-   **DOM Utilities (`/client/dom`)**: Helpers for interacting with the DOM.
    -   `addClass(element, className)`
    -   `getViewportSize()`
-   **Domain/URL Utilities (`/client/domain`)**: Client-side URL helpers that use the `window.location` object.
    -   `getCurrentUrl()`
    -   `getPublicUrlClient()`

### `server` (Server-Side Only)

These utilities are for use in Server Components, API routes, and middleware.

-   **Middleware Utilities (`/server/middleware`)**: Helpers for use inside Next.js middleware.
    -   `getTenantIdFromRequest(request)`
    -   `setMiddlewareHeaders(response, ...)`
-   **Domain/URL Utilities (`/server/domain`)**: Server-side URL helpers that use request headers to determine the application's public URL.
    -   `getPublicUrl(headers)`
    -   `getApiDomain(headers)`

By providing this well-organized and clearly separated set of utilities, the `@repo/utils` library promotes code reuse, consistency, and correctness across the entire project.
