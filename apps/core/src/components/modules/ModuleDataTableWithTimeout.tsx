'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ModuleDataTable } from '@repo/schema-tables'
import { Alert, AlertDescription } from '@repo/ui'
import { Button } from '@repo/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { Loader2, RefreshCw, AlertTriangle, Clock, Wifi, WifiOff } from 'lucide-react'
import type { ModuleSchema } from '@repo/types'
import type { ModulePermissions } from '@/types/layout'

interface ModuleDataTableWithTimeoutProps {
  module: ModuleSchema
  initialData?: any[]
  searchParams?: Record<string, string>
  userPermissions?: ModulePermissions
}

interface ModuleListResponse {
  data?: any[]
  error?: string
  isTimeout?: boolean
  isLoading?: boolean
}

// Client-side data fetching with timeout handling
async function fetchModuleDataWithTimeout(
  moduleSlug: string, 
  searchParams: Record<string, string> = {},
  timeoutMs: number = 15000 // 15 seconds timeout
): Promise<ModuleListResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    // Build query string
    const queryParams = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) queryParams.set(key, value)
    })
    const queryString = queryParams.toString()
    const url = `/api/modules/${moduleSlug}${queryString ? `?${queryString}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Timeout': String(timeoutMs),
      },
      // Enable credentials for auth
      credentials: 'include',
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      if (response.status === 408 || response.status === 504) {
        return { error: 'Request timed out', isTimeout: true }
      }

      // Try to extract enhanced error details from response
      let errorDetails: any = {};
      try {
        const errorData = await response.json();
        errorDetails = {
          message: errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          statusCode: errorData.statusCode || response.status,
          errorCode: errorData.errorCode || errorData.code,
          traceId: errorData.traceId,
          userMessage: errorData.userMessage || errorData.backendMessage,
          category: errorData.category || errorData.errorCategory,
        };
      } catch {
        errorDetails = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        };
      }

      return { error: errorDetails.message, ...errorDetails };
    }
    
    const data = await response.json()
    return { data }
    
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { error: 'Request timed out', isTimeout: true }
      }
      return { error: error.message }
    }
    
    return { error: 'An unexpected error occurred' }
  }
}

export function ModuleDataTableWithTimeout({
  module,
  initialData,
  searchParams = {},
  userPermissions
}: ModuleDataTableWithTimeoutProps) {
  const [state, setState] = useState<ModuleListResponse>({
    data: initialData,
    isLoading: !initialData
  })
  const [retryCount, setRetryCount] = useState(0)
  const [lastFetch, setLastFetch] = useState<number>(Date.now())

  // Memoize search params to prevent unnecessary refetches
  const memoizedSearchParams = useMemo(() => searchParams, [
    JSON.stringify(searchParams)
  ])

  const fetchData = async (isRetry: boolean = false) => {
    if (isRetry) {
      setRetryCount(prev => prev + 1)
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: undefined }))
    setLastFetch(Date.now())
    
    const result = await fetchModuleDataWithTimeout(
      module.slug, 
      memoizedSearchParams,
      20000 // 20 second timeout
    )
    
    setState({
      data: result.data || [],
      error: result.error,
      isTimeout: result.isTimeout,
      isLoading: false
    })
  }

  // Initial data fetch (only if no initial data provided)
  useEffect(() => {
    if (!initialData) {
      fetchData()
    }
  }, [module.slug, memoizedSearchParams])

  // Auto-retry for timeout errors (max 2 retries)
  useEffect(() => {
    if (state.isTimeout && retryCount < 2) {
      const timer = setTimeout(() => {
        console.log(`Auto-retrying request (attempt ${retryCount + 1}/2)`)
        fetchData(true)
      }, 3000 * (retryCount + 1)) // Progressive delay: 3s, 6s
      
      return () => clearTimeout(timer)
    }
  }, [state.isTimeout, retryCount])

  // Loading state
  if (state.isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <CardTitle>Loading {module.name?.en || module.slug}...</CardTitle>
          </div>
          <CardDescription>
            {retryCount > 0 ? `Retry attempt ${retryCount}/2` : 'Fetching data from microservice'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Loading skeleton */}
            <div className="flex justify-between items-center">
              <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
              <div className="h-8 bg-muted animate-pulse rounded w-24"></div>
            </div>
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Timeout error state
  if (state.isTimeout) {
    return (
      <Card className="w-full border-warning">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            <CardTitle className="text-warning">Request Timed Out</CardTitle>
          </div>
          <CardDescription>
            The microservice is taking longer than expected to respond.
            {retryCount < 2 && ' Automatic retry in progress...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This usually happens when:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>The microservice is experiencing high load</li>
                <li>Network connectivity is slow</li>
                <li>The server is processing a large dataset</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => fetchData(true)}
              disabled={state.isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            {retryCount >= 2 && (
              <Button 
                variant="default"
                onClick={() => {
                  setRetryCount(0)
                  fetchData(true)
                }}
              >
                <Wifi className="h-4 w-4 mr-2" />
                Force Refresh
              </Button>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            Last attempted: {new Date(lastFetch).toLocaleTimeString()}
            {retryCount > 0 && ` • Retry ${retryCount}/2`}
          </div>
        </CardContent>
      </Card>
    )
  }

  // General error state
  if (state.error && !state.isTimeout) {
    return (
      <Card className="w-full border-danger">
        <CardHeader>
          <div className="flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-danger" />
            <CardTitle className="text-danger">Failed to Load Data</CardTitle>
          </div>
          <CardDescription>
            An error occurred while fetching module data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <details className="cursor-pointer">
                <summary className="font-medium mb-2">Error Details</summary>
                <code className="text-xs bg-background p-2 rounded block">
                  {state.error}
                </code>
              </details>
            </AlertDescription>
          </Alert>
          
          <Button 
            variant="outline" 
            onClick={() => fetchData(true)}
            disabled={state.isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <div className="text-xs text-muted-foreground">
            Error occurred at: {new Date(lastFetch).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Success state - render the data table
  return (
    <ModuleDataTable
      module={module}
      data={state.data || []}
      onRefresh={() => fetchData(true)}
      isRefreshing={state.isLoading}
      userPermissions={userPermissions}
    />
  )
}