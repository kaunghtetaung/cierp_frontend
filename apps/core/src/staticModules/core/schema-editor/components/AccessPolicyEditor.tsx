'use client';

import React, { useState } from 'react';
import { Input, Label, Button, Badge } from '@repo/ui';
import { Switch } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@repo/ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@repo/ui';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/ui';
import {
  Plus,
  Trash2,
  Pencil,
  Shield,
  ShieldCheck,
  ShieldX,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import type { ModuleAccessPolicy, RoleAccessPolicy, AccessOperation } from '../lib/types';
import { AVAILABLE_ROLES } from '../lib/types';

interface AccessPolicyEditorProps {
  accessPolicy: ModuleAccessPolicy | undefined;
  onChange: (policy: ModuleAccessPolicy | undefined) => void;
}

// Default role policy
const createDefaultRolePolicy = (): RoleAccessPolicy => ({
  operation: {
    create: false,
    read: { allow: true, restrictInvisibleFields: true },
    update: { allow: false, restrictUnaccessibleFields: true },
    softDelete: false,
    hardDelete: false,
    readSoftDeleted: { allow: false, IsResourceBase: false },
    restoreSoftDeleted: { allow: false, IsResourceBase: false },
    schema: { allow: true, IsResourceBase: false },
  },
  unaccessibleFields: [],
  invisibleFields: [],
  relatedDataOnly: true,
  accessDenied: false,
});

// Default access policy
const createDefaultAccessPolicy = (): ModuleAccessPolicy => ({
  resourceIdField: '_id',
  hasOrganizationField: true,
  organizationIdFieldName: 'organizationId',
  hasDepartmentField: false,
  departmentIdFieldName: '',
  queryAllowedFields: [],
  accessPolicy: {
    systemAdmin: {
      operation: {
        create: true,
        read: { allow: true, restrictInvisibleFields: false },
        update: { allow: true, restrictUnaccessibleFields: false },
        softDelete: true,
        hardDelete: true,
        readSoftDeleted: { allow: true, IsResourceBase: false },
        restoreSoftDeleted: { allow: true, IsResourceBase: false },
        schema: { allow: true, IsResourceBase: false },
      },
      unaccessibleFields: [],
      invisibleFields: [],
      relatedDataOnly: false,
      accessDenied: false,
    },
  },
});

export function AccessPolicyEditor({ accessPolicy, onChange }: AccessPolicyEditorProps) {
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<RoleAccessPolicy | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  // Initialize policy if not exists
  const policy = accessPolicy || createDefaultAccessPolicy();

  // Update policy
  const updatePolicy = (updates: Partial<ModuleAccessPolicy>) => {
    onChange({ ...policy, ...updates });
  };

  // Update role policy
  const updateRolePolicy = (roleName: string, rolePolicy: RoleAccessPolicy) => {
    updatePolicy({
      accessPolicy: {
        ...policy.accessPolicy,
        [roleName]: rolePolicy,
      },
    });
  };

  // Add new role
  const handleAddRole = () => {
    if (!newRoleName) return;
    const roleName = newRoleName.trim();
    if (policy.accessPolicy[roleName]) return;

    updatePolicy({
      accessPolicy: {
        ...policy.accessPolicy,
        [roleName]: createDefaultRolePolicy(),
      },
    });
    setNewRoleName('');
  };

  // Edit role
  const handleEditRole = (roleName: string) => {
    setEditingRole(roleName);
    setEditingPolicy({ ...policy.accessPolicy[roleName] });
    setIsDialogOpen(true);
  };

  // Delete role
  const handleDeleteRole = (roleName: string) => {
    const newAccessPolicy = { ...policy.accessPolicy };
    delete newAccessPolicy[roleName];
    updatePolicy({ accessPolicy: newAccessPolicy });
  };

  // Save role policy
  const handleSaveRole = () => {
    if (!editingRole || !editingPolicy) return;
    updateRolePolicy(editingRole, editingPolicy);
    setIsDialogOpen(false);
    setEditingRole(null);
    setEditingPolicy(null);
  };

  // Update editing policy
  const updateEditingPolicy = (updates: Partial<RoleAccessPolicy>) => {
    if (!editingPolicy) return;
    setEditingPolicy({ ...editingPolicy, ...updates });
  };

  // Get permission summary for a role
  const getPermissionSummary = (rolePolicy: RoleAccessPolicy) => {
    const perms = [];
    if (rolePolicy.operation.create) perms.push('C');
    if (rolePolicy.operation.read?.allow) perms.push('R');
    if (rolePolicy.operation.update?.allow) perms.push('U');
    if (rolePolicy.operation.softDelete) perms.push('D');
    return perms.join('') || 'None';
  };

  return (
    <div className="space-y-6">
      {/* Module Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Module Settings
          </CardTitle>
          <CardDescription>
            Configure module-level access control settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Resource ID Field</Label>
              <Input
                value={policy.resourceIdField}
                onChange={(e) => updatePolicy({ resourceIdField: e.target.value })}
                placeholder="_id"
              />
            </div>
            <div className="space-y-2">
              <Label>Organization ID Field Name</Label>
              <Input
                value={policy.organizationIdFieldName}
                onChange={(e) => updatePolicy({ organizationIdFieldName: e.target.value })}
                placeholder="organizationId"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Has Organization Field</Label>
              <Switch
                checked={policy.hasOrganizationField}
                onCheckedChange={(checked) =>
                  updatePolicy({ hasOrganizationField: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Has Department Field</Label>
              <Switch
                checked={policy.hasDepartmentField}
                onCheckedChange={(checked) =>
                  updatePolicy({ hasDepartmentField: checked })
                }
              />
            </div>
            {policy.hasDepartmentField && (
              <div className="space-y-2">
                <Label>Department ID Field Name</Label>
                <Input
                  value={policy.departmentIdFieldName}
                  onChange={(e) => updatePolicy({ departmentIdFieldName: e.target.value })}
                  placeholder="departmentId"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Policies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Role Policies
              </CardTitle>
              <CardDescription>
                Configure access permissions for each role
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={newRoleName} onValueChange={setNewRoleName}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select role to add" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.filter(
                    (role) => !policy.accessPolicy[role]
                  ).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddRole} disabled={!newRoleName}>
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(policy.accessPolicy).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No role policies configured yet. Add a role to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(policy.accessPolicy).map(([roleName, rolePolicy]) => (
                <Card key={roleName} className="group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            rolePolicy.accessDenied
                              ? 'bg-destructive/10'
                              : 'bg-primary/10'
                          }`}
                        >
                          {rolePolicy.accessDenied ? (
                            <ShieldX className="h-5 w-5 text-destructive" />
                          ) : (
                            <ShieldCheck className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{roleName}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {getPermissionSummary(rolePolicy)}
                            </Badge>
                            {rolePolicy.relatedDataOnly && (
                              <Badge variant="secondary" className="text-xs">
                                Related Only
                              </Badge>
                            )}
                            {rolePolicy.invisibleFields.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <EyeOff className="h-3 w-3 mr-1" />
                                {rolePolicy.invisibleFields.length} hidden
                              </Badge>
                            )}
                            {rolePolicy.unaccessibleFields.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                {rolePolicy.unaccessibleFields.length} locked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditRole(roleName)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteRole(roleName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Policy Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role Policy - {editingRole}</DialogTitle>
            <DialogDescription>
              Configure access permissions for this role
            </DialogDescription>
          </DialogHeader>

          {editingPolicy && (
            <div className="space-y-6 py-4">
              {/* Access Denied Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4 bg-destructive/5">
                <div>
                  <Label className="text-base">Access Denied</Label>
                  <p className="text-sm text-muted-foreground">
                    Completely deny access to this module
                  </p>
                </div>
                <Switch
                  checked={editingPolicy.accessDenied}
                  onCheckedChange={(checked) =>
                    updateEditingPolicy({ accessDenied: checked })
                  }
                />
              </div>

              {/* Operations */}
              <Accordion type="single" collapsible defaultValue="operations">
                <AccordionItem value="operations">
                  <AccordionTrigger>Operations</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 md:grid-cols-2 pt-2">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label>Create</Label>
                        <Switch
                          checked={editingPolicy.operation.create || false}
                          onCheckedChange={(checked) =>
                            updateEditingPolicy({
                              operation: {
                                ...editingPolicy.operation,
                                create: checked,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label>Read</Label>
                        <Switch
                          checked={editingPolicy.operation.read?.allow || false}
                          onCheckedChange={(checked) =>
                            updateEditingPolicy({
                              operation: {
                                ...editingPolicy.operation,
                                read: {
                                  ...editingPolicy.operation.read,
                                  allow: checked,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label>Update</Label>
                        <Switch
                          checked={editingPolicy.operation.update?.allow || false}
                          onCheckedChange={(checked) =>
                            updateEditingPolicy({
                              operation: {
                                ...editingPolicy.operation,
                                update: {
                                  ...editingPolicy.operation.update,
                                  allow: checked,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label>Soft Delete</Label>
                        <Switch
                          checked={editingPolicy.operation.softDelete || false}
                          onCheckedChange={(checked) =>
                            updateEditingPolicy({
                              operation: {
                                ...editingPolicy.operation,
                                softDelete: checked,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label>Hard Delete</Label>
                        <Switch
                          checked={editingPolicy.operation.hardDelete || false}
                          onCheckedChange={(checked) =>
                            updateEditingPolicy({
                              operation: {
                                ...editingPolicy.operation,
                                hardDelete: checked,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label>Read Soft Deleted</Label>
                        <Switch
                          checked={editingPolicy.operation.readSoftDeleted?.allow || false}
                          onCheckedChange={(checked) =>
                            updateEditingPolicy({
                              operation: {
                                ...editingPolicy.operation,
                                readSoftDeleted: {
                                  ...editingPolicy.operation.readSoftDeleted,
                                  allow: checked,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label>Restore Soft Deleted</Label>
                        <Switch
                          checked={editingPolicy.operation.restoreSoftDeleted?.allow || false}
                          onCheckedChange={(checked) =>
                            updateEditingPolicy({
                              operation: {
                                ...editingPolicy.operation,
                                restoreSoftDeleted: {
                                  ...editingPolicy.operation.restoreSoftDeleted,
                                  allow: checked,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label>View Schema</Label>
                        <Switch
                          checked={editingPolicy.operation.schema?.allow || false}
                          onCheckedChange={(checked) =>
                            updateEditingPolicy({
                              operation: {
                                ...editingPolicy.operation,
                                schema: {
                                  ...editingPolicy.operation.schema,
                                  allow: checked,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="restrictions">
                  <AccordionTrigger>Field Restrictions</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <Label>Related Data Only</Label>
                          <p className="text-xs text-muted-foreground">
                            Restrict to user's organization/department
                          </p>
                        </div>
                        <Switch
                          checked={editingPolicy.relatedDataOnly}
                          onCheckedChange={(checked) =>
                            updateEditingPolicy({ relatedDataOnly: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <Label>Restrict Invisible Fields</Label>
                          <p className="text-xs text-muted-foreground">
                            Hide specified fields from read responses
                          </p>
                        </div>
                        <Switch
                          checked={editingPolicy.operation.read?.restrictInvisibleFields || false}
                          onCheckedChange={(checked) =>
                            updateEditingPolicy({
                              operation: {
                                ...editingPolicy.operation,
                                read: {
                                  ...editingPolicy.operation.read,
                                  allow: editingPolicy.operation.read?.allow || false,
                                  restrictInvisibleFields: checked,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <Label>Restrict Unaccessible Fields</Label>
                          <p className="text-xs text-muted-foreground">
                            Prevent updates to specified fields
                          </p>
                        </div>
                        <Switch
                          checked={editingPolicy.operation.update?.restrictUnaccessibleFields || false}
                          onCheckedChange={(checked) =>
                            updateEditingPolicy({
                              operation: {
                                ...editingPolicy.operation,
                                update: {
                                  ...editingPolicy.operation.update,
                                  allow: editingPolicy.operation.update?.allow || false,
                                  restrictUnaccessibleFields: checked,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Invisible Fields (comma separated)</Label>
                        <Input
                          value={editingPolicy.invisibleFields.join(', ')}
                          onChange={(e) =>
                            updateEditingPolicy({
                              invisibleFields: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="e.g., email, phoneNo, password"
                        />
                        <p className="text-xs text-muted-foreground">
                          Fields hidden from read responses
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Unaccessible Fields (comma separated)</Label>
                        <Input
                          value={editingPolicy.unaccessibleFields.join(', ')}
                          onChange={(e) =>
                            updateEditingPolicy({
                              unaccessibleFields: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="e.g., createdAt, updatedAt, status"
                        />
                        <p className="text-xs text-muted-foreground">
                          Fields that cannot be updated
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
