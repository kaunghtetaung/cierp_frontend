'use client'

import { useParams } from 'next/navigation'
import { useDeletedModuleItems, useRestoreModuleItem, useHardDeleteModuleItem, useBulkModuleOperation } from '@repo/schema-hooks'
import { RecycleBinView } from '@/components/common/recycle-bin-view'
import { toastSuccess, toastError } from '@repo/utils'
import { useLanguage } from '@repo/language'
import { getLocalizedText } from '@repo/utils'
import Link from 'next/link'
import { Button } from '@repo/ui'
import { ArrowLeft } from 'lucide-react'

export default function DeletedItemsPage() {
  const params = useParams()
  const module = params.module as string
  const { currentLanguage } = useLanguage()

  const { data: deletedItems, isLoading, refetch } = useDeletedModuleItems(module)
  const restoreMutation = useRestoreModuleItem(module)
  const hardDeleteMutation = useHardDeleteModuleItem(module)
  const bulkOperationMutation = useBulkModuleOperation(module)

  const handleRestore = async (id: string) => {
    try {
      await restoreMutation.mutateAsync(id)
      toastSuccess(
        currentLanguage === 'mm' 
          ? 'ပြန်လည်ရရှိနိုင်သည်!' 
          : 'Item restored successfully!'
      )
      refetch()
    } catch (error) {
      console.error('Failed to restore item:', error)
      toastError(
        currentLanguage === 'mm'
          ? 'ပြန်လည်ရရှိခြင်းမအောင်မြင်ပါ'
          : 'Failed to restore item'
      )
    }
  }

  const handlePermanentDelete = async (id: string) => {
    try {
      await hardDeleteMutation.mutateAsync(id)
      toastSuccess(
        currentLanguage === 'mm' 
          ? 'အပြီးအစီးဖျက်လိုက်ပြီ!' 
          : 'Item permanently deleted!'
      )
      refetch()
    } catch (error) {
      console.error('Failed to permanently delete item:', error)
      toastError(
        currentLanguage === 'mm'
          ? 'အပြီးအစီးဖျက်ခြင်းမအောင်မြင်ပါ'
          : 'Failed to permanently delete item'
      )
    }
  }

  const handleBulkRestore = async (ids: string[]) => {
    try {
      await bulkOperationMutation.mutateAsync({
        operation: 'restore',
        ids,
      })
      toastSuccess(
        currentLanguage === 'mm' 
          ? `${ids.length} ခုပြန်လည်ရရှိနိုင်သည်!` 
          : `${ids.length} item${ids.length > 1 ? 's' : ''} restored successfully!`
      )
      refetch()
    } catch (error) {
      console.error('Failed to restore items:', error)
      toastError(
        currentLanguage === 'mm'
          ? 'အချက်အလက်များပြန်လည်ရရှိခြင်းမအောင်မြင်ပါ'
          : 'Failed to restore items'
      )
    }
  }

  const handleBulkPermanentDelete = async (ids: string[]) => {
    try {
      await bulkOperationMutation.mutateAsync({
        operation: 'hard-delete',
        ids,
      })
      toastSuccess(
        currentLanguage === 'mm' 
          ? `${ids.length} ခုအပြီးအစီးဖျက်လိုက်ပြီ!` 
          : `${ids.length} item${ids.length > 1 ? 's' : ''} permanently deleted!`
      )
      refetch()
    } catch (error) {
      console.error('Failed to permanently delete items:', error)
      toastError(
        currentLanguage === 'mm'
          ? 'အချက်အလက်များအပြီးအစီးဖျက်ခြင်းမအောင်မြင်ပါ'
          : 'Failed to permanently delete items'
      )
    }
  }

  const handleRefresh = async () => {
    await refetch()
  }

  // Transform deleted items to match RecycleBinView interface
  const transformedItems = deletedItems?.map(item => ({
    id: item._id || item.id,
    displayName: item.displayName || item.name || item.title || `${module} item`,
    deletedAt: item.deletedAt || new Date().toISOString(),
    deletedBy: item.deletedBy,
    originalData: item,
  })) || []

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="mb-4"
        >
          <Link href={`/${module}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentLanguage === 'mm' ? 'ပြန်သွားရန်' : 'Back to'} {module}
          </Link>
        </Button>
      </div>

      <RecycleBinView
        items={transformedItems}
        isLoading={isLoading || restoreMutation.isPending || hardDeleteMutation.isPending || bulkOperationMutation.isPending}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
        onBulkRestore={handleBulkRestore}
        onBulkPermanentDelete={handleBulkPermanentDelete}
        onRefresh={handleRefresh}
        title={currentLanguage === 'mm' ? `${module} ဖျက်လိုက်သောအရာများ` : `Deleted ${module}s`}
        description={currentLanguage === 'mm' ? 'ဖျက်လိုက်သောအချက်အလက်များကိုစီမံခန့်ခွဲရန်' : 'Manage deleted items'}
        itemTypeName={module}
      />
    </div>
  )
}