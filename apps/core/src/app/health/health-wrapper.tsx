"use client";

import React, { useState, useEffect } from "react";

// Simple component implementations using semantic theme variables
const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-card text-card-foreground border rounded-lg shadow-sm ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-6 pb-4 ${className}`}>{children}</div>;

const CardTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3 className={`text-lg font-semibold text-card-foreground ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={`text-sm text-muted-foreground mt-1 ${className}`}>
    {children}
  </p>
);

const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

const Badge = ({
  children,
  className = "",
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "destructive"
    | "success"
    | "warning";
}) => {
  const baseClasses =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    outline: "border border-input bg-transparent text-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    success: "bg-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
  };
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Button = ({
  children,
  className = "",
  variant = "default",
  size = "default",
  disabled = false,
  onClick,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  [key: string]: any;
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  const sizeClasses = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

interface HealthData {
  system: {
    hostname: string;
    requestId: string;
    protocol: string;
    app: string;
    timestamp: string;
    nodeEnv?: string;
  };
  middleware: {
    status: string;
    tenantResolution: string;
    language: string;
    requestProcessing: string;
    tenantId?: string;
    tenantStatus?: string;
  };
  tenant: {
    id?: string;
    status?: string;
    isActive: boolean;
    hostname: string;
    resolvedAt: string;
  };
}

interface HealthWrapperProps {
  healthData: HealthData;
}

/**
 * Health Status Component
 * Displays system, middleware, and tenant health information
 */
export function HealthWrapper({ healthData }: HealthWrapperProps) {
  const [refreshTime, setRefreshTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshTime(new Date());
    // Refresh the page to get updated health data
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const getStatusVariant = (
    status: string
  ): "success" | "warning" | "destructive" | "secondary" => {
    switch (status.toLowerCase()) {
      case "operational":
      case "healthy":
      case "success":
      case "active":
        return "success";
      case "warning":
      case "degraded":
        return "warning";
      case "failed":
      case "error":
      case "inactive":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    const variant = getStatusVariant(status);
    const iconColorClass = {
      success: "text-success",
      warning: "text-warning",
      destructive: "text-destructive",
      secondary: "text-muted-foreground",
    }[variant];

    const iconPath = {
      success: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 13l4 4L19 7"
        ></path>
      ),
      warning: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        ></path>
      ),
      destructive: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        ></path>
      ),
      secondary: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      ),
    }[variant];

    return (
      <svg
        className={`w-4 h-4 ${iconColorClass}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {iconPath}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Last updated: {refreshTime.toLocaleTimeString()}
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          {isRefreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground mr-2"></div>
              Refreshing...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(healthData.middleware.status)}
            Overall System Status
          </CardTitle>
          <CardDescription>
            CiERP multi-tenant system health overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-success mb-1">
                {healthData.tenant.isActive ? "ONLINE" : "OFFLINE"}
              </div>
              <div className="text-sm text-muted-foreground">System Status</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {healthData.tenant.id ? "1" : "0"}
              </div>
              <div className="text-sm text-muted-foreground">Active Tenant</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-info mb-1">
                {healthData.middleware.language.toUpperCase()}
              </div>
              <div className="text-sm text-muted-foreground">Language</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              ></path>
            </svg>
            System Information
          </CardTitle>
          <CardDescription>
            Application server and runtime details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground">Hostname:</span>
                <Badge variant="outline" className="font-mono">
                  {healthData.system.hostname}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground">
                  Application:
                </span>
                <Badge variant="default">{healthData.system.app}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground">Protocol:</span>
                <Badge variant="outline">{healthData.system.protocol}</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground">
                  Environment:
                </span>
                <Badge
                  variant={
                    healthData.system.nodeEnv === "production"
                      ? "success"
                      : "warning"
                  }
                >
                  {healthData.system.nodeEnv || "unknown"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground">Request ID:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {healthData.system.requestId.slice(0, 8)}...
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground">Timestamp:</span>
                <Badge variant="outline" className="text-xs">
                  {new Date(healthData.system.timestamp).toLocaleTimeString()}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Middleware Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
            Middleware Health
          </CardTitle>
          <CardDescription>
            Request processing and tenant resolution status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Middleware Status</div>
                  <div className="text-sm text-muted-foreground">
                    Core middleware health
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthData.middleware.status)}
                  <Badge
                    variant={getStatusVariant(healthData.middleware.status)}
                  >
                    {healthData.middleware.status}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Tenant Resolution</div>
                  <div className="text-sm text-muted-foreground">
                    Domain to tenant mapping
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthData.middleware.tenantResolution)}
                  <Badge
                    variant={getStatusVariant(
                      healthData.middleware.tenantResolution
                    )}
                  >
                    {healthData.middleware.tenantResolution}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Request Processing</div>
                  <div className="text-sm text-muted-foreground">
                    HTTP request handling
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthData.middleware.requestProcessing)}
                  <Badge
                    variant={getStatusVariant(
                      healthData.middleware.requestProcessing
                    )}
                  >
                    {healthData.middleware.requestProcessing}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Language Support</div>
                  <div className="text-sm text-muted-foreground">
                    Multi-language processing
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon("success")}
                  <Badge variant="success">
                    {healthData.middleware.language}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-info"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              ></path>
            </svg>
            Tenant Configuration
          </CardTitle>
          <CardDescription>
            Multi-tenant ERP instance configuration and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthData.tenant.id ? (
            <div className="space-y-4">
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-success"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-success-foreground">
                      Tenant Active
                    </h3>
                    <p className="text-sm text-success-foreground/80 mt-1">
                      ERP instance successfully configured for tenant:{" "}
                      <code className="font-mono bg-success/20 px-2 py-1 rounded">
                        {healthData.tenant.id}
                      </code>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">
                      Tenant ID:
                    </span>
                    <Badge variant="outline" className="font-mono">
                      {healthData.tenant.id}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">Status:</span>
                    <Badge
                      variant={getStatusVariant(
                        healthData.tenant.status || "unknown"
                      )}
                    >
                      {healthData.tenant.status || "unknown"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">Domain:</span>
                    <Badge variant="outline" className="font-mono">
                      {healthData.tenant.hostname}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">
                      Resolved At:
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {new Date(
                        healthData.tenant.resolvedAt
                      ).toLocaleTimeString()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Tenant Features */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-card-foreground mb-3">
                  Available ERP Modules
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Badge variant="secondary" className="p-2 text-center">
                    Financial Management
                  </Badge>
                  <Badge variant="secondary" className="p-2 text-center">
                    Human Resources
                  </Badge>
                  <Badge variant="secondary" className="p-2 text-center">
                    Supply Chain
                  </Badge>
                  <Badge variant="secondary" className="p-2 text-center">
                    Customer Relations
                  </Badge>
                  <Badge variant="secondary" className="p-2 text-center">
                    Project Management
                  </Badge>
                  <Badge variant="secondary" className="p-2 text-center">
                    Business Intelligence
                  </Badge>
                  <Badge variant="secondary" className="p-2 text-center">
                    Inventory Management
                  </Badge>
                  <Badge variant="secondary" className="p-2 text-center">
                    Asset Management
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-destructive"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-destructive-foreground">
                    No Tenant Configuration
                  </h3>
                  <p className="text-sm text-destructive-foreground/80 mt-1">
                    No tenant found for hostname:{" "}
                    <code className="font-mono bg-destructive/20 px-2 py-1 rounded">
                      {healthData.tenant.hostname}
                    </code>
                  </p>
                  <p className="text-sm text-destructive-foreground/70 mt-2">
                    • Check domain configuration in tenant management
                    <br />
                    • Verify tenant is active and properly configured
                    <br />• Contact system administrator for assistance
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
