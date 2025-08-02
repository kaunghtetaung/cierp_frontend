"use client";

import React, { useState } from "react";
import { useAuth } from "@repo/auth";

interface ModuleSchema {
  slug: string;
  name: { en: string; mm: string };
  serviceName: string;
  formFields?: any[];
  dataTableSchema?: any;
  extraActionForms?: any[];
}

interface AppSchemaData {
  modules: ModuleSchema[];
  supportedLanguages: { code: string; name: string }[];
  serviceName: string;
  timestamp: string;
  appId?: string;
}

interface HealthPageClientProps {
  initialTenant: any;
  tenantError: string | null;
  middlewareData: any;
  appSchemaData: AppSchemaData | null;
  appSchemaError: string | null;
}

export default function HealthPageClient({
  initialTenant: tenant,
  tenantError,
  middlewareData,
  appSchemaData,
  appSchemaError,
}: HealthPageClientProps) {
  // Get user information from auth provider (client-side only)
  const {
    user,
    loading: authLoading,
    error: authError,
    isAuthenticated,
  } = useAuth();

  // App Schema demo state (client-side selection only)
  const [selectedModule, setSelectedModule] = useState<ModuleSchema | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Loading user information...
          </p>
        </div>
      </div>
    );
  }

  if (tenantError || authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-destructive-foreground mb-2">
              Error Loading
            </h2>
            <p className="text-destructive">
              {tenantError || authError || "Unknown error occurred"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-card-foreground mb-2">
            Welcome to {tenant?.brandInfo?.title || tenant?.fullName || "CiERP"}
          </h1>
          <p className="text-muted-foreground">
            {tenant?.brandInfo?.description ||
              "Enterprise Resource Planning Dashboard"}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tenant Information Card */}
          <div className="bg-card rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
              <div className="w-6 h-6 bg-primary/10 rounded mr-3 flex items-center justify-center">
                🏢
              </div>
              Tenant Information
            </h2>

            {tenant ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-foreground">
                      Organization:
                    </label>
                    <p className="text-card-foreground">{tenant.fullName}</p>
                  </div>
                  <div>
                    <label className="font-medium text-foreground">
                      Short Name:
                    </label>
                    <p className="text-card-foreground">{tenant.shortName}</p>
                  </div>
                  <div>
                    <label className="font-medium text-foreground">
                      Domain:
                    </label>
                    <p className="text-card-foreground">{tenant.rootDomain}</p>
                  </div>
                  <div>
                    <label className="font-medium text-foreground">
                      Tenant ID:
                    </label>
                    <p className="text-card-foreground font-mono text-xs">
                      {tenant.id}
                    </p>
                  </div>
                </div>

                {/* Middleware Data */}
                <div className="pt-4 border-t border-border">
                  <h3 className="font-medium text-foreground mb-2">
                    Current Context
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Language:</span>{" "}
                      {middlewareData?.language || "en"}
                    </div>
                    <div>
                      <span className="font-medium">Request ID:</span>
                      <span className="font-mono text-xs ml-1">
                        {middlewareData?.requestId?.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                {tenant.contact && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-medium text-foreground mb-2">
                      Contact Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      {tenant.contact.email && (
                        <div>
                          <span className="font-medium">Email:</span>{" "}
                          {tenant.contact.email}
                        </div>
                      )}
                      {tenant.contact.phoneNo && (
                        <div>
                          <span className="font-medium">Phone:</span>{" "}
                          {tenant.contact.phoneNo}
                        </div>
                      )}
                      {tenant.contact.webSiteUrl && (
                        <div>
                          <span className="font-medium">Website:</span>
                          <a
                            href={`https://${tenant.contact.webSiteUrl}`}
                            className="text-primary hover:underline ml-1"
                          >
                            {tenant.contact.webSiteUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Language Support */}
                {tenant.langSupport && tenant.langSupport.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-medium text-foreground mb-2">
                      Language Support
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tenant.langSupport.map((lang) => (
                        <span
                          key={lang}
                          className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs"
                        >
                          {lang.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No tenant information available
              </p>
            )}
          </div>

          {/* User Information Card */}
          <div className="bg-card rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
              <div className="w-6 h-6 bg-success/10 rounded mr-3 flex items-center justify-center">
                👤
              </div>
              User Information
            </h2>

            {isAuthenticated && user ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-foreground">Name:</label>
                    <p className="text-card-foreground">
                      {user.name || user.displayName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="font-medium text-foreground">
                      Email:
                    </label>
                    <p className="text-card-foreground">
                      {user.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="font-medium text-foreground">Role:</label>
                    <p className="text-card-foreground">
                      {user.role || "User"}
                    </p>
                  </div>
                  <div>
                    <label className="font-medium text-foreground">
                      User ID:
                    </label>
                    <p className="text-card-foreground font-mono text-xs">
                      {user.id || user.sub || "N/A"}
                    </p>
                  </div>
                </div>

                {/* User Permissions/Roles */}
                {user.permissions && user.permissions.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-medium text-foreground mb-2">
                      Permissions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {user.permissions.slice(0, 6).map((permission, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-success/10 text-success-foreground rounded-full text-xs"
                        >
                          {permission}
                        </span>
                      ))}
                      {user.permissions.length > 6 && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                          +{user.permissions.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Session Info */}
                <div className="pt-4 border-t border-border">
                  <h3 className="font-medium text-foreground mb-2">Session</h3>
                  <div className="text-sm text-muted-foreground">
                    <div>
                      Status:{" "}
                      <span className="text-success font-medium">Active</span>
                    </div>
                    {user.lastLoginAt && (
                      <div>
                        Last Login:{" "}
                        {new Date(user.lastLoginAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  Not authenticated
                </div>
                <button
                  onClick={() => {
                    // TODO: Implement login handler
                    console.log("Login clicked");
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>

        {/* App Selector Demo Section */}
        <div className="mt-8">
          <div className="bg-card rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
              <div className="w-6 h-6 bg-purple-500/10 rounded mr-3 flex items-center justify-center">
                🔄
              </div>
              App Selector Demo
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-foreground mb-3">Current App Context</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-foreground">App ID:</label>
                    <p className="text-card-foreground font-mono">{appSchemaData?.appId || middlewareData?.appId || 'core'}</p>
                  </div>
                  <div>
                    <label className="font-medium text-foreground">Hostname:</label>
                    <p className="text-card-foreground font-mono">{middlewareData?.hostname || 'localhost'}</p>
                  </div>
                  <div>
                    <label className="font-medium text-foreground">Service:</label>
                    <p className="text-card-foreground">{appSchemaData?.serviceName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-3">App Switching</h3>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    To test app switching, add these entries to your /etc/hosts file:
                  </p>
                  <pre className="text-xs bg-background border rounded p-3 overflow-x-auto">
{`127.0.0.1 core.crystal-image.net
127.0.0.1 library.crystal-image.net
127.0.0.1 school.crystal-image.net
127.0.0.1 content.crystal-image.net`}
                  </pre>
                  <p className="text-sm text-muted-foreground mt-3">
                    Then visit: <code className="bg-background px-1 rounded">http://library.crystal-image.net:3000/health</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* App Schema Demo Section */}
        <div className="mt-8">
          <div className="bg-card rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-card-foreground flex items-center">
                <div className="w-6 h-6 bg-blue-500/10 rounded mr-3 flex items-center justify-center">
                  🔧
                </div>
                App Schema (Server-side)
              </h2>
              <div className="text-sm text-muted-foreground">
                Loaded from server for: {appSchemaData?.appId || 'core'}
              </div>
            </div>

            {appSchemaError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-destructive text-sm">
                  Error: {appSchemaError}
                </p>
              </div>
            )}

            {appSchemaData ? (
              <div className="space-y-6">
                {/* Schema Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-foreground">Service:</label>
                    <p className="text-card-foreground">{appSchemaData.serviceName}</p>
                  </div>
                  <div>
                    <label className="font-medium text-foreground">Modules:</label>
                    <p className="text-card-foreground">{appSchemaData.modules.length}</p>
                  </div>
                  <div>
                    <label className="font-medium text-foreground">Languages:</label>
                    <p className="text-card-foreground">
                      {appSchemaData.supportedLanguages.map(lang => lang.code).join(', ')}
                    </p>
                  </div>
                </div>

                {/* Modules Grid */}
                <div>
                  <h3 className="font-medium text-foreground mb-3">Available Modules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {appSchemaData.modules.map((module) => (
                      <div
                        key={module.slug}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedModule?.slug === module.slug
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                            : 'border-border hover:shadow-md'
                        }`}
                        onClick={() => setSelectedModule(module)}
                      >
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-blue-500/10 rounded mr-3 flex items-center justify-center text-sm">
                            📋
                          </div>
                          <h4 className="font-semibold text-card-foreground">
                            {module.name.en}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {module.name.mm}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {module.slug}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                            {module.serviceName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Module Details */}
                {selectedModule && (
                  <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-medium text-foreground mb-3">
                      Module Details: {selectedModule.name.en}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="font-medium text-foreground">Slug:</label>
                        <p className="text-card-foreground font-mono text-sm">{selectedModule.slug}</p>
                      </div>
                      <div>
                        <label className="font-medium text-foreground">Service:</label>
                        <p className="text-card-foreground">{selectedModule.serviceName}</p>
                      </div>
                      {selectedModule.formFields && selectedModule.formFields.length > 0 && (
                        <div>
                          <label className="font-medium text-foreground">Form Fields:</label>
                          <div className="mt-2 space-y-1">
                            {selectedModule.formFields.map((field, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                  {field.name}
                                </span>
                                <span className="text-muted-foreground">
                                  {field.type}
                                </span>
                                {field.required && (
                                  <span className="text-red-500 text-xs">required</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {appSchemaError ? 
                  "App schema data could not be loaded from server" : 
                  "No app schema data available"
                }
              </div>
            )}
          </div>
        </div>

        {/* Applications Section */}
        {tenant?.applications && tenant.applications.length > 0 && (
          <div className="mt-8">
            <div className="bg-card rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
                <div className="w-6 h-6 bg-secondary/20 rounded mr-3 flex items-center justify-center">
                  📱
                </div>
                Available Applications
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenant.applications.map((app: any, index: number) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-primary/10 rounded mr-3 flex items-center justify-center text-sm">
                        {app.iconName === "book" && "📚"}
                        {app.iconName === "school" && "🎓"}
                        {app.iconName === "content_paste" && "📋"}
                        {!["book", "school", "content_paste"].includes(
                          app.iconName
                        ) && "📱"}
                      </div>
                      <h3 className="font-semibold text-card-foreground">
                        {app.displayName.en || app.title || "Application"}
                      </h3>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {app.localizedDescription?.en}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {app.shortName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            app.status
                              ? "bg-success text-success-foreground"
                              : "bg-destructive text-destructive-foreground"
                          }`}
                        >
                          {app.status ? "Active" : "Inactive"}
                        </span>
                        <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs">
                          {app.licenseType}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
