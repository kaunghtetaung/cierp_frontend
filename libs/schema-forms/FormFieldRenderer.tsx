'use client'

import React, { useRef, useEffect } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@repo/ui'
import { Input } from '@repo/ui'
import { Textarea } from '@repo/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui'
import { Checkbox } from '@repo/ui'
import { RadioGroup, RadioGroupItem } from '@repo/ui'
import { Label } from '@repo/ui'
import { DynamicSelect } from './DynamicSelect'
import { DependentSelect } from './DependentSelect'
import { PasswordField } from './PasswordField'
import { MultiLanguageInput } from './MultiLanguageInput'
import { PhoneInput } from './PhoneInput'
import { IconComponent, IconSelector } from '@repo/ui'
import type { FormField as SchemaFormField } from '@repo/types'

// Auto-configure dropdownConfig for common organizational fields
function autoConfigureDropdown(field: SchemaFormField): SchemaFormField {
  // Skip if already has dropdownConfig
  if (field.dropdownConfig) {
    return field;
  }

  // Auto-configure organization fields
  if (field.fieldName === 'organizationId' || 
      field.fieldName === 'organization' ||
      field.fieldName.toLowerCase().includes('organization')) {
    return {
      ...field,
      dropdownConfig: {
        type: "dynamic",
        refPath: "/organizations/ref",
        searchable: true,
        clearable: false,
        preloadData: true
      }
    };
  }

  // Auto-configure department fields (dependent on organization)
  if (field.fieldName === 'departmentId' || 
      field.fieldName === 'department' ||
      field.fieldName.toLowerCase().includes('department')) {
    return {
      ...field,
      dropdownConfig: {
        type: "dynamic",
        refPath: "/departments/ref",
        dependsOn: ["organizationId", "organization"],
        searchable: true,
        clearable: true,
        preloadData: false
      }
    };
  }

  // Auto-configure user fields
  if (field.fieldName === 'userId' || 
      field.fieldName === 'user' ||
      field.fieldName === 'assignedTo' ||
      field.fieldName.toLowerCase().includes('user')) {
    return {
      ...field,
      dropdownConfig: {
        type: "dynamic",
        refPath: "/users/ref",
        searchable: true,
        clearable: true,
        preloadData: false
      }
    };
  }

  // Return original field if no auto-configuration applies
  return field;
}

// Convert dataSource configuration to dropdownConfig for backward compatibility
function convertDataSourceToDropdownConfig(field: SchemaFormField): SchemaFormField {
  // Skip if already has dropdownConfig
  if (field.dropdownConfig) {
    return field;
  }

  // Handle fields with dataSource configuration
  if (field.dataSource) {
    const dropdownConfig: any = {
      type: "dynamic",
      refPath: field.dataSource.endpoint,
      searchable: true,
      clearable: true,
      preloadData: field.fieldType === "dynamicSelect" ? true : false
    };

    // Handle dependent fields
    if (field.fieldType === "dependentSelect" && field.dataSource.dependentField) {
      dropdownConfig.dependsOn = [field.dataSource.dependentField];
    }

    return {
      ...field,
      fieldType: field.fieldType === "multiDependentSelect" ? "multiSelect" : "select",
      dropdownConfig
    };
  }

  return field;
}

export interface FormFieldRendererProps {
  field: SchemaFormField
  currentLanguage?: string
  isVerticalLayout?: boolean
  errors?: any
  watch?: any
  onValueChange?: (value: any) => void
}

export function FormFieldRenderer({ 
  field: originalField, 
  currentLanguage = 'en',
  isVerticalLayout = false,
  errors = {},
  watch: watchProp,
  onValueChange
}: FormFieldRendererProps) {
  const formContext = useFormContext()
  const control = formContext?.control
  const watch = formContext?.watch
  const watchFunction = watchProp || watch
  
  // If no form context, return error message
  if (!control) {
    console.error('FormFieldRenderer: No form context found. Make sure this component is wrapped in a FormProvider.')
    return (
      <div className="text-destructive text-sm">
        Error: FormFieldRenderer must be used within a Form component
      </div>
    )
  }
  
  // Apply auto-configuration and backward compatibility
  let field = convertDataSourceToDropdownConfig(originalField);
  if (!originalField.dataSource) {
    field = autoConfigureDropdown(field);
  }
  
  // Early validation - ensure field has required properties
  if (!field || !field.fieldName) {
    console.error('FormFieldRenderer: Invalid field configuration', field)
    return null
  }
  
  // Get current label for the field
  const getFieldLabel = (field: SchemaFormField) => {
    if (typeof field.label === 'string') return field.label
    return field.label[currentLanguage as keyof typeof field.label] || field.label.en
  }
  
  // Get validation error message
  const getErrorMessage = (field: SchemaFormField) => {
    if (!field.validationRule?.errorMessage) return undefined
    if (typeof field.validationRule.errorMessage === 'string') return field.validationRule.errorMessage
    return field.validationRule.errorMessage[currentLanguage as keyof typeof field.validationRule.errorMessage] || field.validationRule.errorMessage.en
  }
  
  // Don't render hidden fields
  if (field.hidden) {
    return null
  }
  
  // Handle multi-language fields
  if (field.isMultiLang && (field.fieldType === "text" || field.fieldType === "textArea")) {
    const containerClasses = isVerticalLayout
      ? "flex items-start gap-2 sm:gap-4"
      : "space-y-2";
    const labelContainerClasses = isVerticalLayout
      ? "flex-shrink-0 w-24 sm:w-32 md:w-48 pt-2"
      : "";
    const inputContainerClasses = isVerticalLayout
      ? "flex-1 min-w-0 space-y-1"
      : "";

    return (
      <div className={containerClasses}>
        {isVerticalLayout ? (
          <div className={labelContainerClasses}>
            <label className="block text-xs sm:text-sm font-medium">
              {getFieldLabel(field)}{" "}
              {field.validationRule?.required && (
                <span className="text-red-500">*</span>
              )}
            </label>
          </div>
        ) : (
          <label className="block text-sm font-medium">
            {getFieldLabel(field)}{" "}
            {field.validationRule?.required && (
              <span className="text-red-500">*</span>
            )}
          </label>
        )}
        <div className={inputContainerClasses}>
          <Controller
            name={field.fieldName}
            control={control}
            render={({ field: { onChange, value } }) => (
              <MultiLanguageInput
                field={field}
                defaultValue={value}
                currentLanguage={currentLanguage}
                isVerticalLayout={isVerticalLayout}
                onValueChange={(newValue) => {
                  onChange(newValue);
                  onValueChange?.(newValue);
                }}
                errors={errors}
              />
            )}
          />
        </div>
      </div>
    );
  }


  const label = getFieldLabel(field)
  const isRequired = field.validationRule?.required ?? false
  const isReadonly = field.readonly ?? false
  
  // Additional validation before rendering
  if (!field.fieldName || typeof field.fieldName !== 'string') {
    console.error('FormFieldRenderer: fieldName must be a non-empty string', { field, fieldName: field.fieldName })
    return (
      <div className="text-red-500 text-sm p-2 border border-red-300 rounded">
        Error: Invalid field name configuration
      </div>
    )
  }

  // Container classes for layout support
  const containerClasses = isVerticalLayout
    ? "flex items-start gap-2 sm:gap-4"
    : "space-y-2";

  return (
    <div className={containerClasses}>
      <FormField
        control={control}
        name={field.fieldName}
        render={({ field: formField, fieldState }) => (
          <FormItem className={isVerticalLayout ? "flex-1 min-w-0" : ""}>
            <FormLabel className={`${isRequired ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''} ${
              isVerticalLayout ? "text-xs sm:text-sm" : "text-sm"
            }`}>
              {label}
            </FormLabel>
            <FormControl>
              <FormFieldInput 
                field={field}
                formField={formField}
                isReadonly={isReadonly}
                currentLanguage={currentLanguage}
                errors={errors}
                watchFunction={watchFunction}
                onValueChange={onValueChange}
              />
            </FormControl>
            {fieldState.error && (
              <FormMessage className="flex items-center gap-1">
                <IconComponent name="AlertCircle" className="w-3 h-3" />
                {fieldState.error.message || getErrorMessage(field)}
              </FormMessage>
            )}
            {errors[field.fieldName] && !fieldState.error && (
              <p className="text-xs text-destructive mt-1 flex items-center">
                <IconComponent name="AlertCircle" className="w-3 h-3 mr-1" />
                {errors[field.fieldName]?.message}
              </p>
            )}
          </FormItem>
        )}
      />
    </div>
  )
}

interface FormFieldInputProps {
  field: SchemaFormField
  formField: any
  isReadonly: boolean
  currentLanguage: string
  errors?: any
  watchFunction?: any
  onValueChange?: (value: any) => void
}

function FormFieldInput({ 
  field, 
  formField, 
  isReadonly, 
  currentLanguage,
  errors = {},
  watchFunction,
  onValueChange
}: FormFieldInputProps) {
  const { control, watch } = useFormContext()
  const watchFunc = watchFunction || watch
  
  switch (field.fieldType) {
    case 'phone':
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: { onChange, value, name } }) => (
            <PhoneInput
              value={value || ''}
              onChange={onChange}
              disabled={isReadonly}
              config={field.phoneConfig}
              error={!!errors[field.fieldName]}
              currentLanguage={currentLanguage}
              placeholder={field.placeHolder}
            />
          )}
        />
      )
    
    case 'text':
    case 'email':
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: { onChange, value, name } }) => {
            const inputRef = useRef<HTMLInputElement>(null);
            const hasError = errors[field.fieldName];
            
            // Auto-focus on validation error
            useEffect(() => {
              if (hasError && inputRef.current) {
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 100);
              }
            }, [hasError]);

            return (
              <Input
                ref={inputRef}
                type={field.fieldType}
                name={name}
                value={value || ''}
                onChange={(e) => {
                  onChange(e);
                  onValueChange?.(e.target.value);
                }}
                placeholder={field.placeHolder}
                readOnly={isReadonly}
                className={`${isReadonly ? 'bg-muted' : ''} ${hasError ? 'border-destructive focus:ring-destructive bg-destructive/5' : ''}`}
              />
            );
          }}
        />
      )
    
    case 'number':
      return (
        <Input
          {...formField}
          type="number"
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          className={`${isReadonly ? 'bg-muted' : ''} ${errors[field.fieldName] ? 'border-destructive focus:ring-destructive bg-destructive/5' : ''}`}
          onChange={(e) => {
            const numValue = e.target.valueAsNumber || '';
            formField.onChange(numValue);
            onValueChange?.(numValue);
          }}
        />
      )
    
    case 'password':
      // Use enhanced PasswordField if strength indicator is enabled
      if (field.validationRule?.showStrengthIndicator) {
        return (
          <PasswordField
            value={formField.value || ''}
            onChange={(value) => {
              formField.onChange(value);
              onValueChange?.(value);
            }}
            placeholder={field.placeHolder}
            className={`${isReadonly ? 'bg-muted' : ''} ${errors[field.fieldName] ? 'border-destructive focus:ring-destructive bg-destructive/5' : ''}`}
            readOnly={isReadonly}
            strengthConfig={field.validationRule.strengthMeterConfig}
            currentLanguage={currentLanguage}
            showStrengthIndicator={true}
          />
        )
      }
      
      // Fallback to basic password input
      return (
        <Input
          {...formField}
          type="password"
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          className={`${isReadonly ? 'bg-muted' : ''} ${errors[field.fieldName] ? 'border-destructive focus:ring-destructive bg-destructive/5' : ''}`}
          onChange={(e) => {
            formField.onChange(e);
            onValueChange?.(e.target.value);
          }}
        />
      )
    
    case 'textArea':
      return (
        <Textarea
          {...formField}
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          rows={field.rows || 3}
          className={`${isReadonly ? 'bg-muted' : ''} ${errors[field.fieldName] ? 'border-destructive focus:ring-destructive bg-destructive/5' : ''}`}
          onChange={(e) => {
            formField.onChange(e);
            onValueChange?.(e.target.value);
          }}
        />
      )
    
    case 'select':
    case 'dynamicSelect':
    case 'dependentSelect':
      // Use DynamicSelect for advanced dropdown functionality if dropdownConfig exists
      if (field.dropdownConfig) {
        return (
          <DynamicSelect
            field={field}
            value={formField.value}
            onChange={(newValue) => {
              formField.onChange(newValue);
              onValueChange?.(newValue);
            }}
            currentLanguage={currentLanguage}
            watch={watchFunc}
            errors={errors}
          />
        );
      }

      // Fallback to regular select
      return (
        <Select 
          value={formField.value || ''}
          onValueChange={(value) => {
            formField.onChange(value);
            onValueChange?.(value);
          }}
          disabled={isReadonly}
        >
          <SelectTrigger className={`${isReadonly ? 'bg-muted' : ''} ${errors[field.fieldName] ? 'border-destructive' : ''}`}>
            <SelectValue placeholder={field.placeHolder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={String(option.value)} value={String(option.value)}>
                {typeof option.label === 'string' 
                  ? option.label 
                  : option.label[currentLanguage as keyof typeof option.label] || option.label.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    
    case 'multiSelect':
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: controllerField }) => (
            <div className={`space-y-2 ${errors[field.fieldName] ? 'border border-destructive/20 bg-destructive/5 rounded p-2' : ''}`}>
              {field.options?.map((option) => (
                <div key={String(option.value)} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.fieldName}-${String(option.value)}`}
                    checked={Array.isArray(controllerField.value) && controllerField.value.includes(String(option.value))}
                    onCheckedChange={(checked) => {
                      const currentValue = Array.isArray(controllerField.value) ? controllerField.value : []
                      const newValue = checked
                        ? [...currentValue, String(option.value)]
                        : currentValue.filter((v: string) => v !== String(option.value))
                      controllerField.onChange(newValue);
                      onValueChange?.(newValue);
                    }}
                    disabled={isReadonly}
                  />
                  <Label htmlFor={`${field.fieldName}-${String(option.value)}`}>
                    {typeof option.label === 'string' 
                      ? option.label 
                      : option.label[currentLanguage as keyof typeof option.label] || option.label.en}
                  </Label>
                </div>
              ))}
            </div>
          )}
        />
      )
    
    case 'radio':
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: controllerField }) => (
            <RadioGroup
              value={controllerField.value}
              onValueChange={(value) => {
                controllerField.onChange(value);
                onValueChange?.(value);
              }}
              disabled={isReadonly}
              className={errors[field.fieldName] ? 'border border-destructive/20 bg-destructive/5 rounded p-2' : ''}
            >
              {field.options?.map((option) => (
                <div key={String(option.value)} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={String(option.value)} 
                    id={`${field.fieldName}-${String(option.value)}`}
                  />
                  <Label htmlFor={`${field.fieldName}-${String(option.value)}`}>
                    {typeof option.label === 'string' 
                      ? option.label 
                      : option.label[currentLanguage as keyof typeof option.label] || option.label.en}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
      )
    
    case 'checkbox':
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: controllerField }) => (
            <div className={`flex items-center space-x-2 ${errors[field.fieldName] ? 'text-destructive' : ''}`}>
              <Checkbox
                id={field.fieldName}
                checked={controllerField.value}
                onCheckedChange={(checked) => {
                  controllerField.onChange(checked);
                  onValueChange?.(checked);
                }}
                disabled={isReadonly}
              />
              <Label htmlFor={field.fieldName}>
                {field.placeHolder || 'Enable'}
              </Label>
            </div>
          )}
        />
      )
    
    case 'boolean':
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: controllerField }) => (
            <Select 
              value={controllerField.value === undefined ? '' : String(controllerField.value)}
              onValueChange={(value) => {
                const boolValue = value === 'true';
                controllerField.onChange(boolValue);
                onValueChange?.(boolValue);
              }}
              disabled={isReadonly}
            >
              <SelectTrigger className={`${isReadonly ? 'bg-muted' : ''} ${errors[field.fieldName] ? 'border-destructive' : ''}`}>
                <SelectValue placeholder={field.placeHolder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      )
    
    case 'date':
      return (
        <Input
          {...formField}
          type="date"
          readOnly={isReadonly}
          className={`${isReadonly ? 'bg-muted' : ''} ${errors[field.fieldName] ? 'border-destructive focus:ring-destructive bg-destructive/5' : ''}`}
          onChange={(e) => {
            formField.onChange(e);
            onValueChange?.(e.target.value);
          }}
        />
      )
    
    case 'file':
      return (
        <Input
          type="file"
          accept={field.accept}
          readOnly={isReadonly}
          onChange={(e) => {
            const file = e.target.files?.[0];
            formField.onChange(file);
            onValueChange?.(file);
          }}
          className={`${isReadonly ? 'bg-muted' : ''} ${errors[field.fieldName] ? 'border-destructive' : ''}`}
        />
      )
    
    case 'htmlContent':
      return (
        <Textarea
          {...formField}
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          rows={field.rows || 5}
          className={`${isReadonly ? 'bg-muted' : ''} font-mono text-sm ${errors[field.fieldName] ? 'border-destructive focus:ring-destructive bg-destructive/5' : ''}`}
          onChange={(e) => {
            formField.onChange(e);
            onValueChange?.(e.target.value);
          }}
        />
      )
    
    case 'icon':
      return (
        <IconSelector
          value={formField.value || ""}
          onSelect={(iconName) => {
            formField.onChange(iconName);
            onValueChange?.(iconName);
          }}
          placeholder={field.placeHolder || "Select an icon..."}
          disabled={isReadonly}
          className="w-full"
        />
      )
    
    default:
      return (
        <Input
          {...formField}
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          className={`${isReadonly ? 'bg-muted' : ''} ${errors[field.fieldName] ? 'border-destructive focus:ring-destructive bg-destructive/5' : ''}`}
          onChange={(e) => {
            formField.onChange(e);
            onValueChange?.(e.target.value);
          }}
        />
      )
  }
}