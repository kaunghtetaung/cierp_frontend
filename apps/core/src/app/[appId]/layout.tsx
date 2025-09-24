import { requireAppAccess, validateAppAccess } from '@/lib/auth-utils'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
  params: Promise<{ appId: string }>
}

/**
 * Layout for all [appId]/* routes with server-side authorization
 * Protects all nested routes within an application
 */
export default async function AppLayout({ children, params }: AppLayoutProps) {
  const { appId } = await params

  // Server-side authorization check for all routes under this app
  // This will redirect to login or unauthorized page if user doesn't have access
  await requireAppAccess(appId)

  // If we reach here, user is authorized for this app
  return <>{children}</>
}

/**
 * Generate metadata based on the app from tenant data
 */
export async function generateMetadata({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params

  try {
    // Get the actual app information from tenant data
    const authResult = await validateAppAccess(appId)

    if (authResult.isAuthorized && authResult.tenant) {
      // Find the app in tenant's applications
      const app = authResult.tenant.applications?.find(
        app => app.slug === appId ||
               app.displayShortName?.en?.toLowerCase() === appId.toLowerCase()
      )

      if (app) {
        // Use app's display name from tenant data
        const appName = app.displayName?.en ||
                       app.displayShortName?.en ||
                       appId.charAt(0).toUpperCase() + appId.slice(1)

        const appDescription = app.localizedDescription?.en ||
                              `${appName} application dashboard`

        return {
          title: `${appName} | ${authResult.tenant.brandInfo?.title || 'Crystal Image'}`,
          description: appDescription
        }
      }
    }

    // Fallback if app not found or not authorized
    const fallbackName = appId.charAt(0).toUpperCase() + appId.slice(1)
    return {
      title: `${fallbackName} | Crystal Image`,
      description: `${fallbackName} application dashboard`
    }

  } catch (error) {
    console.error(`[METADATA] Error generating metadata for app '${appId}':`, error)

    // Error fallback
    const fallbackName = appId.charAt(0).toUpperCase() + appId.slice(1)
    return {
      title: `${fallbackName} | Crystal Image`,
      description: `${fallbackName} application dashboard`
    }
  }
}