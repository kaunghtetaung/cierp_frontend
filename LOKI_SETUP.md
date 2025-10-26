# Grafana Loki Integration Guide

This document explains how to integrate Grafana Loki for log aggregation with your frontend applications.

## Overview

The application now supports **structured JSON logging** optimized for Grafana Loki log aggregation.

### Architecture

```
Frontend Apps (stdout/stderr)
       ↓
   Promtail Agent (collects logs)
       ↓
   Loki Server (stores logs)
       ↓
   Grafana (visualizes logs)
```

## Log Format

### Development (Pretty)
```
🔥 CRITICAL ERROR: { timestamp, type, message, severity, tenantId, ... }
❌ HIGH SEVERITY ERROR: { ... }
⚠️ MEDIUM SEVERITY ERROR: { ... }
```

### Production (JSON for Loki)
```json
{"level":"fatal","timestamp":"2025-01-21T10:30:00.000Z","type":"UNKNOWN_ERROR","code":"ERR_001","message":"Database connection failed","severity":"critical","category":"application","operation":"db-connect","component":"auth-service","tenantId":"tenant123","userId":"user456","retryable":true,"cause":"Connection timeout","stack":"Error: ...\n  at ...","metadata":{}}
```

## Configuration

### Environment Variables

```bash
# Development - Human-readable logs with emojis
LOG_FORMAT=pretty

# Production - JSON logs for Loki
LOG_FORMAT=json
```

The format automatically defaults to:
- `pretty` in development (`NODE_ENV=development`)
- `json` in production (`NODE_ENV=production`)

## Loki Setup

### 1. Install Loki & Promtail

#### Using Docker Compose

```yaml
version: '3'

services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  loki-data:
  grafana-data:
```

### 2. Configure Promtail

Create `promtail-config.yml`:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # PublicWeb App Logs
  - job_name: frontend-publicweb
    static_configs:
      - targets:
          - localhost
        labels:
          job: publicweb
          app: frontend
          environment: production
          __path__: /var/log/publicweb/*.log

    pipeline_stages:
      # Parse JSON logs
      - json:
          expressions:
            level: level
            timestamp: timestamp
            message: message
            severity: severity
            tenantId: tenantId
            userId: userId
            component: component
            operation: operation

      # Extract labels for efficient querying
      - labels:
          level:
          severity:
          tenantId:
          component:

      # Set timestamp
      - timestamp:
          source: timestamp
          format: RFC3339

  # Core App Logs
  - job_name: frontend-core
    static_configs:
      - targets:
          - localhost
        labels:
          job: core
          app: frontend
          environment: production
          __path__: /var/log/core/*.log

    pipeline_stages:
      - json:
          expressions:
            level: level
            timestamp: timestamp
            message: message
            severity: severity
            tenantId: tenantId
            userId: userId
            component: component
            operation: operation

      - labels:
          level:
          severity:
          tenantId:
          component:

      - timestamp:
          source: timestamp
          format: RFC3339

  # Docker Container Logs (if running in Docker)
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s

    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'

      - source_labels: ['__meta_docker_container_log_stream']
        target_label: 'stream'

    pipeline_stages:
      - json:
          expressions:
            level: level
            timestamp: timestamp
            message: message

      - labels:
          level:
          stream:
```

### 3. Configure Loki

Create `loki-config.yml`:

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-05-15
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /loki/index

  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s
```

### 4. PM2 Configuration (For Node.js Apps)

If using PM2 to run your apps:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'publicweb',
      script: 'npm',
      args: 'run start',
      cwd: './apps/publicWeb',
      env: {
        NODE_ENV: 'production',
        LOG_FORMAT: 'json'
      },
      out_file: '/var/log/publicweb/out.log',
      error_file: '/var/log/publicweb/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'core',
      script: 'npm',
      args: 'run start',
      cwd: './apps/core',
      env: {
        NODE_ENV: 'production',
        LOG_FORMAT: 'json'
      },
      out_file: '/var/log/core/out.log',
      error_file: '/var/log/core/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

## Grafana Dashboard Setup

### 1. Add Loki Data Source

1. Open Grafana (http://localhost:3000)
2. Go to Configuration → Data Sources
3. Add Loki
4. Set URL: `http://loki:3100`
5. Save & Test

### 2. Create Dashboard

#### Query Examples

**All errors for a specific tenant:**
```logql
{job="publicweb"} |= `tenantId":"tenant123"` | json | level="error"
```

**Critical errors in last 1 hour:**
```logql
{job=~"publicweb|core"} | json | severity="critical"
```

**Errors by component:**
```logql
sum by (component) (count_over_time({job=~"publicweb|core"} | json | level="error" [5m]))
```

**User-specific errors:**
```logql
{job="publicweb"} |= `userId":"user456"` | json | level="error"
```

**Operation failures:**
```logql
{job="core"} | json | operation="db-connect" | level="error"
```

### 3. Useful Panels

**Error Rate Over Time:**
```logql
rate({job=~"publicweb|core"} | json | level="error" [1m])
```

**Error Distribution by Severity:**
```logql
sum by (severity) (count_over_time({job=~"publicweb|core"} | json [5m]))
```

**Top 10 Error Messages:**
```logql
topk(10, count by (message) (count_over_time({job=~"publicweb|core"} | json | level="error" [1h])))
```

## Log Structure

All error logs include these fields:

```typescript
{
  level: 'fatal' | 'error' | 'warn' | 'info',     // Severity level
  timestamp: '2025-01-21T10:30:00.000Z',          // ISO 8601 timestamp
  type: 'UNKNOWN_ERROR',                          // Error type
  code: 'ERR_001',                                // Error code
  message: 'Error description',                   // Human-readable message
  severity: 'critical' | 'high' | 'medium' | 'low', // Business severity
  category: 'application',                        // Error category
  operation: 'db-connect',                        // Operation that failed
  component: 'auth-service',                      // Component name
  tenantId: 'tenant123',                          // Multi-tenant ID
  userId: 'user456',                              // User ID (if applicable)
  retryable: true,                                // Can this be retried?
  cause: 'Connection timeout',                    // Root cause
  stack: 'Error: ...',                            // Stack trace
  metadata: {}                                    // Additional context
}
```

## Alerting

### Create Alert Rules in Grafana

**High Error Rate:**
```logql
rate({job=~"publicweb|core"} | json | level="error" [5m]) > 10
```

**Critical Errors:**
```logql
count_over_time({job=~"publicweb|core"} | json | severity="critical" [5m]) > 0
```

**Tenant-Specific Issues:**
```logql
count_over_time({job="publicweb", tenantId="tenant123"} | json | level="error" [5m]) > 5
```

## Production Deployment

### 1. Set Environment Variables

```bash
# .env.production
NODE_ENV=production
LOG_FORMAT=json
```

### 2. Ensure Log Directories Exist

```bash
sudo mkdir -p /var/log/publicweb
sudo mkdir -p /var/log/core
sudo chown -R $USER:$USER /var/log/publicweb /var/log/core
```

### 3. Start Services

```bash
# Start Loki stack
docker-compose up -d

# Start apps with PM2
pm2 start ecosystem.config.js

# Verify logs are being collected
pm2 logs
```

### 4. Verify in Grafana

1. Open Grafana
2. Go to Explore
3. Select Loki data source
4. Run query: `{job=~"publicweb|core"}`
5. You should see your application logs

## Troubleshooting

### Logs not appearing in Loki

1. Check Promtail is running: `docker-compose ps promtail`
2. Check Promtail logs: `docker-compose logs promtail`
3. Verify log files exist: `ls -la /var/log/publicweb/`
4. Check Promtail can read logs: `docker exec promtail cat /var/log/publicweb/out.log`

### JSON parsing errors

1. Verify logs are valid JSON: `tail -f /var/log/publicweb/out.log | jq .`
2. Check LOG_FORMAT is set to 'json'
3. Restart app after changing LOG_FORMAT

### High memory usage

1. Reduce retention period in loki-config.yml
2. Increase chunk_idle_period
3. Limit log volume with sampling

## Cost Optimization

### 1. Log Sampling

Only log errors in production:

```typescript
// libs/utils/common/error-reporter.ts
const DEFAULT_CONFIG: ErrorReportingConfig = {
  enableConsoleLogging: process.env.NODE_ENV === 'development' ||
                        error.severity === 'critical' ||
                        error.severity === 'high',
  // ...
};
```

### 2. Retention Policy

Set retention in loki-config.yml:

```yaml
limits_config:
  retention_period: 720h  # 30 days
```

### 3. Label Cardinality

Limit label values to reduce index size:
- Use high-cardinality data (userId, requestId) in metadata, not labels
- Keep labels to: job, environment, severity, component

## References

- [Grafana Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Promtail Configuration](https://grafana.com/docs/loki/latest/clients/promtail/configuration/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/logql/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
