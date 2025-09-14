import { NextResponse } from 'next/server'
import { fetchLayoutData } from '@/lib/layout-data'
import { getModuleItem } from '@repo/app-modules'
import type { ModuleSchema, DetailViewField } from '@repo/types'

// Helper function to get field value
function getFieldValue(data: any, fieldPath: string): any {
  return fieldPath.split('.').reduce((obj, key) => obj?.[key], data)
}

// Helper function to format field value
function formatFieldValue(value: any, field: DetailViewField): string {
  if (value === null || value === undefined) return ''

  // Handle arrays
  if (Array.isArray(value)) {
    if (field.renderAs === 'table') {
      // Return as HTML table
      let html = '<table class="print-table"><thead><tr><th style="width:50px">Sr</th>'
      if (value.length > 0) {
        Object.keys(value[0])
          .filter(key => key !== '_id' && key !== 'id')
          .forEach(key => {
            html += `<th>${key.replace(/([A-Z])/g, ' $1').trim()}</th>`
          })
      }
      html += '</tr></thead><tbody>'
      value.forEach((row, index) => {
        html += `<tr><td>${index + 1}</td>`
        Object.entries(row)
          .filter(([key]) => key !== '_id' && key !== 'id')
          .forEach(([_, val]) => {
            const cellValue = typeof val === 'object' && val !== null 
              ? (val.name || val.title || val.accessionNo || JSON.stringify(val))
              : String(val || '')
            html += `<td>${cellValue}</td>`
          })
        html += '</tr>'
      })
      html += '</tbody></table>'
      return html
    }
    if (field.renderAs === 'list') {
      return value.map(item => 
        `<span class="badge">${typeof item === 'object' ? item.name || item.title || String(item) : String(item)}</span>`
      ).join(' ')
    }
    return value.map(item => 
      typeof item === 'object' ? item.name || item.title || String(item) : String(item)
    ).join(', ')
  }

  // Handle objects
  if (typeof value === 'object') {
    if (value._id) {
      return value.name || value.title || value.accessionNo || `[Object ${value._id}]`
    }
    return value.name || value.title || '[Object]'
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

  // Handle checkboxes
  if (field.type === 'checkbox') {
    return value ? '✓ Yes' : '✗ No'
  }

  // Handle numbers
  if (field.type === 'number') {
    return Number(value).toLocaleString()
  }

  // Handle badges
  if (field.renderAs === 'badge') {
    return `<span class="badge">${String(value)}</span>`
  }

  return String(value)
}

function getLocalizedText(text: any, language: string): string {
  if (typeof text === 'string') return text
  if (typeof text === 'object' && text !== null) {
    return text[language] || text['en'] || ''
  }
  return ''
}

export async function GET(
  request: Request,
  context: { params: Promise<{ appId: string; module: string; id: string }> }
) {
  const params = await context.params
  const { appSchemaData } = await fetchLayoutData()
  
  if (!appSchemaData?.modules) {
    return NextResponse.json({ error: 'No modules found' }, { status: 404 })
  }

  // Find the module by slug
  const module = appSchemaData.modules.find(
    (mod: ModuleSchema) => mod.slug === params.module
  )

  if (!module || !module.detailViewSchema) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  // Fetch the item data
  let itemData = null
  try {
    itemData = await getModuleItem(params.module, params.id)
  } catch (error) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  if (!itemData) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const detailViewSchema = module.detailViewSchema
  const titleField = itemData.title || itemData.name || 'Untitled'
  const currentLanguage = 'en' // You can get this from headers if needed

  // Generate pure HTML
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${titleField} - ${getLocalizedText(module.name, currentLanguage)}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      background: white;
    }
    
    .print-container {
      width: 100%;
      max-width: 100%;
      padding: 0;
    }
    
    .print-section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 600;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }
    
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .fields-grid.single-column {
      grid-template-columns: 1fr;
    }
    
    .field-item {
      page-break-inside: avoid;
    }
    
    .field-item.full-width {
      grid-column: span 2;
    }
    
    .field-label {
      font-size: 10pt;
      font-weight: 600;
      color: #555;
      margin-bottom: 3px;
    }
    
    .field-value {
      font-size: 11pt;
      color: #000;
      white-space: pre-wrap;
    }
    
    .badge {
      display: inline-block;
      padding: 2px 8px;
      background: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-size: 10pt;
      margin-right: 5px;
    }
    
    .print-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 5px;
      page-break-inside: avoid;
    }
    
    .print-table th,
    .print-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      font-size: 10pt;
    }
    
    .print-table th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    
    .print-table tr:nth-child(even) {
      background-color: #fafafa;
    }
    
    .print-footer {
      margin-top: 40px;
      padding-top: 20px;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    }
    window.onafterprint = function() {
      window.close();
    }
  </script>
</head>
<body>
  <div class="print-container">`

  // Generate sections
  detailViewSchema.sections.forEach((section) => {
    // Check if section should be shown
    const alwaysShowSections = ['additionalInformation', 'systemInformation', 'additional', 'system']
    const shouldAlwaysShow = alwaysShowSections.some(name => 
      section.name.toLowerCase().includes(name.toLowerCase())
    )
    
    if (!shouldAlwaysShow) {
      const hasVisibleFields = section.fields.some(field => {
        const fieldValue = getFieldValue(itemData, field.fieldName)
        return field.visible && fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
      })
      
      if (!hasVisibleFields) return
    }
    
    // Skip non-printable sections
    if (section.printable === false) return
    
    const isSingleColumn = section.columns === 1 || section.layout === 'list'
    
    html += `
    <div class="print-section">
      <div class="section-title">${getLocalizedText(section.title, currentLanguage)}</div>`
    
    if (section.layout === 'table') {
      // Table layout for entire section
      html += '<table class="print-table"><thead><tr>'
      section.fields.filter(f => f.visible).forEach(field => {
        html += `<th>${getLocalizedText(field.label, currentLanguage)}</th>`
      })
      html += '</tr></thead><tbody><tr>'
      section.fields.filter(f => f.visible).forEach(field => {
        const fieldValue = getFieldValue(itemData, field.fieldName)
        const displayValue = formatFieldValue(fieldValue, field)
        html += `<td>${displayValue || '-'}</td>`
      })
      html += '</tr></tbody></table>'
    } else {
      // Grid layout
      html += `<div class="fields-grid ${isSingleColumn ? 'single-column' : ''}">`
      
      section.fields.forEach(field => {
        if (!field.visible) return
        
        const fieldValue = getFieldValue(itemData, field.fieldName)
        if (fieldValue === null || fieldValue === undefined || fieldValue === '') return
        
        const displayValue = formatFieldValue(fieldValue, field)
        if (!displayValue) return
        
        const isFullWidth = field.colspan === 2 || field.renderAs === 'table'
        
        html += `
        <div class="field-item ${isFullWidth ? 'full-width' : ''}">
          <div class="field-label">${getLocalizedText(field.label, currentLanguage)}</div>
          <div class="field-value">${displayValue}</div>
        </div>`
      })
      
      html += '</div>'
    }
    
    html += '</div>'
  })

  // Footer
  const footerContent = detailViewSchema.printConfig?.footerContent 
    ? getLocalizedText(detailViewSchema.printConfig.footerContent, currentLanguage)
    : `Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`
  
  html += `
    <div class="print-footer">
      ${footerContent}
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}