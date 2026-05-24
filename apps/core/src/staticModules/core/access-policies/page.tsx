'use client';

import React, {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Input,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  Shield,
  ShieldAlert,
  Database,
  Lock,
} from 'lucide-react';
import { toastSuccess, toastError } from '@repo/utils';
import {
  checkSystemAdminAccess,
  getAccessPolicies,
  deleteAccessPolicy,
  syncPoliciesFromFile,
} from './actions/access-policy.actions';
import type { AccessPolicy } from './lib/types';
import { SERVICE_OPTIONS } from './lib/types';
import { PolicyEditor } from './components/PolicyEditor';

/**
 * Access Policy admin — systemAdmin only. Frontend gates render of
 * the editor UI behind a `checkSystemAdminAccess()` server-action;
 * the backend ALSO enforces the same role check on every endpoint.
 *
 * URL: `/core/access-policies`
 */
export default function AccessPoliciesPage() {
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  const [policies, setPolicies] = useState<AccessPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AccessPolicy | null>(null);
  const [deleting, setDeleting] = useState<AccessPolicy | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);

  // Gate: check role before rendering
  useEffect(() => {
    (async () => {
      try {
        const result = await checkSystemAdminAccess();
        setHasAccess(!!result.isSystemAdmin);
      } catch (err) {
        console.error('Access check failed:', err);
        setHasAccess(false);
      } finally {
        setAccessChecked(true);
      }
    })();
  }, []);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const params: { serviceName?: string } = {};
      if (serviceFilter !== 'all') params.serviceName = serviceFilter;
      const result = await getAccessPolicies(params);
      if (result.success && Array.isArray(result.data)) {
        setPolicies(result.data);
      } else {
        toastError(result.error || 'Failed to load policies');
      }
    } catch (err) {
      console.error('Load policies error:', err);
      toastError('Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, [serviceFilter]);

  useEffect(() => {
    if (!hasAccess) return;
    loadPolicies();
  }, [hasAccess, loadPolicies]);

  const handleCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const handleEdit = (p: AccessPolicy) => {
    setEditing(p);
    setEditorOpen(true);
  };

  const confirmDelete = () => {
    if (!deleting?._id) return;
    startTransition(async () => {
      try {
        const result = await deleteAccessPolicy(deleting._id!);
        if (result.success) {
          toastSuccess('Policy deleted');
          loadPolicies();
        } else {
          toastError(result.error || 'Failed to delete policy');
        }
      } catch (err) {
        console.error('Delete error:', err);
        toastError('Unexpected error');
      } finally {
        setDeleting(null);
      }
    });
  };

  const handleEditorSuccess = () => {
    setEditorOpen(false);
    setEditing(null);
    loadPolicies();
  };

  const confirmSync = () => {
    startTransition(async () => {
      try {
        const result = await syncPoliciesFromFile(
          serviceFilter === 'all' ? undefined : serviceFilter,
        );
        if (result.success && result.data) {
          toastSuccess(
            `Deleted ${result.data.deleted} policies. Restart the service to re-seed from file.`,
            { duration: 12000 },
          );
          loadPolicies();
        } else {
          toastError(result.error || 'Failed to sync from file');
        }
      } catch (err) {
        console.error('Sync error:', err);
        toastError('Unexpected error');
      } finally {
        setSyncOpen(false);
      }
    });
  };

  const filtered = policies.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.moduleName?.toLowerCase().includes(q) ||
      p.serviceName?.toLowerCase().includes(q)
    );
  });

  // Access-denied state
  if (accessChecked && !hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          The Access Policy editor is restricted to System Administrators.
          Contact a system admin if you need access.
        </p>
      </div>
    );
  }

  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Module Access Policies
          </h1>
          <p className="text-muted-foreground text-sm">
            Per-role permission matrices for every module. SystemAdmin only.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setSyncOpen(true)}
            disabled={isPending}
            title="Delete all and re-seed from moduleAccessPolicy.json on next service restart"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync from file
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by module / service…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {SERVICE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadPolicies}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No policies found</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchQuery || serviceFilter !== 'all'
                  ? 'Try adjusting filters'
                  : 'Create your first policy to gate a module'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left font-medium py-2 px-3">Module</th>
                    <th className="text-left font-medium py-2 px-3">Service</th>
                    <th className="text-left font-medium py-2 px-3">Roles</th>
                    <th className="text-left font-medium py-2 px-3">Org / Dept</th>
                    <th className="text-left font-medium py-2 px-3">Status</th>
                    <th className="text-right font-medium py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((p) => {
                    const roleCount = Object.keys(p.accessPolicy ?? {}).length;
                    return (
                      <tr key={p._id} className="hover:bg-muted/40">
                        <td className="py-2 px-3 font-medium">
                          {p.moduleName}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {p.serviceName || '—'}
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant="secondary">{roleCount} roles</Badge>
                        </td>
                        <td className="py-2 px-3 text-xs text-muted-foreground">
                          {p.hasOrganizationField && 'org'}
                          {p.hasOrganizationField && p.hasDepartmentField && ' · '}
                          {p.hasDepartmentField && 'dept'}
                          {!p.hasOrganizationField && !p.hasDepartmentField && '—'}
                        </td>
                        <td className="py-2 px-3">
                          {p.isActive === false ? (
                            <Badge variant="outline">Inactive</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(p)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleting(p)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor */}
      {editorOpen && (
        <PolicyEditor
          mode={editing ? 'edit' : 'create'}
          initial={editing}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
          onSuccess={handleEditorSuccess}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this access policy?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? (
                <>
                  &quot;
                  <span className="font-mono">{deleting.moduleName}</span>
                  &quot; (
                  <span className="font-mono">{deleting.serviceName}</span>
                  ) will be soft-deleted. The module will fall back to
                  default-deny until you create a new policy or restore.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sync confirm */}
      <AlertDialog open={syncOpen} onOpenChange={setSyncOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" />
              Sync policies from file
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will <strong>delete</strong>
              {serviceFilter === 'all'
                ? ' ALL access policies '
                : ` policies for service "${serviceFilter}" `}
              from MongoDB. The service will re-seed from
              <code className="mx-1 px-1 py-0.5 rounded bg-muted text-[11px]">
                resources/moduleAccessPolicy.json
              </code>
              on next restart. Use this when the JSON file is the source
              of truth and you need to wipe local edits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSync}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wiping…
                </>
              ) : (
                'Wipe & restart-required'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
