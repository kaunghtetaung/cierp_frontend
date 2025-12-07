'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@repo/ui';
import { IconComponent } from '@repo/ui';
import { Card, CardContent, Button } from '@repo/ui';
import { useLanguage } from '@repo/language';
import { getLocalizedText } from '@repo/utils';
import { getModuleDashboardAction } from '@repo/app-modules/server-actions';
import { StudentDashboard } from './StudentDashboard';
import { ModuleDataTableWrapper } from '@/components/modules/ModuleDataTableWrapper';
import { PrefilterSheetTrigger } from '@repo/schema-tables';
import type { StudentDashboardResponse, ModuleSchema, PrefilterFieldGroup, PrefilterField } from '@repo/types';
import type { ModulePermissions } from '@/types/layout';

interface StudentDashboardWrapperProps {
  module: ModuleSchema;
  initialData?: any[];
  userPermissions?: ModulePermissions;
}

export function StudentDashboardWrapper({
  module,
  initialData = [],
  userPermissions,
}: StudentDashboardWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentLanguage } = useLanguage();

  // Tab state - default to dashboard if hasDashboard is true
  const [activeTab, setActiveTab] = useState<'dashboard' | 'data'>(() => {
    const tabParam = searchParams.get('_view');
    if (tabParam === 'data' || tabParam === 'dashboard') {
      return tabParam;
    }
    return module.hasDashboard ? 'dashboard' : 'data';
  });

  // Active prefilter tab state for persistence
  const [activePrefilterTab, setActivePrefilterTab] = useState<string>(() => {
    return module.dataTableSchema?.prefilters?.fieldGroups?.[0]?.groupKey || '';
  });

  // Check if prefilters are enabled
  const hasPrefilters = module.dataTableSchema?.prefilters?.enabled &&
    ((module.dataTableSchema?.prefilters?.fields?.length ?? 0) > 0 ||
      (module.dataTableSchema?.prefilters?.fieldGroups?.length ?? 0) > 0);

  // Helper to get all prefilter fields
  const getPrefilterFields = useCallback((): PrefilterField[] => {
    const prefilters = module.dataTableSchema?.prefilters;
    if (!prefilters) return [];
    if (prefilters.fieldGroups && prefilters.fieldGroups.length > 0) {
      return prefilters.fieldGroups.flatMap((group: PrefilterFieldGroup) => group.fields || []);
    }
    return prefilters.fields || [];
  }, [module.dataTableSchema?.prefilters]);

  // Prefilter state management
  const [prefilterValues, setPrefilterValues] = useState<Record<string, string | string[] | { from: string; to: string } | undefined>>(() => {
    const values: Record<string, string | string[] | { from: string; to: string } | undefined> = {};
    const allFields = getPrefilterFields();

    allFields.forEach((field) => {
      if (field.type === 'text') {
        const operators = field.searchOptions?.operators || [{ value: '$regex' }, { value: '$eq' }];
        for (const op of operators) {
          const paramValue = searchParams.get(`${field.fieldName}[${op.value}]`);
          if (paramValue) {
            values[field.fieldName] = paramValue;
            values[`${field.fieldName}_operator`] = op.value;
            break;
          }
        }
      } else if (field.type === 'yearRange') {
        const exactValue = searchParams.get(field.fieldName) || searchParams.get(`${field.fieldName}[$eq]`);
        if (exactValue) {
          values[field.fieldName] = exactValue;
          values[`${field.fieldName}_operator`] = '$eq';
        } else {
          const fromValue = searchParams.get(`${field.fieldName}[$gte]`);
          const toValue = searchParams.get(`${field.fieldName}[$lte]`);
          if (fromValue || toValue) {
            values[field.fieldName] = { from: fromValue || '', to: toValue || '' };
            values[`${field.fieldName}_operator`] = 'between';
          }
        }
      } else {
        const paramValue = searchParams.get(field.fieldName);
        if (paramValue) {
          if (field.allowMultiple && paramValue.includes('|')) {
            values[field.fieldName] = paramValue.split('|').map(v => v.trim());
          } else {
            values[field.fieldName] = paramValue;
          }
        }
      }
    });
    return values;
  });

  // Sync prefilterValues with URL params when searchParams change
  useEffect(() => {
    const newValues: Record<string, string | string[] | { from: string; to: string } | undefined> = {};
    const allFields = getPrefilterFields();

    allFields.forEach((field) => {
      if (field.type === 'text') {
        const operators = field.searchOptions?.operators || [{ value: '$regex' }, { value: '$eq' }];
        for (const op of operators) {
          const paramValue = searchParams.get(`${field.fieldName}[${op.value}]`);
          if (paramValue) {
            newValues[field.fieldName] = paramValue;
            newValues[`${field.fieldName}_operator`] = op.value;
            break;
          }
        }
      } else if (field.type === 'yearRange') {
        const exactValue = searchParams.get(field.fieldName) || searchParams.get(`${field.fieldName}[$eq]`);
        if (exactValue) {
          newValues[field.fieldName] = exactValue;
          newValues[`${field.fieldName}_operator`] = '$eq';
        } else {
          const fromValue = searchParams.get(`${field.fieldName}[$gte]`);
          const toValue = searchParams.get(`${field.fieldName}[$lte]`);
          if (fromValue || toValue) {
            newValues[field.fieldName] = { from: fromValue || '', to: toValue || '' };
            newValues[`${field.fieldName}_operator`] = 'between';
          }
        }
      } else {
        const paramValue = searchParams.get(field.fieldName);
        if (paramValue) {
          if (field.allowMultiple && paramValue.includes('|')) {
            newValues[field.fieldName] = paramValue.split('|').map((v: string) => v.trim());
          } else {
            newValues[field.fieldName] = paramValue;
          }
        }
      }
    });

    setPrefilterValues(newValues);
  }, [searchParams, getPrefilterFields]);

  // Handle prefilter changes
  const handlePrefilterChange = useCallback((fieldName: string, value: string | string[] | { from: string; to: string } | undefined, operator?: string) => {
    const newValues = { ...prefilterValues };
    const allFields = getPrefilterFields();

    if (value !== undefined && (Array.isArray(value) ? value.length > 0 : value)) {
      newValues[fieldName] = value;
      if (operator) {
        newValues[`${fieldName}_operator`] = operator;
      }
    } else {
      delete newValues[fieldName];
      delete newValues[`${fieldName}_operator`];
    }
    setPrefilterValues(newValues);

    // Update URL with prefilter params
    const newSearchParams = new URLSearchParams(searchParams.toString());

    // Remove all existing prefilter params
    allFields.forEach((field) => {
      if (field.type === 'text') {
        const operators = field.searchOptions?.operators || [{ value: '$regex' }, { value: '$eq' }];
        operators.forEach((op: { value: string }) => {
          newSearchParams.delete(`${field.fieldName}[${op.value}]`);
        });
      } else if (field.type === 'yearRange') {
        newSearchParams.delete(field.fieldName);
        newSearchParams.delete(`${field.fieldName}[$eq]`);
        newSearchParams.delete(`${field.fieldName}[$gte]`);
        newSearchParams.delete(`${field.fieldName}[$lte]`);
      } else {
        newSearchParams.delete(field.fieldName);
      }
    });

    // Add new prefilter params
    Object.entries(newValues).forEach(([key, val]) => {
      if (key.endsWith('_operator') || val === undefined) return;

      const field = allFields.find((f) => f.fieldName === key);
      if (field?.type === 'text' && newValues[`${key}_operator`]) {
        const op = newValues[`${key}_operator`] as string;
        newSearchParams.set(`${key}[${op}]`, val as string);
      } else if (field?.type === 'yearRange' && newValues[`${key}_operator`]) {
        const op = newValues[`${key}_operator`] as string;
        if (op === 'between' && typeof val === 'object' && val && 'from' in val && 'to' in val) {
          if (val.from) newSearchParams.set(`${key}[$gte]`, val.from);
          if (val.to) newSearchParams.set(`${key}[$lte]`, val.to);
        } else if (op === '$eq' && typeof val === 'string') {
          newSearchParams.set(key, val);
        }
      } else if (Array.isArray(val)) {
        newSearchParams.set(key, val.join('|'));
      } else if (typeof val === 'string') {
        newSearchParams.set(key, val);
      }
    });

    newSearchParams.set('page', '1');
    router.push(`${pathname}?${newSearchParams.toString()}`);
  }, [prefilterValues, getPrefilterFields, searchParams, router, pathname]);

  // Clear all prefilters
  const handleClearAllPrefilters = useCallback(() => {
    setPrefilterValues({});

    const newSearchParams = new URLSearchParams(searchParams.toString());
    const allFields = getPrefilterFields();

    allFields.forEach((field) => {
      if (field.type === 'text') {
        const operators = field.searchOptions?.operators || [{ value: '$regex' }, { value: '$eq' }];
        operators.forEach((op: { value: string }) => {
          newSearchParams.delete(`${field.fieldName}[${op.value}]`);
        });
      } else if (field.type === 'yearRange') {
        newSearchParams.delete(field.fieldName);
        newSearchParams.delete(`${field.fieldName}[$eq]`);
        newSearchParams.delete(`${field.fieldName}[$gte]`);
        newSearchParams.delete(`${field.fieldName}[$lte]`);
      } else {
        newSearchParams.delete(field.fieldName);
      }
    });

    newSearchParams.set('page', '1');
    router.push(`${pathname}?${newSearchParams.toString()}`);
  }, [searchParams, getPrefilterFields, router, pathname]);

  // Calculate total active filters
  const totalActiveFilters = useMemo(() => {
    let count = 0;
    const allFields = getPrefilterFields();

    allFields.forEach((field) => {
      const value = prefilterValues[field.fieldName];
      if (value !== undefined && value !== '' && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) count++;
        } else if (typeof value === 'object') {
          if (value.from || value.to) count++;
        } else {
          count++;
        }
      }
    });

    return count;
  }, [prefilterValues, getPrefilterFields]);

  // Build query params for dashboard API from URL search params
  // This reuses the same prefilter params that ModuleDataTable uses
  const dashboardQueryParams = useMemo(() => {
    const params: Record<string, string | undefined> = {};

    // Copy all search params except internal ones
    searchParams.forEach((value, key) => {
      // Skip internal params and pagination params
      if (key.startsWith('_') || key === 'page' || key === 'limit' || key === 'sortBy' || key === 'sortOrder') {
        return;
      }
      params[key] = value;
    });

    return params;
  }, [searchParams]);

  // Fetch dashboard data - only when dashboard tab is active
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['student-dashboard', dashboardQueryParams],
    queryFn: async () => {
      const response = await getModuleDashboardAction<StudentDashboardResponse>(
        'students',
        dashboardQueryParams
      );
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch dashboard data');
      }
      return response.data!;
    },
    enabled: activeTab === 'dashboard',
    staleTime: 5 * 60 * 1000,
  });

  // Handle view tab change
  const handleViewTabChange = useCallback((value: string) => {
    const newTab = value as 'dashboard' | 'data';
    setActiveTab(newTab);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('_view', newTab);
    router.push(`${pathname}?${newSearchParams.toString()}`);
  }, [searchParams, router, pathname]);

  // Check if module has dashboard - for students module, always show dashboard
  const hasDashboard = module.hasDashboard === true || module.slug === 'students';

  // If module doesn't have dashboard, just render the data table
  if (!hasDashboard) {
    return (
      <ModuleDataTableWrapper
        module={module}
        initialData={initialData}
        userPermissions={userPermissions}
      />
    );
  }

  // Get total items from dashboard data for prefilter display
  const totalItems = dashboardData?.summary?.totalStudents || 0;

  // Sort and pagination handlers for Control tab
  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('sortBy', sortBy);
    newSearchParams.set('sortOrder', sortOrder);
    newSearchParams.set('page', '1'); // Reset to first page
    router.push(`${pathname}?${newSearchParams.toString()}`);
  }, [searchParams, router, pathname]);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('limit', pageSize.toString());
    newSearchParams.set('page', '1'); // Reset to first page
    router.push(`${pathname}?${newSearchParams.toString()}`);
  }, [searchParams, router, pathname]);

  // Get current sort and pagination values
  const currentSort = searchParams.get('sortBy') || '';
  const currentSortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
  const currentPageSize = parseInt(searchParams.get('limit') || '10');

  // Build sort options from table schema
  const sortOptions = useMemo(() => {
    if (!module.dataTableSchema?.columns) return [];

    return module.dataTableSchema.columns
      .filter(col => col.sortable !== false)
      .map(col => ({
        field: col.fieldName,
        label: col.label
      }));
  }, [module.dataTableSchema?.columns]);

  // Add Control tab to field groups
  const fieldGroupsWithControl = useMemo(() => {
    if (!module.dataTableSchema?.prefilters?.fieldGroups) return [];

    // Clone existing field groups and add Control tab
    const groups = [...module.dataTableSchema.prefilters.fieldGroups];

    // Add Control tab at the end
    groups.push({
      groupKey: 'control',
      groupLabel: { en: 'Control', mm: 'ထိန်းချုပ်မှု' },
      fields: [] // Control fields will be handled specially in PrefilterTabGroup
    });

    return groups;
  }, [module.dataTableSchema?.prefilters?.fieldGroups]);

  // Module has dashboard - render prefilters above tabs
  return (
    <div className="space-y-4">
      {/* Header with Module Title and Actions */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Module Icon, Title & Description */}
        <div className="flex items-start gap-3 flex-1">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <IconComponent name={module.iconName || "GraduationCap"} className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {getLocalizedText(module.name, currentLanguage)}
            </h1>
            {module.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {getLocalizedText(module.description, currentLanguage)}
              </p>
            )}
          </div>
        </div>

        {/* Right: View Tabs, Filter Button, and Clear All Button */}
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={handleViewTabChange} className="w-auto">
            <TabsList>
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <IconComponent name="LayoutDashboard" className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <IconComponent name="Table" className="h-4 w-4" />
                Data
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filter Sheet Trigger and Clear All Button */}
          {hasPrefilters && fieldGroupsWithControl.length > 0 && (
            <>
              <PrefilterSheetTrigger
                fieldGroups={fieldGroupsWithControl}
                prefilterValues={prefilterValues}
                onPrefilterChange={handlePrefilterChange}
                onClearAll={handleClearAllPrefilters}
                currentLanguage={currentLanguage}
                moduleSlug={module.slug}
                totalItems={totalItems}
                sortOptions={sortOptions}
                currentSort={currentSort}
                currentOrder={currentSortOrder}
                onSortChange={handleSortChange}
                currentPageSize={currentPageSize}
                onPageSizeChange={handlePageSizeChange}
                disabledTabs={activeTab === 'dashboard' ? ['control', 'identity'] : []}
              />

              {/* Clear All Filters Button */}
              {totalActiveFilters > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearAllPrefilters}
                  className="h-10 px-4 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200"
                >
                  <IconComponent name="X" className="h-4 w-4" />
                  <span className="font-medium">
                    {currentLanguage === "mm" ? "အားလုံးရှင်း" : "Clear All"}
                  </span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'dashboard' ? (
        <div>
          {dashboardError ? (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <IconComponent name="AlertCircle" className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Error loading dashboard</p>
                    <p className="text-sm">
                      {dashboardError instanceof Error ? dashboardError.message : 'An unexpected error occurred'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchDashboard()} className="ml-auto">
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <StudentDashboard
              data={dashboardData || null}
              isLoading={isDashboardLoading}
              activeFilters={prefilterValues}
              filterFields={getPrefilterFields()}
            />
          )}
        </div>
      ) : (
        <ModuleDataTableWrapper
          module={module}
          initialData={initialData}
          userPermissions={userPermissions}
          hidePrefilters={true}
          hideTitle={true}
        />
      )}
    </div>
  );
}