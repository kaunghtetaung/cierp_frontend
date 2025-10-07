import { fetchLayoutData } from "@/lib/layout-data";
import { getLocalizedText } from "@repo/utils";
import { IconComponent } from "@repo/ui";
import { Card, CardContent } from "@repo/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui";
import { Badge } from "@repo/ui";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Page() {
  // Fetch layout data to get tenant, user info, and available apps
  const { middlewareData, tenant, authData, filteredApps } = await fetchLayoutData();

  // If no tenant or user, redirect to login with return URL
  if (!tenant || !authData?.isAuthenticated || !authData.user) {
    const headersList = await headers();
    const currentUrl = headersList.get('x-url') || '/';
    const returnUrl = encodeURIComponent(currentUrl);
    redirect(`/login?returnUrl=${returnUrl}`);
  }

  const user = authData.user;
  const language = middlewareData.language || "en";

  // Get tenant display information
  const tenantName = getLocalizedText(tenant.displayName, language) || tenant.brandInfo?.title || "System";
  const tenantDescription = getLocalizedText(tenant.localizedDescription, language) || "Management System";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <IconComponent name="Building2" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{tenantName}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Management Portal</p>
              </div>
            </div>

            {/* Header User Info */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.displayName || user.name || user.email}</p>
                <div className="flex gap-2 justify-end mt-1">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.slice(0, 2).map((role, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                        {typeof role === 'string' ? role : (role as any)?.Role || 'Unknown'}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400">Guest</Badge>
                  )}
                </div>
              </div>
              <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-800 shadow-md">
                <AvatarImage src={undefined} alt={user.displayName || user.name || user.email} />
                <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {(user.displayName || user.name || user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-6 py-6 space-y-6">
          {/* Applications Grid with Highlight */}
          <section>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Applications</h2>
                {filteredApps && filteredApps.length > 0 && (
                  <Badge variant="secondary" className="text-xs bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50">
                    {filteredApps.length} available
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Select an application to get started</p>
            </div>

            {filteredApps && filteredApps.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredApps.map((app: any) => {
                  const appName = getLocalizedText(app.displayName, language);
                  const appDescription = getLocalizedText(app.localizedDescription, language);
                  const appShortName = app.slug || getLocalizedText(app.displayShortName, language);
                  const dashboardPath = `/${appShortName}/dashboard`;

                  return (
                    <a
                      key={app.slug}
                      href={dashboardPath}
                      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300/60 dark:hover:border-blue-600/60 shadow-sm hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-50/10 to-indigo-50/20 dark:from-transparent dark:via-blue-900/10 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Content */}
                      <div className="relative p-6 flex flex-col items-center text-center space-y-5">
                        {/* App Icon */}
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 dark:shadow-blue-900/50 flex items-center justify-center group-hover:shadow-xl group-hover:shadow-blue-500/40 dark:group-hover:shadow-blue-900/60 transition-all duration-300 group-hover:scale-110">
                            <IconComponent
                              name={app.iconName}
                              fallback="LayoutDashboard"
                              className="w-8 h-8 text-white"
                            />
                          </div>
                          {/* Shine effect */}
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* App Info */}
                        <div className="space-y-3">
                          <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors leading-tight">
                            {appName}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed max-w-[160px]">
                            {appDescription || "Launch application"}
                          </p>
                        </div>

                        {/* Action Button */}
                        <div className="w-full pt-3">
                          <div className="px-4 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 group-hover:bg-blue-100/80 dark:group-hover:bg-blue-900/30 border border-slate-200/60 dark:border-slate-700/60 group-hover:border-blue-300/60 dark:group-hover:border-blue-600/60 transition-all duration-200">
                            <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                              Open
                              <IconComponent name="ArrowRight" className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <Card className="border-2 border-dashed border-slate-200/80 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/40">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-slate-100/80 to-slate-200/80 dark:from-slate-800/80 dark:to-slate-700/80 flex items-center justify-center border border-slate-200/60 dark:border-slate-600/60 shadow-sm">
                    <IconComponent name="AlertCircle" className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-slate-700 dark:text-slate-200">No Applications Available</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto text-sm">
                    You don't have access to any applications yet. Please contact your administrator.
                  </p>
                  <Badge variant="secondary" className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60">
                    Contact Required
                  </Badge>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Support Resources */}
          <section>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Support Resources</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Download manuals and access video tutorials</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* User Manual Download */}
              <Card className="border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm shadow-sm hover:shadow-lg hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-100/50 dark:border-emerald-800/50">
                      <IconComponent name="FileDown" className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-slate-700 dark:text-slate-200 mb-2">User Manual</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                        Download comprehensive guides and documentation for all applications and features.
                      </p>
                      <a
                        href="/downloads/user-manual.pdf"
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/30 hover:bg-emerald-200/80 dark:hover:bg-emerald-800/40 border border-emerald-200/60 dark:border-emerald-700/60 text-sm font-medium text-emerald-700 dark:text-emerald-300 transition-all duration-200 hover:scale-105"
                      >
                        <IconComponent name="Download" className="w-4 h-4" />
                        Download Manual
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support Video Channel */}
              <Card className="border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm shadow-sm hover:shadow-lg hover:shadow-red-100/50 dark:hover:shadow-red-900/20 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-red-50/80 to-pink-50/80 dark:from-red-900/30 dark:to-pink-900/30 border border-red-100/50 dark:border-red-800/50">
                      <IconComponent name="PlayCircle" className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-slate-700 dark:text-slate-200 mb-2">Video Tutorials</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                        Access step-by-step video tutorials and training materials on our support channel.
                      </p>
                      <a
                        href="https://youtube.com/@yoursupport"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100/80 dark:bg-red-900/30 hover:bg-red-200/80 dark:hover:bg-red-800/40 border border-red-200/60 dark:border-red-700/60 text-sm font-medium text-red-700 dark:text-red-300 transition-all duration-200 hover:scale-105"
                      >
                        <IconComponent name="Youtube" className="w-4 h-4" />
                        Watch Tutorials
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Organization Info */}
          <section>
            <Card className="border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm shadow-sm">
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-3 items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100/50 dark:border-blue-800/50">
                      <IconComponent name="Building2" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-slate-700 dark:text-slate-200">{tenantName}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{tenantDescription}</p>
                    </div>
                  </div>

                  {tenant.contact?.webSiteUrl && (
                    <div className="flex items-center gap-3">
                      <IconComponent name="Globe" className="w-4 h-4 text-slate-400" />
                      <a
                        href={tenant.contact.webSiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors truncate"
                      >
                        {(() => {
                          let url = tenant.contact.webSiteUrl;
                          // Remove protocol if present
                          url = url.replace(/^https?:\/\//, '');
                          // If the URL contains the app domain prefix, extract just the actual domain
                          if (url.includes('/')) {
                            const parts = url.split('/');
                            // Take the last part which should be the actual domain
                            url = parts[parts.length - 1];
                          }
                          return url;
                        })()}
                      </a>
                    </div>
                  )}

                  {tenant.contact?.email && (
                    <div className="flex items-center gap-3">
                      <IconComponent name="Mail" className="w-4 h-4 text-slate-400" />
                      <a
                        href={`mailto:${tenant.contact.email}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        {tenant.contact.email}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600">
                <IconComponent name="Shield" className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Secure Portal - {tenantName}
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <IconComponent name="Clock" className="w-4 h-4" />
                <span>Last updated: {new Date().toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-sm animate-pulse"></div>
                <span>System Online</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
