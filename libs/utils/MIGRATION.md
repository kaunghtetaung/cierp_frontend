# Utils Organization Refactor - Migration Guide

## 🎯 **New Structure Overview**

```
libs/utils/
├── common/          # Shared utilities (client & server)
│   ├── constants.ts
│   ├── date.ts
│   ├── error-factory.ts
│   ├── error-reporter.ts
│   ├── error-types.ts
│   ├── formatters.ts
│   ├── localization.ts
│   ├── object-utils.ts
│   ├── security.ts
│   ├── url.ts
│   ├── validation.ts
│   └── index.ts
├── client/          # Client-side only utilities
│   ├── api.ts      # Client API helpers
│   ├── auth.ts     # Client auth utilities
│   ├── content.ts  # Client content utilities
│   ├── dom.ts      # DOM manipulation
│   ├── domain.ts   # Client domain helpers
│   └── index.ts
├── server/          # Server-side only utilities
│   ├── api.ts      # Server API helpers
│   ├── content.ts  # Server content utilities
│   ├── domain.ts   # Server domain helpers
│   ├── middleware.ts # Middleware utilities
│   └── index.ts
└── index.ts         # Main export with backward compatibility
```

## 🔄 **Migration Required**

### **Old Imports → New Imports**

```typescript
// ❌ OLD IMPORTS (no longer work)
import { MIDDLEWARE_HEADERS } from '@repo/utils/constants'
import { getTenantIdFromHeaders } from '@repo/utils/middleware-helpers'
import { generateRandomString } from '@repo/utils/crypto'
import { cn } from '@repo/utils/dom'

// ✅ NEW IMPORTS (recommended)
import { MIDDLEWARE_HEADERS } from '@repo/utils/common/constants'
import { getTenantIdFromHeaders } from '@repo/utils/server/middleware'
import { generateSecureRandomString } from '@repo/utils/common/security'
import { cn } from '@repo/utils/client/dom'

// ✅ LEGACY IMPORTS (still work for backward compatibility)
import { MIDDLEWARE_HEADERS, getTenantIdFromHeaders, generateRandomString, cn } from '@repo/utils'
```

### **Domain-Specific Business Logic**

#### **Client-Side API Calls**
```typescript
// Domain-aware client API utilities
import { buildApiUrl, apiGet, apiPost } from '@repo/utils/client/api'
import { getAuthDomainClient, redirectToAuth } from '@repo/utils/client/auth'

const data = await apiGet('/posts')  // Automatically resolves domain
redirectToAuth('/login')             // Handles auth domain routing
```

#### **Server-Side Operations**
```typescript
// Domain-aware server utilities
import { serverApiGet, createAuthRedirect } from '@repo/utils/server/api'
import { getPublicUrlFromHeaders } from '@repo/utils/server/domain'

const posts = await serverApiGet('/posts')  // Forward headers automatically
const authUrl = await createAuthRedirect('/login')
```

## 🎨 **Business Domain Organization**

### **Duplicated by Design**
Some utilities are intentionally duplicated between client and server to provide domain-specific implementations:

- **Domain utilities**: Client uses `window.location`, server uses headers
- **API utilities**: Client uses fetch, server forwards headers
- **Content utilities**: Different caching strategies and data access patterns

### **Common Utilities**
Shared between client and server:
- **Date/time functions**
- **Validation functions**
- **Formatting functions**
- **Security utilities**
- **Error handling**

## ⚠️ **Breaking Changes**

1. **File Locations**: All utility files moved to subdirectories
2. **Import Paths**: Direct file imports need updating
3. **Function Names**: Some renamed for clarity:
   - `generateRandomString` → `generateSecureRandomString` (for new usage)
   - `buildApiUrl` → `buildGenericApiUrl` (in common/url.ts)

## 🔧 **Quick Fix Guide**

### **Fix Import Errors**
```bash
# Find all files with old imports
grep -r "from '@repo/utils/" apps/ libs/ --include="*.ts" --include="*.tsx"

# Update patterns:
# @repo/utils/constants → @repo/utils/common/constants
# @repo/utils/middleware-helpers → @repo/utils/server/middleware  
# @repo/utils/crypto → @repo/utils/common/security
# @repo/utils/validation → @repo/utils/common/validation
```

### **Security Fix Applied**
- ✅ **CRITICAL**: Replaced insecure `Math.random()` with cryptographically secure random generation in auth PKCE flows
- ✅ **AUTH SECURITY**: `generateCodeVerifier()` and `generateState()` now use secure crypto APIs

## 🚀 **Benefits**

1. **Environment Separation**: Clear distinction between client/server code
2. **Business Domain Organization**: Utilities organized by business purpose
3. **Better Tree Shaking**: Import only what you need
4. **Enhanced Security**: Eliminated crypto vulnerabilities
5. **Maintained Backward Compatibility**: Existing imports still work

## 📝 **TODO: Migration Tasks**

1. **Update Import Statements**: Change direct file imports to new paths
2. **Fix Middleware Imports**: Update middleware-helpers imports
3. **Update Security Imports**: Change crypto imports to security
4. **Test Applications**: Verify all functionality works after migration
5. **Update Documentation**: Update any docs referencing old paths

The refactor maintains backward compatibility through the main index.ts, but for best performance and clarity, update to the new organized import structure.
