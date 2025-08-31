'use client'

import { useState } from 'react'
import { ModuleActionBar } from './ModuleActionBar'
import { DeleteActionsMenu } from './DeleteActionsMenu'
import { useDeleteModuleItem, useHardDeleteModuleItem, useBulkModuleOperation } from '@/hooks/use-module-query'
import { toastSuccess, toastError } from '@repo/utils'
import { useLanguage } from '@repo/language'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface EnhancedModuleListExampleProps {
  module: string
  items: any[]
  onRefresh: () => void
  isLoading?: boolean
}

export function EnhancedModuleListExample({
  module,
  items,
  onRefresh,
  isLoading = false
}: EnhancedModuleListExampleProps) {
  const { currentLanguage } = useLanguage()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false)

  // Hooks for delete operations
  const deleteItemMutation = useDeleteModuleItem(module)
  const hardDeleteItemMutation = useHardDeleteModuleItem(module)
  const bulkOperationMutation = useBulkModuleOperation(module)

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(item => item._id || item.id))
    }
  }

  const handleSoftDelete = async (id: string) => {
    try {
      await deleteItemMutation.mutateAsync(id)
      toastSuccess(
        currentLanguage === 'mm' 
          ? 'ဖျက်လိုက်ပြီ!' 
          : 'Item deleted successfully!'
      )
      onRefresh()
    } catch (error) {
      console.error('Failed to delete item:', error)
      toastError(
        currentLanguage === 'mm'
          ? 'ဖျက်ခြင်းမအောင်မြင်ပါ'
          : 'Failed to delete item'
      )
    }
  }

  const handleHardDelete = async (id: string) => {
    try {
      await hardDeleteItemMutation.mutateAsync(id)
      toastSuccess(
        currentLanguage === 'mm' 
          ? 'အပြီးအစီးဖျက်လိုက်ပြီ!' 
          : 'Item permanently deleted!'
      )
      onRefresh()
    } catch (error) {
      console.error('Failed to permanently delete item:', error)
      toastError(
        currentLanguage === 'mm'
          ? 'အပြီးအစီးဖျက်ခြင်းမအောင်မြင်ပါ'
          : 'Failed to permanently delete item'
      )
    }
  }

  const handleBulkDelete = async () => {
    try {
      await bulkOperationMutation.mutateAsync({
        operation: 'delete',
        ids: selectedItems,
      })
      toastSuccess(
        currentLanguage === 'mm' 
          ? `${selectedItems.length} ခုဖျက်လိုက်ပြီ!` 
          : `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} deleted successfully!`
      )
      setSelectedItems([])
      setBulkDeleteDialog(false)
      onRefresh()
    } catch (error) {
      console.error('Failed to delete items:', error)
      toastError(
        currentLanguage === 'mm'
          ? 'အချက်အလက်များဖျက်ခြင်းမအောင်မြင်ပါ'
          : 'Failed to delete items'
      )
    }
  }

  const getItemDisplayName = (item: any) => {
    return item.displayName?.en || item.displayName?.mm || item.name || item.title || `${module} item`
  }

  const isAllSelected = selectedItems.length === items.length && items.length > 0

  return (
    <div className="space-y-6">
      <ModuleActionBar
        module={module}
        onRefresh={onRefresh}
        selectedCount={selectedItems.length}
        onBulkDelete={() => setBulkDeleteDialog(true)}
        isLoading={isLoading}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{currentLanguage === 'mm' ? `${module} စာရင်း` : `${module} List`}</span>
            {items.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {currentLanguage === 'mm' ? 'အားလုံးရွေးချယ်' : 'Select All'}
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{currentLanguage === 'mm' ? 'အချက်အလက်မရှိပါ' : 'No items found'}</p>
              </div>
            ) : (
              items.map((item) => {
                const itemId = item._id || item.id
                const isSelected = selectedItems.includes(itemId)
                
                return (
                  <div
                    key={itemId}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      isSelected ? 'bg-muted border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleItemSelect(itemId)}
                      />
                      <div>
                        <p className="font-medium">{getItemDisplayName(item)}</p>
                        <p className="text-sm text-muted-foreground">
                          {currentLanguage === 'mm' ? 'ပြုလုပ်ချိန်' : 'Created'}: {' '}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <DeleteActionsMenu
                      itemId={itemId}
                      itemName={getItemDisplayName(item)}
                      onSoftDelete={handleSoftDelete}
                      onHardDelete={handleHardDelete}
                      isLoading={
                        deleteItemMutation.isPending || 
                        hardDeleteItemMutation.isPending || 
                        isLoading
                      }
                    />
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={bulkDeleteDialog}
        onOpenChange={setBulkDeleteDialog}
        deleteType="soft"
        itemCount={selectedItems.length}
        itemName={module}
        onConfirm={handleBulkDelete}
        isLoading={bulkOperationMutation.isPending}
      />
    </div>
  )
}