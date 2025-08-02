'use client'

import React from 'react'
import { DashboardProviders } from './DashboardProviders'
import type { DashboardProvidersProps } from '../types'

// Provider factory types
export interface ProviderConfig {
  name: string
  component: React.ComponentType<any>
  props?: Record<string, any>
}

export interface DashboardProviderFactoryProps extends Omit<DashboardProvidersProps, 'initialLanguage'> {
  additionalProviders?: ProviderConfig[]
  initialLanguage?: string
}

/**
 * Factory function to create dashboard provider compositions
 * Allows different applications to extend the base provider setup
 */
export function createDashboardProviders(
  additionalProviders: ProviderConfig[] = []
): React.ComponentType<DashboardProviderFactoryProps> {
  return function ComposedDashboardProviders({
    children,
    initialTenant,
    initialError,
    initialLanguage,
    additionalProviders: runtimeProviders = []
  }: DashboardProviderFactoryProps) {
    
    // Combine compile-time and runtime providers
    const allProviders = [...additionalProviders, ...runtimeProviders]
    
    // Start with base dashboard providers
    let wrappedChildren = (
      <DashboardProviders initialTenant={initialTenant} initialError={initialError}>
        {children}
      </DashboardProviders>
    )
    
    // Wrap with additional providers (in reverse order to maintain hierarchy)
    for (let i = allProviders.length - 1; i >= 0; i--) {
      const { component: Provider, props = {} } = allProviders[i]
      
      // Special handling for language provider
      if (allProviders[i].name === 'LanguageProvider' && initialLanguage) {
        props.initialLanguage = initialLanguage
      }
      
      wrappedChildren = (
        <Provider {...props}>
          {wrappedChildren}
        </Provider>
      )
    }
    
    return <>{wrappedChildren}</>
  }
}

/**
 * Pre-configured provider factory for common dashboard setups
 */
export function createStandardDashboardProviders(
  LanguageProvider?: React.ComponentType<{ children: React.ReactNode; initialLanguage: string }>,
  ErrorProvider?: React.ComponentType<{ children: React.ReactNode }>
) {
  const providers: ProviderConfig[] = []
  
  if (ErrorProvider) {
    providers.push({
      name: 'ErrorProvider',
      component: ErrorProvider
    })
  }
  
  if (LanguageProvider) {
    providers.push({
      name: 'LanguageProvider',
      component: LanguageProvider
    })
  }
  
  return createDashboardProviders(providers)
}

/**
 * Create dashboard providers with standard language provider from @repo/language
 */
export function createDashboardProvidersWithLanguage(
  ErrorProvider?: React.ComponentType<{ children: React.ReactNode }>
) {
  // Import LanguageProvider from @repo/language
  const { LanguageProvider } = require('@repo/language')
  
  return createStandardDashboardProviders(LanguageProvider, ErrorProvider)
}