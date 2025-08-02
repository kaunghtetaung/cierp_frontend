
# API Library Documentation

This document provides an overview of the `@repo/api` library, a robust and flexible system for handling both client-side and server-side API communication.

## Core Concepts

The `api` library is designed with SOLID principles, featuring a clear separation of concerns and an extensible architecture.

-   **Client/Server Separation**: The library provides two distinct clients:
    -   `HttpClient`: For use in the browser (React components).
    -   `ServerApiClient`: For use on the server (Next.js Server Components, API routes) to communicate with a backend API gateway.
-   **Strategy Pattern**: Core functionalities like URL building, header construction, and request execution are handled by injectable "strategy" classes. This makes the system modular and easy to test or extend.
-   **Interceptor Pipeline**: The `HttpClient` uses a pipeline of interceptors to process requests and responses. This is used for cross-cutting concerns like authentication, validation, and error handling.

---

## Client-Side Usage (`HttpClient`)

The `HttpClient` is used for making API calls from the browser. It's designed to be easy to use for common cases while remaining highly configurable.

### Default Instance

The library exports a pre-configured default instance that you can use for most requests.

```tsx
import { httpClient } from '@repo/api/client';
```

### Making Requests

The client provides convenience methods for all standard HTTP verbs.

**GET Request:**

```tsx
import { httpClient } from '@repo/api/client';

async function fetchUsers() {
  const response = await httpClient.get('/users');
  if (response.success) {
    console.log('Users:', response.data);
  } else {
    console.error('Failed to fetch users:', response.error);
  }
}
```

**POST Request:**

```tsx
import { httpClient } from '@repo/api/client';

async function createUser(userData) {
  const response = await httpClient.post('/users', userData);
  if (response.success) {
    console.log('User created:', response.data);
  }
}
```

**File Upload:**

```tsx
import { httpClient } from '@repo/api/client';

async function uploadAvatar(file) {
  const response = await httpClient.upload('/users/avatar', file);
  if (response.success) {
    console.log('Upload successful:', response.data);
  }
}
```

### Automatic Authentication Handling

The `HttpClient` has a built-in `AuthResponseInterceptor` that automatically handles token refreshes.

-   If an API request returns a `401 Unauthorized` error, the interceptor will pause the request.
-   It then uses the `@repo/auth` library's `TokenManager` to attempt a token refresh.
-   If the refresh is successful, it retries the original request with the new token.
-   This entire process is transparent to the calling code.

---

## Server-Side Usage (`ServerApiClient`)

The `ServerApiClient` is used for making server-to-server API calls, typically from a Next.js backend to an API gateway.

### Default Instance

Similar to the client, a pre-configured server instance is available.

```tsx
import { serverApiClient } from '@repo/api/server';
```

### Making Requests

The `ServerApiClient` automatically handles adding the `x-tenant-id` header (if available in the incoming request) and any configured API gateway authentication keys.

**Example (in a Server Component):**

```tsx
import { serverApiClient } from '@repo/api/server';

export async function UserProfile({ userId }) {
  // The tenantId from the original request to this component
  // will be automatically passed along in the server-to-server call.
  const response = await serverApiClient.get(`/users/${userId}`);

  if (!response.success) {
    return <p>Error loading user.</p>;
  }

  const user = response.data;
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

---

## Architecture Overview

### Strategies

The `HttpClient`'s behavior is defined by a set of strategy classes:

-   **`UrlBuilder`**: Constructs the full request URL from a base URL and an endpoint.
-   **`HeaderBuilder`**: Constructs the request headers, adding things like `Content-Type`, CSRF tokens, and `Authorization` tokens.
-   **`HttpExecutor`**: The core component that actually makes the `fetch` call. It includes retry logic.
-   **`ResponseHandler`**: Processes the `Response` object, parsing JSON and handling both successful and error responses.

### Interceptors

Interceptors allow for processing requests and responses in a pipeline.

-   **`RequestInterceptor`**: Runs before the request is sent. Used for tasks like data validation.
-   **`ResponseInterceptor`**: Runs after a response is received but before it's processed. Used for tasks like the automatic token refresh.
-   **`ErrorInterceptor`**: Runs if an error occurs. Used for global error logging or transformation.
