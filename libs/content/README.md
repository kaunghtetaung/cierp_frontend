# Content Settings Module

## Purpose
This module handles **CMS configuration settings** for public pages, including:
- Header settings (logo, navigation, banner)
- Footer settings (links, social media, contact info)
- Navigation menus (header menu, footer menu)
- Theme settings and layout configuration
- Language and localization settings
- Homepage configuration

## NOT for Content Items
This module is **NOT** for managing content items like:
- ❌ Pages
- ❌ Posts  
- ❌ News articles
- ❌ Events
- ❌ Announcements

Content items are handled by separate modules (page, post, etc.).

## Files Structure
```
libs/content/
├── README.md           # This file - explains purpose
├── content-service.ts # CMS settings service (logic only)
├── wrapper.ts         # React cache wrapper for service
└── index.ts          # Module exports

libs/types/
└── content.ts         # All CMS settings types/interfaces
```

## Types
- **All Types**: Defined in `/libs/types/content.ts` (centralized)
- **Service Logic**: Clean service implementation in `content-service.ts`

## Usage
```typescript
import { getContentSettings, type ContentSettingsData } from '@repo/content';

// Get CMS settings for a tenant
const settings = await getContentSettings(tenantId);
console.log(settings.header.showNavigation);
console.log(settings.footer.socialLinks);
console.log(settings.themeName);
```

## API Endpoint
- `GET /content/settings/tenant/effective` - Get effective CMS settings for tenant

## Caching
- Redis-based caching with TTL
- React.cache for request-level deduplication
- Cache key: `ContentSettings:{tenantId}`