# `/api/logs` Endpoint Security Documentation

## Overview

The `/api/logs` endpoint receives client-side console logs from browsers and forwards them to Loki for centralized logging. This document outlines the security measures implemented to protect against abuse.

---

## 🔒 Security Measures

### 1. **Rate Limiting (Per IP)**

**Implementation:** In-memory rate limiter with automatic cleanup

**Limits:**
- **30 requests per minute** per IP address
- **50 logs maximum** per batch
- Automatic window reset after 60 seconds

**Response Headers:**
```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
Retry-After: 60  (when rate limited)
```

**HTTP Status Codes:**
- `429 Too Many Requests` - Rate limit exceeded

**Protection Against:**
- ✅ DDoS attacks
- ✅ Log spam from single source
- ✅ Resource exhaustion

---

### 2. **Origin Validation (Same-Origin Only)**

**Implementation:** Validates `Origin` and `Referer` headers

**Allowed Origins:**
- Same hostname as request (same-origin policy)
- Example: Request to `app.um1ygn.edu.mm` only accepts logs from `app.um1ygn.edu.mm`

**Rejected:**
- ❌ Cross-origin requests (different domain)
- ❌ Requests without origin/referer headers
- ❌ External API calls

**HTTP Status Codes:**
- `403 Forbidden` - Invalid origin

**Protection Against:**
- ✅ CSRF attacks
- ✅ External abuse from other websites
- ✅ API scraping

---

### 3. **Input Sanitization**

**Message Sanitization:**
- Maximum length: **1000 characters**
- Removes: `<script>`, `<iframe>`, `javascript:`, event handlers
- Replaces dangerous patterns with safe placeholders

**Example:**
```javascript
// Input
console.log('<script>alert("xss")</script>');

// Sanitized
'[script removed]alert("xss")[script removed]'
```

**Arguments Sanitization:**
- Maximum 10 arguments per log entry
- Maximum 2000 characters per argument
- Large objects replaced with `[arg too large]`

**Protection Against:**
- ✅ XSS injection via logs
- ✅ Log injection attacks
- ✅ Memory exhaustion from large payloads

---

### 4. **Payload Size Limits**

**Limits:**
- **50 logs** maximum per batch
- **1000 characters** maximum per message
- **2000 characters** maximum per argument
- **10 arguments** maximum per log entry

**HTTP Status Codes:**
- `413 Payload Too Large` - Batch exceeds size limit

**Protection Against:**
- ✅ Memory exhaustion
- ✅ Bandwidth abuse
- ✅ Storage overflow

---

### 5. **Request Validation**

**Validates:**
- JSON structure
- Required fields (`logs` array)
- Log entry structure (`level`, `timestamp`, `message`)
- Data types

**HTTP Status Codes:**
- `400 Bad Request` - Invalid JSON or structure

**Protection Against:**
- ✅ Malformed requests
- ✅ Invalid data injection
- ✅ Protocol abuse

---

### 6. **Middleware Exclusion**

**Configuration:**
```typescript
excludePaths: [
  "/api/logs", // Has own security layer
]
```

**Why Excluded:**
- Endpoint has dedicated security (rate limiting, origin validation)
- No tenant authentication needed (public logging endpoint)
- Reduces middleware overhead for high-frequency endpoint

**Note:** While excluded from tenant middleware, the endpoint still has comprehensive security via its own implementation.

---

## 🛡️ Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
│  Browser sends POST /api/logs                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                            │
│                                                              │
│  1. Rate Limiting        → 429 if exceeded                  │
│  2. Origin Validation    → 403 if invalid                   │
│  3. JSON Validation      → 400 if malformed                 │
│  4. Payload Size Check   → 413 if too large                 │
│  5. Input Sanitization   → Clean XSS/injection              │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   LOG PROCESSING                             │
│  - Enrich with server metadata                              │
│  - Output to stdout (JSON/pretty)                           │
│  - Return success with rate limit headers                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Configuration Parameters

### Rate Limiting
```typescript
RATE_LIMIT_WINDOW = 60 * 1000;        // 1 minute
RATE_LIMIT_MAX_REQUESTS = 30;         // 30 requests/min
```

### Payload Limits
```typescript
MAX_MESSAGE_LENGTH = 1000;            // Characters
MAX_ARGS_SIZE = 2000;                 // Characters
MAX_BATCH_SIZE = 50;                  // Logs per batch
```

### Adjusting Limits

To modify limits, edit [apps/publicWeb/src/app/api/logs/route.ts](apps/publicWeb/src/app/api/logs/route.ts):

```typescript
// Stricter limits for high-traffic environments
const RATE_LIMIT_MAX_REQUESTS = 20;   // Reduce to 20/min

// More permissive for development
const RATE_LIMIT_MAX_REQUESTS = 100;  // Increase to 100/min
```

---

## 🚨 Attack Scenarios & Mitigations

### Scenario 1: DDoS Attack
**Attack:** Attacker floods endpoint with requests

**Mitigation:**
- ✅ Rate limiting (30 req/min per IP)
- ✅ Automatic IP blocking after threshold
- ✅ Response returns 429 with `Retry-After` header

---

### Scenario 2: Cross-Site Request Forgery (CSRF)
**Attack:** Malicious site sends logs to your endpoint

**Mitigation:**
- ✅ Origin validation (same-origin only)
- ✅ Referer header validation
- ✅ Returns 403 Forbidden for invalid origins

---

### Scenario 3: XSS via Log Injection
**Attack:** Attacker logs malicious scripts hoping they render in log viewer

**Mitigation:**
- ✅ Input sanitization removes `<script>`, `<iframe>`, etc.
- ✅ Event handlers stripped
- ✅ Dangerous patterns replaced with safe text

---

### Scenario 4: Storage Exhaustion
**Attack:** Attacker sends massive log payloads to fill disk

**Mitigation:**
- ✅ Batch size limit (50 logs)
- ✅ Message length limit (1000 chars)
- ✅ Argument size limit (2000 chars)
- ✅ Rate limiting prevents rapid accumulation

---

### Scenario 5: Log Poisoning
**Attack:** Attacker injects fake tenant/user IDs to corrupt analytics

**Mitigation:**
- ✅ Metadata comes from cookies (controlled by your app)
- ✅ Server enrichment adds trusted `requestIp`, `hostname`
- ✅ Client metadata is supplementary, not authoritative

---

## 🔍 Monitoring & Alerts

### Key Metrics to Monitor

1. **Rate Limit Violations**
   - Track 429 responses per IP
   - Alert if single IP hits limit repeatedly

2. **Origin Validation Failures**
   - Track 403 responses
   - Alert on unexpected cross-origin attempts

3. **Payload Size Rejections**
   - Track 413 responses
   - Could indicate client-side bug or attack

4. **Request Volume**
   - Monitor total requests per minute
   - Baseline for DDoS detection

### Grafana Queries

```logql
# Rate limit violations
{service="frontend-browser"}
  | json
  | requestIp != ""
  | count_over_time({status="429"}[5m])

# Origin validation failures
{service="frontend-browser"}
  | json
  | status="403"

# Total log volume per tenant
sum by (tenantId) (
  count_over_time({service="frontend-browser"}[1h])
)
```

---

## 🧪 Testing Security

### Test Rate Limiting
```bash
# Send 35 requests rapidly (should get 429 after 30)
for i in {1..35}; do
  curl -X POST http://app.um1ygn.edu.mm/api/logs \
    -H "Content-Type: application/json" \
    -H "Origin: http://app.um1ygn.edu.mm" \
    -d '{"logs":[{"level":"info","timestamp":"2025-01-26T10:00:00Z","message":"test"}]}'
  echo "Request $i"
  sleep 0.1
done
```

### Test Origin Validation
```bash
# Should return 403 (different origin)
curl -X POST http://app.um1ygn.edu.mm/api/logs \
  -H "Content-Type: application/json" \
  -H "Origin: http://malicious-site.com" \
  -d '{"logs":[{"level":"info","timestamp":"2025-01-26T10:00:00Z","message":"test"}]}'
```

### Test Payload Size
```bash
# Should return 413 (batch too large - 51 logs)
curl -X POST http://app.um1ygn.edu.mm/api/logs \
  -H "Content-Type: application/json" \
  -H "Origin: http://app.um1ygn.edu.mm" \
  -d '{"logs":[/* array with 51 log entries */]}'
```

### Test Input Sanitization
```bash
# XSS attempt - should be sanitized
curl -X POST http://app.um1ygn.edu.mm/api/logs \
  -H "Content-Type: application/json" \
  -H "Origin: http://app.um1ygn.edu.mm" \
  -d '{"logs":[{
    "level":"error",
    "timestamp":"2025-01-26T10:00:00Z",
    "message":"<script>alert(\"xss\")</script>"
  }]}'

# Check server logs - should see "[script removed]alert(\"xss\")[script removed]"
```

---

## 📝 Best Practices

### For Developers

1. **Don't log sensitive data**
   ```javascript
   // ❌ BAD
   console.log('User password:', password);

   // ✅ GOOD
   console.log('User login attempt', { userId });
   ```

2. **Keep log messages concise**
   - Messages over 1000 chars are truncated
   - Use structured data in metadata instead

3. **Monitor rate limit headers**
   ```javascript
   const response = await fetch('/api/logs', { ... });
   const remaining = response.headers.get('X-RateLimit-Remaining');
   console.log(`Rate limit remaining: ${remaining}`);
   ```

### For Administrators

1. **Monitor rate limit violations** - Could indicate bug or attack
2. **Review origin failures** - Should be extremely rare in production
3. **Adjust limits based on usage** - Tune for your traffic patterns
4. **Set up alerts** - 429/403 spikes need investigation

---

## 🔄 Future Enhancements

### Planned Improvements

- [ ] **Redis-based rate limiting** - Shared across instances
- [ ] **IP allowlist/blocklist** - Manual control
- [ ] **Tenant-specific rate limits** - Different limits per tenant
- [ ] **Authentication tokens** - Optional API key validation
- [ ] **Sampling** - Only process X% of logs in high volume
- [ ] **Async processing** - Queue logs for background processing

---

## 📚 References

- [Rate Limiting Best Practices](https://www.nginx.com/blog/rate-limiting-nginx/)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [Same-Origin Policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)

---

**Last Updated:** 2025-01-26
**Security Review:** Pending
**Next Review:** 2025-04-26
