# Environment Configuration Guide

This guide explains how to set up your environment variables for the frontend monorepo project.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in required values** (see sections below)

3. **Start development:**
   ```bash
   pnpm dev
   ```

## 🔧 Required Configuration

### Essential Variables (Required for basic functionality)

```bash
# Basic Environment
NODE_ENV=development
PORT=3000

# Database (Required)
DATABASE_URL=postgresql://username:password@localhost:5432/frontend_db

# Redis Cache (Required)
REDIS_URL=redis://localhost:6379

# API Configuration (Required)
API_BASE_URL=http://localhost:3331

# Security Secrets (Required - Generate Strong Values)
JWT_SECRET=your-256-bit-secret-key-here
SESSION_SECRET=your-256-bit-session-secret-here
COOKIE_SECRET=your-256-bit-cookie-secret-here
CSRF_SECRET=your-256-bit-csrf-secret-here

# Multi-Tenant (Required)
ROOT_DOMAIN=localhost
```

### Generate Secure Secrets

Use these commands to generate secure random secrets:

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Session Secret  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Cookie Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate CSRF Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📚 Configuration Sections

### 1. Database Configuration

**PostgreSQL (Recommended)**
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/frontend_db
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=frontend_db
DATABASE_USER=username
DATABASE_PASSWORD=password
DATABASE_SSL=false
```

**Pool Settings (Optimize for your load)**
```bash
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
DATABASE_POOL_IDLE_TIMEOUT=30000
DATABASE_POOL_ACQUIRE_TIMEOUT=60000
```

### 2. Redis Cache Configuration

**Single Redis Instance**
```bash
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

**Redis Cluster (Production)**
```bash
REDIS_CLUSTER_NODES=redis1:6379,redis2:6379,redis3:6379
REDIS_CLUSTER_PASSWORD=your-cluster-password
```

**Cache TTL Settings (in seconds)**
```bash
CACHE_TTL_DEFAULT=3600      # 1 hour
CACHE_TTL_SESSION=86400     # 24 hours
CACHE_TTL_TOKEN=3600        # 1 hour
CACHE_TTL_CONTENT=1800      # 30 minutes
CACHE_TTL_TENANT=7200       # 2 hours
```

### 3. Authentication & Security

**JWT Configuration**
```bash
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
```

**Session Configuration**
```bash
SESSION_SECRET=your-session-secret
SESSION_MAX_AGE=86400000    # 24 hours in milliseconds
SESSION_SECURE=false        # Set to true in production
SESSION_HTTP_ONLY=true      # Always true for security
```

**OIDC/OAuth Providers**
```bash
# Your OIDC Provider
OIDC_ISSUER_URL=https://your-oidc-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 4. Multi-Tenant Configuration

```bash
# Tenant Settings
SUPPORTED_LANGUAGES=en,mm

# Domain Configuration
ROOT_DOMAIN=localhost                    # yourdomain.com in production
ADMIN_SUBDOMAIN=admin                   # admin.yourdomain.com
API_SUBDOMAIN=api                       # api.yourdomain.com
ALLOWED_DOMAINS=localhost,yourdomain.com
```

### 5. Next.js & Frontend

```bash
# Public URLs (accessible in browser)
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PROTOCOL=http

# Development Features
USE_MOCK_USER=true
ENABLE_DEV_TOOLS=true
NEXT_PUBLIC_DEV_MODE=true
```

### 6. File Upload & Storage

**Local Storage (Development)**
```bash
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,txt
```

**AWS S3 (Production)**
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
```

**Cloudinary (Alternative)**
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 7. Email Configuration

**SMTP (Gmail example)**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use app-specific password
```

**SendGrid (Recommended for production)**
```bash
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### 8. Analytics & Tracking

**Google Analytics**
```bash
GA_TRACKING_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

**Google Tag Manager**
```bash
GTM_CONTAINER_ID=GTM-XXXXXXX
NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXXX
```

### 9. Content Management

**Section Library**
```bash
SECTION_CACHE_TTL=3600
MAX_SECTIONS_PER_PAGE=50
ENABLE_SECTION_COPY=true
ENABLE_SECTION_TEMPLATES=true
```

**Page Library**
```bash
PAGE_CACHE_TTL=1800
MAX_PAGES_PER_TENANT=1000
ENABLE_PAGE_BUILDER=true
PAGE_AUTOSAVE_INTERVAL=30000  # 30 seconds
```

**Post/Blog Library**
```bash
POST_CACHE_TTL=900
POSTS_PER_PAGE=10
ENABLE_POST_COMMENTS=true
ENABLE_POST_STATS=true
POST_EXCERPT_LENGTH=160
```

### 10. Feature Flags

```bash
# Authentication Features
FEATURE_USER_REGISTRATION=true
FEATURE_SOCIAL_LOGIN=true
FEATURE_TWO_FACTOR_AUTH=false

# Content Features
FEATURE_BLOG=true
FEATURE_PAGES=true
FEATURE_SECTIONS=true
FEATURE_MULTI_LANGUAGE=true

# UI Features
FEATURE_ADMIN_PANEL=true
FEATURE_PAGE_BUILDER=true
FEATURE_ANALYTICS=true
```

## 🚀 Environment-Specific Setup

### Development Environment

```bash
NODE_ENV=development
FORCE_HTTPS=false
COOKIE_SECURE=false
SESSION_SECURE=false
USE_MOCK_USER=true
ENABLE_DEV_TOOLS=true
```

### Production Environment

```bash
NODE_ENV=production
FORCE_HTTPS=true
COOKIE_SECURE=true
SESSION_SECURE=true
USE_MOCK_USER=false
ENABLE_DEV_TOOLS=false

# Additional production settings
CSP_REPORT_URI=https://yourdomain.com/csp-report
SENTRY_ENVIRONMENT=production
```

### Testing Environment

```bash
NODE_ENV=test
TEST_DATABASE_URL=postgresql://username:password@localhost:5432/frontend_test_db
TEST_REDIS_URL=redis://localhost:6379/1
ENABLE_MOCK_SERVICES=true
```

## 🔐 Security Best Practices

### 1. Secret Management

- **Never commit secrets** to version control
- Use **strong, unique secrets** for each environment
- **Rotate secrets** regularly
- Use **environment-specific** values

### 2. Cookie Security

```bash
# Enforce secure cookies in production
COOKIE_HTTP_ONLY=true      # Prevent XSS
COOKIE_SECURE=true         # HTTPS only (production)
COOKIE_SAME_SITE=lax       # CSRF protection
```

### 3. Session Security

```bash
# Secure session configuration
SESSION_HTTP_ONLY=true
SESSION_SECURE=true        # Production only
SESSION_MAX_AGE=86400000   # 24 hours
```

### 4. Database Security

```bash
# Use SSL in production
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

## 🛠 Development Setup

### 1. Local Development

```bash
# Clone and setup
git clone <repository>
cd frontend
cp .env.example .env

# Edit .env with your values
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### 2. Docker Development

```bash
# Use docker-compose for services
docker-compose up -d postgres redis

# Update .env for docker services
DATABASE_URL=postgresql://username:password@localhost:5432/frontend_db
REDIS_URL=redis://localhost:6379
```

### 3. Required Services

**PostgreSQL Database**
```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Create database
createdb frontend_db
```

**Redis Cache**
```bash
# Install Redis
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu

# Start Redis
redis-server
```

## 📊 Monitoring & Observability

### Application Monitoring

```bash
# Sentry (Error tracking)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development

# New Relic (Performance)
NEW_RELIC_LICENSE_KEY=your-license-key
NEW_RELIC_APP_NAME=frontend-app
```

### Logging

```bash
LOG_LEVEL=info
LOG_DIR=./logs
LOG_MAX_SIZE=10m
LOG_MAX_FILES=14d
```

## 🧪 Testing Configuration

```bash
# Test databases
TEST_DATABASE_URL=postgresql://username:password@localhost:5432/frontend_test_db
TEST_REDIS_URL=redis://localhost:6379/1

# Mock services for testing
ENABLE_MOCK_SERVICES=true
MOCK_DELAY_MS=100
```

## 🚨 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```bash
   # Check if Redis is running
   redis-cli ping
   # Should return PONG
   ```

2. **Database Connection Failed**
   ```bash
   # Test database connection
   psql postgresql://username:password@localhost:5432/frontend_db
   ```

3. **Missing Environment Variables**
   ```bash
   # Check required variables are set
   node -e "console.log(process.env.DATABASE_URL ? 'OK' : 'MISSING: DATABASE_URL')"
   ```

4. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

### Environment Validation

Create a validation script:

```javascript
// scripts/validate-env.js
const required = [
  'DATABASE_URL',
  'REDIS_URL', 
  'JWT_SECRET',
  'SESSION_SECRET',
  'API_BASE_URL'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

Run validation:
```bash
node scripts/validate-env.js
```

## 📝 Configuration Templates

### Minimal Development Setup

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/frontend_db
REDIS_URL=redis://localhost:6379
API_BASE_URL=http://localhost:3331
JWT_SECRET=dev-jwt-secret-change-in-production
SESSION_SECRET=dev-session-secret-change-in-production
COOKIE_SECRET=dev-cookie-secret-change-in-production
CSRF_SECRET=dev-csrf-secret-change-in-production
ROOT_DOMAIN=localhost
```

### Full Production Setup

See the complete `.env.example` file for all available configuration options.

## 🔗 Related Documentation

- [Redis Configuration Guide](https://redis.io/docs/manual/config/)
- [PostgreSQL Configuration](https://www.postgresql.org/docs/current/runtime-config.html)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#process_process_env)