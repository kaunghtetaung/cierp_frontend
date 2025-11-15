# VS Code Debugging Setup

## Quick Debug Steps:

### 1. Set Breakpoints
- Open `libs/auth/token-manager.ts` 
- The `debugger;` statement is already added at line 309
- Open `libs/tenant/tenant-service.ts`
- The `debugger;` statement is already added at line 23

### 2. Start Debugging
Choose one of these methods:

#### Method A: Debug publicWeb app
1. Press `F5` or go to "Run and Debug" tab
2. Select **"Debug publicWeb"** from dropdown
3. Click Start Debugging

#### Method B: Debug ciERP app  
1. Press `F5` or go to "Run and Debug" tab
2. Select **"Debug ciERP"** from dropdown  
3. Click Start Debugging

### 3. Trigger the Flow
1. Open browser to `http://localhost:3000` (publicWeb) or `http://localhost:3001` (ciERP)
2. The debugger should hit the breakpoint in `tenant-service.ts` first
3. Step through the code to see the flow
4. When it hits `token-manager.ts`, check the environment variables

### 4. Debug Environment Variables
When stopped at the breakpoint in `fetchInitializerTokenFromOIDC()`:

1. **Check Variables Panel**: Look at `clientId` and `clientSecret`
2. **Check Console**: The console.log will show environment details
3. **Evaluate Expressions**: 
   - `process.env.TENANT_API_CLIENT_ID`
   - `process.env.TENANT_API_CLIENT_SECRET`  
   - `Object.keys(process.env).filter(k => k.includes('TENANT'))`

### 5. Debug Flow
The call stack should show:
```
fetchInitializerTokenFromOIDC() [token-manager.ts:309]
↑ getInitializerToken() [token-manager.ts:53]  
↑ getSettings() [tenant-service.ts:31]
↑ getTenantSetting() [tenant-service.ts:71]
↑ getCurrentTenantForClient() [wrapper.ts:39]
↑ Layout component
```

## Common Issues to Check:
1. **Environment variables not loaded**: Check if `.env.local` exists
2. **Wrong Node environment**: Verify `NODE_ENV=development`
3. **Build cache issues**: Try clearing `.next` folder
4. **Port conflicts**: Make sure ports 9230/9231 are free

## Cleanup After Debugging:
Remember to remove the `debugger;` statements when done:
- `libs/auth/token-manager.ts:309`
- `libs/tenant/tenant-service.ts:23`