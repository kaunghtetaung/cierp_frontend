'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Badge } from '@repo/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
import { toastSuccess, toastError } from '@repo/utils';
import {
  ArrowLeft,
  Save,
  Loader2,
  Database,
  FileText,
  Table,
  Shield,
  Wand2,
  Zap,
  Eye,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import {
  getModuleSchemaById,
  updateModuleSchema,
  createModuleSchema,
  checkSystemAdminAccess,
} from '../actions/schema.actions';
import {
  BasicInfoForm,
  FormFieldsEditor,
  TableColumnsEditor,
  AccessPolicyEditor,
} from '../components';
import type { ModuleSchema, CreateModuleSchemaDto, UpdateModuleSchemaDto, DataTableSchema } from '../lib/types';

interface SchemaEditPageProps {
  schemaId?: string;
}

// Default data table schema
const createDefaultDataTableSchema = (): DataTableSchema => ({
  layout: 'standard',
  columns: [],
  actions: {
    edit: { type: 'modal', label: { en: 'Edit', mm: 'ပြင်ဆင်ရန်' }, icon: 'edit' },
    delete: { type: 'modal', label: { en: 'Delete', mm: 'ဖျက်ရန်' }, icon: 'delete' },
    view: { type: 'modal', label: { en: 'View', mm: 'ကြည့်ရန်' }, icon: 'view' },
  },
  pagination: {
    enabled: true,
    defaultLimit: 10,
    allowedLimits: [10, 25, 50, 100],
    isClientSidePaging: true,
  },
  sorting: {
    enabled: true,
  },
  filtering: {
    enabled: true,
    searchFields: [],
  },
});

// Default schema template
const createDefaultSchema = (): Partial<ModuleSchema> => ({
  name: { en: '', mm: '' },
  slug: '',
  serviceName: 'Core',
  description: { en: '', mm: '' },
  iconName: 'FileText',
  formLayout: 'vertical',
  formFields: [],
  dataTableSchema: createDefaultDataTableSchema(),
  extraActionForms: [],
  isActive: true,
});

export default function SchemaEditPage({ schemaId }: SchemaEditPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = schemaId || searchParams.get('id');
  const isCreateMode = !id || id === 'new';

  const [schema, setSchema] = useState<Partial<ModuleSchema>>(createDefaultSchema());
  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

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

  // Load schema if editing
  useEffect(() => {
    if (isAdmin && !isCreateMode && id) {
      loadSchema(id);
    }
  }, [isAdmin, isCreateMode, id]);

  // Check for duplicate data in session storage (for create mode)
  useEffect(() => {
    if (isCreateMode) {
      const duplicateData = sessionStorage.getItem('schema-editor-duplicate');
      if (duplicateData) {
        try {
          const parsed = JSON.parse(duplicateData);
          setSchema(parsed);
          sessionStorage.removeItem('schema-editor-duplicate');
        } catch (e) {
          console.error('Failed to parse duplicate data:', e);
        }
      }
    }
  }, [isCreateMode]);

  // Load schema from API
  const loadSchema = async (schemaId: string) => {
    setLoading(true);
    try {
      const result = await getModuleSchemaById(schemaId);
      if (result.success && result.data) {
        setSchema(result.data);
      } else {
        toastError(result.error || 'Failed to load schema');
        router.push('/core/schema-editor');
      }
    } catch (error) {
      console.error('Load schema error:', error);
      toastError('Failed to load schema');
      router.push('/core/schema-editor');
    } finally {
      setLoading(false);
    }
  };

  // Handle schema update
  const handleSchemaChange = (updates: Partial<ModuleSchema>) => {
    setSchema((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!schema.name?.en || !schema.slug || !schema.serviceName) {
      toastError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (isCreateMode) {
        const createData: CreateModuleSchemaDto = {
          name: schema.name!,
          slug: schema.slug!,
          serviceName: schema.serviceName!,
          description: schema.description!,
          iconName: schema.iconName || 'FileText',
          parentModule: schema.parentModule,
          hasDashboard: schema.hasDashboard,
          formLayout: schema.formLayout || 'vertical',
          customLayoutName: schema.customLayoutName,
          formFields: schema.formFields || [],
          wizardConfig: schema.wizardConfig,
          dataTableSchema: schema.dataTableSchema || createDefaultDataTableSchema(),
          extraActionForms: schema.extraActionForms || [],
          detailViewSchema: schema.detailViewSchema,
          moduleAccessPolicy: schema.moduleAccessPolicy,
          isActive: schema.isActive !== false,
        };

        const result = await createModuleSchema(createData);
        if (result.success) {
          toastSuccess('Schema created successfully');
          setHasUnsavedChanges(false);
          router.push(`/core/schema-editor/${result.data._id}`);
        } else {
          toastError(result.error || 'Failed to create schema');
        }
      } else {
        const updateData: UpdateModuleSchemaDto = {
          name: schema.name,
          description: schema.description,
          iconName: schema.iconName,
          parentModule: schema.parentModule,
          hasDashboard: schema.hasDashboard,
          formLayout: schema.formLayout,
          customLayoutName: schema.customLayoutName,
          formFields: schema.formFields,
          wizardConfig: schema.wizardConfig,
          dataTableSchema: schema.dataTableSchema,
          extraActionForms: schema.extraActionForms,
          detailViewSchema: schema.detailViewSchema,
          moduleAccessPolicy: schema.moduleAccessPolicy,
          isActive: schema.isActive,
          version: schema.version,
        };

        const result = await updateModuleSchema(schema._id!, updateData);
        if (result.success) {
          toastSuccess('Schema updated successfully');
          setSchema(result.data);
          setHasUnsavedChanges(false);
        } else {
          toastError(result.error || 'Failed to update schema');
        }
      }
    } catch (error) {
      console.error('Save schema error:', error);
      toastError('Failed to save schema');
    } finally {
      setSaving(false);
    }
  };

  // Handle navigation with unsaved changes check
  const handleBack = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation('/core/schema-editor');
      setShowUnsavedDialog(true);
    } else {
      router.push('/core/schema-editor');
    }
  };

  // Confirm navigation
  const confirmNavigation = () => {
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
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

  // Loading states
  if (isAdmin === null || loading) {
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Database className="h-6 w-6" />
              {isCreateMode ? 'Create Module Schema' : `Edit: ${schema.name?.en || schema.slug}`}
            </h1>
            <p className="text-muted-foreground">
              {isCreateMode
                ? 'Define a new module configuration'
                : `Editing ${schema.serviceName} / ${schema.slug}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-amber-600">
              Unsaved changes
            </Badge>
          )}
          {!isCreateMode && (
            <Button
              variant="outline"
              onClick={() => loadSchema(schema._id!)}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Reload
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isCreateMode ? 'Create Schema' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Basic Info</span>
          </TabsTrigger>
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">Form Fields</span>
            {schema.formFields && schema.formFields.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {schema.formFields.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            <span className="hidden sm:inline">Table</span>
            {schema.dataTableSchema?.columns && schema.dataTableSchema.columns.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {schema.dataTableSchema.columns.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Access Policy</span>
          </TabsTrigger>
          <TabsTrigger value="wizard" className="flex items-center gap-2" disabled={!schema.formLayout?.includes('wizard')}>
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Wizard</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Actions</span>
          </TabsTrigger>
          <TabsTrigger value="detail" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Detail View</span>
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the module's basic settings and metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BasicInfoForm
                data={schema}
                onChange={handleSchemaChange}
                isEdit={!isCreateMode}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Fields Tab */}
        <TabsContent value="fields">
          <Card>
            <CardHeader>
              <CardTitle>Form Fields Configuration</CardTitle>
              <CardDescription>
                Define the fields that appear in create and edit forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormFieldsEditor
                fields={schema.formFields || []}
                onChange={(fields) => handleSchemaChange({ formFields: fields })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Table Tab */}
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data Table Configuration</CardTitle>
              <CardDescription>
                Configure how data is displayed in the list view
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TableColumnsEditor
                dataTableSchema={schema.dataTableSchema || createDefaultDataTableSchema()}
                onChange={(dataTableSchema) => handleSchemaChange({ dataTableSchema })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Policy Tab */}
        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Access Policy Configuration</CardTitle>
              <CardDescription>
                Define role-based access control for this module
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccessPolicyEditor
                accessPolicy={schema.moduleAccessPolicy}
                onChange={(moduleAccessPolicy) => handleSchemaChange({ moduleAccessPolicy })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wizard Tab */}
        <TabsContent value="wizard">
          <Card>
            <CardHeader>
              <CardTitle>Wizard Configuration</CardTitle>
              <CardDescription>
                Configure multi-step form wizard (only for wizard layouts)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schema.formLayout?.includes('wizard') ? (
                <div className="text-muted-foreground text-center py-8">
                  Wizard configuration editor coming soon...
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  Select a wizard form layout in Basic Info to enable wizard configuration.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extra Actions Tab */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Extra Action Forms</CardTitle>
              <CardDescription>
                Configure custom actions beyond standard CRUD operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-8">
                Extra actions editor coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detail View Tab */}
        <TabsContent value="detail">
          <Card>
            <CardHeader>
              <CardTitle>Detail View Configuration</CardTitle>
              <CardDescription>
                Configure how single record details are displayed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-8">
                Detail view editor coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNavigation}>
              Leave without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
