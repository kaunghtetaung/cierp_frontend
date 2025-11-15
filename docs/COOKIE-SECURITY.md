# Cookie Security Standards

This document outlines the security standards for all cookies used in the monorepo.

## 🛡️ Security Requirements

All cookies MUST follow these security rules:

### ✅ Required Settings
- **`httpOnly: true`** - Prevents JavaScript access (XSS protection)
- **`secure: true`** - HTTPS only in production mode
- **`domain: .{rootDomain}`** - Root-level domain for subdomain sharing
- **`path: "/"`** - Available across entire domain
- **`sameSite: "lax" | "strict"`** - CSRF protection

### 🍪 Cookie Types & Configuration

#### 1. **Tenant Cookies** (`x-tenant-id`)
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax", // Allow cross-site for tenant switching
  maxAge: 86400, // 24 hours
  path: "/",
  domain: `.${rootDomain}`
}
```

#### 2. **Language Cookies** (`x-lang`)
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", 
  sameSite: "lax",
  maxAge: 31536000, // 1 year
  path: "/",
  domain: `.${rootDomain}`
}
```

#### 3. **Request ID Cookies** (`x-request-id`)
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 3600, // 1 hour
  path: "/",
  domain: `.${rootDomain}`
}
```

#### 4. **Session Cookies**
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict", // Stricter for sessions
  maxAge: 1800, // 30 minutes
  path: "/",
  domain: `.${rootDomain}`
}
```

#### 5. **CSRF Cookies**
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 3600, // 1 hour
  path: "/",
  domain: `.${rootDomain}`
}
```

## 🔧 Implementation

### Using Standard Cookie Options
```typescript
import { createStandardCookieOptions } from '@repo/security';

// Create secure cookie options
const cookieOptions = createStandardCookieOptions(
  rootDomain,    // e.g., "example.com"
  86400,         // maxAge in seconds
  'lax'          // sameSite policy
);
```

### Helper Functions Available
```typescript
import {
  createSessionCookieOptions,
  createTenantCookieOptions,
  createCSRFCookieOptions,
  createLanguageCookieOptions,
  createThemeCookieOptions
} from '@repo/security';
```

## 🚫 Security Violations

### ❌ NEVER Do This
```typescript
// DON'T: Client-accessible cookies
{ httpOnly: false }

// DON'T: Insecure in production
{ secure: false }

// DON'T: No domain (limited to exact hostname)
{ domain: undefined }

// DON'T: No CSRF protection
{ sameSite: 'none' }
```

## 🏗️ Architecture

### Cookie Flow
1. **Middleware sets cookies** with secure options
2. **Server components** read from headers (set by middleware)
3. **Client components** cannot access httpOnly cookies (security feature)
4. **API requests** automatically include cookies

### Domain Strategy
- **Root domain**: `.example.com` 
  - Accessible by: `app.example.com`, `tenant1.example.com`, `api.example.com`
- **Development**: `.localhost` for local development

### Environment Handling
- **Development**: `secure: false` (HTTP allowed)
- **Production**: `secure: true` (HTTPS required)

## 📋 Compliance Checklist

- [ ] All cookies use `httpOnly: true`
- [ ] All cookies use `secure: true` in production
- [ ] All cookies use root-level domain (`.example.com`)
- [ ] Session cookies use `sameSite: "strict"`
- [ ] Tenant/language cookies use `sameSite: "lax"`
- [ ] Appropriate TTL for each cookie type
- [ ] No sensitive data in cookie values

## 🛠️ Testing

### Verify Cookie Security
```bash
# Check cookie headers in browser dev tools
# Ensure all cookies show:
# - HttpOnly flag
# - Secure flag (in production)
# - Proper domain (.example.com)
# - Correct SameSite value
```

This security standard ensures all cookies are protected against XSS, CSRF, and session hijacking attacks while maintaining proper functionality across the multi-tenant application.