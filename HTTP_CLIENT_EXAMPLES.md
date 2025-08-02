# HTTP Client Response Examples

## Standard API Response Structure

### Success Response Format
```typescript
interface ApiResponse<T> {
  data: T;                    // The actual response data
  message: string;            // Success message
  success: boolean;           // Always true for successful responses
  timestamp: Date;            // When the response was created
}
```

### Error Response Format
```typescript
interface ApiResponse<T> {
  data: null;                 // No data on error
  message: string;            // Error message
  success: false;             // Always false for errors
  error: string;              // Detailed error description
  timestamp: Date;            // When the error occurred
}
```

## Real Usage Examples

### 1. Tenant Service Examples

#### ✅ Successful Tenant Fetch
```typescript
// Input
const response = await httpClient.get<TenantSettingsDto>('/tenant/settings', { id: 'tenant123' });

// Response
{
  data: {
    id: "tenant123",
    name: "Crystal Image Corp",
    isActive: true,
    domains: ["crystal-image.com"],
    applications: ["publicWeb", "ciERP"]
  },
  message: "Tenant settings retrieved successfully",
  success: true,
  timestamp: new Date("2024-01-15T10:30:00Z")
}
```

#### ❌ Tenant Not Found Error
```typescript
// Input
const response = await httpClient.get<TenantSettingsDto>('/tenant/settings', { id: 'nonexistent' });

// Response
{
  data: null,
  message: "Tenant nonexistent not found",
  success: false,
  error: "Tenant nonexistent not found",
  timestamp: new Date("2024-01-15T10:30:00Z")
}
```

#### ❌ Authentication Error
```typescript
// Input (without proper token)
const response = await httpClient.get<TenantSettingsDto>('/tenant/settings', { id: 'tenant123' });

// Response
{
  data: null,
  message: "Unauthorized: Invalid or expired token",
  success: false,
  error: "HTTP 401: Unauthorized",
  timestamp: new Date("2024-01-15T10:30:00Z")
}
```

### 2. Token Manager Examples

#### ✅ Successful Token Fetch
```typescript
// Input
const response = await authHttpClient.post('/oidc/token', tokenRequestData);

// Response
{
  data: {
    access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    expires_in: 3600,
    token_type: "Bearer",
    scope: "tenant:read"
  },
  message: "Token generated successfully",
  success: true,
  timestamp: new Date("2024-01-15T10:30:00Z")
}
```

#### ❌ Invalid Credentials Error
```typescript
// Input (wrong client_secret)
const response = await authHttpClient.post('/oidc/token', invalidCredentials);

// Response
{
  data: null,
  message: "Invalid client credentials",
  success: false,
  error: "HTTP 401: Unauthorized - Invalid client credentials",
  timestamp: new Date("2024-01-15T10:30:00Z")
}
```

### 3. Domain Resolution Examples

#### ✅ Successful Domain Resolution
```typescript
// Input
const response = await httpClient.get('/tenant/initialize', { host: 'crystal-image.com' });

// Response
{
  data: {
    id: "tenant123",
    tenantId: "tenant123",
    domain: "crystal-image.com",
    isActive: true
  },
  message: "Tenant resolved successfully",
  success: true,
  timestamp: new Date("2024-01-15T10:30:00Z")
}
```

#### ❌ Domain Not Found Error
```typescript
// Input
const response = await httpClient.get('/tenant/initialize', { host: 'unknown-domain.com' });

// Response
{
  data: null,
  message: "No tenant found for domain: unknown-domain.com",
  success: false,
  error: "HTTP 404: Not Found - No tenant found for domain",
  timestamp: new Date("2024-01-15T10:30:00Z")
}
```

## Error Handling in Services

### How Services Handle Responses

```typescript
// In tenant-service.ts
async getSettings(tenantId: string): Promise<TenantSettingsDto> {
  const response: ApiResponse<TenantSettingsDto> = await this.httpClient.get(
    `/tenant/settings`,
    { id: tenantId }
  );

  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch tenant settings');
  }

  return response.data; // Only return data on success
}
```

### Error Types and Messages

#### Network Errors
```typescript
{
  data: null,
  message: "Network request failed",
  success: false,
  error: "TypeError: fetch failed",
  timestamp: new Date()
}
```

#### Timeout Errors
```typescript
{
  data: null,
  message: "Request timeout",
  success: false,
  error: "AbortError: The operation was aborted",
  timestamp: new Date()
}
```

#### Server Errors (500)
```typescript
{
  data: null,
  message: "Internal server error",
  success: false,
  error: "HTTP 500: Internal Server Error",
  timestamp: new Date()
}
```

#### Validation Errors (400)
```typescript
{
  data: null,
  message: "Validation failed",
  success: false,
  error: "HTTP 400: Bad Request - Invalid tenant ID format",
  timestamp: new Date()
}
```

## HTTP Client Configuration

```typescript
// Default configuration
const httpClient = createHttpClient({
  baseURL: 'https://api.tenant.com:3331',
  timeout: 30000,
  enableAuth: true,
  enableCSRF: false,
  retryAttempts: 3,
  retryDelay: 1000
});
```

## Key Features

1. **Consistent Structure**: All responses follow the same `ApiResponse<T>` format
2. **Error Handling**: Standardized error messages and codes
3. **Retry Logic**: Automatic retry for network failures
4. **Token Management**: Automatic token refresh on 401 errors
5. **Type Safety**: Full TypeScript support with generic types
6. **Caching**: Built-in response caching capabilities
7. **Multi-tenant**: Automatic tenant context handling

This standardized approach ensures consistent API communication across all services while providing robust error handling and type safety.