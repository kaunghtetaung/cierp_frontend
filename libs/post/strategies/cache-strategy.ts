// Cache Strategy - Single Responsibility: Cache management operations
import { getCacheInstance, CacheKeys } from "@repo/cache";
import type { CacheStrategy } from '../types/post-types';

export class StandardCacheStrategy implements CacheStrategy {
  private cache = getCacheInstance();

  async clearPostCache(tenantId?: string, slug?: string): Promise<void> {
    if (tenantId && slug) {
      // Clear specific post cache (both populated and basic)
      await this.cache.del(CacheKeys.postBySlug(tenantId, `${slug}:populated`));
      await this.cache.del(CacheKeys.postBySlug(tenantId, `${slug}:basic`));
      console.log(`Post cache cleared for tenant: ${tenantId}, slug: ${slug}`);
    } else if (tenantId) {
      // Clear all posts for tenant
      await this.cache.deletePattern(`ciApp:${tenantId}:Content:Post:*`);
      console.log(`All post cache cleared for tenant: ${tenantId}`);
    } else {
      // Clear all post cache across all tenants
      await this.cache.deletePattern("ciApp:*:Content:Post:*");
      console.log("All post cache cleared");
    }
  }
}