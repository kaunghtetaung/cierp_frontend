'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { Button } from '@repo/ui'
import { Alert, AlertDescription } from '@repo/ui'
import { Badge } from '@repo/ui'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { checkTenantIdAvailability, validateTenantIdFormat, debugTenantId } from '@repo/api/debug/tenant-debug'

interface TenantDebugState {
  availability: {
    cookie: string | null
    header: string | null
    domain: string | null
    localStorage: string | null
  } | null
  testResults: {
    fetch: { status: 'idle' | 'loading' | 'success' | 'error', result?: any, error?: string }
    headers: { present: boolean, value?: string }
  }
  lastCheck: Date | null
}

export function TenantIdDebug() {
  const [state, setState] = useState<TenantDebugState>({
    availability: null,
    testResults: {
      fetch: { status: 'idle' },
      headers: { present: false }
    },
    lastCheck: null
  })

  const checkAvailability = async () => {
    setState(prev => ({ ...prev, lastCheck: new Date() }))
    
    try {
      const availability = await checkTenantIdAvailability()
      setState(prev => ({ ...prev, availability }))
    } catch (error) {
      console.error('Failed to check tenant ID availability:', error)
    }
  }

  const testApiCall = async () => {
    setState(prev => ({
      ...prev,
      testResults: { ...prev.testResults, fetch: { status: 'loading' } }
    }))

    try {
      const response = await fetch('/api/test-tenant', {
        method: 'GET',
        credentials: 'include',
      })

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        testResults: {
          ...prev.testResults,
          fetch: { 
            status: response.ok ? 'success' : 'error', 
            result: data,
            error: response.ok ? undefined : data.error 
          },
          headers: { 
            present: !!response.headers.get('X-Tenant-ID'),
            value: response.headers.get('X-Tenant-ID') || undefined
          }
        }
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        testResults: {
          ...prev.testResults,
          fetch: { 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }
        }
      }))
    }
  }

  useEffect(() => {
    checkAvailability()
  }, [])

  const renderStatusIcon = (present: boolean) => {
    return present ? (
      <CheckCircle className="h-4 w-4 text-success" />
    ) : (
      <XCircle className="h-4 w-4 text-danger" />
    )
  }

  const getValidationResult = (tenantId: string | null) => {
    return validateTenantIdFormat(tenantId)
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Tenant ID Debug Panel
            </CardTitle>
            <CardDescription>
              Verify that x-tenant-id header is properly forwarded to API gateway
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={checkAvailability}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Availability Check */}
        <div>
          <h3 className="font-semibold mb-3">Tenant ID Sources</h3>
          
          {state.availability ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Cookie</span>
                  <div className="flex items-center gap-2">
                    {renderStatusIcon(!!state.availability.cookie)}
                    <Badge variant={state.availability.cookie ? 'default' : 'secondary'}>
                      {state.availability.cookie || 'None'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Server Header</span>
                  <div className="flex items-center gap-2">
                    {renderStatusIcon(!!state.availability.header)}
                    <Badge variant={state.availability.header ? 'default' : 'secondary'}>
                      {state.availability.header || 'None'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Domain</span>
                  <div className="flex items-center gap-2">
                    {renderStatusIcon(!!state.availability.domain)}
                    <Badge variant={state.availability.domain ? 'default' : 'secondary'}>
                      {state.availability.domain || 'None'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">LocalStorage</span>
                  <div className="flex items-center gap-2">
                    {renderStatusIcon(!!state.availability.localStorage)}
                    <Badge variant={state.availability.localStorage ? 'default' : 'secondary'}>
                      {state.availability.localStorage || 'None'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg text-center">
              <span className="text-muted-foreground">Checking tenant ID sources...</span>
            </div>
          )}
        </div>

        {/* Validation Results */}
        {state.availability && (
          <div>
            <h3 className="font-semibold mb-3">Validation Results</h3>
            <div className="space-y-2">
              {Object.entries(state.availability).map(([source, value]) => {
                const validation = getValidationResult(value)
                if (!value) return null
                
                return (
                  <Alert key={source} variant={validation.valid ? 'default' : 'destructive'}>
                    <div className="flex items-center gap-2">
                      {validation.valid ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        <strong className="capitalize">{source}:</strong> {value} - {' '}
                        {validation.valid ? 'Valid format' : validation.reason}
                      </AlertDescription>
                    </div>
                  </Alert>
                )
              })}
            </div>
          </div>
        )}

        {/* API Test */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">API Gateway Test</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testApiCall}
              disabled={state.testResults.fetch.status === 'loading'}
            >
              {state.testResults.fetch.status === 'loading' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Test API Call
            </Button>
          </div>
          
          {state.testResults.fetch.status !== 'idle' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">Request Status</span>
                <Badge variant={
                  state.testResults.fetch.status === 'success' ? 'default' : 
                  state.testResults.fetch.status === 'error' ? 'destructive' : 
                  'secondary'
                }>
                  {state.testResults.fetch.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">Response Tenant ID</span>
                <div className="flex items-center gap-2">
                  {renderStatusIcon(state.testResults.headers.present)}
                  <Badge variant={state.testResults.headers.present ? 'default' : 'secondary'}>
                    {state.testResults.headers.value || 'Not present'}
                  </Badge>
                </div>
              </div>
              
              {state.testResults.fetch.result && (
                <details className="p-3 border rounded-lg">
                  <summary className="font-medium cursor-pointer">Response Details</summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(state.testResults.fetch.result, null, 2)}
                  </pre>
                </details>
              )}
              
              {state.testResults.fetch.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {state.testResults.fetch.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Debug Info */}
        {state.lastCheck && (
          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            Last checked: {state.lastCheck.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}