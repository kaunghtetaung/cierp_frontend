/**
 * Static Module Utilities
 * Detect and enumerate custom routes within static modules for navigation
 */

import { readdirSync, existsSync, statSync } from 'fs'
import path from 'path'

export interface StaticModuleRoute {
  name: string
  path: string
  title: string
}

/**
 * Get all static module custom routes for a given app/module combination
 * Returns array of subdirectories that contain page.tsx files
 *
 * @param appId - Application ID (e.g., "library", "cpms")
 * @param moduleSlug - Module slug (e.g., "bibliographies", "students")
 * @returns Array of custom routes found in the static module
 */
export function getStaticModuleRoutes(appId: string, moduleSlug: string): StaticModuleRoute[] {
  try {
    const staticModulePath = path.join(
      process.cwd(),
      'src',
      'staticModules',
      appId,
      moduleSlug
    )

    // Check if static module directory exists
    if (!existsSync(staticModulePath)) {
      return []
    }

    const entries = readdirSync(staticModulePath, { withFileTypes: true })
    const routes: StaticModuleRoute[] = []

    for (const entry of entries) {
      // Skip files (we only want directories)
      if (!entry.isDirectory()) {
        continue
      }

      // Skip reserved directories and special folders
      const skipDirs = ['actions', 'batch', 'detail', 'wizard', 'shared', 'components', 'utils', 'lib']
      if (skipDirs.includes(entry.name)) {
        continue
      }

      // Check if directory contains a page.tsx file
      const pagePath = path.join(staticModulePath, entry.name, 'page.tsx')
      if (existsSync(pagePath)) {
        // Convert directory name to title (e.g., "barcode" -> "Barcode", "bulk-import" -> "Bulk Import")
        const title = entry.name
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        routes.push({
          name: entry.name,
          path: entry.name,
          title
        })
      }
    }

    // Sort routes alphabetically by title
    routes.sort((a, b) => a.title.localeCompare(b.title))

    console.log(`[STATIC_ROUTES] Found ${routes.length} custom routes for ${appId}/${moduleSlug}:`, routes.map(r => r.name))

    return routes
  } catch (error) {
    console.error(`[STATIC_ROUTES] Error scanning static module routes for ${appId}/${moduleSlug}:`, error)
    return []
  }
}

/**
 * Check if a static module has any custom routes
 */
export function hasStaticModuleRoutes(appId: string, moduleSlug: string): boolean {
  const routes = getStaticModuleRoutes(appId, moduleSlug)
  return routes.length > 0
}

/**
 * Get static module route by name
 */
export function getStaticModuleRoute(appId: string, moduleSlug: string, routeName: string): StaticModuleRoute | null {
  const routes = getStaticModuleRoutes(appId, moduleSlug)
  return routes.find(r => r.name === routeName) || null
}
