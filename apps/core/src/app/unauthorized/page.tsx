import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@repo/ui'
import { getUserAuthorizedApps, type AppInfo } from '@/lib/auth-utils'

interface UnauthorizedPageProps {
  searchParams: { app?: string; reason?: string }
}

async function getAppDisplayName(appId?: string): Promise<string> {
  if (!appId) return 'this application'

  try {
    // Try to get the app's display name from authorized apps first
    const authorizedApps = await getUserAuthorizedApps()
    const foundApp = authorizedApps.find(app => app.id === appId)
    if (foundApp) return foundApp.name

    // Fallback to capitalized app ID
    return appId.charAt(0).toUpperCase() + appId.slice(1)
  } catch {
    return appId.charAt(0).toUpperCase() + appId.slice(1)
  }
}

export default async function UnauthorizedPage({ searchParams }: UnauthorizedPageProps) {
  const { app, reason } = searchParams

  // Get list of apps user has access to for alternative suggestions
  const authorizedApps = await getUserAuthorizedApps()

  // Get display name for the denied app
  const appDisplayName = await getAppDisplayName(app)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto text-center space-y-6 p-8">
        {/* Error Icon */}
        <div className="mx-auto flex items-center justify-center w-20 h-20 bg-destructive/10 rounded-full">
          <svg
            className="w-10 h-10 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access the "{appDisplayName}" application.
          </p>
          {reason && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              Reason: {reason}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {authorizedApps.length > 0 ? (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                You have access to these applications:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {authorizedApps.slice(0, 4).map((app) => (
                  <Button key={app.id} asChild variant="outline" size="sm">
                    <Link href={`/${app.id}`} title={app.description}>
                      {app.name}
                    </Link>
                  </Button>
                ))}
              </div>
              {authorizedApps.length > 4 && (
                <p className="text-xs text-muted-foreground mt-2">
                  +{authorizedApps.length - 4} more applications available
                </p>
              )}
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                You don't have access to any applications. Please contact your administrator to request access.
              </p>
            </div>
          )}

          {/* Back Button */}
          <div className="flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/">
                Go to Home
              </Link>
            </Button>
            {authorizedApps.length > 0 && (
              <Button asChild>
                <Link href={`/${authorizedApps[0].id}`}>
                  Go to {authorizedApps[0].name}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            If you believe this is an error, please contact your system administrator or try logging in again.
          </p>
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense
function UnauthorizedLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}