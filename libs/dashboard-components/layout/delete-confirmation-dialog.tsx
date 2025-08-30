'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2, HardDriveIcon } from 'lucide-react'

export interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  itemName?: string
  itemCount?: number
  deleteType: 'soft' | 'hard'
  onConfirm: () => Promise<void> | void
  isLoading?: boolean
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName = 'item',
  itemCount = 1,
  deleteType,
  onConfirm,
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const isSoft = deleteType === 'soft'
  const isMultiple = itemCount > 1
  
  const defaultTitle = isSoft 
    ? `Delete ${isMultiple ? `${itemCount} ${itemName}s` : itemName}?`
    : `Permanently delete ${isMultiple ? `${itemCount} ${itemName}s` : itemName}?`

  const defaultDescription = isSoft
    ? `${isMultiple ? 'These items' : 'This item'} will be moved to the recycle bin and can be restored later.`
    : `${isMultiple ? 'These items' : 'This item'} will be permanently deleted and cannot be recovered. This action cannot be undone.`

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isSoft ? (
              <Trash2 className="h-5 w-5 text-orange-500" />
            ) : (
              <HardDriveIcon className="h-5 w-5 text-red-500" />
            )}
            {title || defaultTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description || defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting || isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting || isLoading}
            className={isSoft ? "bg-orange-600 hover:bg-orange-700" : "bg-red-600 hover:bg-red-700"}
          >
            {isDeleting || isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                {isSoft ? 'Deleting...' : 'Permanently Deleting...'}
              </>
            ) : (
              isSoft ? 'Delete' : 'Permanently Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}