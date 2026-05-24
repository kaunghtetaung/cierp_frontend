'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Input, Button, Badge } from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  Database,
  RotateCcw,
  ShieldAlert,
  Settings,
  Eye,
  Copy,
  FileJson,
} from 'lucide-react';
import {
  getModuleSchemas,
  deleteModuleSchema,
  restoreModuleSchema,
  checkSystemAdminAccess,
  invalidateSchemaCache,
} from './actions/schema.actions';
import type { ModuleSchema } from './lib/types';

// Available services
const SERVICES = [
  { value: 'all', label: 'All Services' },
  { value: 'Core', label: 'Core' },
  { value: 'Library', label: 'Library' },
  { value: 'CPMS', label: 'CPMS' },
  { value: 'Content', label: 'Content' },
];

export default function SchemaEditorPage() {
  const router = useRouter();
  const [schemas, setSchemas] = useState<ModuleSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Dialog states
  const [deletingSchema, setDeletingSchema] = useState<ModuleSchema | null>(null);
  const [viewingSchema, setViewingSchema] = useState<ModuleSchema | null>(null);

  // Check admin access on mount
  useEffect(() => {
    async function checkAccess() {
      const result = await checkSystemAdminAccess();
      setIsAdmin(result.isAdmin);
      if (!result.isAdmin) {
        setAccessError(result.error || 'Access denied: SystemAdmin role required');
      }
    }
    checkAccess();
  }, []);

  // Load schemas
  const loadSchemas = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const result = await getModuleSchemas(
        selectedService && selectedService !== 'all' ? { serviceName: selectedService } : undefined
      );
      if (result.success && result.data) {
        setSchemas(result.data.data || []);
      } else {
        toastError(result.error || 'Failed to load schemas');
      }
    } catch (error) {
      console.error('Load schemas error:', error);
      toastError('Failed to load schemas');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedService]);

  useEffect(() => {
    if (isAdmin) {
      loadSchemas();
    }
  }, [isAdmin, loadSchemas]);

  // Filter schemas by search
  const filteredSchemas = schemas.filter((schema) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      schema.name.en?.toLowerCase().includes(query) ||
      schema.name.mm?.toLowerCase().includes(query) ||
      schema.slug?.toLowerCase().includes(query) ||
      schema.serviceName?.toLowerCase().includes(query)
    );
  });

  // Group schemas by service
  const groupedSchemas = filteredSchemas.reduce((acc, schema) => {
    const service = schema.serviceName || 'Unknown';
    if (!acc[service]) {
      acc[service] = [];
    }
    acc[service].push(schema);
    return acc;
  }, {} as Record<string, ModuleSchema[]>);

  // Handle edit
  const handleEdit = (schema: ModuleSchema) => {
    router.push(`/core/schema-editor/${schema._id}`);
  };

  // Handle view JSON
  const handleViewJson = (schema: ModuleSchema) => {
    setViewingSchema(schema);
  };

  // Handle duplicate
  const handleDuplicate = (schema: ModuleSchema) => {
    // Navigate to create page with prefilled data
    const duplicateData = {
      ...schema,
      _id: undefined,
      id: undefined,
      slug: `${schema.slug}-copy`,
      name: {
        en: `${schema.name.en} (Copy)`,
        mm: `${schema.name.mm} (Copy)`,
      },
    };
    sessionStorage.setItem('schema-editor-duplicate', JSON.stringify(duplicateData));
    router.push('/core/schema-editor/new');
  };

  // Handle delete
  const handleDelete = (schema: ModuleSchema) => {
    setDeletingSchema(schema);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!deletingSchema) return;

    startTransition(async () => {
      try {
        const result = await deleteModuleSchema(deletingSchema._id!);
        if (result.success) {
          toastSuccess('Schema deleted successfully');
          loadSchemas();
        } else {
          toastError(result.error || 'Failed to delete schema');
        }
      } catch (error) {
        console.error('Delete schema error:', error);
        toastError('Failed to delete schema');
      } finally {
        setDeletingSchema(null);
      }
    });
  };

  // Handle restore
  const handleRestore = (schema: ModuleSchema) => {
    startTransition(async () => {
      try {
        const result = await restoreModuleSchema(schema._id!);
        if (result.success) {
          toastSuccess('Schema restored successfully');
          loadSchemas();
        } else {
          toastError(result.error || 'Failed to restore schema');
        }
      } catch (error) {
        console.error('Restore schema error:', error);
        toastError('Failed to restore schema');
      }
    });
  };

  // Handle cache invalidation
  const handleInvalidateCache = () => {
    startTransition(async () => {
      try {
        const result = await invalidateSchemaCache(selectedService === 'all' ? 'Core' : selectedService);
        if (result.success) {
          toastSuccess('Cache invalidated successfully');
        } else {
          toastError(result.error || 'Failed to invalidate cache');
        }
      } catch (error) {
        console.error('Invalidate cache error:', error);
        toastError('Failed to invalidate cache');
      }
    });
  };

  // Access denied view
  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4 max-w-md">
          {accessError || 'You need SystemAdmin role to access the Module Schema Editor.'}
        </p>
        <Button variant="outline" onClick={() => router.push('/core/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // Loading access check
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6" />
            Module Schema Editor
          </h1>
          <p className="text-muted-foreground">
            Manage module configurations, forms, tables, and access policies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleInvalidateCache}
            disabled={isPending}
          >
            <Settings className="h-4 w-4 mr-2" />
            Invalidate Cache
          </Button>
          <Button onClick={() => router.push('/core/schema-editor/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Schema
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schemas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICES.map((service) => (
                  <SelectItem key={service.value} value={service.value}>
                    {service.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadSchemas} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSchemas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No schemas found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Get started by creating your first module schema'}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push('/core/schema-editor/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schema
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSchemas).map(([service, serviceSchemas]) => (
                <div key={service}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Badge variant="outline">{service}</Badge>
                    <span className="text-xs">({serviceSchemas.length} modules)</span>
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {serviceSchemas.map((schema) => (
                      <Card
                        key={schema._id}
                        className={`group hover:shadow-md transition-shadow cursor-pointer ${
                          schema.deletedAt ? 'opacity-60 border-dashed' : ''
                        }`}
                        onClick={() => handleEdit(schema)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">
                                {schema.name.en || schema.slug}
                              </CardTitle>
                              <CardDescription className="text-xs truncate">
                                /{schema.slug}
                              </CardDescription>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(schema);
                                }}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewJson(schema);
                                }}>
                                  <FileJson className="h-4 w-4 mr-2" />
                                  View JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicate(schema);
                                }}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {schema.deletedAt ? (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestore(schema);
                                  }}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Restore
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(schema);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-1 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {schema.formLayout}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {schema.formFields?.length || 0} fields
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {schema.dataTableSchema?.columns?.length || 0} columns
                            </Badge>
                          </div>
                          {schema.deletedAt && (
                            <Badge variant="destructive" className="text-xs">
                              Deleted
                            </Badge>
                          )}
                          {!schema.isActive && !schema.deletedAt && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total count */}
      {!loading && filteredSchemas.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredSchemas.length} of {schemas.length} schemas
        </p>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSchema} onOpenChange={() => setDeletingSchema(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module Schema</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingSchema?.name.en || deletingSchema?.slug}&quot;?
              This will soft-delete the schema and it can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View JSON Dialog */}
      <AlertDialog open={!!viewingSchema} onOpenChange={() => setViewingSchema(null)}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>Schema JSON - {viewingSchema?.name.en}</AlertDialogTitle>
            <AlertDialogDescription>
              Raw JSON representation of the module schema
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex-1 overflow-auto bg-muted rounded-md p-4">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(viewingSchema, null, 2)}
            </pre>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(viewingSchema, null, 2));
                toastSuccess('JSON copied to clipboard');
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy JSON
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
