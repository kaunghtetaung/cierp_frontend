'use client'

import { useState } from 'react'
import { 
  Trash2, 
  RotateCcw, 
  HardDriveIcon, 
  Search,
  RefreshCw,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

export interface DeletedItem {
  id: string
  displayName: string | { en: string; mm: string }
  deletedAt: string
  deletedBy?: string
  originalData?: any
}

export interface RecycleBinViewProps {
  items: DeletedItem[]
  isLoading?: boolean
  onRestore: (id: string) => Promise<void>
  onPermanentDelete: (id: string) => Promise<void>
  onBulkRestore: (ids: string[]) => Promise<void>
  onBulkPermanentDelete: (ids: string[]) => Promise<void>
  onRefresh: () => Promise<void>
  title?: string
  description?: string
  itemTypeName?: string
}

export function RecycleBinView({
  items,
  isLoading = false,
  onRestore,
  onPermanentDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  onRefresh,
  title = "Recycle Bin",
  description = "Manage deleted items",
  itemTypeName = "item"
}: RecycleBinViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    itemId?: string
    itemName?: string
    type: 'single' | 'bulk'
  }>({ open: false, type: 'single' })

  const filteredItems = items.filter(item => {
    const displayName = typeof item.displayName === 'string' 
      ? item.displayName 
      : item.displayName.en || item.displayName.mm
    return displayName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredItems.map(item => item.id))
    }
  }

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSingleRestore = async (itemId: string) => {
    await onRestore(itemId)
    setSelectedItems(prev => prev.filter(id => id !== itemId))
  }

  const handleBulkRestore = async () => {
    await onBulkRestore(selectedItems)
    setSelectedItems([])
  }

  const handleSinglePermanentDelete = async () => {
    if (deleteDialog.itemId) {
      await onPermanentDelete(deleteDialog.itemId)
      setSelectedItems(prev => prev.filter(id => id !== deleteDialog.itemId))
    }
    setDeleteDialog({ open: false, type: 'single' })
  }

  const handleBulkPermanentDelete = async () => {
    await onBulkPermanentDelete(selectedItems)
    setSelectedItems([])
    setDeleteDialog({ open: false, type: 'bulk' })
  }

  const getDisplayName = (item: DeletedItem) => {
    return typeof item.displayName === 'string' 
      ? item.displayName 
      : item.displayName.en || item.displayName.mm
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deleted items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Badge variant="secondary">
                {filteredItems.length} {itemTypeName}{filteredItems.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedItems.length} selected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkRestore}
                  disabled={isLoading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore Selected
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialog({ open: true, type: 'bulk' })}
                  disabled={isLoading}
                >
                  <HardDriveIcon className="h-4 w-4 mr-2" />
                  Delete Permanently
                </Button>
              </div>
            )}
          </div>

          {filteredItems.length > 0 && (
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8"
              >
                {selectedItems.length === filteredItems.length ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No deleted {itemTypeName}s found</p>
                {searchTerm && (
                  <p className="text-sm">Try adjusting your search terms</p>
                )}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleSelectItem(item.id)}
                    />
                    <div>
                      <p className="font-medium">{getDisplayName(item)}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Deleted: {formatDate(item.deletedAt)}</span>
                        {item.deletedBy && <span>By: {item.deletedBy}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSingleRestore(item.id)}
                      disabled={isLoading}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialog({ 
                        open: true, 
                        type: 'single', 
                        itemId: item.id,
                        itemName: getDisplayName(item)
                      })}
                      disabled={isLoading}
                    >
                      <HardDriveIcon className="h-4 w-4 mr-2" />
                      Delete Permanently
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        deleteType="hard"
        itemName={deleteDialog.type === 'single' ? deleteDialog.itemName : itemTypeName}
        itemCount={deleteDialog.type === 'bulk' ? selectedItems.length : 1}
        onConfirm={deleteDialog.type === 'single' ? handleSinglePermanentDelete : handleBulkPermanentDelete}
        isLoading={isLoading}
      />
    </div>
  )
}