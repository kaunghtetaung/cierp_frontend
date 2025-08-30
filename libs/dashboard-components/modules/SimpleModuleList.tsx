import Link from 'next/link'
import { getLocalizedText } from '@repo/utils'
import { Button } from '@repo/ui'
import { IconComponent } from '@repo/ui/components/icons'
import { deleteModuleItemAction } from '@repo/app-modules/server-actions'
import type { ModuleSchema, DataTableColumn } from '@repo/types'

interface SimpleModuleListProps {
  module: ModuleSchema
  data: any[]
}

export function SimpleModuleList({ module, data }: SimpleModuleListProps) {
  console.log('SimpleModuleList received:', { 
    module: module.name, 
    dataCount: data.length,
    columns: module.dataTableSchema?.columns?.length 
  });

  // Helper function to get nested field values
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  // Helper function to render cell value based on column type
  const renderCellValue = (item: any, column: DataTableColumn) => {
    const fieldValue = getNestedValue(item, column.fieldName);

    if (column.type === "date" && fieldValue) {
      return new Date(fieldValue).toLocaleDateString();
    } else if (column.type === "boolean") {
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            fieldValue
              ? "bg-success/20 text-success border border-success/30"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          {fieldValue ? "Yes" : "No"}
        </span>
      );
    } else if (column.type === "status") {
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            fieldValue === "Active"
              ? "bg-success/20 text-success border border-success/30"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          {fieldValue === "Active" ? "Active" : "Inactive"}
        </span>
      );
    } else if (column.type === "number" && fieldValue) {
      return <div className="font-medium text-right">{fieldValue.toLocaleString()}</div>;
    }

    return <div className="font-medium">{fieldValue || "-"}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconComponent name={module.iconName} className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {getLocalizedText(module.name, 'en')}
            </h1>
            <p className="text-muted-foreground">
              {getLocalizedText(module.description, 'en')}
            </p>
          </div>
        </div>
        
        <Link href={`/${module.slug}/new`}>
          <Button>
            <IconComponent name="Plus" className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </Link>
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-lg border">
        {module.dataTableSchema?.columns && module.dataTableSchema.columns.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {module.dataTableSchema.columns.map(column => (
                  <th key={column.fieldName} className="text-left p-4 font-medium">
                    <div className="flex items-center gap-2">
                      {getLocalizedText(column.label, 'en')}
                      {column.sortable && (
                        <IconComponent name="ArrowUpDown" className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item._id || item.id || index} className="border-b last:border-0 hover:bg-muted/50">
                    {module.dataTableSchema.columns.map(column => (
                      <td key={column.fieldName} className="p-4">
                        {renderCellValue(item, column)}
                      </td>
                    ))}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Action */}
                        {module.dataTableSchema?.actions?.view && (
                          <Link href={`/${module.slug}/${item._id || item.id}/view`}>
                            <Button variant="outline" size="sm" title="View">
                              <IconComponent name="Eye" className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        
                        {/* Edit Action */}
                        {module.dataTableSchema?.actions?.edit && (
                          <Link href={`/${module.slug}/${item._id || item.id}`}>
                            <Button variant="outline" size="sm" title="Edit">
                              <IconComponent name="Edit" className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        
                        {/* Delete Action */}
                        {module.dataTableSchema?.actions?.delete && (
                          <form action={deleteModuleItemAction.bind(null, module.slug, item._id || item.id)}>
                            <Button variant="outline" size="sm" type="submit" title="Delete">
                              <IconComponent name="Trash" className="w-4 h-4" />
                            </Button>
                          </form>
                        )}
                        
                        {/* Extra Actions */}
                        {module.dataTableSchema?.actions?.extraActions?.map(action => (
                          <Link key={action.actionKey} href={`/${module.slug}/${item._id || item.id}/actions/${action.actionKey}`}>
                            <Button variant="outline" size="sm" title={getLocalizedText(action.label, 'en')}>
                              <IconComponent name={action.icon} className="w-4 h-4" />
                            </Button>
                          </Link>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={module.dataTableSchema.columns.length + 1} 
                      className="text-center py-12">
                    <div>
                      <IconComponent name="Database" className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No data found</h3>
                      <p className="text-muted-foreground mb-4">Get started by creating your first item.</p>
                      <Link href={`/${module.slug}/new`}>
                        <Button>
                          <IconComponent name="Plus" className="w-4 h-4 mr-2" />
                          Add New
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <IconComponent name="Settings" className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No table configuration</h3>
            <p className="text-muted-foreground">This module has no display columns configured.</p>
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {data.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Total: {data.length} items
          </div>
          <div>
            Layout: {module.dataTableSchema?.layout || 'standard'}
            {module.dataTableSchema?.pagination?.enabled && (
              <> • Page size: {module.dataTableSchema.pagination.defaultLimit}</>
            )}
          </div>
        </div>
      )}
    </div>
  )
}