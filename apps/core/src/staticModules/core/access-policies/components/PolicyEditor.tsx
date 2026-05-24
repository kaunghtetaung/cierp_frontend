'use client';

import React, { useEffect, useState, useTransition } from 'react';
import {
  X,
  Save,
  Loader2,
  Shield,
  Plus,
  Trash2,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  Input,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
} from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import {
  createAccessPolicy,
  updateAccessPolicy,
} from '../actions/access-policy.actions';
import {
  POLICY_ACTIONS,
  STANDARD_ROLES,
  type AccessPolicy,
  type AccessOperation,
  type RoleAccessPolicy,
  type CreateAccessPolicyDto,
  type PolicyAction,
} from '../lib/types';

interface PolicyEditorProps {
  mode: 'create' | 'edit';
  initial?: AccessPolicy | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ACTION_LABELS: Record<PolicyAction, string> = {
  create: 'Create',
  read: 'Read',
  update: 'Update',
  softDelete: 'Soft delete',
  hardDelete: 'Hard delete',
  readSoftDeleted: 'Read deleted',
  restoreSoftDeleted: 'Restore',
  schema: 'Schema',
  reference: 'Reference',
};

/**
 * Read the boolean "is allowed" out of a polymorphic action config.
 * The shape is one of: `boolean`, `{ allow: boolean, ... }`, or
 * undefined (treated as denied).
 */
function actionAllowed(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value && typeof value === 'object' && 'allow' in value) {
    return Boolean((value as any).allow);
  }
  return false;
}

/**
 * Set the "allow" flag on an action config, preserving extra fields
 * like `restrictInvisibleFields` / `IsResourceBase` when present.
 */
function setActionAllowed(
  current: unknown,
  next: boolean,
): boolean | Record<string, unknown> {
  // For `create`, `softDelete`, `hardDelete` the canonical shape is
  // bare boolean. For others it's `{ allow, ... }`.
  if (typeof current === 'boolean' || current === undefined) {
    return next;
  }
  if (current && typeof current === 'object') {
    return { ...(current as object), allow: next };
  }
  return next;
}

const blankRolePolicy = (): RoleAccessPolicy => ({
  operation: {
    create: false,
    read: { allow: false, restrictInvisibleFields: false },
    update: { allow: false, restrictUnaccessibleFields: false },
    softDelete: false,
    hardDelete: false,
    readSoftDeleted: { allow: false, IsResourceBase: false },
    restoreSoftDeleted: { allow: false, IsResourceBase: true },
    schema: { allow: true, IsResourceBase: false },
    reference: { allow: true, IsResourceBase: false },
  },
  unaccessibleFields: [],
  invisibleFields: [],
  relatedDataOnly: false,
  accessDenied: false,
});

const blankPolicy = (): CreateAccessPolicyDto => ({
  moduleName: '',
  serviceName: 'core',
  resourceIdField: '_id',
  hasOrganizationField: true,
  organizationIdFieldName: 'organizationId',
  hasDepartmentField: false,
  departmentIdFieldName: '',
  queryAllowedFields: [],
  accessPolicy: STANDARD_ROLES.reduce(
    (acc, r) => ({ ...acc, [r]: blankRolePolicy() }),
    {} as Record<string, RoleAccessPolicy>,
  ),
  isActive: true,
});

/**
 * Full-screen editor for one access policy. Layout:
 *   - Header strip: title + Save / Close buttons
 *   - Sticky sidebar: module identity (name / service / id field /
 *     org-dept toggles)
 *   - Main canvas: per-role tabs, each showing the operation matrix
 *     and field lists (unaccessible / invisible / restriction flags).
 */
export function PolicyEditor({
  mode,
  initial,
  onClose,
  onSuccess,
}: PolicyEditorProps) {
  const [open, setOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [policy, setPolicy] = useState<CreateAccessPolicyDto>(
    () =>
      (initial as any) ?? blankPolicy(),
  );
  const [activeRole, setActiveRole] = useState<string>(
    Object.keys(initial?.accessPolicy ?? {})[0] ?? STANDARD_ROLES[0],
  );
  const [newRoleName, setNewRoleName] = useState('');

  useEffect(() => {
    if (initial) {
      setPolicy(initial as any);
      const firstRole = Object.keys(initial.accessPolicy ?? {})[0];
      if (firstRole) setActiveRole(firstRole);
    } else {
      setPolicy(blankPolicy());
      setActiveRole(STANDARD_ROLES[0]);
    }
  }, [initial]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const setField = <K extends keyof CreateAccessPolicyDto>(
    key: K,
    value: CreateAccessPolicyDto[K],
  ) => setPolicy((p) => ({ ...p, [key]: value }));

  const setRolePolicy = (
    role: string,
    update: (current: RoleAccessPolicy) => RoleAccessPolicy,
  ) => {
    setPolicy((p) => ({
      ...p,
      accessPolicy: {
        ...p.accessPolicy,
        [role]: update(p.accessPolicy[role] ?? blankRolePolicy()),
      },
    }));
  };

  const setRoleAction = (role: string, action: string, allow: boolean) => {
    setRolePolicy(role, (rp) => ({
      ...rp,
      operation: {
        ...rp.operation,
        [action]: setActionAllowed(
          (rp.operation as any)[action],
          allow,
        ),
      },
    }));
  };

  const addRole = () => {
    const name = newRoleName.trim();
    if (!name) return;
    if (policy.accessPolicy[name]) {
      toastError(`Role "${name}" already exists`);
      return;
    }
    setPolicy((p) => ({
      ...p,
      accessPolicy: { ...p.accessPolicy, [name]: blankRolePolicy() },
    }));
    setActiveRole(name);
    setNewRoleName('');
  };

  const removeRole = (name: string) => {
    setPolicy((p) => {
      const next = { ...p.accessPolicy };
      delete next[name];
      return { ...p, accessPolicy: next };
    });
    if (activeRole === name) {
      const remaining = Object.keys(policy.accessPolicy).filter(
        (r) => r !== name,
      );
      setActiveRole(remaining[0] ?? STANDARD_ROLES[0]);
    }
  };

  const onSave = () => {
    if (!policy.moduleName.trim()) {
      toastError('Module name is required');
      return;
    }
    if (!policy.serviceName.trim()) {
      toastError('Service name is required');
      return;
    }
    startTransition(async () => {
      try {
        const result =
          mode === 'create'
            ? await createAccessPolicy(policy)
            : await updateAccessPolicy(initial!._id!, {
                ...policy,
                version: initial?.version,
              });
        if (result.success) {
          toastSuccess(
            mode === 'create'
              ? 'Access policy created'
              : 'Access policy updated',
          );
          onSuccess();
        } else {
          toastError(result.error || 'Failed to save policy');
        }
      } catch (error) {
        console.error('Save policy error:', error);
        toastError('Unexpected error saving policy');
      }
    });
  };

  // Cmd/Ctrl + S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policy]);

  const roles = Object.keys(policy.accessPolicy);
  const currentRolePolicy =
    policy.accessPolicy[activeRole] ?? blankRolePolicy();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[100vw] h-[100vh] p-0 rounded-none !flex !flex-col gap-0"
        style={{
          top: 0,
          left: 0,
          transform: 'none',
          width: '100vw',
          height: '100vh',
          zIndex: 1050,
        }}
      >
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Header */}
          <div className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0 bg-background gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
              <h2 className="text-base md:text-lg font-semibold truncate">
                {mode === 'create' ? 'New Access Policy' : 'Edit Access Policy'}
                {policy.moduleName && (
                  <span className="text-muted-foreground ml-2">
                    · {policy.moduleName}
                  </span>
                )}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={onSave}
                disabled={isPending}
                className="h-9"
                title="Save (Cmd/Ctrl+S)"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save policy
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                title="Close editor"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Body — split pane */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Sidebar — module identity */}
            <aside className="w-full md:w-[400px] lg:w-[440px] shrink-0 border-r bg-background overflow-y-auto p-4 space-y-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Module
              </div>
              <FieldRow label="Module name *">
                <Input
                  value={policy.moduleName}
                  onChange={(e) => setField('moduleName', e.target.value)}
                  placeholder="e.g. template, post, section"
                  disabled={mode === 'edit'}
                />
              </FieldRow>
              <FieldRow label="Service name *">
                <Input
                  value={policy.serviceName}
                  onChange={(e) => setField('serviceName', e.target.value)}
                  placeholder="core / Content / library / cpms / finance"
                />
              </FieldRow>
              <FieldRow label="Resource id field">
                <Input
                  value={policy.resourceIdField}
                  onChange={(e) => setField('resourceIdField', e.target.value)}
                  placeholder="_id"
                />
              </FieldRow>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <div className="text-xs font-medium">Has org field</div>
                  <p className="text-[10px] text-muted-foreground">
                    Resource is org-scoped.
                  </p>
                </div>
                <Switch
                  checked={!!policy.hasOrganizationField}
                  onCheckedChange={(v) =>
                    setField('hasOrganizationField', v)
                  }
                />
              </div>
              <FieldRow label="Org field name">
                <Input
                  value={policy.organizationIdFieldName}
                  onChange={(e) =>
                    setField('organizationIdFieldName', e.target.value)
                  }
                  placeholder="organizationId"
                  disabled={!policy.hasOrganizationField}
                />
              </FieldRow>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <div className="text-xs font-medium">Has dept field</div>
                  <p className="text-[10px] text-muted-foreground">
                    Resource is dept-scoped.
                  </p>
                </div>
                <Switch
                  checked={!!policy.hasDepartmentField}
                  onCheckedChange={(v) => setField('hasDepartmentField', v)}
                />
              </div>
              <FieldRow label="Dept field name">
                <Input
                  value={policy.departmentIdFieldName}
                  onChange={(e) =>
                    setField('departmentIdFieldName', e.target.value)
                  }
                  placeholder="departmentId"
                  disabled={!policy.hasDepartmentField}
                />
              </FieldRow>

              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="text-xs font-medium">Active</div>
                <Switch
                  checked={policy.isActive !== false}
                  onCheckedChange={(v) => setField('isActive', v)}
                />
              </div>

              <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                <div className="text-xs font-medium flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" />
                  Roles in this policy
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <Badge
                      key={r}
                      variant={r === activeRole ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => setActiveRole(r)}
                    >
                      {r}
                    </Badge>
                  ))}
                  {roles.length === 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      No roles. Add one below.
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Add role…"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRole();
                      }
                    }}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addRole}
                    disabled={!newRoleName.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </aside>

            {/* Canvas — per-role permissions matrix */}
            <div className="flex-1 overflow-auto bg-muted/20">
              <div className="min-h-full p-6">
                {roles.length === 0 ? (
                  <div className="text-center text-muted-foreground py-16">
                    Add a role in the sidebar to start authoring permissions.
                  </div>
                ) : (
                  <Tabs
                    value={activeRole}
                    onValueChange={setActiveRole}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <TabsList className="flex-wrap h-auto">
                        {roles.map((r) => (
                          <TabsTrigger key={r} value={r} className="text-xs">
                            {r}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRole(activeRole)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Remove role
                      </Button>
                    </div>

                    {roles.map((r) => {
                      const rp = policy.accessPolicy[r] ?? blankRolePolicy();
                      return (
                        <TabsContent key={r} value={r} className="space-y-4">
                          {/* Operations matrix */}
                          <div className="rounded-md border bg-card p-4">
                            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                              Operations
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {POLICY_ACTIONS.map((action) => {
                                const v = (rp.operation as any)[action];
                                const allowed = actionAllowed(v);
                                return (
                                  <div
                                    key={action}
                                    className="flex items-center justify-between rounded border px-3 py-2"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-xs font-medium">
                                        {ACTION_LABELS[action]}
                                      </div>
                                      <div className="text-[10px] text-muted-foreground font-mono">
                                        {action}
                                      </div>
                                    </div>
                                    <Switch
                                      checked={allowed}
                                      onCheckedChange={(checked) =>
                                        setRoleAction(r, action, checked)
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Per-role flags */}
                          <div className="rounded-md border bg-card p-4 space-y-3">
                            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                              Restrictions
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="flex items-center justify-between rounded border px-3 py-2">
                                <div>
                                  <div className="text-xs font-medium">
                                    Related data only
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    Limit to records the user owns / belongs to.
                                  </p>
                                </div>
                                <Switch
                                  checked={!!rp.relatedDataOnly}
                                  onCheckedChange={(v) =>
                                    setRolePolicy(r, (cur) => ({
                                      ...cur,
                                      relatedDataOnly: v,
                                    }))
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between rounded border px-3 py-2">
                                <div>
                                  <div className="text-xs font-medium">
                                    Access denied (lock all)
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    Bypass everything and deny.
                                  </p>
                                </div>
                                <Switch
                                  checked={!!rp.accessDenied}
                                  onCheckedChange={(v) =>
                                    setRolePolicy(r, (cur) => ({
                                      ...cur,
                                      accessDenied: v,
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            <FieldChips
                              label="Invisible fields (hidden in responses)"
                              values={rp.invisibleFields}
                              onChange={(next) =>
                                setRolePolicy(r, (cur) => ({
                                  ...cur,
                                  invisibleFields: next,
                                }))
                              }
                            />
                            <FieldChips
                              label="Unaccessible fields (read-only)"
                              values={rp.unaccessibleFields}
                              onChange={(next) =>
                                setRolePolicy(r, (cur) => ({
                                  ...cur,
                                  unaccessibleFields: next,
                                }))
                              }
                            />
                          </div>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium">{label}</div>
      {children}
    </div>
  );
}

function FieldChips({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (values.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...values, v]);
    setDraft('');
  };
  const remove = (v: string) => onChange(values.filter((x) => x !== v));
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge
            key={v}
            variant="secondary"
            className="text-[10px] cursor-pointer"
            onClick={() => remove(v)}
          >
            {v} ×
          </Badge>
        ))}
        {values.length === 0 && (
          <span className="text-[10px] text-muted-foreground">None.</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add field name…"
          className="h-8 text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={add}
          disabled={!draft.trim()}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
