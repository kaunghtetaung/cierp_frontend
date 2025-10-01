'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { Button } from '@repo/ui'
import { IconComponent } from '@repo/ui'
import { getLocalizedText } from '@repo/utils'
import { FormFieldRenderer } from '../FormFieldRenderer'
import { BatchEnrollmentItem } from './BatchEnrollmentItem'
import { PreviousEducationItem } from './PreviousEducationItem'
import type { FormField } from '@repo/types'

export interface ArrayFieldItemProps {
  field: FormField
  fieldName: string
  index: number
  currentLanguage: string
  isReadonly?: boolean
  errors?: any
  onRemove: (index: number) => void
}

export function ArrayFieldItem({
  field,
  fieldName,
  index,
  currentLanguage,
  isReadonly = false,
  errors = {},
  onRemove
}: ArrayFieldItemProps) {

  // Get field label for the item title
  const fieldLabel = getLocalizedText(field.label, currentLanguage)

  // Check if this is a subjects array field - more specific detection
  const isSubjectsArray = (
    fieldName.includes('subjects') ||
    fieldLabel.toLowerCase().includes('subject') ||
    fieldName.endsWith('.subjects') ||
    field.children?.some(child =>
      child.fieldName === 'subject' ||
      child.fieldName === 'subjectId' ||
      child.fieldName === 'mark' ||
      child.fieldName === 'isDistinction'
    )
  )

  // Check if this is a batch enrollments array field
  const isBatchEnrollmentsArray = (
    fieldName.includes('batch') ||
    fieldName === 'batches' ||
    fieldLabel.toLowerCase().includes('batch') ||
    field.children?.some(child =>
      child.fieldName === 'academicYear' ||
      child.fieldName === 'batch' ||
      child.fieldName === 'batchId'
    )
  )

  // Check if this is a previous education array field
  const isPreviousEducationArray = (
    fieldName.includes('previousEducation') ||
    fieldName.includes('education') ||
    fieldLabel.toLowerCase().includes('education') ||
    field.children?.some(child =>
      child.fieldName === 'className' ||
      child.fieldName === 'examBoard'
    )
  )

  // Use specialized component for batch enrollments
  if (isBatchEnrollmentsArray) {
    return (
      <BatchEnrollmentItem
        field={field}
        fieldName={fieldName}
        index={index}
        currentLanguage={currentLanguage}
        isReadonly={isReadonly}
        errors={errors}
        onRemove={onRemove}
      />
    )
  }

  // Use specialized component for previous education records
  if (isPreviousEducationArray) {
    return (
      <PreviousEducationItem
        field={field}
        fieldName={fieldName}
        index={index}
        currentLanguage={currentLanguage}
        isReadonly={isReadonly}
        errors={errors}
        onRemove={onRemove}
      />
    )
  }

  // If this is a subjects array, use simplified layout
  if (isSubjectsArray) {
    return (
      <Card className="relative border-0 shadow-none px-0 py-2 gap-3">
        <CardContent className="py-2 px-0">
          {/* Single row compact layout: Subject (2 cols) + Mark (1 col) + Distinction & Delete (1 col) */}
          <div className="grid grid-cols-4 gap-3 items-start">
            {/* Subject field - column 1-2 */}
            <div className="col-span-2">
              {field.children?.filter(childField =>
                childField.fieldName === 'subject' ||
                childField.fieldName === 'subjectId' ||
                childField.fieldName.toLowerCase().includes('subject')
              ).map((childField) => (
                <div key={childField.fieldName} className="w-full [&>div]:!m-0 [&>div]:!space-y-0">
                  <FormFieldRenderer
                    field={{
                      ...childField,
                      fieldName: `${fieldName}.${index}.${childField.fieldName}`,
                      label: {
                        en: `Subject #${index + 1}`,
                        mm: `Subject #${index + 1}`
                      }
                    }}
                    currentLanguage={currentLanguage}
                    isVerticalLayout={false}
                    errors={errors[`${fieldName}.${index}`] || {}}
                  />
                </div>
              ))}
            </div>

            {/* Mark field - column 3 */}
            <div className="col-span-1">
              {field.children?.filter(childField => {
                const fieldName = childField.fieldName.toLowerCase();
                return (childField.fieldName === 'mark' ||
                        childField.fieldName === 'marks' ||
                        fieldName.includes('mark')) &&
                       childField.fieldName !== 'totalMarks' &&
                       !fieldName.includes('total');
              }).map((childField) => (
                <div key={childField.fieldName} className="w-full [&>div]:!m-0 [&>div]:!space-y-0">
                  <FormFieldRenderer
                    field={{
                      ...childField,
                      fieldName: `${fieldName}.${index}.${childField.fieldName}`
                    }}
                    currentLanguage={currentLanguage}
                    isVerticalLayout={false}
                    errors={errors[`${fieldName}.${index}`] || {}}
                  />
                </div>
              ))}
            </div>

            {/* Distinction field + Delete button - column 4 */}
            <div className="col-span-1 flex items-end gap-2 py-6">
              {/* Distinction field */}
              <div className="flex-1">
                {field.children?.filter(childField => {
                  const fieldNameLower = childField.fieldName.toLowerCase();
                  return fieldNameLower.includes('distinction') ||
                         fieldNameLower.includes('isdistinction') ||
                         childField.fieldName === 'distinction' ||
                         childField.fieldName === 'isDistinction';
                }).map((childField) => (
                  <div key={childField.fieldName} className="w-full [&>div]:!m-0 [&>div]:!space-y-0 [&_label]:!hidden [&_.sr-only]:!hidden">
                    <FormFieldRenderer
                      field={{
                        ...childField,
                        fieldName: `${fieldName}.${index}.${childField.fieldName}`,
                        label: { en: '', mm: '' }, // Empty label instead of null
                        options: childField.options?.map(option => ({
                          ...option,
                          label: { en: 'Distinction', mm: 'Distinction' }
                        })) || [{ value: true, label: { en: 'Distinction', mm: 'Distinction' } }]
                      }}
                      currentLanguage={currentLanguage}
                      isVerticalLayout={false}
                      errors={errors[`${fieldName}.${index}`] || {}}
                    />
                  </div>
                ))}
              </div>

              {/* Delete button */}
              <div className="flex-shrink-0">
                {!isReadonly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                  >
                    <IconComponent name="Trash2" className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Any other remaining fields in subjects (if any) */}
          {field.children?.filter(childField => {
            const fieldNameLower = childField.fieldName.toLowerCase();
            return !fieldNameLower.includes('subject') &&
                   !fieldNameLower.includes('mark') &&
                   !fieldNameLower.includes('total') &&
                   !fieldNameLower.includes('distinction');
          }).length > 0 && (
            <div className="mt-3 space-y-2">
              {field.children?.filter(childField => {
                const fieldNameLower = childField.fieldName.toLowerCase();
                return !fieldNameLower.includes('subject') &&
                       !fieldNameLower.includes('mark') &&
                       !fieldNameLower.includes('total') &&
                       !fieldNameLower.includes('distinction');
              }).map((childField) => (
                <div key={childField.fieldName} className="space-y-2">
                  <FormFieldRenderer
                    field={{
                      ...childField,
                      fieldName: `${fieldName}.${index}.${childField.fieldName}`
                    }}
                    currentLanguage={currentLanguage}
                    isVerticalLayout={false}
                    errors={errors[`${fieldName}.${index}`] || {}}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Default fallback layout for any other array types
  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {fieldLabel.replace(/s$/, '')} #{index + 1}
          </CardTitle>

          {/* Remove item button */}
          {!isReadonly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <IconComponent name="Trash2" className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {field.children?.map((childField) => (
            <div key={childField.fieldName} className="space-y-2">
              <FormFieldRenderer
                field={{
                  ...childField,
                  fieldName: `${fieldName}.${index}.${childField.fieldName}`
                }}
                currentLanguage={currentLanguage}
                isVerticalLayout={false}
                errors={errors[`${fieldName}.${index}`] || {}}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}