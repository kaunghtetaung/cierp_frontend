# Frontend Multi-Tenant Monorepo Project

## Quick Start for AI Coding
**Essential files to read first:** `domain.md`, `auth.md`, `security.md`, `redis-cache.md`

## Project Architecture Overview
Multi-tenant Next.js 15 monorepo with modular authentication, caching, and security systems.

### Core Applications
- **`apps/publicWeb`** - Multi-tenant public website (127.0.0.2:80)
- **`apps/core`** - Enterprise Resource Planning app (127.0.0.3:80)

### Key Libraries
- **`libs/auth`** - OIDC authentication with token strategies
- **`libs/security`** - Session management with strategy pattern
- **`libs/cache`** - Redis caching with tenant scoping
- **`libs/utils`** - Domain utilities and validation
- **`libs/tenant`** - Multi-tenant middleware and resolution
- **`libs/types`** - Shared TypeScript interfaces

## Technology Stack
- **Framework**: Next.js 15.4 App Router
- **React**: React 19 with latest features
- **Authentication**: OIDC with JWT tokens
- **Caching**: Redis with tenant-scoped keys
- **Security**: Session management, CSRF protection
- **Database**: Multi-tenant architecture
- **Styling**: Tailwind CSS + shadcn/ui
- **Package Manager**: pnpm with workspaces

## Development Commands
```bash
# Start all applications
npm run dev

# Individual apps
cd apps/publicWeb && npm run dev  # 127.0.0.2:80
cd apps/core && npm run dev       # 127.0.0.3:80

# Quality checks
npm run lint
npm run type-check
npm run build
```

## Documentation Index

### 🔐 Authentication & Security
- **[auth.md](docs/auth.md)** - Token management, OIDC, strategies
- **[security.md](docs/security.md)** - Session management, validation, encryption

### 🌐 Infrastructure & Core
- **[domain.md](docs/domain.md)** - Multi-tenant domain utilities
- **[redis-cache.md](docs/redis-cache.md)** - Caching patterns and strategies
- **[tenant.md](docs/tenant.md)** - Multi-tenant middleware and resolution

### 📚 Libraries & Utilities
- **[utils.md](docs/utils.md)** - Common utilities and validation
- **[api.md](docs/api.md)** - HTTP client and API patterns
- **[language.md](docs/language.md)** - Internationalization system

### 🏗️ Application Modules
- **[content.md](docs/content.md)** - Content management system
- **[appSchema.md](docs/appSchema.md)** - Schema definitions and validation

## AI Coding Guidelines

### Token Optimization
1. **Read documentation first** before exploring code
2. **Use specific file paths** from documentation
3. **Reference existing patterns** in similar modules
4. **Check domain.md** for simplified multi-tenant patterns
5. **Review auth.md** for authentication flows
6. **No port detection needed** - all services use port 80

### Code Patterns
- **Strategy Pattern**: Used in auth and session management
- **Dependency Injection**: SessionManager, TokenManager
- **Factory Pattern**: Cache instances, OIDC clients
- **Multi-tenant**: All services are tenant-scoped
- **React 19**: Server Components, Actions, use() hook
- **Next.js 15.4**: Enhanced App Router, improved caching

### Security Considerations
- All tokens are tenant-scoped
- Sessions use strategy pattern for validation
- CSRF protection on all forms
- XSS validation on user inputs
- Redis keys include tenant prefixes

### Common Workflows
1. **Authentication**: OIDC → Token strategies → Cache storage
2. **Session Management**: Creation → Validation → Renewal → Cleanup
3. **Multi-tenant**: Domain resolution → Tenant context → Scoped operations
4. **Caching**: Tenant-scoped keys → TTL management → Invalidation
5. **Domain Resolution**: IP-based apps → Standard port 80 → No port detection

## Path Aliases
```typescript
@repo/auth/*      - Authentication modules
@repo/security/*  - Security and session management
@repo/cache/*     - Redis caching utilities
@repo/utils/*     - Common utilities
@repo/tenant/*    - Multi-tenant middleware
@repo/types/*     - Shared TypeScript types
```

## Environment Setup
- Node.js 18+
- Redis server for caching
- OIDC provider configuration
- IP-based development setup (127.0.0.2, 127.0.0.3)
- All services on standard port 80

## Key Dependencies
- Next.js 15.4, React 19
- Redis for caching
- OIDC for authentication
- Tailwind CSS + shadcn/ui
- TypeScript (strict mode)

---
**Last Updated**: July 2025 | **Documentation Version**: 2.0