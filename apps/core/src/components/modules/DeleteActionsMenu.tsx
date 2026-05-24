'use client'

import { useState } from 'react'
import { Trash2, HardDriveIcon, MoreHorizontal, Recycle } from 'lucide-react'
import { Button } from '@repo/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/uidropdown-menu'
import { ConfirmationDialog } from '@repo/ui'
import { useLanguage } from '@repo/language'
import { useIsSystemAdmin } from '@/hooks/use-is-system-admin'

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
  // Hard-delete (permanent removal) is restricted to SystemAdmin —
  // everyone else only sees the soft-delete option. Backend should
  // also enforce this via the module access policy; this gate is
  // a UX layer so non-admins don't see a button that errors out.
  const canHardDelete = useIsSystemAdmin()
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
            {/* SystemAdmin-only — hide for everyone else. Deleted-item
                rows still show Restore above; SystemAdmin additionally
                gets the permanent-delete option. */}
            {canHardDelete && (
              <>
                {onRestore && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={() => setDeleteDialog({ open: true, type: 'hard' })}
                  disabled={isLoading}
                  className="text-red-600 focus:text-red-600"
                >
                  <HardDriveIcon className="mr-2 h-4 w-4" />
                  {currentLanguage === 'mm' ? 'အပြီးအစီးဖျက်' : 'Delete Permanently'}
                </DropdownMenuItem>
              </>
            )}
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

  // Active items — soft delete always available; hard delete
  // SystemAdmin-only.
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
          {canHardDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialog({ open: true, type: 'hard' })}
                disabled={isLoading}
                className="text-red-600 focus:text-red-600"
              >
                <HardDriveIcon className="mr-2 h-4 w-4" />
                {currentLanguage === 'mm' ? 'အပြီးအစီးဖျက်' : 'Delete Permanently'}
              </DropdownMenuItem>
            </>
          )}
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