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
        {/* Responsive layout: 12 column grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Subject field - 6 columns */}
          <div className="md:col-span-6">
            {field.children?.filter(childField =>
              childField.fieldName === 'subject' ||
              childField.fieldName === 'subjectId' ||
              childField.fieldName.toLowerCase().includes('subject')
            ).map((childField) => (
              <div key={childField.fieldName} className="w-full">
                <FormFieldRenderer
                  field={{
                    ...childField,
                    fieldName: `${fieldName}.${index}.${childField.fieldName}`,
                    label: {
                      en: `Subject #${index + 1}`,
                      mm: `ဘာသာရပ် #${index + 1}`
                    }
                  }}
                  currentLanguage={currentLanguage}
                  isVerticalLayout={false}
                  errors={errors[`${fieldName}.${index}`] || {}}
                />
              </div>
            ))}
          </div>

          {/* Mark, Distinction, Delete - 6 columns */}
          <div className="md:col-span-6 grid grid-cols-12 gap-2 items-end">
            {/* Mark input - 5 columns */}
            <div className="col-span-5">
              {field.children?.filter(childField => {
                const fieldNameLower = childField.fieldName.toLowerCase();
                return (childField.fieldName === 'mark' ||
                        childField.fieldName === 'marks' ||
                        fieldNameLower.includes('mark')) &&
                       childField.fieldName !== 'totalMarks' &&
                       !fieldNameLower.includes('total');
              }).map((childField) => (
                <div key={childField.fieldName} className="w-full">
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

            {/* Distinction toggle switch - 4 columns */}
            <div className="col-span-4 flex items-center justify-center pb-2">
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
                        className="h-4 w-8 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input [&>*]:h-3 [&>*]:w-3 [&>*]:data-[state=checked]:translate-x-4"
                      />
                      <Label
                        htmlFor={`${fieldName}.${index}.${childField.fieldName}`}
                        className="text-xs font-normal cursor-pointer whitespace-nowrap"
                        title={currentLanguage === 'mm' ? 'ထူးခြားချက်' : 'Distinction'}
                      >
                        {currentLanguage === 'mm' ? 'ထူးခြားချက်' : 'Distinction'}
                      </Label>
                    </div>
                  )}
                />
              ))}
            </div>

            {/* Delete button - 3 columns */}
            <div className="col-span-3 flex justify-end pb-2">
              {!isReadonly && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemove(index)}
                >
                  <IconComponent name="Trash2" className="w-4 h-4 mr-1" />
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
