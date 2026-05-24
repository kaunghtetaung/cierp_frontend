'use client';

import React, { useState } from 'react';
import { Input, Label, Button, Badge } from '@repo/ui';
import { Textarea } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Switch } from '@repo/ui';
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
  GripVertical,
  Pencil,
  Copy,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { FormField, FieldType } from '../lib/types';
import { FIELD_TYPES } from '../lib/types';

interface FormFieldsEditorProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

// Default field template
const createDefaultField = (): FormField => ({
  fieldName: '',
  fieldType: 'text',
  label: { en: '', mm: '' },
  validationRule: { required: false },
});

export function FormFieldsEditor({ fields, onChange }: FormFieldsEditorProps) {
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Add new field
  const handleAddField = () => {
    setEditingField(createDefaultField());
    setEditingIndex(null);
    setIsDialogOpen(true);
  };

  // Edit existing field
  const handleEditField = (index: number) => {
    setEditingField({ ...fields[index] });
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  // Duplicate field
  const handleDuplicateField = (index: number) => {
    const field = { ...fields[index] };
    field.fieldName = `${field.fieldName}_copy`;
    field.label = {
      en: `${field.label.en} (Copy)`,
      mm: `${field.label.mm} (Copy)`,
    };
    onChange([...fields, field]);
  };

  // Delete field
  const handleDeleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
  };

  // Move field up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...fields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    onChange(newFields);
  };

  // Move field down
  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return;
    const newFields = [...fields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    onChange(newFields);
  };

  // Save field
  const handleSaveField = () => {
    if (!editingField) return;

    const newFields = [...fields];
    if (editingIndex !== null) {
      newFields[editingIndex] = editingField;
    } else {
      newFields.push(editingField);
    }
    onChange(newFields);
    setIsDialogOpen(false);
    setEditingField(null);
    setEditingIndex(null);
  };

  // Update editing field
  const updateEditingField = (updates: Partial<FormField>) => {
    if (!editingField) return;
    setEditingField({ ...editingField, ...updates });
  };

  // Get field type badge variant
  const getFieldTypeBadge = (type: FieldType) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      text: 'default',
      email: 'secondary',
      password: 'secondary',
      select: 'outline',
      dynamicSelect: 'outline',
      checkbox: 'secondary',
      date: 'secondary',
      number: 'default',
    };
    return variants[type] || 'default';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Form Fields</h3>
          <p className="text-sm text-muted-foreground">
            Configure the fields that appear in create/edit forms
          </p>
        </div>
        <Button onClick={handleAddField}>
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      {/* Fields List */}
      {fields.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No fields configured yet</p>
            <Button onClick={handleAddField}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Field
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <Card key={`${field.fieldName}-${index}`} className="group">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Drag handle */}
                  <div className="flex flex-col gap-0.5 text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === fields.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Field info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {field.label.en || field.fieldName}
                      </span>
                      <Badge variant={getFieldTypeBadge(field.fieldType)} className="text-xs">
                        {field.fieldType}
                      </Badge>
                      {field.validationRule?.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {field.hidden && (
                        <Badge variant="secondary" className="text-xs">
                          Hidden
                        </Badge>
                      )}
                      {field.readonly && (
                        <Badge variant="secondary" className="text-xs">
                          Readonly
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {field.fieldName}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditField(index)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDuplicateField(index)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteField(index)}
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

      {/* Edit Field Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit Field' : 'Add New Field'}
            </DialogTitle>
            <DialogDescription>
              Configure the field properties
            </DialogDescription>
          </DialogHeader>

          {editingField && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Field Name *</Label>
                  <Input
                    value={editingField.fieldName}
                    onChange={(e) =>
                      updateEditingField({
                        fieldName: e.target.value.replace(/\s+/g, ''),
                      })
                    }
                    placeholder="e.g., firstName"
                  />
                  <p className="text-xs text-muted-foreground">
                    Database field name (camelCase, no spaces)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Field Type *</Label>
                  <Select
                    value={editingField.fieldType}
                    onValueChange={(value) =>
                      updateEditingField({ fieldType: value as FieldType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Labels */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Label (English) *</Label>
                  <Input
                    value={editingField.label.en}
                    onChange={(e) =>
                      updateEditingField({
                        label: { ...editingField.label, en: e.target.value },
                      })
                    }
                    placeholder="e.g., First Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label (Myanmar) *</Label>
                  <Input
                    value={editingField.label.mm}
                    onChange={(e) =>
                      updateEditingField({
                        label: { ...editingField.label, mm: e.target.value },
                      })
                    }
                    placeholder="e.g., အမည်"
                  />
                </div>
              </div>

              {/* Placeholder */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Placeholder (English)</Label>
                  <Input
                    value={
                      typeof editingField.placeHolder === 'object'
                        ? editingField.placeHolder.en || ''
                        : editingField.placeHolder || ''
                    }
                    onChange={(e) => {
                      const current = editingField.placeHolder;
                      if (typeof current === 'object') {
                        updateEditingField({
                          placeHolder: { ...current, en: e.target.value },
                        });
                      } else {
                        updateEditingField({
                          placeHolder: { en: e.target.value, mm: '' },
                        });
                      }
                    }}
                    placeholder="Enter placeholder text"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Placeholder (Myanmar)</Label>
                  <Input
                    value={
                      typeof editingField.placeHolder === 'object'
                        ? editingField.placeHolder.mm || ''
                        : ''
                    }
                    onChange={(e) => {
                      const current = editingField.placeHolder;
                      if (typeof current === 'object') {
                        updateEditingField({
                          placeHolder: { ...current, mm: e.target.value },
                        });
                      } else {
                        updateEditingField({
                          placeHolder: { en: '', mm: e.target.value },
                        });
                      }
                    }}
                    placeholder="Enter placeholder text"
                  />
                </div>
              </div>

              {/* Validation */}
              <Accordion type="single" collapsible defaultValue="validation">
                <AccordionItem value="validation">
                  <AccordionTrigger>Validation Rules</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <Label>Required</Label>
                        <Switch
                          checked={editingField.validationRule?.required || false}
                          onCheckedChange={(checked) =>
                            updateEditingField({
                              validationRule: {
                                ...editingField.validationRule,
                                required: checked,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Min Length</Label>
                          <Input
                            type="number"
                            value={editingField.validationRule?.minLength || ''}
                            onChange={(e) =>
                              updateEditingField({
                                validationRule: {
                                  ...editingField.validationRule,
                                  minLength: e.target.value ? parseInt(e.target.value) : undefined,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Length</Label>
                          <Input
                            type="number"
                            value={editingField.validationRule?.maxLength || ''}
                            onChange={(e) =>
                              updateEditingField({
                                validationRule: {
                                  ...editingField.validationRule,
                                  maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      {(editingField.fieldType === 'number') && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Min Value</Label>
                            <Input
                              type="number"
                              value={editingField.validationRule?.min || ''}
                              onChange={(e) =>
                                updateEditingField({
                                  validationRule: {
                                    ...editingField.validationRule,
                                    min: e.target.value ? parseInt(e.target.value) : undefined,
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Max Value</Label>
                            <Input
                              type="number"
                              value={editingField.validationRule?.max || ''}
                              onChange={(e) =>
                                updateEditingField({
                                  validationRule: {
                                    ...editingField.validationRule,
                                    max: e.target.value ? parseInt(e.target.value) : undefined,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Pattern (Regex)</Label>
                        <Input
                          value={editingField.validationRule?.pattern || ''}
                          onChange={(e) =>
                            updateEditingField({
                              validationRule: {
                                ...editingField.validationRule,
                                pattern: e.target.value || undefined,
                              },
                            })
                          }
                          placeholder="e.g., ^[a-zA-Z]+$"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="display">
                  <AccordionTrigger>Display Options</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between">
                          <Label>Hidden</Label>
                          <Switch
                            checked={editingField.hidden || false}
                            onCheckedChange={(checked) =>
                              updateEditingField({ hidden: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Readonly</Label>
                          <Switch
                            checked={editingField.readonly || false}
                            onCheckedChange={(checked) =>
                              updateEditingField({ readonly: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Hide in Edit Mode</Label>
                          <Switch
                            checked={editingField.hideInEditMode || false}
                            onCheckedChange={(checked) =>
                              updateEditingField({ hideInEditMode: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Is Multilingual</Label>
                          <Switch
                            checked={editingField.isMultilingual || false}
                            onCheckedChange={(checked) =>
                              updateEditingField({ isMultilingual: checked })
                            }
                          />
                        </div>
                      </div>
                      {editingField.fieldType === 'textArea' && (
                        <div className="space-y-2">
                          <Label>Rows</Label>
                          <Input
                            type="number"
                            value={editingField.rows || 3}
                            onChange={(e) =>
                              updateEditingField({
                                rows: parseInt(e.target.value) || 3,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {(editingField.fieldType === 'dynamicSelect' ||
                  editingField.fieldType === 'dependentSelect') && (
                  <AccordionItem value="datasource">
                    <AccordionTrigger>Data Source</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>Endpoint *</Label>
                          <Input
                            value={editingField.dataSource?.endpoint || ''}
                            onChange={(e) =>
                              updateEditingField({
                                dataSource: {
                                  ...editingField.dataSource,
                                  endpoint: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., /departments"
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Service Name</Label>
                            <Input
                              value={editingField.dataSource?.serviceName || ''}
                              onChange={(e) =>
                                updateEditingField({
                                  dataSource: {
                                    ...editingField.dataSource,
                                    endpoint: editingField.dataSource?.endpoint || '',
                                    serviceName: e.target.value || undefined,
                                  },
                                })
                              }
                              placeholder="e.g., Core"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Dependent Field</Label>
                            <Input
                              value={editingField.dataSource?.dependentField || ''}
                              onChange={(e) =>
                                updateEditingField({
                                  dataSource: {
                                    ...editingField.dataSource,
                                    endpoint: editingField.dataSource?.endpoint || '',
                                    dependentField: e.target.value || undefined,
                                  },
                                })
                              }
                              placeholder="e.g., organizationId"
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Label Field</Label>
                            <Input
                              value={editingField.dataSource?.labelField || ''}
                              onChange={(e) =>
                                updateEditingField({
                                  dataSource: {
                                    ...editingField.dataSource,
                                    endpoint: editingField.dataSource?.endpoint || '',
                                    labelField: e.target.value || undefined,
                                  },
                                })
                              }
                              placeholder="e.g., name.en"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Value Field</Label>
                            <Input
                              value={editingField.dataSource?.valueField || ''}
                              onChange={(e) =>
                                updateEditingField({
                                  dataSource: {
                                    ...editingField.dataSource,
                                    endpoint: editingField.dataSource?.endpoint || '',
                                    valueField: e.target.value || undefined,
                                  },
                                })
                              }
                              placeholder="e.g., _id"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Enable Typeahead</Label>
                          <Switch
                            checked={editingField.dataSource?.enableTypeahead || false}
                            onCheckedChange={(checked) =>
                              updateEditingField({
                                dataSource: {
                                  ...editingField.dataSource,
                                  endpoint: editingField.dataSource?.endpoint || '',
                                  enableTypeahead: checked,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveField}
              disabled={!editingField?.fieldName || !editingField?.label.en}
            >
              {editingIndex !== null ? 'Update Field' : 'Add Field'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
