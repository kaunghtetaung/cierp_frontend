# Authentication Session Security Configuration

This document explains the configurable session security settings and their implications.

## Environment Variables

### `AUTH_SESSION_IP_VALIDATION`

Controls whether sessions are bound to specific IP addresses.

#### When `AUTH_SESSION_IP_VALIDATION=true`:
- ✅ **SECURITY**: Prevents session hijacking if someone steals your session cookie
- ✅ **PROTECTION**: Stolen sessions cannot be used from different IP addresses  
- ❌ **LIMITATION**: Users will be logged out when IP changes (WiFi switching, VPN, mobile networks)
- ❌ **CROSS-SUBDOMAIN**: May break cross-subdomain authentication in some network configurations

#### When `AUTH_SESSION_IP_VALIDATION=false`:
- ✅ **FLEXIBILITY**: Users stay logged in when switching networks or subdomains
- ✅ **USER EXPERIENCE**: No unexpected logouts due to IP changes
- ✅ **CROSS-SUBDOMAIN**: Works seamlessly across subdomains
- ⚠️ **SECURITY RISK**: Stolen session cookies can be used from any IP address

### `AUTH_SESSION_USER_AGENT_VALIDATION`

Controls whether sessions are bound to specific browsers/devices.

#### When `AUTH_SESSION_USER_AGENT_VALIDATION=true`:
- ✅ **SECURITY**: Detects if session is used from different browser or device
- ✅ **PROTECTION**: Prevents session use after browser fingerprint changes
- ❌ **LIMITATION**: Users logged out when browser updates or switching browsers
- ❌ **MAINTENANCE**: Breaks legitimate use during browser updates

#### When `AUTH_SESSION_USER_AGENT_VALIDATION=false`:
- ✅ **FLEXIBILITY**: Works across browser updates and different browsers
- ✅ **USER EXPERIENCE**: No unexpected logouts due to browser changes
- ✅ **MAINTENANCE**: No issues during browser or system updates
- ⚠️ **SECURITY RISK**: Session can be used from any browser if cookie is stolen

## Recommended Settings

### Cross-Subdomain Applications (Current Setup)
```bash
AUTH_SESSION_IP_VALIDATION=false
AUTH_SESSION_USER_AGENT_VALIDATION=false
```

### High-Security Single-Domain Applications
```bash
AUTH_SESSION_IP_VALIDATION=true
AUTH_SESSION_USER_AGENT_VALIDATION=true
```

### Development/Testing
```bash
AUTH_SESSION_IP_VALIDATION=false
AUTH_SESSION_USER_AGENT_VALIDATION=false
```

### Consumer-Facing Applications
```bash
AUTH_SESSION_IP_VALIDATION=false
AUTH_SESSION_USER_AGENT_VALIDATION=false
```

## Security Impact Summary

### Current Configuration Benefits
- Seamless cross-subdomain authentication
- Better user experience (no unexpected logouts)
- Simplified network configuration
- Works with dynamic IPs and browser updates

### Security Measures Still Active
- ✅ Session expiration (30 minutes)
- ✅ HTTPS enforcement (in production)
- ✅ HttpOnly cookies (prevents XSS access)
- ✅ SameSite cookies (prevents CSRF)
- ✅ Tenant isolation (sessions scoped to tenants)
- ✅ Activity tracking (session monitoring)
- ✅ Session limits (max concurrent sessions)

### Monitoring Recommendations
When IP/UserAgent validation is disabled, implement additional monitoring:

1. **Unusual session patterns**: Multiple IPs for same session
2. **Geographic anomalies**: Session used from different countries  
3. **Concurrent usage**: Same session active from multiple locations
4. **Session duration**: Sessions active for suspicious periods
5. **Device fingerprinting**: Alternative browser/device tracking
6. **Behavioral analysis**: Unusual user activity patterns

## Configuration Examples

### Production Environment File
```bash
# Cross-subdomain production setup
NODE_ENV=production
AUTH_SESSION_IP_VALIDATION=false
AUTH_SESSION_USER_AGENT_VALIDATION=false
```

### High-Security Environment File  
```bash
# Banking/finance high-security setup
NODE_ENV=production
AUTH_SESSION_IP_VALIDATION=true
AUTH_SESSION_USER_AGENT_VALIDATION=true
```

### Development Environment File
```bash
# Development setup
NODE_ENV=development
AUTH_SESSION_IP_VALIDATION=false
AUTH_SESSION_USER_AGENT_VALIDATION=false
```

## Testing Your Configuration

To verify your configuration is working:

1. **Check logs**: Look for session validation debug messages
2. **Test cross-subdomain**: Navigate between subdomains without logout
3. **Test network changes**: Switch WiFi networks and verify session persists
4. **Test browser updates**: Update browser and verify no unexpected logout

## Risk Assessment

| Scenario | IP Validation | UserAgent Validation | Security Level | User Experience |
|----------|---------------|---------------------|----------------|-----------------|
| Banking/Finance | ✅ Enabled | ✅ Enabled | 🔒 High | 😐 Moderate |
| Corporate Internal | ✅ Enabled | ❌ Disabled | 🔒 Medium-High | 😊 Good |
| Business Apps | ❌ Disabled | ❌ Disabled | 🔒 Medium | 😊 Excellent |
| Consumer Apps | ❌ Disabled | ❌ Disabled | 🔒 Medium | 😊 Excellent |
| Development | ❌ Disabled | ❌ Disabled | ⚠️ Low | 😊 Excellent |

Choose the configuration that best balances security needs with user experience for your specific use case.