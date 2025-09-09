"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Button } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { cn } from "@repo/ui";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  className?: string;
}

/**
 * Dashboard-01 style metric card component
 */
export function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <IconComponent 
            name={icon as any} 
            className="h-4 w-4 text-muted-foreground" 
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {trend && (
            <Badge variant={trend.isPositive ? "default" : "secondary"}>
              <IconComponent
                name={trend.isPositive ? "TrendingUp" : "TrendingDown"}
                className="h-3 w-3 mr-1"
              />
              {trend.value}%
            </Badge>
          )}
          {description && <span>{description}</span>}
          {trend && <span>{trend.label}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricGridProps {
  metrics: Array<MetricCardProps>;
  className?: string;
}

/**
 * Responsive grid for metric cards
 */
export function MetricGrid({ metrics, className }: MetricGridProps) {
  return (
    <div className={cn(
      "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}

interface DashboardTableWrapperProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Dashboard-01 style table wrapper with header and actions
 */
export function DashboardTableWrapper({
  title,
  description,
  children,
  actions,
  className,
}: DashboardTableWrapperProps) {
  return (
    <Card className={cn("", className)}>
      {(title || description || actions) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );
}

interface ContentSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Content section with consistent spacing and optional header
 */
export function ContentSection({
  title,
  description,
  children,
  actions,
  className,
}: ContentSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold leading-none tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

interface DashboardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Responsive dashboard grid layout
 */
export function DashboardGrid({ 
  children, 
  columns = 2, 
  className 
}: DashboardGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 lg:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div className={cn(
      "grid gap-4 md:gap-6",
      gridCols[columns],
      className
    )}>
      {children}
    </div>
  );
}

export default {
  MetricCard,
  MetricGrid,
  DashboardTableWrapper,
  ContentSection,
  DashboardGrid,
};