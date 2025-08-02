# App Schema Module

## Purpose
This module handles **Core module schemas and initialization** for server-side applications, including:
- Module schema definitions (form fields, table configurations, access policies)
- Core service initialization from `/core/initialize` endpoint
- Form field validation rules and configurations
- Data table schemas with columns, actions, and pagination
- Extra action forms for custom module operations
- Access control policies and permissions
- Multilingual support (English/Myanmar)

## Server-Side Only
This module is designed **exclusively for Next.js server-side usage**:
- ✅ Server Components
- ✅ API Routes
- ✅ Server Actions
- ✅ Middleware
- ❌ Client Components (browser)
- ❌ Client-side hooks

## Files Structure
```
libs/appSchema/
├── README.md              # This file - explains purpose
├── appSchema.service.ts   # Core schema service (logic only)
├── wrapper.ts             # React cache wrapper for service
├── package.json           # Library configuration
└── index.ts              # Module exports

libs/types/
├── module-schema.ts           # Base types (languages, icons, etc.)
├── form-types.ts             # Form field and validation types
├── table-types.ts            # Table schema and action types
├── access-policy-types.ts    # Access control and permission types
├── module-schema-interfaces.ts # Main interfaces and response DTOs
└── type-guards.ts            # Runtime validation and utilities
```

## Types
- **All Types**: Defined in `/libs/types/` (centralized and modular)
- **Service Logic**: Clean service implementation in `appSchema.service.ts`
- **Type Safety**: Full TypeScript support with runtime validation

## Usage

### Basic Usage
```typescript
import { getModuleSchemas, type InitializeResponseDto } from '@repo/appSchema';

// Get all module schemas for a tenant
const schemas = await getModuleSchemas(tenantId);
console.log(schemas.modules.length);
console.log(schemas.supportedLanguages);
```

### Get Specific Module
```typescript
import { getModuleBySlug, type ModuleSchema } from '@repo/appSchema';

// Get user module schema
const userModule = await getModuleBySlug(tenantId, 'users');
console.log(userModule?.formFields);
console.log(userModule?.dataTableSchema);
```

### Get Module Components
```typescript
import { 
  getModuleFormFields, 
  getModuleTableSchema,
  getModuleExtraActions 
} from '@repo/appSchema';

// Get specific module components
const formFields = await getModuleFormFields(tenantId, 'users');
const tableSchema = await getModuleTableSchema(tenantId, 'organizations');
const extraActions = await getModuleExtraActions(tenantId, 'users');
```

### Wrapper Class Usage
```typescript
import { AppSchemaWrapper } from '@repo/appSchema';

const wrapper = new AppSchemaWrapper();
const modules = await wrapper.getModules(tenantId);
const hasUsers = await wrapper.hasModule(tenantId, 'users');
```

### Utility Functions
```typescript
import { 
  getCoreModuleNames, 
  isCoreModule, 
  getLocalizedModuleText 
} from '@repo/appSchema';

// Core module utilities
const coreModules = getCoreModuleNames(); // ['applications', 'organizations', ...]
const isCore = isCoreModule('users'); // true

// Localization
const localizedText = getLocalizedModuleText(
  { en: 'Users', mm: 'အသုံးပြုသူများ' }, 
  'mm'
); // 'အသုံးပြုသူများ'
```

## API Endpoint
- `GET /core/initialize` - Get complete module schemas with access policies

## Core Modules
The system includes 6 core modules:
1. **Applications** (`applications`) - App configurations and settings
2. **Organizations** (`organizations`) - Organization management 
3. **Departments** (`departments`) - Department hierarchy
4. **Users** (`users`) - User accounts and profiles
5. **Roles** (`roles`) - User roles and permissions
6. **Groups** (`groups`) - User groups and team structures

## Caching
- **Redis-based caching** with 24-hour TTL
- **React.cache** for request-level deduplication
- **Cache key**: `ciApp:{tenantId}:App:Initialize:core`
- **Cache management**: Built-in cache clearing functions

## Error Handling
- Graceful degradation with null/empty returns
- Comprehensive error logging
- Tenant ID validation
- Runtime type validation with type guards

## TypeScript Support
- **Full type safety** for all operations
- **Runtime validation** with custom type guards
- **Modular type definitions** for better maintainability
- **Utility types** for common operations

## Dependencies
- `@repo/types` - Type definitions
- `@repo/utils` - Server-side utilities (domain, validation)
- `@repo/api` - HTTP client for API communication
- `@repo/cache` - Redis caching system
- `react` - React.cache for request deduplication