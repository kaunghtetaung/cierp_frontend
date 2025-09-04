import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function ModuleLoading() {
  return (
    <div className="w-full min-w-0 overflow-hidden">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <CardTitle>Loading Module...</CardTitle>
          </div>
          <CardDescription>
            Fetching module configuration and data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Loading skeleton for toolbar */}
            <div className="flex justify-between items-center">
              <div className="h-10 bg-muted animate-pulse rounded w-64"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-muted animate-pulse rounded w-24"></div>
                <div className="h-10 bg-muted animate-pulse rounded w-24"></div>
                <div className="h-10 bg-muted animate-pulse rounded w-24"></div>
              </div>
            </div>
            
            {/* Loading skeleton for table */}
            <div className="border rounded-lg overflow-hidden">
              {/* Table header */}
              <div className="border-b bg-muted/50 p-4">
                <div className="flex gap-4">
                  <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-40"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-28"></div>
                </div>
              </div>
              
              {/* Table rows */}
              <div className="divide-y">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="p-4">
                    <div className="flex gap-4 items-center">
                      <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-40"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-28"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Loading skeleton for pagination */}
            <div className="flex justify-between items-center">
              <div className="h-4 bg-muted animate-pulse rounded w-48"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-muted animate-pulse rounded w-20"></div>
                <div className="h-10 bg-muted animate-pulse rounded w-20"></div>
                <div className="h-10 bg-muted animate-pulse rounded w-20"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}