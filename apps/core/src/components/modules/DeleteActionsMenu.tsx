'use client'

import { useState } from 'react'
import { Trash2, HardDriveIcon, MoreHorizontal, Recycle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useLanguage } from '@repo/language'

interface DeleteActionsMenuProps {
  itemId: string
  itemName?: string
  onSoftDelete: (id: string) => Promise<void>
  onHardDelete: (id: string) => Promise<void>
  onRestore?: (id: string) => Promise<void>
  isDeleted?: boolean
  isLoading?: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

export function DeleteActionsMenu({
  itemId,
  itemName = 'item',
  onSoftDelete,
  onHardDelete,
  onRestore,
  isDeleted = false,
  isLoading = false,
  size = 'sm',
  variant = 'ghost'
}: DeleteActionsMenuProps) {
  const { currentLanguage } = useLanguage()
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: 'soft' | 'hard'
  }>({ open: false, type: 'soft' })

  const handleSoftDelete = async () => {
    await onSoftDelete(itemId)
    setDeleteDialog({ open: false, type: 'soft' })
  }

  const handleHardDelete = async () => {
    await onHardDelete(itemId)
    setDeleteDialog({ open: false, type: 'hard' })
  }

  const handleRestore = async () => {
    if (onRestore) {
      await onRestore(itemId)
    }
  }

  if (isDeleted) {
    // Show restore and permanent delete options for deleted items
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={variant} size={size} disabled={isLoading}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onRestore && (
              <DropdownMenuItem onClick={handleRestore} disabled={isLoading}>
                <Recycle className="mr-2 h-4 w-4 text-green-600" />
                {currentLanguage === 'mm' ? 'ပြန်လည်ရယူ' : 'Restore'}
              </DropdownMenuItem>
            )}
            {onRestore && <DropdownMenuSeparator />}
            <DropdownMenuItem 
              onClick={() => setDeleteDialog({ open: true, type: 'hard' })}
              disabled={isLoading}
              className="text-red-600 focus:text-red-600"
            >
              <HardDriveIcon className="mr-2 h-4 w-4" />
              {currentLanguage === 'mm' ? 'အပြီးအစီးဖျက်' : 'Delete Permanently'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ConfirmationDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
          deleteType={deleteDialog.type}
          itemName={itemName}
          onConfirm={deleteDialog.type === 'soft' ? handleSoftDelete : handleHardDelete}
          isLoading={isLoading}
        />
      </>
    )
  }

  // Show soft delete and hard delete options for active items
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={isLoading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => setDeleteDialog({ open: true, type: 'soft' })}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4 text-orange-600" />
            {currentLanguage === 'mm' ? 'ဖျက်' : 'Delete'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setDeleteDialog({ open: true, type: 'hard' })}
            disabled={isLoading}
            className="text-red-600 focus:text-red-600"
          >
            <HardDriveIcon className="mr-2 h-4 w-4" />
            {currentLanguage === 'mm' ? 'အပြီးအစီးဖျက်' : 'Delete Permanently'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        deleteType={deleteDialog.type}
        itemName={itemName}
        onConfirm={deleteDialog.type === 'soft' ? handleSoftDelete : handleHardDelete}
        isLoading={isLoading}
      />
    </>
  )
}