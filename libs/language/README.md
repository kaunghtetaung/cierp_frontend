# Language Service

A comprehensive, reusable language management service for multi-language web applications.

## Features

- 🌍 **Multi-language Support**: Easy configuration for any number of languages
- 🍪 **Cookie-based Persistence**: Server-side accessible language preferences
- 🔧 **Configurable**: Fully customizable API endpoints, cookie settings, and supported languages  
- 🚀 **Next.js Ready**: Built-in middleware and API route integration
- 📱 **Browser Detection**: Automatic language detection from browser preferences
- 🎯 **TypeScript**: Full type safety and IntelliSense support
- 🔄 **Backward Compatible**: Drop-in replacement for existing language systems

## Quick Start

### Basic Usage

```typescript
import { languageService } from '@/lib/services/language';

// Change language
const result = await languageService.changeLanguage('en');
if (result.success) {
  console.log('Language changed to:', result.language);
}

// Get current language
const current = languageService.getStoredLanguage();

// Check if language is supported
const isValid = languageService.isValidLanguage('fr');
```

### Custom Configuration

```typescript
import { LanguageService, createLanguageConfig } from '@/lib/services/language';

const customConfig = createLanguageConfig({
  apiEndpoint: '/api/lang/change',
  cookieName: 'user-lang',
  supportedLanguages: [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' }
  ],
  defaultLanguage: 'en'
});

const customLanguageService = new LanguageService(customConfig);
```

## API Routes

### Create API Endpoint

```typescript
// app/api/language/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { languageService } from '@/lib/services/language';

export async function POST(request: NextRequest) {
  const { language } = await request.json();
  const result = await languageService.changeLanguage(language);
  
  const response = NextResponse.json(result);
  if (result.success) {
    const config = languageService.getConfig();
    response.cookies.set(config.cookieName!, language, config.cookieOptions);
  }
  
  return response;
}

export async function GET() {
  const currentLanguage = languageService.getStoredLanguage() || 'en';
  return NextResponse.json({
    success: true,
    language: currentLanguage,
    supportedLanguages: languageService.getSupportedLanguages().map(l => l.code)
  });
}
```

### Middleware Integration

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { languageService } from '@/lib/services/language';

export async function middleware(request: NextRequest) {
  const config = languageService.getConfig();
  
  // Get and validate language
  const language = request.cookies.get(config.cookieName!)?.value || config.defaultLanguage!;
  const validLanguage = languageService.isValidLanguage(language) ? language : config.defaultLanguage!;
  
  const response = NextResponse.next();
  
  // Set language header for server components
  response.headers.set('x-lang', validLanguage);
  
  // Set cookie if missing or invalid
  if (!request.cookies.get(config.cookieName!) || !languageService.isValidLanguage(language)) {
    response.cookies.set(config.cookieName!, validLanguage, config.cookieOptions);
  }
  
  return response;
}
```

## React Integration

### Language Selector Component

```typescript
import { languageService } from '@/lib/services/language';

function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState(languageService.getStoredLanguage());
  const [isChanging, setIsChanging] = useState(false);
  
  const handleLanguageChange = async (langCode: string) => {
    setIsChanging(true);
    try {
      const result = await languageService.changeLanguage(langCode);
      if (result.success) {
        setCurrentLang(langCode);
        window.location.reload(); // Refresh to apply changes
      }
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <select 
      value={currentLang} 
      onChange={(e) => handleLanguageChange(e.target.value)}
      disabled={isChanging}
    >
      {languageService.getSupportedLanguages().map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
```

### Server Component Language Detection

```typescript
// app/layout.tsx or page.tsx
import { headers } from 'next/headers';

export default async function Layout() {
  const headersList = headers();
  const currentLanguage = headersList.get('x-lang') || 'en';
  
  return (
    <html lang={currentLanguage}>
      <body>
        <YourComponent currentLanguage={currentLanguage} />
      </body>
    </html>
  );
}
```

## Configuration Options

```typescript
interface LanguageServiceConfig {
  apiEndpoint?: string;           // API endpoint for language changes
  cookieName?: string;            // Cookie name for language storage
  cookieOptions?: {               // Cookie configuration
    maxAge?: number;              // Cookie expiry (seconds)
    secure?: boolean;             // HTTPS only
    sameSite?: 'strict' | 'lax' | 'none';
    httpOnly?: boolean;           // Server-side only
    path?: string;                // Cookie path
  };
  supportedLanguages?: Language[]; // Available languages
  defaultLanguage?: string;        // Fallback language
}

interface Language {
  code: string;                   // Language code (e.g., 'en', 'fr')
  name: string;                   // English name (e.g., 'English')
  nativeName: string;             // Native name (e.g., 'English', 'Français')
  flag?: string;                  // Flag emoji (e.g., '🇺🇸')
  direction?: 'ltr' | 'rtl';      // Text direction
}
```

## Default Configuration

```typescript
const DEFAULT_CONFIG = {
  apiEndpoint: '/api/language/change',
  cookieName: 'x-lang',
  cookieOptions: {
    maxAge: 365 * 24 * 60 * 60,   // 1 year
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: false,
    path: '/'
  },
  supportedLanguages: [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'mm', name: 'Myanmar', nativeName: 'မြန်မာ', flag: '🇲🇲' }
  ],
  defaultLanguage: 'en'
};
```

## Advanced Usage

### Custom Language Service Instance

```typescript
import { LanguageService } from '@/lib/services/language';

// Create multiple instances for different contexts
const adminLanguageService = new LanguageService({
  apiEndpoint: '/api/admin/language',
  cookieName: 'admin-lang',
  supportedLanguages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' }
  ]
});

const userLanguageService = new LanguageService({
  apiEndpoint: '/api/user/language',
  cookieName: 'user-lang'
});
```

### Language Initialization

```typescript
// Initialize language on app startup
async function initializeApp() {
  const preferredLanguage = await languageService.initializeLanguage();
  console.log('App initialized with language:', preferredLanguage);
}
```

### Runtime Configuration Updates

```typescript
// Update configuration at runtime
languageService.updateConfig({
  supportedLanguages: [
    ...languageService.getSupportedLanguages(),
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' }
  ]
});
```

## Migration Guide

### From Custom Implementation

1. Replace direct cookie handling:
```typescript
// Before
document.cookie = `x-lang=${lang}; path=/; max-age=${maxAge}`;

// After  
languageService.setStoredLanguage(lang);
```

2. Replace API calls:
```typescript
// Before
const response = await fetch('/api/language/change', {
  method: 'POST',
  body: JSON.stringify({ language: lang })
});

// After
const result = await languageService.changeLanguage(lang);
```

3. Replace validation:
```typescript
// Before
const supportedLanguages = ['en', 'mm'];
const isValid = supportedLanguages.includes(lang);

// After
const isValid = languageService.isValidLanguage(lang);
```

## Testing

```typescript
import { LanguageService } from '@/lib/services/language';

describe('LanguageService', () => {
  let service: LanguageService;
  
  beforeEach(() => {
    service = new LanguageService({
      supportedLanguages: [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'fr', name: 'French', nativeName: 'Français' }
      ]
    });
  });
  
  test('validates supported languages', () => {
    expect(service.isValidLanguage('en')).toBe(true);
    expect(service.isValidLanguage('de')).toBe(false);
  });
  
  test('returns browser language preference', () => {
    const browserLang = service.getBrowserLanguage();
    expect(['en', 'fr']).toContain(browserLang);
  });
});
```

## Troubleshooting

### Common Issues

1. **Language not persisting**: Check cookie settings and ensure `httpOnly: false`
2. **API errors**: Verify API endpoint configuration and request format
3. **SSR mismatches**: Ensure server and client use same language detection logic
4. **Browser detection failing**: Check supported languages include browser language codes

### Debug Mode

```typescript
// Enable detailed logging
languageService.updateConfig({
  debug: true // Custom flag for your implementation
});
```

## License

This service is part of the project's shared library and follows the same license terms.