# Cross-Subdomain Session Debug Test

## Issue Summary
Users authenticated on `www.crystal-image.net` appear as signed out on `core.crystal-image.net` despite correct cookie domain settings.

## Debug Results (Before Fix)
- **www.crystal-image.net**: `session=ff3906f5b1e3a6d2d50b...`, `tenantId: "688602a2c856ff5ae49faecb"`
- **core.crystal-image.net**: `session=61273c8e51b6bee37048...`, `tenantId: null`

## Problem Analysis
Different session IDs indicate new sessions being created instead of sharing existing ones. The `tenantId: null` on core suggests middleware was not properly setting tenant context for API routes.

## Fix Applied
Updated `/Users/kaunghtet/Projects/frontend/apps/core/src/middleware.ts` to include API routes in the matcher pattern so middleware can set proper tenant context.

## Next Steps
Test the debug endpoints again to verify:
1. Both subdomains now have the same tenant ID
2. Sessions are properly shared (same session ID)
3. Cross-subdomain authentication works

## Test Commands
```bash
# Test www subdomain
curl -H "Cookie: session=your-session-cookie" http://www.crystal-image.net/api/auth/debug

# Test core subdomain  
curl -H "Cookie: session=your-session-cookie" http://core.crystal-image.net/api/auth/debug
```