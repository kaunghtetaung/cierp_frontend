
# Auth Library Documentation

This document provides an overview of the `auth` library, which handles authentication and authorization for the application. It follows SOLID principles, using a strategy pattern for token management and providing clear separation between client-side and server-side logic.

## Core Concepts

The `auth` library is responsible for:

-   **OIDC-based Authentication**: Interacting with an OIDC provider for user login, logout, and token management.
-   **Token Management**: A sophisticated `TokenManager` handles different types of tokens (user, tenant, initializer) with caching and automatic refresh logic.
-   **Session Management**: Secure server-side session management using the `@repo/security` library.
-   **React Integration**: Provides React components (`<AuthProvider>`, `<LoginPage>`) and hooks (`useAuth`, `useAuthContext`) for easy integration into the frontend.
-   **Route Protection**: Components like `<AuthGuard>` and HOCs like `withAuth` to protect routes and components based on authentication and authorization rules.

## File Structure

The library is organized as follows:

-   `/clients`: OIDC client implementation.
-   `/components`: React components for UI (e.g., `AuthProvider`, `LoginPage`).
-   `/hooks`: React hooks for state management (e.g., `useAuth`).
-   `/managers`: Server-side token management strategies (SOLID architecture).
-   `/routes`: API route handlers for login, logout, callback, etc.
-   `/server`: Core server-side authentication logic.
-   `/types`: TypeScript type definitions.
-   `/utils`: Client-side utility functions.
-   `cookie-utils.ts`: Utilities for setting and deleting cookies.
-   `index.ts`: Main entry point for client-side exports.

---

## Server-Side Usage (`/server`, `/managers`)

The server-side logic is built around the `TokenManager`, which uses a strategy pattern to handle different token types.

### TokenManager

The `TokenManager` (`/managers/token-manager.ts`) is a singleton that coordinates token acquisition and caching. It uses three main strategies:

1.  **`InitializerTokenStrategy`**: For system-level initialization tokens.
2.  **`TenantTokenStrategy`**: For tenant-specific API access (client credentials flow).
3.  **`UserTokenStrategy`**: For user-specific access and refresh tokens.

The `TokenManager.getTokenForRequest()` method provides a unified way to get the correct token based on the request context (user, tenant), following a priority order: User > Tenant > Initializer.

### API Routes (`/routes/api-routes.ts`)

The library provides handlers for standard OIDC-related API routes:

-   `handleLoginRequest` (`/api/auth/login`): Initiates the OIDC login flow, generates a PKCE challenge, and redirects the user to the auth provider.
-   `handleAuthCallback` (`/api/auth/callback`): Handles the callback from the OIDC provider, exchanges the authorization code for tokens, creates a user session, and sets the session cookie.
-   `handleLogout` (`/api/auth/logout`): Destroys the user session, clears tokens, and redirects to the OIDC logout endpoint.
-   `handleSessionStatus` (`/api/auth/session`): Returns the current user's authentication status.
-   `handleRefreshSession` (`/api/auth/refresh`): Refreshes the current session's expiry time.

### Core Server Logic (`/server/server.ts`)

The `getAuthenticationStatus` function is the primary server-side function to check if a user is authenticated. It validates the session cookie, checks the session against the cache/database, and returns a comprehensive `AuthenticationResult` object.

There are also several convenient wrappers available:

-   **`getAuthenticationStatus()`**: The core function. Returns an object with `isAuthenticated`, `user`, `session`, `tenantId`, and an optional `error`.
-   **`getCurrentUser()`**: A wrapper that returns only the `User` object or `null`.
-   **`getCurrentSession()`**: A wrapper that returns only the `AuthSession` object or `null`.

All these functions are cached per-request, making them efficient to use throughout your server-side code.

**Example (Server Component):**

```tsx
import { getCurrentUser, getCurrentSession } from '@repo/auth/server';

export default async function ServerPage() {
  const user = await getCurrentUser();
  const session = await getCurrentSession();

  if (!user) {
    return <p>You are not logged in.</p>;
  }

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Your session expires at: {session?.expiresAt.toString()}</p>
    </div>
  );
}
```

---

## Client-Side Usage (`/components`, `/hooks`, `/utils`)

The client-side part of the library is designed for easy integration with React applications.

### `AuthProvider`

The `<AuthProvider>` component (`/components/auth-provider.tsx`) is the root of the authentication system on the client. It should wrap your application. It initializes the `useAuth` hook and provides the authentication context to all child components.

**Example:**

```tsx
import { AuthProvider } from '@repo/auth';

function App({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

### `useAuthContext` Hook

The `useAuthContext` hook (`/components/auth-provider.tsx`) allows any component within the `AuthProvider` to access the authentication state and methods.

**State and Methods:**

-   `user: User | null`: The currently authenticated user object.
-   `isAuthenticated: boolean`: True if the user is authenticated.
-   `isLoading: boolean`: True while the authentication state is being determined.
-   `login(returnUrl?: string)`: Function to initiate the login process.
-   `logout()`: Function to initiate the logout process.
-   `error: string | null`: Any authentication-related error message.

**Example:**

```tsx
import { useAuthContext } from '@repo/auth';

function UserProfile() {
  const { user, isAuthenticated, logout } = useAuthContext();

  if (!isAuthenticated) {
    return <p>Please log in.</p>;
  }

  return (
    <div>
      <p>Welcome, {user.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### `LoginPage` Component

The `<LoginPage>` component (`/components/login-page.tsx`) provides a full, ready-to-use login page that handles the OIDC flow automatically.

**Example:**

```tsx
import { LoginPage } from '@repo/auth';

function MyLoginPage() {
  return <LoginPage companyName="My Awesome App" />;
}
```

### `AuthGuard` Component

The `<AuthGuard>` component (`/components/auth-provider.tsx`) is used to protect content, redirecting unauthenticated users to the login page. It can also check for specific roles and permissions.

**Example:**

```tsx
import { AuthGuard } from '@repo/auth';

function DashboardPage() {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <h1>Admin Dashboard</h1>
      <p>This content is for admins only.</p>
    </AuthGuard>
  );
}
```

---

## Utilities

### `cookie-utils.ts`

Provides server-side functions (`setSessionCookie`, `deleteSessionCookie`) for managing the session cookie in Next.js API routes and middleware. It correctly handles setting the root domain for cross-subdomain cookie sharing.

### `login-utils.ts`

Contains client-side helper functions like `initiateLogin`, `initiateLogout`, `getAuthStatus`, and permission-checking functions (`hasPermission`, `hasRole`). These are used internally by the hooks and components but can be used directly if needed.
