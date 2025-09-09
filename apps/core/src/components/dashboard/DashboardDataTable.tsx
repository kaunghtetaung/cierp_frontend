"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { cn } from "@repo/ui";
import { ModuleDataTable } from "@repo/schema-tables";
import { DashboardTableWrapper } from "@/components/dashboard/ContentArea";
import type { ModuleSchema } from "@repo/types";
import { getLocalizedText } from "@repo/utils";
import { useLanguage } from "@repo/language";

interface DashboardDataTableProps {
  module: ModuleSchema;
  data: any[];
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSort?: (sortField: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isLoading?: boolean;
  onRefresh?: () => void;
  showMetrics?: boolean;
  className?: string;
}

/**
 * Dashboard-01 enhanced ModuleDataTable with metrics and improved styling
 */
export function DashboardDataTable({
  module,
  data,
  totalItems,
  totalPages,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSort,
  sortBy,
  sortOrder,
  isLoading,
  onRefresh,
  showMetrics = true,
  className,
}: DashboardDataTableProps) {
  const { currentLanguage } = useLanguage();

  // Calculate metrics
  const metrics = React.useMemo(() => {
    if (!data || !showMetrics) return null;

    const activeCount = data.filter(item => item.isActive !== false).length;
    const inactiveCount = data.length - activeCount;
    const recentCount = data.filter(item => {
      if (!item.createdAt) return false;
      const created = new Date(item.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length;

    return [
      {
        title: "Total Items",
        value: totalItems || data.length,
        icon: "Database",
        description: "Total records"
      },
      {
        title: "Active",
        value: activeCount,
        icon: "CheckCircle",
        description: "Active items",
        trend: activeCount > inactiveCount ? {
          value: Math.round((activeCount / data.length) * 100),
          isPositive: true,
          label: "of total"
        } : undefined
      },
      {
        title: "Recent",
        value: recentCount,
        icon: "Clock",
        description: "Added this week",
        trend: recentCount > 0 ? {
          value: Math.round((recentCount / data.length) * 100),
          isPositive: true,
          label: "this week"
        } : undefined
      },
      {
        title: "Status",
        value: isLoading ? "Loading..." : "Ready",
        icon: isLoading ? "Loader" : "CheckCircle2",
        description: isLoading ? "Fetching data..." : "Data loaded"
      }
    ];
  }, [data, totalItems, isLoading, showMetrics]);

  // Get module title
  const moduleTitle = getLocalizedText(module.name, currentLanguage) || module.slug;
  const moduleDescription = getLocalizedText(module.description, currentLanguage);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Metrics Cards */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <IconComponent 
                  name={metric.icon as any}
                  className={cn(
                    "h-4 w-4 text-muted-foreground",
                    isLoading && metric.icon === "Loader" && "animate-spin"
                  )}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  {metric.trend && (
                    <Badge variant={metric.trend.isPositive ? "default" : "secondary"}>
                      <IconComponent
                        name={metric.trend.isPositive ? "TrendingUp" : "TrendingDown"}
                        className="h-3 w-3 mr-1"
                      />
                      {metric.trend.value}%
                    </Badge>
                  )}
                  <span>{metric.description}</span>
                  {metric.trend && <span>{metric.trend.label}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Data Table */}
      <DashboardTableWrapper
        title={moduleTitle}
        description={moduleDescription}
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <IconComponent 
                name="RefreshCw" 
                className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} 
              />
              Refresh
            </Button>
            <Button size="sm" asChild>
              <Link href={`/${module.serviceName}/${module.slug}/new`}>
                <IconComponent name="Plus" className="h-4 w-4 mr-2" />
                Add New
              </Link>
            </Button>
          </div>
        }
      >
        <div className="border-t">
          <ModuleDataTable
            module={module}
            data={data}
            totalItems={totalItems}
            totalPages={totalPages}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            onSort={onSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            isLoading={isLoading}
            onRefresh={onRefresh}
          />
        </div>
      </DashboardTableWrapper>
    </div>
  );
}

export default DashboardDataTable;