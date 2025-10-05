'use client'

import React from 'react'
import { Card, CardContent } from '@repo/ui'
import { Button } from '@repo/ui'
import { IconComponent } from '@repo/ui'
import { getLocalizedText } from '@repo/utils'
import { FormFieldRenderer } from '../FormFieldRenderer'
import type { FormField } from '@repo/types'

export interface BatchEnrollmentItemProps {
  field: FormField
  fieldName: string
  index: number
  currentLanguage: string
  isReadonly?: boolean
  errors?: any
  onRemove: (index: number) => void
}

export function BatchEnrollmentItem({
  field,
  fieldName,
  index,
  currentLanguage,
  isReadonly = false,
  errors = {},
  onRemove
}: BatchEnrollmentItemProps) {

  // Get field label for the item title
  const fieldLabel = getLocalizedText(field.label, currentLanguage)

  return (
    <Card className="relative border-0 shadow-none px-0 py-2 gap-3">
      <CardContent className="py-2 px-0">
        {/* Single row compact layout: Academic Year + Batch + Roll Number + Delete (3 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
          {/* Academic Year field - 1 column */}
          <div className="lg:col-span-1">
            {field.children?.filter(childField =>
              childField.fieldName === 'academicYear' ||
              childField.fieldName === 'academicYearId' ||
              childField.fieldName.toLowerCase().includes('academicyear')
            ).map((childField) => (
              <div key={childField.fieldName} className="w-full [&>div]:!m-0 [&>div]:!space-y-0">
                <FormFieldRenderer
                  field={{
                    ...childField,
                    fieldName: `${fieldName}.${index}.${childField.fieldName}`,
                    label: {
                      en: index === 0 ? getLocalizedText(childField.label, 'en') : '',
                      mm: index === 0 ? getLocalizedText(childField.label, 'mm') : ''
                    }
                  }}
                  currentLanguage={currentLanguage}
                  isVerticalLayout={false}
                  errors={errors[`${fieldName}.${index}`] || {}}
                />
              </div>
            ))}
          </div>

          {/* Batch field - 1 column */}
          <div className="lg:col-span-1">
            {field.children?.filter(childField =>
              childField.fieldName === 'batch' ||
              childField.fieldName === 'batchId' ||
              (childField.fieldName.toLowerCase().includes('batch') &&
               !childField.fieldName.toLowerCase().includes('year'))
            ).map((childField) => {
              // Fix dependent field path for array context
              // If this field depends on another field (e.g., batchId depends on academicYearId),
              // we need to update the dependsOn path to include the array index
              const updatedField = { ...childField };
              if (updatedField.dropdownConfig?.dependsOn) {
                const originalDependsOn = updatedField.dropdownConfig.dependsOn;
                updatedField.dropdownConfig = {
                  ...updatedField.dropdownConfig,
                  dependsOn: updatedField.dropdownConfig.dependsOn.map((depField: string) =>
                    `${fieldName}.${index}.${depField}`
                  )
                };
                console.log('🔍 BatchEnrollmentItem - Fixed dependsOn path:', {
                  fieldName: childField.fieldName,
                  arrayPath: `${fieldName}.${index}`,
                  originalDependsOn,
                  updatedDependsOn: updatedField.dropdownConfig.dependsOn
                });
              }
              // Also update dataSource.dependentField if it exists
              if (updatedField.dataSource?.dependentField) {
                const originalDepField = updatedField.dataSource.dependentField;
                updatedField.dataSource = {
                  ...updatedField.dataSource,
                  dependentField: `${fieldName}.${index}.${updatedField.dataSource.dependentField}`
                };
                console.log('🔍 BatchEnrollmentItem - Fixed dataSource.dependentField:', {
                  fieldName: childField.fieldName,
                  arrayPath: `${fieldName}.${index}`,
                  originalDepField,
                  updatedDepField: updatedField.dataSource.dependentField
                });
              }

              return (
                <div key={childField.fieldName} className="w-full [&>div]:!m-0 [&>div]:!space-y-0">
                  <FormFieldRenderer
                    field={{
                      ...updatedField,
                      fieldName: `${fieldName}.${index}.${childField.fieldName}`,
                      label: {
                        en: index === 0 ? getLocalizedText(childField.label, 'en') : '',
                        mm: index === 0 ? getLocalizedText(childField.label, 'mm') : ''
                      }
                    }}
                    currentLanguage={currentLanguage}
                    isVerticalLayout={false}
                    errors={errors[`${fieldName}.${index}`] || {}}
                  />
                </div>
              );
            })}
          </div>

          {/* Roll Number + Delete button - 1 column */}
          <div className="lg:col-span-1">
            <div className="flex items-end gap-2">
              {/* Roll Number field */}
              <div className="flex-1">
                {field.children?.filter(childField =>
                  childField.fieldName === 'rollNumber' ||
                  childField.fieldName === 'rollNo' ||
                  childField.fieldName.toLowerCase().includes('roll')
                ).map((childField) => (
                  <div key={childField.fieldName} className="w-full [&>div]:!m-0 [&>div]:!space-y-0">
                    <FormFieldRenderer
                      field={{
                        ...childField,
                        fieldName: `${fieldName}.${index}.${childField.fieldName}`,
                        label: {
                          en: index === 0 ? getLocalizedText(childField.label, 'en') : '',
                          mm: index === 0 ? getLocalizedText(childField.label, 'mm') : ''
                        }
                      }}
                      currentLanguage={currentLanguage}
                      isVerticalLayout={false}
                      errors={errors[`${fieldName}.${index}`] || {}}
                    />
                  </div>
                ))}
              </div>

              {/* Delete button - align with input field */}
              <div className="flex-shrink-0">
                {!isReadonly && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onRemove(index)}
                    className="h-10"
                  >
                    <IconComponent name="Trash2" className="w-4 h-4 mr-2" />
                    {currentLanguage === 'mm' ? 'ဖျက်' : 'Delete'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Any other remaining fields in batches (if any) - full width below */}
        {field.children?.filter(childField => {
          const fieldNameLower = childField.fieldName.toLowerCase();
          return !fieldNameLower.includes('academicyear') &&
                 !fieldNameLower.includes('batch') &&
                 !fieldNameLower.includes('roll');
        }).length > 0 && (
          <div className="mt-3 space-y-2">
            {field.children?.filter(childField => {
              const fieldNameLower = childField.fieldName.toLowerCase();
              return !fieldNameLower.includes('academicyear') &&
                     !fieldNameLower.includes('batch') &&
                     !fieldNameLower.includes('roll');
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
