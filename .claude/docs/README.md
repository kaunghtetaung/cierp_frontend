# Documentation Quick Reference

## 🚀 For AI Assistants - Start Here

### Essential Reading Order
1. **[domain.md](domain.md)** - Multi-tenant domain handling (MUST READ FIRST)
2. **[auth.md](auth.md)** - Authentication system architecture
3. **[security.md](security.md)** - Session management patterns
4. **[redis-cache.md](redis-cache.md)** - Caching strategies

### Token-Efficient Approach
**Before writing code, always:**
1. Check relevant documentation file
2. Look for existing patterns in similar modules  
3. Use path aliases from CLAUDE.md
4. Follow established architectural patterns

## 📋 Documentation Categories

### 🔐 Authentication & Security
| File | Purpose | Key Concepts |
|------|---------|--------------|
| [auth.md](auth.md) | Token management | OIDC, Strategy pattern, Token priorities |
| [security.md](security.md) | Session management | Strategy pattern, Validation, Encryption |

### 🌐 Infrastructure
| File | Purpose | Key Concepts |
|------|---------|--------------|
| [domain.md](domain.md) | Multi-tenant domains | Subdomain routing, URL building |
| [redis-cache.md](redis-cache.md) | Caching system | Tenant-scoped keys, TTL, Invalidation |
| [tenant.md](tenant.md) | Multi-tenancy | Middleware, Resolution, Context |

### 📚 Libraries & Utilities  
| File | Purpose | Key Concepts |
|------|---------|--------------|
| [utils.md](utils.md) | Common utilities | Validation, Formatters, Security |
| [api.md](api.md) | HTTP patterns | Clients, Interceptors, Error handling |
| [language.md](language.md) | i18n system | Localization, Context, Providers |

### 🏗️ Application Modules
| File | Purpose | Key Concepts |
|------|---------|--------------|
| [content.md](content.md) | CMS system | Content management, Caching |
| [appSchema.md](appSchema.md) | Schema system | Validation, Types, Interfaces |

## 🎯 Common Coding Patterns

### Multi-tenant Pattern
```typescript
// Always include tenantId in operations
const cacheKey = CacheKeys.userToken(tenantId, userId);
const domain = await getAuthDomain(); // No port handling needed
```

### Strategy Pattern Usage
```typescript
// Authentication
class TokenManager {
  constructor(strategies: TokenStrategy[]) { ... }
}

// Session Management  
class SessionManager {
  constructor(
    private validationStrategy: SessionValidationStrategy
  ) { ... }
}
```

### Dependency Injection
```typescript
// Services inject dependencies
constructor(
  private cache: TokenCache,
  private oidcClient: OIDCClient
) { ... }
```

### React 19 Patterns
```typescript
// Server Actions
async function loginAction(formData: FormData) {
  'use server'
  // Authentication logic
}

// use() Hook for promises
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);
  return <div>{user.name}</div>;
}

// Server Components with async
async function TenantPage({ params }: { params: { tenantId: string } }) {
  const tenant = await getTenant(params.tenantId);
  return <TenantDashboard tenant={tenant} />;
}
```

## 📍 File Path Quick Reference

### Authentication Files
- `/libs/auth/managers/token-manager.ts` - Main token orchestration
- `/libs/auth/managers/*-token-strategy.ts` - Strategy implementations
- `/libs/auth/clients/oidc-client.ts` - OIDC communication
- `/libs/auth/types/token-types.ts` - Type definitions

### Security Files
- `/libs/security/managers/session-manager.ts` - Session orchestration
- `/libs/security/strategies/*-strategy.ts` - Strategy implementations
- `/libs/security/core/validation.ts` - Security validation
- `/libs/security/core/encryption.ts` - Encryption utilities

### Cache Files
- `/libs/cache/unified-cache.ts` - Main cache class
- `/libs/cache/cache-utils.ts` - Helper functions
- `/libs/cache/types.ts` - Cache type definitions

### Domain Files
- `/libs/utils/common/url.ts` - Simplified domain utilities (no ports)
- `/libs/utils/server/domain.ts` - Server-side domain functions (no ports)  
- `/libs/utils/client/domain.ts` - Client-side domain functions (no ports)

## 🔧 Development Shortcuts

### Quick Commands
```bash
# Start development
npm run dev

# Type checking  
npm run type-check

# Linting
npm run lint

# Build all
npm run build
```

### Environment Variables
- `NODE_ENV` - Environment mode
- `REDIS_URL` - Redis connection
- `OIDC_*` - OIDC configuration
- `TENANT_*` - Multi-tenant settings

### IP-Based Development Setup
- PublicWeb: `127.0.0.2:80`
- Core: `127.0.0.3:80`
- All services: Standard port 80
- No port detection needed

---
**Last Updated**: July 2025 | Use this for efficient AI-assisted coding