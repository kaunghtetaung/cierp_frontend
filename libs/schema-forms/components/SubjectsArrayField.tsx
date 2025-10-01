'use client'

import React from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button } from '@repo/ui'
import { IconComponent } from '@repo/ui'
import { getLocalizedText } from '@repo/utils'
import { SubjectsArrayItem } from './SubjectsArrayItem'
import type { FormField } from '@repo/types'

export interface SubjectsArrayFieldProps {
  field: FormField
  fieldName: string
  currentLanguage: string
  isReadonly?: boolean
  errors?: any
}

export function SubjectsArrayField({
  field,
  fieldName,
  currentLanguage,
  isReadonly = false,
  errors = {}
}: SubjectsArrayFieldProps) {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName
  })

  // Create default object for new items based on field children
  const createDefaultItem = () => {
    const defaultItem: Record<string, any> = {}
    field.children?.forEach(child => {
      if (child.defaultValue !== undefined) {
        defaultItem[child.fieldName] = child.defaultValue
      } else {
        // Set appropriate default values based on field type
        switch (child.fieldType) {
          case 'arrayField':
            defaultItem[child.fieldName] = []
            break
          case 'multiSelect':
            defaultItem[child.fieldName] = []
            break
          case 'checkbox':
          case 'boolean':
            defaultItem[child.fieldName] = false
            break
          case 'number':
            defaultItem[child.fieldName] = ''
            break
          default:
            defaultItem[child.fieldName] = ''
        }
      }
    })
    return defaultItem
  }

  const handleAddItem = () => {
    if (!isReadonly) {
      append(createDefaultItem())
    }
  }

  const handleRemoveItem = (index: number) => {
    if (!isReadonly) {
      remove(index)
    }
  }

  // Get field label
  const fieldLabel = getLocalizedText(field.label, currentLanguage)

  return (
    <div className="space-y-4">
      {/* Subjects array header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">
            {fieldLabel}
            {field.validationRule?.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </h3>
          {field.helperText && (
            <p className="text-sm text-muted-foreground mt-1">
              {getLocalizedText(field.helperText, currentLanguage)}
            </p>
          )}
        </div>

        {/* Add item button */}
        {!isReadonly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="flex items-center gap-2"
          >
            <IconComponent name="Plus" className="w-4 h-4" />
            Add {fieldLabel.replace(/s$/, '')}
          </Button>
        )}
      </div>

      {/* Subjects items */}
      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <IconComponent name="FileText" className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No {fieldLabel.toLowerCase()} added yet</p>
            {!isReadonly && (
              <p className="text-sm mt-1">Click "Add {fieldLabel.replace(/s$/, '')}" to get started</p>
            )}
          </div>
        ) : (
          fields.map((item, index) => (
            <SubjectsArrayItem
              key={item.id}
              field={field}
              fieldName={fieldName}
              index={index}
              currentLanguage={currentLanguage}
              isReadonly={isReadonly}
              errors={errors}
              onRemove={handleRemoveItem}
            />
          ))
        )}
      </div>

      {/* Item count footer */}
      {fields.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {fields.length} {fields.length === 1 ? 'subject' : 'subjects'}
        </div>
      )}
    </div>
  )
}
