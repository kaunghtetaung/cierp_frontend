'use client'

import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Card, CardContent } from '@repo/ui'
import { Button } from '@repo/ui'
import { Switch } from '@repo/ui'
import { Label } from '@repo/ui'
import { IconComponent } from '@repo/ui'
import { FormFieldRenderer } from '../FormFieldRenderer'
import type { FormField } from '@repo/types'

export interface SubjectsArrayItemProps {
  field: FormField
  fieldName: string
  index: number
  currentLanguage: string
  isReadonly?: boolean
  errors?: any
  onRemove: (index: number) => void
}

export function SubjectsArrayItem({
  field,
  fieldName,
  index,
  currentLanguage,
  isReadonly = false,
  errors = {},
  onRemove
}: SubjectsArrayItemProps) {
  const { control } = useFormContext()

  return (
    <Card className="relative border-0 shadow-none px-0 py-2 gap-3">
      <CardContent className="py-2 px-0">
        {/* Single row compact layout: Subject (2 cols) + Mark + Distinction + Delete (2 cols) */}
        <div className="grid grid-cols-4 gap-3 items-start">
          {/* Subject field - column 1-2 */}
          <div className="col-span-2 flex items-end">
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

          {/* Mark field + Distinction switch + Delete button - column 3-4 */}
          <div className="col-span-2 flex items-end gap-2">
            {/* Mark input */}
            <div className="flex-1">
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

            {/* Distinction toggle switch */}
            <div className="flex items-center space-x-2 pb-2">
              {field.children?.filter(childField => {
                const fieldNameLower = childField.fieldName.toLowerCase();
                return fieldNameLower.includes('distinction') ||
                       fieldNameLower.includes('isdistinction') ||
                       childField.fieldName === 'distinction' ||
                       childField.fieldName === 'isDistinction';
              }).map((childField) => (
                <Controller
                  key={childField.fieldName}
                  control={control}
                  name={`${fieldName}.${index}.${childField.fieldName}`}
                  render={({ field: { onChange, value } }) => (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${fieldName}.${index}.${childField.fieldName}`}
                        checked={!!value}
                        onCheckedChange={onChange}
                        disabled={isReadonly}
                      />
                      <Label
                        htmlFor={`${fieldName}.${index}.${childField.fieldName}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {currentLanguage === 'mm' ? 'ထူးခြားချက်' : 'Distinction'}
                      </Label>
                    </div>
                  )}
                />
              ))}
            </div>

            {/* Delete button */}
            <div className="flex-shrink-0 pb-2">
              {!isReadonly && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemove(index)}
                >
                  <IconComponent name="Trash2" className="w-4 h-4 mr-2" />
                  {currentLanguage === 'mm' ? 'ဖျက်' : 'Delete'}
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
