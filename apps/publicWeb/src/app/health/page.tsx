import { HealthWrapper, type HealthData } from './health-wrapper';
import type { TenantApplication } from '@repo/types';

// Health Page Content Component
function HealthPageContent({ 
  tenantSettings, 
  contentSettings,
  homePageData,
  middlewareData, 
  systemStatus, 
  requestInfo,
  error: tenantError 
}: HealthData) {
  const { tenantId, language, requestId } = middlewareData;
  const hostname = middlewareData.hostname || 'unknown';
  const protocol = middlewareData.protocol || 'unknown';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">🏥 Health Check</h1>
          <p className="text-lg text-muted-foreground mb-8">
            System health monitoring and tenant configuration status
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold mb-4">🔍 Request Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Hostname:</span>
                <span className="font-mono bg-white px-2 py-1 rounded">
                  {hostname}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">Protocol:</span>
                <span className="font-mono bg-white px-2 py-1 rounded">
                  {protocol}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">User Agent:</span>
                <span className="font-mono bg-white px-2 py-1 rounded text-xs">
                  {requestInfo.userAgent.slice(0, 30) || 'Unknown'}...
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Tenant ID:</span>
                <span className={`font-mono px-2 py-1 rounded ${
                  tenantId 
                    ? 'bg-green-100 text-green-800
                    : 'bg-red-100 text-red-800
                }`}>
                  {tenantId || 'Not resolved'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">Request ID:</span>
                <span className="font-mono bg-white px-2 py-1 rounded text-xs">
                  {requestId?.slice(0, 8) || 'N/A'}...
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">Timestamp:</span>
                <span className="font-mono bg-white px-2 py-1 rounded text-xs">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Language:</span>
              <span className="font-mono bg-white px-2 py-1 rounded">
                {middlewareData.language}
              </span>
            </div>
            
            <details className="mt-3">
              <summary className="font-medium text-sm cursor-pointer text-gray-600 hover:text-gray-800">
                🔍 Debug Headers (Click to expand)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono max-h-40 overflow-y-auto">
                {Object.entries(requestInfo.allHeaders).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-gray-200">
                    <span className="font-medium text-blue-600">{key}:</span>
                    <span className="text-gray-700 ml-2 truncate">{value}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>

        {tenantSettings && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">
                  {(tenantSettings as any)?.fullName || (tenantSettings as any)?.shortName || 'Tenant Configuration'}
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Status: {(tenantSettings as any)?.isActive ? 'Active' : 'Inactive'} • ID: <code className="font-mono">{tenantId}</code>
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-green-800">Organization:</span>
                  <span className="text-green-700">{(tenantSettings as any)?.fullName || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-green-800">Short Name:</span>
                  <span className="text-green-700">{(tenantSettings as any)?.shortName || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-green-800">Root Domain:</span>
                  <span className="text-green-700 font-mono text-xs">{(tenantSettings as any)?.rootDomain || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-green-800">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    (tenantSettings as any)?.isActive 
                      ? 'bg-green-100 text-green-800 
                      : 'bg-red-100 text-red-800
                  }`}>
                    {(tenantSettings as any)?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {(tenantSettings as any)?.contact && (
                  <div className="space-y-2">
                    <span className="font-medium text-green-800">Contact Info:</span>
                    <div className="text-green-700 text-xs space-y-1">
                      {(tenantSettings as any)?.contact?.email && (
                        <div>Email: {(tenantSettings as any)?.contact?.email}</div>
                      )}
                      {(tenantSettings as any)?.contact?.phoneNo && (
                        <div>Phone: {(tenantSettings as any)?.contact?.phoneNo}</div>
                      )}
                      {(tenantSettings as any)?.contact?.webSiteUrl && (
                        <div>Website: {(tenantSettings as any)?.contact?.webSiteUrl}</div>
                      )}
                      {(tenantSettings as any)?.contact?.address && (
                        <div>Address: {(tenantSettings as any)?.contact?.address}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {(tenantSettings as any)?.applications && (tenantSettings as any)?.applications?.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-medium text-green-800">Applications:</span>
                    <div className="space-y-1">
                      {(tenantSettings as any)?.applications?.map((app: TenantApplication | any, index: number) => {
                        // Handle both object and string formats for backward compatibility
                        const appName = typeof app === 'object' ? (app.name || app.shortName || 'Unknown') : String(app);
                        const appDescription = typeof app === 'object' ? app.description : undefined;
                        const appSubDomain = typeof app === 'object' ? app.subDomain : undefined;
                        const appIcon = typeof app === 'object' ? app.iconName : undefined;
                        
                        return (
                          <div key={index} className="bg-green-100 text-green-800 p-2 rounded text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{appName}</span>
                              {appSubDomain && (
                                <span className="text-green-600 font-mono">
                                  {appSubDomain}
                                </span>
                              )}
                            </div>
                            {appDescription && (
                              <p className="mt-1 text-green-700 text-xs">
                                {appDescription}
                              </p>
                            )}
                            {appIcon && (
                              <p className="mt-1 text-green-600 text-xs">
                                Icon: {appIcon}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {(tenantSettings as any)?.createdAt && (
                  <div className="flex justify-between">
                    <span className="font-medium text-green-800">Created:</span>
                    <span className="text-green-700 text-xs">
                      {new Date((tenantSettings as any)?.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {(tenantSettings as any)?.updatedAt && (
                  <div className="flex justify-between">
                    <span className="font-medium text-green-800">Updated:</span>
                    <span className="text-green-700 text-xs">
                      {new Date((tenantSettings as any)?.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tenantError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error Loading Tenant Settings
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {tenantError}
                </p>
              </div>
            </div>
          </div>
        )}

        {!tenantId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No Tenant Configuration
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  No tenant configuration found for hostname: <code className="font-mono">{hostname}</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Settings Module Section */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-purple-800">
                🎨 Content Settings Module
              </h3>
              <p className="text-sm text-purple-700 mt-1">
                Status: {systemStatus.contentModuleWorking ? 'Working' : 'Error'} • 
                Theme: {contentSettings.data?.themeName || 'Unknown'} • 
                Cache: {systemStatus.contentModuleWorking ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          {contentSettings.error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm text-red-700">
                ❌ Content Settings Error: {contentSettings.error}
              </p>
            </div>
          )}

          {systemStatus.contentModuleWorking && contentSettings.data && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-purple-800">
                Configuration Details:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="bg-purple-100 text-purple-800 p-3 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Theme</span>
                      <span className="text-xs text-purple-600">
                        {contentSettings.data.themeName}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-purple-100 text-purple-800 p-3 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Layout</span>
                      <span className="text-xs text-purple-600">
                        {contentSettings.data.layout.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-purple-100 text-purple-800 p-3 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Default Language</span>
                      <span className="text-xs text-purple-600">
                        {contentSettings.data.defaultLanguage}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-purple-100 text-purple-800 p-3 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Header Menu</span>
                      <span className="text-xs text-purple-600">
                        {contentSettings.data.enableHeaderMenu ? `${contentSettings.data.headerMenu.length} items` : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-purple-100 text-purple-800 p-3 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Footer Menu</span>
                      <span className="text-xs text-purple-600">
                        {contentSettings.data.enableFooterMenu ? `${contentSettings.data.footerMenu.length} items` : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-purple-100 text-purple-800 p-3 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Available Languages</span>
                      <span className="text-xs text-purple-600">
                        {contentSettings.data.availableLanguages.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {contentSettings.data.metaTitle && (
                <div className="bg-purple-100 text-purple-800 p-3 rounded text-sm">
                  <div className="font-medium mb-1">Meta Title</div>
                  <div className="text-xs text-purple-600">
                    {contentSettings.data.metaTitle}
                  </div>
                </div>
              )}
            </div>
          )}

          {systemStatus.contentModuleWorking && !contentSettings.data && (
            <div className="text-center py-4">
              <p className="text-sm text-purple-600">
                📭 No content settings found for this tenant
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-purple-200">
            <p className="text-xs text-purple-600">
              🔧 Content Settings: wrapper → react cache → service → http client → Redis cache
            </p>
            <p className="text-xs text-purple-600 mt-1">
              📡 Content API: {systemStatus.apiEndpoint !== 'Not available' ? `${systemStatus.apiEndpoint}/content/settings/tenant/effective` : 'Not available'}
            </p>
          </div>
        </div>

        {/* Home Page Module Section */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-orange-800">
                🏠 Home Page Module
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Status: {systemStatus.pageModuleWorking ? 'Working' : 'Error'} • 
                Page: {homePageData.title?.en || 'Not found'} • 
                Sections: {homePageData.totalSections}
              </p>
            </div>
          </div>

          {homePageData.error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm text-red-700">
                ❌ Home Page Error: {homePageData.error}
              </p>
            </div>
          )}

          {systemStatus.pageModuleWorking && homePageData.title && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-orange-800">
                Home Page Details:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="bg-orange-100 text-orange-800 p-3 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Title (EN)</span>
                      <span className="text-xs text-orange-600">
                        {homePageData.title.en}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-orange-100 text-orange-800 p-3 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Title (MM)</span>
                      <span className="text-xs text-orange-600">
                        {homePageData.title.mm || 'Not set'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-orange-100 text-orange-800 p-3 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Is Home Page</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        homePageData.isHomePage 
                          ? 'bg-green-100 text-green-800
                          : 'bg-red-100 text-red-800
                      }`}>
                        {homePageData.isHomePage ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-orange-100 text-orange-800 p-3 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Sections</span>
                      <span className="text-xs text-orange-600">
                        {homePageData.totalSections}
                      </span>
                    </div>
                  </div>
                  
                  {homePageData.sections && homePageData.sections.length > 0 && (
                    <div className="bg-orange-100 text-orange-800 p-3 rounded text-sm">
                      <div className="font-medium mb-2">Section Types:</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {homePageData.sections.map((section, index) => (
                          <div key={section._id} className="flex items-center justify-between text-xs">
                            <span className="text-orange-700">
                              {index + 1}. {section.type}
                            </span>
                            <span className={`px-2 py-1 rounded ${
                              section.isEnabled 
                                ? 'bg-green-100 text-green-800
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {section.isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {systemStatus.pageModuleWorking && !homePageData.title && (
            <div className="text-center py-4">
              <p className="text-sm text-orange-600">
                📭 No home page found for this tenant (looking for slug: 'home')
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-orange-200">
            <p className="text-xs text-orange-600">
              🔧 Page Module: wrapper → react cache → service → http client → Redis cache
            </p>
            <p className="text-xs text-orange-600 mt-1">
              📡 Page API: {systemStatus.apiEndpoint !== 'Not available' ? `${systemStatus.apiEndpoint}/content/page/slug/home` : 'Not available'}
            </p>
          </div>
        </div>

        <div className="bg-blue-50/20 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-800 mb-2">🔧 System Status</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>✅ Middleware: {systemStatus.middlewareWorking ? 'Working' : 'Not resolving tenant'}</p>
            <p>✅ HTTP Client: {systemStatus.httpClientWorking ? 'Working' : (tenantError ? 'Error' : 'Not tested')}</p>
            <p>✅ Content Module: {systemStatus.contentModuleWorking ? 'Working' : (contentSettings.error ? 'Error' : 'Not tested')}</p>
            <p>✅ Page Module: {systemStatus.pageModuleWorking ? 'Working' : (homePageData.error ? 'Error' : 'Not tested')}</p>
            <p>✅ Redis Cache: {systemStatus.httpClientWorking ? 'Working' : 'Not tested'}</p>
            <p>✅ Token Manager: {systemStatus.httpClientWorking ? 'Working' : 'Not tested'}</p>
            {systemStatus.apiEndpoint !== 'Not available' && (
              <p className="mt-2 text-xs">
                📡 API Endpoint: <code className="font-mono bg-blue-100 px-1 rounded">{systemStatus.apiEndpoint}</code>
              </p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs text-blue-600">
              🔍 Debug: Using content wrapper pattern (wrapper → react cache → service → http client)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              📊 Test middleware at: <a href="/test-middleware" className="underline">/test-middleware</a>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              ⏱️ Health check timestamp: {new Date(systemStatus.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// Main Health Page Component with Wrapper
export default async function HealthPage() {
  return (
    <HealthWrapper>
      {(healthData) => <HealthPageContent {...healthData} />}
    </HealthWrapper>
  );
}