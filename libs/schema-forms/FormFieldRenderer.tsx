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
import { ArrayField } from './ArrayField'
import { PasswordField } from './PasswordField'
import { MultiLanguageInput } from './MultiLanguageInput'
import { PhoneInput } from './PhoneInput'
import { NrcField } from './NrcField'
import { IconComponent, IconSelector } from '@repo/ui'
import { Tooltip, TooltipTrigger, TooltipContent } from '@repo/ui'
import { DatePicker } from './components/DatePicker'
import { MediaBrowserField } from './fields/MediaBrowserField'
import type { FormField as SchemaFormField } from '@repo/types'

// Auto-configure dropdownConfig - NO HARDCODING
// All configuration should come from backend schema
function autoConfigureDropdown(field: SchemaFormField): SchemaFormField {
  // Simply return the field as-is
  // Backend should provide complete configuration
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
    console.log('🔄 FormFieldRenderer - Converting dataSource to dropdownConfig:', {
      fieldName: field.fieldName,
      dataSource: field.dataSource,
      serviceName: field.dataSource.serviceName,
      valueFieldFromDataSource: field.dataSource.valueField,
      labelFieldFromDataSource: field.dataSource.labelField
    });
    
    const dropdownConfig: any = {
      type: "dynamic",
      refPath: field.dataSource.endpoint,
      searchable: field.dataSource.enableTypeahead !== false, // Enable typeahead by default
      clearable: true,
      preloadData: !field.dataSource.enableTypeahead, // Don't preload if typeahead is enabled
      labelField: field.dataSource.labelField || 'name',
      valueField: field.dataSource.valueField || 'id',
      minSearchLength: field.dataSource.minSearchLength || 2,
      debounceMs: field.dataSource.debounceMs || 300,
      // Preserve serviceName for cross-service references
      serviceName: field.dataSource.serviceName,
      multiple: field.multiple || field.dataSource.multiple,
    };

    // Handle dependent fields
    if (field.fieldType === "dependentSelect" && field.dataSource.dependentField) {
      dropdownConfig.dependsOn = [field.dataSource.dependentField];
    }

    // Preserve the original field type for dynamicSelect (don't convert to select)
    let finalFieldType = field.fieldType;
    if (field.fieldType === "multiDependentSelect") {
      finalFieldType = "multiSelect";
    }
    
    // Debug log for accessionGroup
    if (field.fieldName === 'accessionGroup') {
      console.log('🎯 FormFieldRenderer - Final dropdownConfig for accessionGroup:', {
        fieldName: field.fieldName,
        dropdownConfig,
        dropdownConfigValueField: dropdownConfig.valueField,
        dropdownConfigLabelField: dropdownConfig.labelField
      });
    }

    return {
      ...field,
      fieldType: finalFieldType,
      dropdownConfig,
      dataSource: field.dataSource // Preserve dataSource for backward compatibility
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
  onValueChange,
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

  // Get help text for the field
  const getHelpText = (field: SchemaFormField) => {
    // Support both 'helpText' (from backend) and 'helperText' (from type definition)
    const helpTextValue = (field as any).helpText || field.helperText;
    if (!helpTextValue) return undefined;
    if (typeof helpTextValue === 'string') return helpTextValue;
    return helpTextValue[currentLanguage as keyof typeof helpTextValue] || helpTextValue.en;
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
              <span className="inline-flex items-center gap-1">
                {getFieldLabel(field)}{" "}
                {field.validationRule?.required && (
                  <span className="text-red-500">*</span>
                )}
                {getHelpText(field) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Help"
                      >
                        <IconComponent name="HelpCircle" className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      {getHelpText(field)}
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
            </label>
          </div>
        ) : (
          <label className="block text-sm font-medium">
            <span className="inline-flex items-center gap-1">
              {getFieldLabel(field)}{" "}
              {field.validationRule?.required && (
                <span className="text-red-500">*</span>
              )}
              {getHelpText(field) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Help"
                    >
                      <IconComponent name="HelpCircle" className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    {getHelpText(field)}
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
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

  // Check if this field should take full width (specific field names or field types)
  const isFullWidthField = ['gender', 'dateOfBirth', 'race', 'religion', 'nrcField', 'nrcNumber'].includes(field.fieldName) || field.fieldType === 'textArea';

  // Handle arrayField separately - it manages its own labeling
  if (field.fieldType === 'arrayField') {
    return (
      <div className={`${containerClasses} ${isFullWidthField ? 'col-span-full' : ''}`}>
        <ArrayField
          field={field}
          fieldName={field.fieldName}
          currentLanguage={currentLanguage}
          isReadonly={isReadonly}
          errors={errors}
        />
      </div>
    )
  }

  return (
    <div className={`${containerClasses} ${isFullWidthField ? 'col-span-full' : ''}`}>
      <FormField
        control={control}
        name={field.fieldName}
        render={({ field: formField, fieldState }) => (
          <FormItem className={`${isVerticalLayout ? "flex-1 min-w-0" : ""} ${isFullWidthField ? 'w-full' : ''}`}>
            <FormLabel className={`${isRequired ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''} ${
              isVerticalLayout ? "text-xs sm:text-sm" : "text-sm"
            }`}>
              <span className="inline-flex items-center gap-1">
                {label}
                {getHelpText(field) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Help"
                      >
                        <IconComponent name="HelpCircle" className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      {getHelpText(field)}
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
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
          render={({ field: { onChange, value } }) => (
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

    case 'nrcField':
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: { onChange, value } }) => (
            <NrcField
              value={value || ''}
              onChange={(newValue) => {
                onChange(newValue);
                onValueChange?.(newValue);
              }}
              disabled={isReadonly}
              config={{
                ...field.nrcConfig,
                currentLanguage
              }}
              error={!!errors[field.fieldName]}
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
            const value = e.target.value;
            // Convert to number if value exists, otherwise use empty string
            const numValue = value === '' ? '' : Number(value);
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
            strengthConfig={field.validationRule?.strengthMeterConfig}
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
          className={`w-full ${isReadonly ? 'bg-muted' : ''} ${errors[field.fieldName] ? 'border-destructive focus:ring-destructive bg-destructive/5' : ''}`}
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
      // 🔍 DEBUG: Log select field rendering
      if (field.fieldName === 'status') {
        console.log('🔍 Select field render:', {
          fieldName: field.fieldName,
          hasOptions: !!field.options,
          optionsCount: field.options?.length,
          options: field.options,
          value: formField.value,
          isReadonly,
          disabled: isReadonly
        });
      }

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
          <SelectContent className="z-[100]">
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
              <SelectContent className="z-[100]">
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      )
    
    case 'date':
      // Calculate default year for dateOfBirth field (current year - 15)
      const getDefaultYear = () => {
        if (field.fieldName === 'dateOfBirth') {
          return new Date().getFullYear() - 15;
        }
        return undefined;
      };

      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: { onChange, value } }) => (
            <DatePicker
              value={value || ''}
              onChange={(newValue) => {
                onChange(newValue);
                onValueChange?.(newValue);
              }}
              placeholder={field.placeHolder || "Select date"}
              disabled={isReadonly}
              defaultYear={getDefaultYear()}
              className={`w-full ${errors[field.fieldName] ? 'border-destructive focus:ring-destructive bg-destructive/5' : ''}`}
            />
          )}
        />
      )

    case 'time':
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: { onChange, value } }) => (
            <Input
              type="time"
              value={value || ''}
              onChange={(e) => {
                onChange(e.target.value);
                onValueChange?.(e.target.value);
              }}
              placeholder={field.placeHolder || "HH:mm"}
              disabled={isReadonly}
              className={`w-full ${isReadonly ? 'bg-muted' : ''} ${errors[field.fieldName] ? 'border-destructive focus:ring-destructive bg-destructive/5' : ''}`}
            />
          )}
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

    case 'mediaBrowser':
    case 'mediaGallery':
    case 'mediaUploader':
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: formField }) => (
            <MediaBrowserField
              value={formField.value}
              onChange={formField.onChange}
              config={{
                ...field.mediaBrowserConfig,
                // Respect backend selectionMode config, with defaults per field type
                selectionMode: field.fieldType === 'mediaGallery' ? 'multiple' :
                              field.mediaBrowserConfig?.selectionMode || 'single',
                allowUpload: field.fieldType === 'mediaUploader' ? true : field.mediaBrowserConfig?.allowUpload,
              }}
              label={field.label}
              fieldName={field.fieldName}
              error={errors[field.fieldName]?.message as string}
              disabled={field.readonly || field.disabled}
              currentLanguage={currentLanguage}
              showUploadButton={field.fieldType === 'mediaUploader'}
            />
          )}
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

    case 'arrayField':
      return (
        <ArrayField
          field={field}
          fieldName={field.fieldName}
          currentLanguage={currentLanguage}
          isReadonly={isReadonly}
          errors={errors}
        />
      )

    default:
      return (
        <Input
          {...formField}
          value={formField.value || ''}
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