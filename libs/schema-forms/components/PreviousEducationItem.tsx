'use client'

import React from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { Button } from '@repo/ui'
import { IconComponent } from '@repo/ui'
import { getLocalizedText } from '@repo/utils'
import { FormFieldRenderer } from '../FormFieldRenderer'
import { SubjectsArrayField } from './SubjectsArrayField'
import type { FormField } from '@repo/types'

export interface PreviousEducationItemProps {
  field: FormField
  fieldName: string
  index: number
  currentLanguage: string
  isReadonly?: boolean
  errors?: any
  onRemove: (index: number) => void
}

export function PreviousEducationItem({
  field,
  fieldName,
  index,
  currentLanguage,
  isReadonly = false,
  errors = {},
  onRemove
}: PreviousEducationItemProps) {

  // Get field label for the item title
  const fieldLabel = getLocalizedText(field.label, currentLanguage)

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {fieldLabel.replace(/s$/, '')} #{index + 1}
          </CardTitle>

          {/* Remove item button - Standard destructive button with icon and text */}
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
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Large screen: 5 columns (Class Name, Exam Board, Total Marks, Year, Roll Number) */}
          {/* MD screen: Row 1 (Class Name, Exam Board) + Row 2 (Total Marks, Year, Roll Number) */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Class Name - full width on mobile, 1 col on md (spans 1), 1 col on lg */}
            {field.children?.filter(childField => {
              const fieldNameLower = childField.fieldName.toLowerCase();
              return childField.fieldName === 'className' || fieldNameLower.includes('classname');
            }).map((childField) => (
              <div key={childField.fieldName} className="md:col-span-1 lg:col-span-1 space-y-2">
                <FormFieldRenderer
                  field={{
                    ...childField,
                    fieldName: `${fieldName}.${index}.${childField.fieldName}`
                  }}
                  currentLanguage={currentLanguage}
                  isVerticalLayout={false}
                  errors={errors}
                />
              </div>
            ))}

            {/* Exam Board - full width on mobile, 1 col on md (spans 1), 1 col on lg */}
            {field.children?.filter(childField => {
              const fieldNameLower = childField.fieldName.toLowerCase();
              return childField.fieldName === 'examBoard' || fieldNameLower.includes('examboard');
            }).map((childField) => (
              <div key={childField.fieldName} className="md:col-span-1 lg:col-span-1 space-y-2">
                <FormFieldRenderer
                  field={{
                    ...childField,
                    fieldName: `${fieldName}.${index}.${childField.fieldName}`
                  }}
                  currentLanguage={currentLanguage}
                  isVerticalLayout={false}
                  errors={errors}
                />
              </div>
            ))}

            {/* Total Marks - full width on mobile, break to second row on md, 1 col on lg */}
            {field.children?.filter(childField => {
              const fieldNameLower = childField.fieldName.toLowerCase();
              return childField.fieldName === 'totalMarks' || fieldNameLower.includes('totalmarks');
            }).map((childField) => (
              <div key={childField.fieldName} className="md:col-span-1 lg:col-span-1 space-y-2">
                <FormFieldRenderer
                  field={{
                    ...childField,
                    fieldName: `${fieldName}.${index}.${childField.fieldName}`
                  }}
                  currentLanguage={currentLanguage}
                  isVerticalLayout={false}
                  errors={errors}
                />
              </div>
            ))}

            {/* Year - full width on mobile, second row on md, 1 col on lg */}
            {field.children?.filter(childField => {
              return childField.fieldName === 'year';
            }).map((childField) => (
              <div key={childField.fieldName} className="md:col-span-1 lg:col-span-1 space-y-2">
                <FormFieldRenderer
                  field={{
                    ...childField,
                    fieldName: `${fieldName}.${index}.${childField.fieldName}`
                  }}
                  currentLanguage={currentLanguage}
                  isVerticalLayout={false}
                  errors={errors}
                />
              </div>
            ))}

            {/* Roll Number - full width on mobile, second row on md, 1 col on lg */}
            {field.children?.filter(childField => {
              return childField.fieldName === 'rollNumber';
            }).map((childField) => (
              <div key={childField.fieldName} className="md:col-span-1 lg:col-span-1 space-y-2">
                <FormFieldRenderer
                  field={{
                    ...childField,
                    fieldName: `${fieldName}.${index}.${childField.fieldName}`
                  }}
                  currentLanguage={currentLanguage}
                  isVerticalLayout={false}
                  errors={errors}
                />
              </div>
            ))}
          </div>

          {/* Row 3: Subjects Array (full width) */}
          {field.children?.filter(childField =>
            childField.fieldType === 'arrayField' &&
            (childField.fieldName === 'subjects' ||
             childField.fieldName.toLowerCase().includes('subject'))
          ).map((subjectArrayField) => (
            <SubjectsArrayField
              key={subjectArrayField.fieldName}
              field={subjectArrayField}
              fieldName={`${fieldName}.${index}.${subjectArrayField.fieldName}`}
              currentLanguage={currentLanguage}
              isReadonly={isReadonly}
              errors={errors}
            />
          ))}

          {/* Row 4: Other remaining fields (like distinction, etc.) - excluding the ones already rendered */}
          {field.children?.filter(childField => {
            const fieldNameLower = childField.fieldName.toLowerCase();
            // Exclude fields already rendered in rows 1-3
            return !fieldNameLower.includes('classname') &&
                   !fieldNameLower.includes('rollnumber') &&
                   !fieldNameLower.includes('examboard') &&
                   !fieldNameLower.includes('totalmarks') &&
                   fieldNameLower !== 'year' &&
                   !fieldNameLower.includes('subject');
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
      </CardContent>
    </Card>
  )
}
