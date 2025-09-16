'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@repo/language'
import { getLocalizedText } from '@repo/utils'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, IconComponent, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@repo/ui'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui'
import type { ModuleSchema, DetailViewSection, DetailViewField } from '@repo/types'
import type { NavigationMetadata } from '@repo/app-modules'

// Helper functions moved to top
function getFieldValue(data: any, fieldPath: string, isMultilingual?: boolean, currentLanguage?: string): any {
  const value = fieldPath.split('.').reduce((obj, key) => obj?.[key], data)
  
  // If field is multilingual and value is an object with language keys
  if (isMultilingual && value && typeof value === 'object' && !Array.isArray(value)) {
    // Check if this is a multilingual object (has 'en' or 'mm' properties)
    if ('en' in value || 'mm' in value) {
      // Return the value for current language, fallback to 'en', then 'mm'
      return value[currentLanguage || 'en'] || value['en'] || value['mm'] || ''
    }
  }
  
  return value
}

function formatFieldValue(value: any, field: DetailViewField, currentLanguage?: string): string | any[] | null {
  if (value === null || value === undefined) return null

  // Handle arrays
  if (Array.isArray(value)) {
    if (field.renderAs === 'list' || field.renderAs === 'table') {
      return value
    }
    return value.map(item => {
      if (typeof item === 'object') {
        // Check if item has multilingual properties
        if (field.isMultilingual && ('en' in item || 'mm' in item)) {
          return item[currentLanguage || 'en'] || item['en'] || item['mm'] || String(item)
        }
        return item.name || item.title || String(item)
      }
      return String(item)
    }).join(', ')
  }

  // Handle objects - already handled by getFieldValue for multilingual
  if (typeof value === 'object') {
    return value.name || value.title || String(value)
  }

  // Handle dates
  if (field.type === 'date' && field.displayFormat) {
    try {
      const date = new Date(value)
      if (field.displayFormat === 'MM/DD/YYYY') {
        return date.toLocaleDateString('en-US')
      }
      return date.toLocaleDateString()
    } catch {
      return String(value)
    }
  }

  // Handle numbers
  if (field.type === 'number') {
    return Number(value).toLocaleString()
  }

  return String(value)
}

interface DetailViewRendererProps {
  module: ModuleSchema
  itemData: any
  appId: string
  navigation?: NavigationMetadata
}

export function DetailViewRenderer({ module, itemData, appId, navigation }: DetailViewRendererProps) {
  const router = useRouter()
  const { currentLanguage } = useLanguage()
  const detailViewSchema = module.detailViewSchema

  const handlePrint = () => {
    // Open print page in new window
    const printUrl = `/${appId}/${module.slug}/${itemData._id || itemData.id}/print`
    const printWindow = window.open(printUrl, '_blank', 'width=800,height=600')
    
    if (!printWindow) {
      // Fallback if popup is blocked
      router.push(printUrl)
    }
  }

  // Get current sort parameters from URL
  const searchParams = useSearchParams()
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  
  // Build query string to preserve sort parameters
  const queryString = `?sortBy=${sortBy}&sortOrder=${sortOrder}`

  // Add keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Left arrow - Previous record
      if (e.key === 'ArrowLeft' && navigation?.hasPrevious && navigation?.previousId) {
        e.preventDefault()
        router.push(`/${appId}/${module.slug}/${navigation.previousId}/view${queryString}`)
      }
      
      // Right arrow - Next record
      if (e.key === 'ArrowRight' && navigation?.hasNext && navigation?.nextId) {
        e.preventDefault()
        router.push(`/${appId}/${module.slug}/${navigation.nextId}/view${queryString}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigation, appId, module.slug, router, queryString])

  if (!detailViewSchema) {
    return <div>No detail view schema configured</div>
  }

  return (
    <div id="detail-view-container" className="space-y-4 max-w-4xl mx-auto">
        {/* Header - Hidden in print */}
        <div className="print:hidden">
          <DetailViewHeader 
            module={module}
            itemData={itemData}
            appId={appId}
            currentLanguage={currentLanguage}
            navigation={navigation}
            queryString={queryString}
          />
        </div>

        {/* Icon Bar - Navigation, Print, Back - Hidden in print */}
        <div className="print:hidden mb-3">
          <DetailViewIconBar
            module={module}
            itemData={itemData}
            appId={appId}
            currentLanguage={currentLanguage}
            navigation={navigation}
            queryString={queryString}
            onPrint={handlePrint}
          />
        </div>

        {/* Single Paper-like Document */}
        <Card className="shadow-xl bg-white border-0">
          <CardContent className="p-8 md:p-12 space-y-8 bg-white">
            {/* Sections */}
          {detailViewSchema.sections.map((section) => {
            // Always show Additional Information and System Information sections
            const alwaysShowSections = ['additionalInformation', 'systemInformation', 'additional', 'system']
            const shouldAlwaysShow = alwaysShowSections.some(name => 
              section.name.toLowerCase().includes(name.toLowerCase())
            )
            
            if (!shouldAlwaysShow) {
              // Check if section has any visible fields with data
              const hasVisibleFields = section.fields.some(field => {
                const fieldValue = getFieldValue(itemData, field.fieldName, field.isMultilingual, currentLanguage)
                const displayValue = formatFieldValue(fieldValue, field, currentLanguage)
                
                return field.visible && 
                       displayValue !== null && 
                       displayValue !== undefined && 
                       displayValue !== '' &&
                       !(Array.isArray(displayValue) && displayValue.length === 0) &&
                       !(Array.isArray(fieldValue) && fieldValue.length === 0)
              })
              
              if (!hasVisibleFields) return null
            }
            
            // Skip sections marked as not printable in print mode
            if (section.printable === false) {
              return (
                <div key={section.name} className="print:hidden">
                  <DetailViewSection
                    section={section}
                    itemData={itemData}
                    currentLanguage={currentLanguage}
                    isInSingleCard={true}
                  />
                </div>
              )
            }
            
            return (
              <DetailViewSection
                key={section.name}
                section={section}
                itemData={itemData}
                currentLanguage={currentLanguage}
                isInSingleCard={true}
              />
            )
          })}
          
          {/* Print Footer - Only visible when printing */}
          {detailViewSchema.printConfig?.footerContent && (
            <div className="hidden print:block print:mt-8 print:pt-4 print:border-t print:text-center print:text-xs print:text-gray-600">
              {getLocalizedText(detailViewSchema.printConfig.footerContent, currentLanguage)}
            </div>
          )}
          
          {/* Default print footer if no config */}
          {!detailViewSchema.printConfig?.footerContent && (
            <div className="hidden print:block print:mt-8 print:pt-4 print:border-t print:text-center print:text-xs print:text-gray-600">
              Printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </div>
          )}
          </CardContent>
        </Card>

        {/* Footer Icon Bar - Same as header - Hidden in print */}
        <div className="print:hidden mt-3">
          <DetailViewIconBar
            module={module}
            itemData={itemData}
            appId={appId}
            currentLanguage={currentLanguage}
            navigation={navigation}
            queryString={queryString}
            onPrint={handlePrint}
          />
        </div>
      </div>
  )
}

interface DetailViewHeaderProps {
  module: ModuleSchema
  itemData: any
  appId: string
  currentLanguage: string
  navigation?: NavigationMetadata
  queryString?: string
}

function DetailViewHeader({ module, itemData, appId, currentLanguage, navigation, queryString = '' }: DetailViewHeaderProps) {
  const router = useRouter()

  // Get main title field - usually title or name
  const titleField = itemData.title || itemData.name || 'Untitled'

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button 
            onClick={() => router.push(`/${appId}/${module.slug}`)}
            className="hover:text-foreground transition-colors"
          >
            {getLocalizedText(module.name, currentLanguage)}
          </button>
          <IconComponent name="ChevronRight" className="w-4 h-4" />
          <span>{currentLanguage === 'mm' ? 'အသေးစိတ်ကြည့်ရှုခြင်း' : 'View Details'}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-foreground">
          {titleField}
        </h1>
      </div>
    </div>
  )
}

interface DetailViewSectionProps {
  section: DetailViewSection
  itemData: any
  currentLanguage: string
  isInSingleCard?: boolean
}

function DetailViewSection({ section, itemData, currentLanguage, isInSingleCard = false }: DetailViewSectionProps) {
  const [isExpanded, setIsExpanded] = useState(section.defaultExpanded ?? true)

  const SectionContent = () => (
    <div className={getLayoutClassName(section)}>
      {section.fields.map((field) => (
        <DetailViewField
          key={field.fieldName}
          field={field}
          itemData={itemData}
          currentLanguage={currentLanguage}
        />
      ))}
    </div>
  )

  if (isInSingleCard) {
    // Paper-like section within single card
    return (
      <div className="space-y-4">
        {section.collapsible ? (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors p-2 -m-2 rounded">
                <h3 className="text-lg font-semibold text-foreground border-b-2 border-muted pb-1">
                  {getLocalizedText(section.title, currentLanguage)}
                </h3>
                <IconComponent 
                  name={isExpanded ? "ChevronDown" : "ChevronRight"} 
                  className="w-5 h-5 transition-transform"
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-4">
                <SectionContent />
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-foreground border-b-2 border-muted pb-1 mb-4">
              {getLocalizedText(section.title, currentLanguage)}
            </h3>
            <SectionContent />
          </>
        )}
      </div>
    )
  }

  // Original card-based layout for backward compatibility
  if (section.collapsible) {
    return (
      <Card>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <span>{getLocalizedText(section.title, currentLanguage)}</span>
                <IconComponent 
                  name={isExpanded ? "ChevronDown" : "ChevronRight"} 
                  className="w-5 h-5 transition-transform"
                />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <SectionContent />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getLocalizedText(section.title, currentLanguage)}</CardTitle>
      </CardHeader>
      <CardContent>
        <SectionContent />
      </CardContent>
    </Card>
  )
}

function getLayoutClassName(section: DetailViewSection): string {
  const baseClass = 'space-y-4'
  
  switch (section.layout) {
    case 'grid':
      const columns = section.columns || 2
      return `grid grid-cols-1 md:grid-cols-${columns} gap-4`
    case 'list':
      return baseClass
    case 'table':
      return ''
    default:
      return baseClass
  }
}

interface DetailViewFieldProps {
  field: DetailViewField
  itemData: any
  currentLanguage: string
}

function DetailViewField({ field, itemData, currentLanguage }: DetailViewFieldProps) {
  if (!field.visible) return null

  const fieldValue = getFieldValue(itemData, field.fieldName, field.isMultilingual, currentLanguage)
  const displayValue = formatFieldValue(fieldValue, field, currentLanguage)

  // Hide fields with null, undefined, empty string, or empty arrays
  if (displayValue === null || 
      displayValue === undefined || 
      displayValue === '' ||
      (Array.isArray(displayValue) && displayValue.length === 0) ||
      (Array.isArray(fieldValue) && fieldValue.length === 0)) {
    return null
  }

  const fieldLabel = getLocalizedText(field.label, currentLanguage)
  const colspanClass = field.colspan ? `col-span-${field.colspan}` : ''

  // Handle table rendering
  if (field.renderAs === 'table' && Array.isArray(fieldValue)) {
    return (
      <div className={colspanClass}>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">{fieldLabel}</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Sr</TableHead>
                {fieldValue.length > 0 && Object.keys(fieldValue[0])
                  .filter(key => key !== '_id' && key !== 'id') // Filter out _id and id fields
                  .map((key) => (
                    <TableHead key={key} className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fieldValue.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  {Object.entries(row)
                    .filter(([key]) => key !== '_id' && key !== 'id') // Filter out _id and id fields
                    .map(([key, value]) => (
                      <TableCell key={key}>
                        {String(value || '')}
                      </TableCell>
                    ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className={colspanClass}>
      <dl className="space-y-1">
        <dt className="text-sm font-medium text-muted-foreground">
          {fieldLabel}
        </dt>
        <dd className="text-sm">
          {field.renderAs === 'badge' ? (
            <Badge variant="secondary">{displayValue}</Badge>
          ) : field.renderAs === 'list' && Array.isArray(fieldValue) ? (
            <div className="flex flex-wrap gap-1">
              {fieldValue.map((item, index) => (
                <Badge key={index} variant="outline">
                  {typeof item === 'object' ? item.name || item.title || String(item) : String(item)}
                </Badge>
              ))}
            </div>
          ) : field.renderAs === 'link' ? (
            <a href={String(displayValue)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {displayValue}
            </a>
          ) : field.type === 'textArea' ? (
            <div className="whitespace-pre-wrap">{displayValue}</div>
          ) : field.type === 'checkbox' ? (
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border-2 ${fieldValue ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                {fieldValue && <IconComponent name="Check" className="w-3 h-3 text-primary-foreground" />}
              </div>
              <span>{fieldValue ? (currentLanguage === 'mm' ? 'ရှိသည်' : 'Yes') : (currentLanguage === 'mm' ? 'မရှိ' : 'No')}</span>
            </div>
          ) : (
            <span>
              {Array.isArray(displayValue) ? 
                displayValue.map((item, idx) => {
                  if (typeof item === 'object' && item !== null) {
                    // For objects, extract meaningful display values
                    const display = item.accessionNo 
                      ? `${item.accessionNo}${item.status ? ` - ${item.status}` : ''}`
                      : item.name || item.displayName || item.title || JSON.stringify(item);
                    return <span key={idx}>{idx > 0 ? ', ' : ''}{display}</span>;
                  }
                  return <span key={idx}>{idx > 0 ? ', ' : ''}{String(item)}</span>;
                })
                : displayValue
              }
            </span>
          )}
        </dd>
      </dl>
    </div>
  )
}

interface DetailViewIconBarProps {
  module: ModuleSchema
  itemData: any
  appId: string
  currentLanguage: string
  navigation?: NavigationMetadata
  queryString?: string
  onPrint: () => void
}

function DetailViewIconBar({ 
  module, 
  itemData, 
  appId, 
  currentLanguage, 
  navigation, 
  queryString = '',
  onPrint 
}: DetailViewIconBarProps) {
  const router = useRouter()

  const handlePrevious = () => {
    if (navigation?.previousId) {
      router.push(`/${appId}/${module.slug}/${navigation.previousId}/view${queryString}`)
    }
  }

  const handleNext = () => {
    if (navigation?.nextId) {
      router.push(`/${appId}/${module.slug}/${navigation.nextId}/view${queryString}`)
    }
  }

  const handleBack = () => {
    router.push(`/${appId}/${module.slug}${queryString}`)
  }

  const handleEdit = () => {
    router.push(`/${appId}/${module.slug}/${itemData._id || itemData.id}`)
  }

  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Left side - Back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="shadow-sm"
        >
          <IconComponent name="ArrowLeft" className="w-4 h-4 mr-2" />
          {currentLanguage === 'mm' ? 'ပြန်သွားမည်' : 'Back to List'}
        </Button>
      </div>

      {/* Center - Navigation controls */}
      {navigation && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={!navigation.hasPrevious}
            title={currentLanguage === 'mm' ? 'ယခင်မှတ်တမ်း (←)' : 'Previous Record (←)'}
            className="shadow-sm"
          >
            <IconComponent name="ChevronLeft" className="w-4 h-4" />
          </Button>
          
          <div className="px-3 py-1 bg-background border border-border rounded-md shadow-sm">
            <span className="text-sm font-medium">
              {navigation.currentIndex} / {navigation.totalRecords}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={!navigation.hasNext}
            title={currentLanguage === 'mm' ? 'နောက်မှတ်တမ်း (→)' : 'Next Record (→)'}
            className="shadow-sm"
          >
            <IconComponent name="ChevronRight" className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrint}
          className="shadow-sm"
        >
          <IconComponent name="Printer" className="w-4 h-4 mr-2" />
          {currentLanguage === 'mm' ? 'ပုံနှိပ်မည်' : 'Print'}
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={handleEdit}
          className="shadow-sm"
        >
          <IconComponent name="Edit" className="w-4 h-4 mr-2" />
          {currentLanguage === 'mm' ? 'တည်းဖြတ်မည်' : 'Edit'}
        </Button>
      </div>
    </div>
  )
}