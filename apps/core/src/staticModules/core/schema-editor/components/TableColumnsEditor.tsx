'use client';

import React, { useState } from 'react';
import { Input, Label, Button, Badge } from '@repo/ui';
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
  Copy,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { TableColumn, TableColumnType, DataTableSchema, TableLayout } from '../lib/types';
import { TABLE_LAYOUTS } from '../lib/types';

interface TableColumnsEditorProps {
  dataTableSchema: DataTableSchema;
  onChange: (schema: DataTableSchema) => void;
}

const COLUMN_TYPES: { value: TableColumnType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'number', label: 'Number' },
  { value: 'image', label: 'Image' },
  { value: 'status', label: 'Status' },
];

const RENDER_AS_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'badge', label: 'Badge' },
  { value: 'link', label: 'Link' },
  { value: 'array', label: 'Array' },
  { value: 'list', label: 'List' },
];

// Default column template
const createDefaultColumn = (): TableColumn => ({
  fieldName: '',
  label: { en: '', mm: '' },
  sortable: true,
  filterable: false,
  type: 'text',
});

export function TableColumnsEditor({ dataTableSchema, onChange }: TableColumnsEditorProps) {
  const [editingColumn, setEditingColumn] = useState<TableColumn | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const columns = dataTableSchema.columns || [];

  // Update schema
  const updateSchema = (updates: Partial<DataTableSchema>) => {
    onChange({ ...dataTableSchema, ...updates });
  };

  // Update columns
  const updateColumns = (newColumns: TableColumn[]) => {
    updateSchema({ columns: newColumns });
  };

  // Add new column
  const handleAddColumn = () => {
    setEditingColumn(createDefaultColumn());
    setEditingIndex(null);
    setIsDialogOpen(true);
  };

  // Edit existing column
  const handleEditColumn = (index: number) => {
    setEditingColumn({ ...columns[index] });
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  // Duplicate column
  const handleDuplicateColumn = (index: number) => {
    const column = { ...columns[index] };
    column.fieldName = `${column.fieldName}_copy`;
    column.label = {
      en: `${column.label.en} (Copy)`,
      mm: `${column.label.mm} (Copy)`,
    };
    updateColumns([...columns, column]);
  };

  // Delete column
  const handleDeleteColumn = (index: number) => {
    const newColumns = columns.filter((_, i) => i !== index);
    updateColumns(newColumns);
  };

  // Move column up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newColumns = [...columns];
    [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
    updateColumns(newColumns);
  };

  // Move column down
  const handleMoveDown = (index: number) => {
    if (index === columns.length - 1) return;
    const newColumns = [...columns];
    [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
    updateColumns(newColumns);
  };

  // Save column
  const handleSaveColumn = () => {
    if (!editingColumn) return;

    const newColumns = [...columns];
    if (editingIndex !== null) {
      newColumns[editingIndex] = editingColumn;
    } else {
      newColumns.push(editingColumn);
    }
    updateColumns(newColumns);
    setIsDialogOpen(false);
    setEditingColumn(null);
    setEditingIndex(null);
  };

  // Update editing column
  const updateEditingColumn = (updates: Partial<TableColumn>) => {
    if (!editingColumn) return;
    setEditingColumn({ ...editingColumn, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Table Layout Settings */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-4">Table Settings</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Table Layout</Label>
              <Select
                value={dataTableSchema.layout}
                onValueChange={(value) => updateSchema({ layout: value as TableLayout })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TABLE_LAYOUTS.map((layout) => (
                    <SelectItem key={layout.value} value={layout.value}>
                      {layout.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Enable Pagination</Label>
              <Switch
                checked={dataTableSchema.pagination?.enabled !== false}
                onCheckedChange={(checked) =>
                  updateSchema({
                    pagination: {
                      ...dataTableSchema.pagination,
                      enabled: checked,
                      defaultLimit: dataTableSchema.pagination?.defaultLimit || 10,
                      allowedLimits: dataTableSchema.pagination?.allowedLimits || [10, 25, 50, 100],
                    },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Enable Sorting</Label>
              <Switch
                checked={dataTableSchema.sorting?.enabled !== false}
                onCheckedChange={(checked) =>
                  updateSchema({
                    sorting: { ...dataTableSchema.sorting, enabled: checked },
                  })
                }
              />
            </div>
          </div>

          {/* Pagination Settings */}
          {dataTableSchema.pagination?.enabled !== false && (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Default Page Size</Label>
                <Select
                  value={String(dataTableSchema.pagination?.defaultLimit || 10)}
                  onValueChange={(value) =>
                    updateSchema({
                      pagination: {
                        ...dataTableSchema.pagination,
                        enabled: true,
                        defaultLimit: parseInt(value),
                        allowedLimits: dataTableSchema.pagination?.allowedLimits || [10, 25, 50, 100],
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Server-side Pagination</Label>
                  <p className="text-xs text-muted-foreground">For large datasets</p>
                </div>
                <Switch
                  checked={dataTableSchema.pagination?.isClientSidePaging === false}
                  onCheckedChange={(checked) =>
                    updateSchema({
                      pagination: {
                        ...dataTableSchema.pagination,
                        enabled: true,
                        defaultLimit: dataTableSchema.pagination?.defaultLimit || 10,
                        allowedLimits: dataTableSchema.pagination?.allowedLimits || [10, 25, 50, 100],
                        isClientSidePaging: !checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* Search/Filtering Settings */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Enable Filtering</Label>
              <Switch
                checked={dataTableSchema.filtering?.enabled !== false}
                onCheckedChange={(checked) =>
                  updateSchema({
                    filtering: { ...dataTableSchema.filtering, enabled: checked },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Search Fields (comma separated)</Label>
              <Input
                value={dataTableSchema.filtering?.searchFields?.join(', ') || ''}
                onChange={(e) =>
                  updateSchema({
                    filtering: {
                      ...dataTableSchema.filtering,
                      enabled: dataTableSchema.filtering?.enabled !== false,
                      searchFields: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    },
                  })
                }
                placeholder="e.g., name.en, email, slug"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Columns Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Table Columns</h3>
          <p className="text-sm text-muted-foreground">
            Configure the columns displayed in the data table
          </p>
        </div>
        <Button onClick={handleAddColumn}>
          <Plus className="h-4 w-4 mr-2" />
          Add Column
        </Button>
      </div>

      {/* Columns List */}
      {columns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No columns configured yet</p>
            <Button onClick={handleAddColumn}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Column
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {columns.map((column, index) => (
            <Card key={`${column.fieldName}-${index}`} className="group">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Move buttons */}
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
                      disabled={index === columns.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Column info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {column.label.en || column.fieldName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {column.type || 'text'}
                      </Badge>
                      {column.sortable && (
                        <Badge variant="secondary" className="text-xs">
                          Sortable
                        </Badge>
                      )}
                      {column.filterable && (
                        <Badge variant="secondary" className="text-xs">
                          Filterable
                        </Badge>
                      )}
                      {column.populate && (
                        <Badge variant="outline" className="text-xs">
                          Populated
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {column.fieldName}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditColumn(index)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDuplicateColumn(index)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteColumn(index)}
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

      {/* Edit Column Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit Column' : 'Add New Column'}
            </DialogTitle>
            <DialogDescription>
              Configure the column properties
            </DialogDescription>
          </DialogHeader>

          {editingColumn && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Field Name *</Label>
                  <Input
                    value={editingColumn.fieldName}
                    onChange={(e) =>
                      updateEditingColumn({ fieldName: e.target.value })
                    }
                    placeholder="e.g., name.en or status"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports nested fields (e.g., name.en)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Column Type</Label>
                  <Select
                    value={editingColumn.type || 'text'}
                    onValueChange={(value) =>
                      updateEditingColumn({ type: value as TableColumnType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_TYPES.map((type) => (
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
                    value={editingColumn.label.en}
                    onChange={(e) =>
                      updateEditingColumn({
                        label: { ...editingColumn.label, en: e.target.value },
                      })
                    }
                    placeholder="e.g., Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label (Myanmar) *</Label>
                  <Input
                    value={editingColumn.label.mm}
                    onChange={(e) =>
                      updateEditingColumn({
                        label: { ...editingColumn.label, mm: e.target.value },
                      })
                    }
                    placeholder="e.g., အမည်"
                  />
                </div>
              </div>

              {/* Display Options */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Width</Label>
                  <Input
                    value={editingColumn.width || ''}
                    onChange={(e) =>
                      updateEditingColumn({ width: e.target.value || undefined })
                    }
                    placeholder="e.g., 150px or 20%"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Render As</Label>
                  <Select
                    value={editingColumn.renderAs || 'text'}
                    onValueChange={(value) =>
                      updateEditingColumn({ renderAs: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RENDER_AS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Input
                    value={editingColumn.format || ''}
                    onChange={(e) =>
                      updateEditingColumn({ format: e.target.value || undefined })
                    }
                    placeholder="e.g., YYYY-MM-DD"
                  />
                </div>
              </div>

              {/* Switches */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Sortable</Label>
                  <Switch
                    checked={editingColumn.sortable !== false}
                    onCheckedChange={(checked) =>
                      updateEditingColumn({ sortable: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Filterable</Label>
                  <Switch
                    checked={editingColumn.filterable || false}
                    onCheckedChange={(checked) =>
                      updateEditingColumn({ filterable: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Is Multilingual</Label>
                  <Switch
                    checked={editingColumn.isMultilingual || false}
                    onCheckedChange={(checked) =>
                      updateEditingColumn({ isMultilingual: checked })
                    }
                  />
                </div>
              </div>

              {/* Populate Settings */}
              <Accordion type="single" collapsible>
                <AccordionItem value="populate">
                  <AccordionTrigger>Populate Settings (for references)</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Populate Path</Label>
                        <Input
                          value={editingColumn.populate?.path || ''}
                          onChange={(e) =>
                            updateEditingColumn({
                              populate: e.target.value
                                ? {
                                    ...editingColumn.populate,
                                    path: e.target.value,
                                  }
                                : undefined,
                            })
                          }
                          placeholder="e.g., organizationId"
                        />
                      </div>
                      {editingColumn.populate?.path && (
                        <>
                          <div className="space-y-2">
                            <Label>Select Fields</Label>
                            <Input
                              value={editingColumn.populate?.select || ''}
                              onChange={(e) =>
                                updateEditingColumn({
                                  populate: {
                                    ...editingColumn.populate,
                                    path: editingColumn.populate?.path || '',
                                    select: e.target.value || undefined,
                                  },
                                })
                              }
                              placeholder="e.g., name email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Display Field</Label>
                            <Input
                              value={editingColumn.populate?.displayField || ''}
                              onChange={(e) =>
                                updateEditingColumn({
                                  populate: {
                                    ...editingColumn.populate,
                                    path: editingColumn.populate?.path || '',
                                    displayField: e.target.value || undefined,
                                  },
                                })
                              }
                              placeholder="e.g., name.en"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Display Field is Multilingual</Label>
                            <Switch
                              checked={editingColumn.populate?.isMultilingual || false}
                              onCheckedChange={(checked) =>
                                updateEditingColumn({
                                  populate: {
                                    ...editingColumn.populate,
                                    path: editingColumn.populate?.path || '',
                                    isMultilingual: checked,
                                  },
                                })
                              }
                            />
                          </div>
                        </>
                      )}
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
            <Button
              onClick={handleSaveColumn}
              disabled={!editingColumn?.fieldName || !editingColumn?.label.en}
            >
              {editingIndex !== null ? 'Update Column' : 'Add Column'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
