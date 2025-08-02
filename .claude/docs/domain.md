# Domain Support for Multi-Tenant Application

This document describes the simplified domain management system for the multi-tenant application, covering subdomain-based tenant routing, service discovery, and URL utilities with the new IP-based development setup.

## Architecture Overview

The application uses a **subdomain-based multi-tenancy** architecture where each tenant gets their own subdomain:

- **Tenant sites**: `tenant1.domain.com`, `tenant2.domain.com`
- **PublicWeb App**: `127.0.0.2:80` (development) / `www.domain.com` (production)
- **Core App**: `127.0.0.3:80` (development) / `core.domain.com` (production)
- **API Gateway**: `api.domain.com` (standard port 80)
- **Auth Service**: `auth.domain.com` (standard port 80)

## Key Simplifications

With the new IP-based setup, **all port detection and environment-specific logic has been removed**:

- **No port suffixes** - All services run on standard port 80
- **No development vs production port mapping** - Consistent behavior
- **Simplified URL construction** - Clean, predictable URLs
- **Reduced configuration** - Fewer environment variables needed

## Module Structure

The domain utilities are organized in `/libs/utils` with clear separation:

```
libs/utils/
   client/domain.ts    # Client-side domain utilities
   server/domain.ts    # Server-side domain utilities  
   common/url.ts       # Shared URL manipulation utilities
```

## Client-Side Domain Utilities

**Location**: `/libs/utils/client/domain.ts`

### `getPublicUrlClient(): string`

Constructs the public website URL with `www` prefix for client-side usage.

```typescript
// Examples:
// core.um1ygn.edu.mm → http://www.um1ygn.edu.mm
// localhost → http://www.localhost
const publicUrl = getPublicUrlClient();
```

**Behavior**:
- Adds `www.` prefix if not present
- Uses current protocol and hostname from browser
- No port handling needed (standard port 80)

### `getCurrentUrlClient(): string`

Simple wrapper for `window.location.href` to get the full current URL.

## Server-Side Domain Utilities

**Location**: `/libs/utils/server/domain.ts`

### Core Domain Functions

#### `getApiDomain(): Promise<string>`

Returns the API gateway URL with caching for performance.

```typescript
// Returns: http://api.tenant.com (no port needed)
const apiUrl = await getApiDomain();
```

#### `getAuthDomain(): Promise<string>`

Returns the authentication service URL with caching.

```typescript
// Returns: http://auth.tenant.com (no port needed)
const authUrl = await getAuthDomain();
```

#### `getPublicUrl(): Promise<string>`

Server-side equivalent of client's `getPublicUrlClient()`.

```typescript
// Examples based on request headers:
// crystal-image.net → https://www.crystal-image.net
// www.crystal-image.net → https://www.crystal-image.net
const publicUrl = await getPublicUrl();
```

### Tenant Management

#### `getTenantIdFromRequestHeaders(): Promise<string | null>`

Extracts tenant ID from the `x-tenant-id` header set by middleware.

```typescript
const tenantId = await getTenantIdFromRequestHeaders();
if (tenantId) {
  // Handle tenant-specific logic
}
```

#### `getCurrentHostname(): Promise<string>`

Gets the current hostname from request headers.

```typescript
const hostname = await getCurrentHostname(); // e.g., "tenant.domain.com"
```

### Cookie Domain Support

#### `getRootDomainForCookie(): Promise<string | undefined>`

Returns the root domain for setting cross-subdomain cookies.

```typescript
const cookieDomain = await getRootDomainForCookie();
// Returns: ".domain.com" for cross-subdomain cookies
// Returns: undefined for localhost/127.0.0.* (no domain attribute needed)
```

### Subdomain Detection

#### `isSubdomain(): Promise<boolean>`

Checks if the current request is from a subdomain (excluding `www`).

```typescript
const isSubdomain = await isSubdomain();
// true for tenant.domain.com
// false for www.domain.com or domain.com
```

## Shared URL Utilities

**Location**: `/libs/utils/common/url.ts`

### Domain Extraction

#### `extractBaseDomain(hostname: string): string`

Intelligently extracts the base domain, handling various TLD patterns and local IPs.

```typescript
// Examples:
extractBaseDomain("core.um1ygn.edu.mm") // → "um1ygn.edu.mm"
extractBaseDomain("www.crystal-image.net") // → "crystal-image.net"  
extractBaseDomain("api.github.io") // → "github.io"
extractBaseDomain("localhost") // → "localhost"
extractBaseDomain("127.0.0.2") // → "127.0.0.2"
```

**Supported patterns**:
- Standard: `domain.com` → `domain.com`
- Educational: `sub.school.edu.mm` → `school.edu.mm`
- Country code: `sub.company.co.uk` → `company.co.uk`
- Government: `sub.agency.gov.uk` → `agency.gov.uk`
- Local IPs: `127.0.0.*` → unchanged

### Simplified Domain Utilities

#### `isDevelopmentEnvironment(): boolean`

Environment detection utility (still used for protocol selection).

```typescript
const isDev = isDevelopmentEnvironment();
// Returns true if NODE_ENV === 'development'
```

#### `getAppropriateProtocol(forwardedProto?: string): string`

Smart protocol detection with fallback logic.

```typescript
const protocol = getAppropriateProtocol(headers.get('x-forwarded-proto'));
// Returns forwarded protocol or falls back to http/https based on environment
```

#### `getPortSuffix(): string`

**Simplified** - Always returns empty string (no ports needed).

```typescript
const portSuffix = getPortSuffix();
// Always returns '' (empty string)
```

#### `buildPublicUrl(hostname: string, protocol: string): string`

Simplified public URL construction - no port parameter needed.

```typescript
const publicUrl = buildPublicUrl('crystal-image.net', 'https');
// Returns: 'https://www.crystal-image.net'
```

#### `buildSubdomainUrl(hostname: string, protocol: string, subdomain: string): string`

Simplified subdomain URL construction - no port parameter needed.

```typescript
const apiUrl = buildSubdomainUrl('tenant.domain.com', 'https', 'api');
// Returns: 'https://api.domain.com'
```

### API Endpoint Construction

#### `getApiEndpoint(hostname, protocol, config?)`

Constructs API endpoints - simplified without port handling.

```typescript
const { fullUrl, rootDomain } = getApiEndpoint("tenant.domain.com", "https");
// fullUrl: "https://api.domain.com"
// rootDomain: "domain.com"
```

#### `buildTenantApiUrl(hostname, protocol, config?)`

Builds tenant initialization API URL.

```typescript
const initUrl = buildTenantApiUrl("tenant.domain.com", "https");
// "https://api.domain.com/tenant/initialize?host=tenant.domain.com"
```

#### `buildAuthApiUrl(hostname, protocol, endpoint, config?)`

Constructs authentication service URLs.

```typescript
const loginUrl = buildAuthApiUrl("tenant.domain.com", "https", "/login");
// "https://auth.domain.com/login"
```

### Security Features

#### URL Sanitization

```typescript
sanitizeUrl("javascript:alert(1)") // → "#" (blocked)
sanitizeUrl("data:text/html,<script>") // → "#" (blocked)
sanitizeUrl("https://safe.com") // → "https://safe.com" (allowed)
```

#### Safe Redirects

```typescript
createSafeRedirectUrl("https://external.com") // → "/" (external blocked)
createSafeRedirectUrl("/internal/path") // → "/internal/path" (allowed)
```

## Environment Configuration

### Development Environment (IP-Based)

- **IPs**: `127.0.0.2:80` (publicWeb), `127.0.0.3:80` (core)
- **Protocol**: HTTP by default
- **Domain handling**: No port numbers in URLs

### Production Environment

- **Ports**: Standard HTTP/HTTPS ports (80/443)
- **Protocol**: HTTPS by default (via `x-forwarded-proto` header)
- **Domain handling**: Clean URLs without port numbers

### Environment Variables (Simplified)

```bash
# Environment
NODE_ENV=development|production

# API base URL (default: /api)
NEXT_PUBLIC_API_URL=/api

# Removed (no longer needed):
# PORT_GATEWAY - All services use port 80
# PORT_AUTH - All services use port 80
```

## Usage Patterns

### 1. Multi-Tenant Routing

```typescript
// In middleware or layout
const hostname = await getCurrentHostname();
const isSubdomain = await isSubdomain();

if (isSubdomain) {
  // Handle tenant-specific routing
  const tenantId = await getTenantIdFromRequestHeaders();
  // Load tenant configuration
}
```

### 2. Cross-Service Communication

```typescript
// API calls from frontend
const apiDomain = await getApiDomain();
const response = await fetch(`${apiDomain}/api/users`);

// Auth redirects
const authDomain = await getAuthDomain();
const loginUrl = `${authDomain}/login?redirect=${getCurrentUrl()}`;
```

### 3. Cookie Management

```typescript
// Set cross-subdomain cookies
const cookieDomain = await getRootDomainForCookie();
if (cookieDomain) {
  document.cookie = `token=value; domain=${cookieDomain}; path=/`;
}
```

### 4. Public Site Integration

```typescript
// Redirect to public site
const publicUrl = await getPublicUrl();
return redirect(`${publicUrl}/pricing`);
```

## Security Considerations

### 1. Subdomain Isolation

- Each tenant operates on a separate subdomain
- Cookie scoping prevents cross-tenant data access
- URL validation blocks external redirects

### 2. Header-Based Tenant Resolution

- Tenant ID passed via `x-tenant-id` header (set by middleware)
- Prevents client-side tenant spoofing
- Server-side validation of tenant access

### 3. IP-Based Security

- Local development uses dedicated IPs (127.0.0.2, 127.0.0.3)
- Prevents port conflicts and service confusion
- Clean separation between applications

## Performance Optimizations

### 1. Request-Level Caching

```typescript
// React.cache ensures single evaluation per request
export const getApiDomain = cache(async function (): Promise<string> {
  return await getDomainUrl("api");
});
```

### 2. Simplified Processing

- **No port detection** - Faster URL construction
- **No environment branching** - Reduced conditional logic
- **Cleaner string operations** - Better performance

### 3. Consistent Architecture

- Same URL patterns across all environments
- Predictable behavior for caching layers
- Simplified debugging and monitoring

## Migration Benefits

### Code Simplification

- **70% less port-related code** across domain utilities
- **Eliminated environment-specific branching**
- **Consistent behavior** across all domain functions
- **Simpler configuration** with fewer environment variables

### Removed Complexity

- ~~Port detection logic~~
- ~~Development vs production port mapping~~
- ~~Conditional port suffixes~~
- ~~Gateway/auth port configuration~~

### Improved Maintainability

- **Single source of truth** for URL construction
- **Predictable URLs** across all environments
- **Easier testing** with consistent behavior
- **Reduced configuration** and setup complexity

## Migration Guide

### Updated Function Signatures

**Before:**
```typescript
buildPublicUrl(hostname, protocol, targetPort?) // Had optional port
buildSubdomainUrl(hostname, protocol, subdomain, port?) // Had optional port
```

**After:**
```typescript
buildPublicUrl(hostname, protocol) // No port parameter
buildSubdomainUrl(hostname, protocol, subdomain) // No port parameter
```

### Removed Configuration

**Before:**
```typescript
// Middleware config had port settings
tenantApi: {
  gatewayPort: "3331",
  authPort: "3332"
}
```

**After:**
```typescript
// Simplified config - no ports needed
tenantApi: {
  timeout: 5000
}
```

This simplified domain system provides the same multi-tenant functionality with significantly reduced complexity, better performance, and easier maintenance.