'use client'

import Link from 'next/link'
import { Button } from '@repo/ui'
import { Trash2, Plus, RefreshCw } from 'lucide-react'
import { useLanguage } from '@repo/language'

interface ModuleActionBarProps {
  module: string
  onRefresh?: () => void
  showAddButton?: boolean
  showRecycleBin?: boolean
  isLoading?: boolean
  selectedCount?: number
  onBulkDelete?: () => void
}

export function ModuleActionBar({
  module,
  onRefresh,
  showAddButton = true,
  showRecycleBin = true,
  isLoading = false,
  selectedCount = 0,
  onBulkDelete
}: ModuleActionBarProps) {
  const { currentLanguage } = useLanguage()

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold capitalize">
          {currentLanguage === 'mm' ? `${module} များ` : `${module}s`}
        </h1>
        
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedCount} {currentLanguage === 'mm' ? 'ရွေးချယ်ထား' : 'selected'}
            </span>
            {onBulkDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {currentLanguage === 'mm' ? 'ရွေးချယ်ထားသောများကိုဖျက်' : 'Delete Selected'}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {currentLanguage === 'mm' ? 'ပြန်လည်ဖွင့်' : 'Refresh'}
          </Button>
        )}

        {showRecycleBin && (
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={`/${module}/deleted`}>
              <Trash2 className="h-4 w-4 mr-2" />
              {currentLanguage === 'mm' ? 'ဖျက်လိုက်သောများ' : 'Recycle Bin'}
            </Link>
          </Button>
        )}

        {showAddButton && (
          <Button
            size="sm"
            asChild
          >
            <Link href={`/${module}/new`}>
              <Plus className="h-4 w-4 mr-2" />
              {currentLanguage === 'mm' ? `${module} အသစ်` : `Add ${module}`}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}