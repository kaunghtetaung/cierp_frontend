
# Security Library Documentation

This document provides an overview of the `@repo/security` library, which offers a comprehensive suite of tools for securing the application. It covers session management, CSRF protection, encryption, and data validation.

## Core Concepts

The security library is built on a foundation of modern security best practices and SOLID principles.

-   **Session Management**: A sophisticated `SessionManager` provides robust, secure, and extensible session handling.
-   **Strategy Pattern**: The `SessionManager` uses a strategy pattern, delegating tasks like session creation, validation, and storage to dedicated strategy classes. This makes the system highly modular and testable.
-   **CSRF Protection**: Implements the double-submit cookie pattern to mitigate Cross-Site Request Forgery attacks.
-   **Universal Encryption**: Provides encryption utilities that work in both Node.js and the browser, using the Web Crypto API and Node's native `crypto` module.
-   **Input Validation**: A suite of validation functions helps protect against common vulnerabilities like XSS, SQL injection, and insecure file uploads.

---

## Session Management (`SessionManager`)

The `SessionManager` is the central component for handling user sessions. It's designed to be secure, efficient, and flexible.

### Usage

You can create an instance of the `SessionManager` to manage sessions.

```tsx
import { SessionManager } from '@repo/security';

const sessionManager = new SessionManager({
  maxAge: 60 * 60, // 1 hour
  ipValidation: true,
  userAgentValidation: true,
});
```

### Key Methods

-   **`createSession(userId, tenantId, options)`**: Creates a new, secure session for a user. It returns a `SessionData` object containing the session ID and other details.

    ```tsx
    const session = await sessionManager.createSession('user-123', 'tenant-abc', {
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome/100.0',
    });
    ```

-   **`validateSession(sessionId, context)`**: Validates a session ID. It checks for expiration, and optionally validates the IP address and user agent. It returns a `SessionValidationResult` with the session data if valid.

    ```tsx
    const result = await sessionManager.validateSession('session-id-abc', {
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome/100.0',
    });

    if (result.valid) {
      console.log('Session is valid for user:', result.session.userId);
    }
    ```

-   **`destroySession(sessionId)`**: Invalidates and removes a session.

-   **`renewSession(sessionId)`**: Extends the expiration time of an active session. The `validateSession` method can be configured to do this automatically.

---

## CSRF Protection

The library provides tools to implement the double-submit cookie pattern for CSRF protection.

-   **`generateDoubleSubmitCSRF()`**: Generates a pair of tokens. One is set as an `HttpOnly` cookie, and the other is sent to the client to be included in subsequent request headers (e.g., `X-CSRF-Token`).
-   **`validateDoubleSubmitCSRF(cookieToken, headerToken, expiresAt)`**: Validates that the token from the cookie matches the token from the request header. This should be done in your API routes or middleware for any state-changing requests (POST, PUT, DELETE, etc.).

---

## Encryption

The `UniversalEncryption` class provides a consistent way to encrypt and decrypt data on both the server and the client.

-   **`UniversalEncryption.encrypt(data, password)`**: Encrypts a string using AES-GCM.
-   **`UniversalEncryption.decrypt(encryptedData, password)`**: Decrypts the data.

```tsx
import { UniversalEncryption } from '@repo/security';

const secret = 'my-super-secret-key';
const data = 'This is a secret message.';

// Encryption
const encrypted = await UniversalEncryption.encrypt(data, secret);

// Decryption
const decrypted = await UniversalEncryption.decrypt(encrypted, secret);

if (decrypted.valid) {
  console.log('Decrypted message:', decrypted.decrypted);
}
```

The library also includes utilities for password hashing (`hashPassword`, `verifyPassword`).

---

## Validation

A set of validation functions is available in `core/validation.ts` to help sanitize and validate user inputs and other data.

-   **`validateAuthCredentials(email, password)`**: Checks for valid email and password formats.
-   **`validateSessionToken(token)`**: Validates the format of a session token.
-   **`validateRedirectUrl(url, allowedDomains)`**: Protects against open redirect vulnerabilities.
-   **`validateUserInput(input)`**: Checks for common XSS and SQL injection patterns.
-   **`validateFileUpload(file)`**: Validates file uploads based on size, type, and name.
