
# Language Library Documentation

This document provides an overview of the `@repo/language` library, which is responsible for managing language selection and localization within the application.

## Core Concepts

The `language` library provides a complete solution for handling the current language state, allowing users to switch languages and have their preference persisted.

-   **Language Service**: A central `LanguageService` class encapsulates all the core logic, such as detecting the user's preferred language, managing cookies, and communicating with a backend API.
-   **React Context Provider**: A `LanguageProvider` component uses React Context to make the current language and related functions available to all components in the application.
-   **Configuration-Driven**: The library's behavior (e.g., supported languages, cookie names) can be easily customized through a configuration object.

---

## Usage

The primary way to use this library on the client-side is by wrapping your application with the `LanguageProvider` and then using the `useLanguage` hook in your components.

### `LanguageProvider`

This provider must wrap your application's root layout. It will automatically determine the best initial language for the user.

**Example (`app/layout.tsx`):**

```tsx
import { LanguageProvider } from '@repo/language';

export default function RootLayout({ children }) {
  // The provider will automatically detect the language from cookies
  // or the browser's settings.
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
```

### `useLanguage()` Hook

Any client component rendered within the `LanguageProvider` can use the `useLanguage` hook to access the current language and the function to change it.

**Hook Return Values:**

-   `currentLanguage: string`: The code for the currently active language (e.g., `"en"`).
-   `setLanguage(language: string)`: A function to change the current language.
-   `isLoading: boolean`: True while the language is being changed.
-   `error: string | null`: Any error message from the language service.

**Example (A language selector component):**

```tsx
'use client';

import { useLanguage } from '@repo/language';
import { languageService } from '@repo/language';

export function LanguageSelector() {
  const { currentLanguage, setLanguage, isLoading } = useLanguage();
  const supportedLanguages = languageService.getSupportedLanguages();

  return (
    <div>
      <select
        value={currentLanguage}
        onChange={(e) => setLanguage(e.target.value)}
        disabled={isLoading}
      >
        {supportedLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      {isLoading && <p>Changing language...</p>}
    </div>
  );
}
```

---

## How It Works

1.  **Initialization**: When the `LanguageProvider` mounts, it calls `languageService.initializeLanguage()`.
2.  **Language Detection**: The service determines the best language in the following order of priority:
    1.  Language stored in the `x-lang` cookie.
    2.  The user's browser language preference.
    3.  The default language specified in the configuration (`en`).
3.  **State Management**: The determined language is set as the `currentLanguage` in the React context.
4.  **Changing Language**: When you call `setLanguage('new-lang')`:
    -   The service makes a `POST` request to a backend API endpoint (`/api/lang`) to inform the server of the change.
    -   The server is expected to update its own session state and can also set the `x-lang` cookie in its response.
    -   The client-side state is updated, and the new language is reflected in the UI.

This library is intended to be used alongside a full i18n solution (like `react-i18next`) which would use the `currentLanguage` to load the appropriate translation files.
