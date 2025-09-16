"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  IconComponent,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";
import { getLocalizedText } from "@repo/utils";
import { httpClient } from "@repo/api/clients/client";

interface TableColumn {
  fieldName: string;
  label: { en: string; mm?: string };
  type: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  renderAs?: "text" | "badge" | "link";
}

interface TableActions {
  edit?: {
    type: string;
    label: { en: string; mm?: string };
    icon?: string;
  };
  delete?: {
    type: string;
    label: { en: string; mm?: string };
    icon?: string;
  };
}

interface TableSchema {
  layout?: string;
  columns: TableColumn[];
  actions?: TableActions;
  pagination?: {
    enabled: boolean;
    defaultLimit?: number;
    allowedLimits?: number[];
    isClientSidePaging?: boolean;
  };
}

interface FormTableSectionProps {
  section: {
    name: string;
    title: { en: string; mm?: string };
    type: "table";
    tableSchema: TableSchema;
    endpoint: string;
    refreshOnAdd?: boolean;
  };
  currentLanguage: string;
  selectedItemId?: string;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  refreshTrigger?: number; // Incremented to trigger refresh
}

export function FormTableSection({
  section,
  currentLanguage,
  selectedItemId,
  onEdit,
  onDelete,
  refreshTrigger,
}: FormTableSectionProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingItem, setDeletingItem] = useState<any>(null);

  // Fetch data from endpoint
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedItemId || !section.endpoint) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Replace :id with actual ID in the endpoint
        const endpoint = section.endpoint.replace(':id', selectedItemId);
        
        // Fetch data from the API
        const response = await httpClient.get<any[]>(endpoint);
        
        if (response.success && response.data) {
          setData(response.data);
        } else {
          // Fallback to empty array if no data
          setData([]);
        }
      } catch (error) {
        console.error("Failed to fetch table data:", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedItemId, section.endpoint, refreshTrigger]);

  const handleDeleteConfirm = async () => {
    if (deletingItem && onDelete) {
      await onDelete(deletingItem);
      setDeletingItem(null);
    }
  };

  const renderCellValue = (item: any, column: TableColumn) => {
    const value = item[column.fieldName];
    
    if (!value) return "-";

    switch (column.renderAs) {
      case "badge":
        const variant = value === "Available" ? "default" : 
                       value === "Checked Out" ? "secondary" :
                       value === "Lost" || value === "Damaged" ? "destructive" : 
                       "outline";
        return <Badge variant={variant}>{value}</Badge>;
      default:
        return value;
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Title */}
      {section.title && (
        <h3 className="text-lg font-semibold">
          {getLocalizedText(section.title, currentLanguage)}
        </h3>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {section.tableSchema.columns.map((column) => (
                <TableHead key={column.fieldName} style={{ width: column.width }}>
                  {getLocalizedText(column.label, currentLanguage)}
                </TableHead>
              ))}
              {section.tableSchema.actions && (
                <TableHead className="text-right">
                  {currentLanguage === "mm" ? "လုပ်ဆောင်ချက်" : "Actions"}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell 
                  colSpan={section.tableSchema.columns.length + (section.tableSchema.actions ? 1 : 0)}
                  className="text-center py-8"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-muted-foreground">
                      {currentLanguage === "mm" ? "အချက်အလက်များ ရယူနေသည်..." : "Loading..."}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={section.tableSchema.columns.length + (section.tableSchema.actions ? 1 : 0)}
                  className="text-center py-8"
                >
                  <div className="text-muted-foreground">
                    <IconComponent name="Inbox" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>
                      {currentLanguage === "mm" 
                        ? "အချက်အလက် မရှိသေးပါ" 
                        : "No data available"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  {section.tableSchema.columns.map((column) => (
                    <TableCell key={column.fieldName}>
                      {renderCellValue(item, column)}
                    </TableCell>
                  ))}
                  {section.tableSchema.actions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {section.tableSchema.actions.edit && onEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(item)}
                          >
                            <IconComponent 
                              name={section.tableSchema.actions.edit.icon || "Edit"} 
                              className="w-4 h-4"
                            />
                          </Button>
                        )}
                        {section.tableSchema.actions.delete && onDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingItem(item)}
                          >
                            <IconComponent 
                              name={section.tableSchema.actions.delete.icon || "Trash2"} 
                              className="w-4 h-4"
                            />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentLanguage === "mm" ? "သေချာပါသလား?" : "Are you sure?"}
            </DialogTitle>
            <DialogDescription>
              {currentLanguage === "mm"
                ? `"${deletingItem?.accessionNo || deletingItem?.name || 'this item'}" ကို ဖယ်ရှားမည်လား?`
                : `Do you want to remove "${deletingItem?.accessionNo || deletingItem?.name || 'this item'}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingItem(null)}
            >
              {currentLanguage === "mm" ? "မလုပ်တော့" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              {currentLanguage === "mm" ? "ဖယ်ရှားမည်" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}