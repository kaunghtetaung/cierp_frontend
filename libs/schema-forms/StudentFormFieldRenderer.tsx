'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { useFormContext, Controller, useController } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@repo/ui'
import { Input } from '@repo/ui'
import { Textarea } from '@repo/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui'
import { Checkbox } from '@repo/ui'
import { RadioGroup, RadioGroupItem } from '@repo/ui'
import { Label } from '@repo/ui'
import { Switch } from '@repo/ui'
import { cn } from '@repo/utils'
import { DynamicSelect } from './DynamicSelect'
import { DependentSelect } from './DependentSelect'
import { ArrayField } from './ArrayField'
import { PasswordField } from './PasswordField'
import { MultiLanguageInput } from './MultiLanguageInput'
import { PhoneInput } from './PhoneInput'
import { NrcField } from './NrcField'
import { IconComponent, IconSelector } from '@repo/ui'
import { DatePicker } from './components/DatePicker'
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
    console.log('🔄 StudentFormFieldRenderer - Converting dataSource to dropdownConfig:', {
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
      serviceName: field.dataSource.serviceName
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

    return {
      ...field,
      fieldType: finalFieldType,
      dropdownConfig,
      dataSource: field.dataSource // Preserve dataSource for backward compatibility
    };
  }

  return field;
}

export interface StudentFormFieldRendererProps {
  field: SchemaFormField
  currentLanguage?: string
  isVerticalLayout?: boolean
  errors?: any
  watch?: any
  onValueChange?: (value: any) => void
  isDisabled?: boolean
  isGuardianMirrored?: boolean
}

export function StudentFormFieldRenderer({
  field: originalField,
  currentLanguage = 'en',
  isVerticalLayout = false,
  errors = {},
  watch: watchProp,
  onValueChange,
  isDisabled = false,
  isGuardianMirrored = false
}: StudentFormFieldRendererProps) {
  const formContext = useFormContext()
  const control = formContext?.control
  const setValue = formContext?.setValue
  const watch = formContext?.watch
  const watchFunction = watchProp || watch

  // Initialize all toggle controllers at component level (following Rules of Hooks)
  const currentAddressToggleController = useController({
    name: 'currentAddress_sameAsPermanent',
    control: control,
    defaultValue: false
  });

  const guardianAddressToggleController = useController({
    name: 'guardian.address_sameAsPermanent',
    control: control,
    defaultValue: false
  });

  // Initialize NRC toggle controller only for NRC fields (using originalField)
  const nrcToggleController = useController({
    name: originalField.fieldType === 'nrcField' ? `${originalField.fieldName}_isFreeForm` : 'dummy_nrcToggle',
    control: control,
    defaultValue: false
  });

  // Global debounced address sync for permanent address field
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const debouncedAddressSync = useCallback((permanentAddressValue: string) => {
    if (originalField.fieldName !== 'permanentAddress' || !setValue) return;

    // Get current form values to check toggle states
    const formValues = watchFunction?.() || {};
    console.log('🔄 Global debounced address sync triggered:', permanentAddressValue);

    // Check current address toggle
    if (formValues['currentAddress_sameAsPermanent']) {
      console.log('🔄 Syncing to currentAddress:', permanentAddressValue);
      setValue('currentAddress', permanentAddressValue, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
    }

    // Check guardian address toggle
    if (formValues['guardian.address_sameAsPermanent']) {
      console.log('🔄 Syncing to guardian.address:', permanentAddressValue);
      setValue('guardian.address', permanentAddressValue, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
    }
  }, [originalField.fieldName, setValue, watchFunction]);

  const handleDebouncedAddressSync = useCallback((value: string) => {
    if (originalField.fieldName !== 'permanentAddress') return;

    console.log('🕐 Global handleDebouncedAddressSync called with:', value);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      console.log('⏰ Global timeout triggered, calling debouncedAddressSync');
      debouncedAddressSync(value);
    }, 500);
  }, [originalField.fieldName, debouncedAddressSync]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Watch for permanent address changes and trigger debounced sync
  useEffect(() => {
    if (originalField.fieldName === 'permanentAddress' && watchFunction) {
      const subscription = watchFunction((value, { name }) => {
        if (name === 'permanentAddress' && typeof value.permanentAddress === 'string') {
          console.log('👀 Watched permanent address change:', value.permanentAddress);
          handleDebouncedAddressSync(value.permanentAddress);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [originalField.fieldName, watchFunction, handleDebouncedAddressSync]);

  // Debug logging for toggle controllers
  React.useEffect(() => {
    console.log('🔍 Address Toggle Controllers Initialized:', {
      currentAddress: {
        name: 'currentAddress_sameAsPermanent',
        value: currentAddressToggleController.field.value,
        hasOnChange: !!currentAddressToggleController.field.onChange
      },
      guardianAddress: {
        name: 'guardian.address_sameAsPermanent',
        value: guardianAddressToggleController.field.value,
        hasOnChange: !!guardianAddressToggleController.field.onChange
      }
    });
  }, [currentAddressToggleController.field.value, guardianAddressToggleController.field.value]);

  // Function to sync permanent address to target fields when toggles are enabled (triggered on blur)
  const syncPermanentAddress = React.useCallback((permanentAddressValue: string) => {
    console.log('🔄 Syncing permanent address on blur:', permanentAddressValue);

    // Check current address toggle
    if (currentAddressToggleController.field.value && setValue) {
      console.log('🔄 Syncing to currentAddress:', permanentAddressValue);
      setValue('currentAddress', permanentAddressValue, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
    }

    // Check guardian address toggle
    if (guardianAddressToggleController.field.value && setValue) {
      console.log('🔄 Syncing to guardian.address:', permanentAddressValue);
      setValue('guardian.address', permanentAddressValue, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
    }
  }, [setValue, currentAddressToggleController.field.value, guardianAddressToggleController.field.value]);

  // If no form context, return error message
  if (!control) {
    console.error('StudentFormFieldRenderer: No form context found. Make sure this component is wrapped in a FormProvider.')
    return (
      <div className="text-destructive text-sm">
        Error: StudentFormFieldRenderer must be used within a Form component
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
    console.error('StudentFormFieldRenderer: Invalid field configuration', field)
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
    console.error('StudentFormFieldRenderer: fieldName must be a non-empty string', { field, fieldName: field.fieldName })
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

  // Student form layout configuration
  // Row 1 fields (2 columns layout)
  const row1Fields = ['nameMyanmar', 'nameEnglish', 'gender', 'ethnicity', 'religion'];
  // Row 2 fields (4 columns layout - bloodGroup, dateOfBirth, nrcNumber)
  const row2Fields = ['bloodGroup', 'dateOfBirth', 'nrcNumber'];
  // Full width fields (span entire row)
  const fullWidthFields = ['dateOfBirth', 'nrcField', 'nrcNumber'];

  const isFullWidthField = fullWidthFields.includes(field.fieldName);
  const isRow1Field = row1Fields.includes(field.fieldName);
  const isRow2Field = row2Fields.includes(field.fieldName);


  // Column span configuration for different layouts
  const getColumnSpan = () => {
    if (isFullWidthField) return 'col-span-full';
    if (isRow1Field) return 'md:col-span-2'; // 2 columns on medium screens and up
    if (isRow2Field) return 'md:col-span-1'; // 1 column (4 fields per row on 4-column grid)
    return ''; // Default grid behavior
  };

  return (
    <div className={`${containerClasses} ${getColumnSpan()} ${isRow2Field || isRow1Field ? 'w-full' : ''}`}>
      <FormField
        control={control}
        name={field.fieldName}
        render={({ field: formField, fieldState }) => (
          <FormItem className={`${isVerticalLayout ? "flex-1 min-w-0" : ""} ${isFullWidthField ? 'w-full' : ''} ${isRow2Field ? 'w-full flex-1' : ''}`}>
            <FormLabel className={`${isRequired ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''} ${
              isVerticalLayout ? "text-xs sm:text-sm" : "text-sm"
            } ${(field.fieldType === 'nrcField' || field.fieldName === 'currentAddress' || field.fieldName === 'guardian.address') ? 'flex items-center justify-between w-full' : ''}`}>
              <span className={field.fieldType === 'nrcField' ? 'whitespace-nowrap' : ''}>{label}</span>
              {/* Address sync toggle for currentAddress and guardian.address */}
              {(field.fieldName === 'currentAddress' || field.fieldName === 'guardian.address') && (() => {
                const isCurrentAddress = field.fieldName === 'currentAddress';
                const isGuardianAddress = field.fieldName === 'guardian.address';
                const toggleFieldName = field.fieldName + '_sameAsPermanent';
                const sourceFieldName = 'permanentAddress';

                // Use the pre-initialized controllers
                const toggleController = isCurrentAddress
                  ? currentAddressToggleController
                  : guardianAddressToggleController;

                return (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                      {currentLanguage === "mm"
                        ? "အမြဲတမ်းလိပ်စာနှင့်တူညီသည်"
                        : "Same with Permanent Address"}
                    </span>
                    <Switch
                      className="h-4 w-8 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input [&>*]:h-3 [&>*]:w-3 [&>*]:data-[state=checked]:translate-x-4"
                      checked={toggleController.field.value}
                      onCheckedChange={(checked) => {
                        console.log('='.repeat(50));
                        console.log('🎯 MANUAL DEBUG - ADDRESS COPY TOGGLE CLICKED');
                        console.log('='.repeat(50));

                        console.log('STEP 1: Initial State Check');
                        console.log('- Field Name:', field.fieldName);
                        console.log('- Toggle Checked:', checked);
                        console.log('- Current Toggle Value:', toggleController.field.value);
                        console.log('- Has Toggle Controller:', !!toggleController);
                        console.log('- Has Toggle Field:', !!toggleController.field);
                        console.log('- Has Toggle onChange:', !!toggleController.field.onChange);

                        console.log('STEP 2: Control Object Check');
                        console.log('- Has Control:', !!control);
                        console.log('- Control Type:', typeof control);
                        console.log('- Has getValues:', !!control?.getValues);
                        console.log('- Has setValue:', !!control?.setValue);
                        console.log('- Control Object:', control);

                        console.log('STEP 3: Updating Toggle State');
                        try {
                          toggleController.field.onChange(checked);
                          console.log('✅ Toggle state updated successfully');
                          console.log('- New Toggle Value:', toggleController.field.value);
                        } catch (error) {
                          console.error('❌ Toggle state update failed:', error);
                        }

                        console.log('STEP 4: Copy Logic Decision');
                        console.log('- Should Copy (checked):', checked);

                        if (checked) {
                          console.log('STEP 5: Starting Copy Process');

                          console.log('STEP 6: Getting Form Values');
                          let allValues;
                          try {
                            // Use the watch function which is in scope to get all values
                            if (watchFunction) {
                              console.log('- Using watch function to get values');
                              // Get the current form values by watching all fields
                              allValues = watchFunction();
                              console.log('✅ Form values retrieved via watch');
                              console.log('- All Form Values:', allValues);
                              console.log('- Form Keys:', Object.keys(allValues || {}));
                              console.log('- Has permanentAddress key:', !!(allValues && 'permanentAddress' in allValues));
                            } else {
                              console.error('❌ No watch function available');
                              return;
                            }
                          } catch (error) {
                            console.error('❌ Failed to get form values:', error);
                            return;
                          }

                          console.log('STEP 7: Finding Permanent Address');
                          const permanentAddress = allValues.permanentAddress || '';
                          console.log('- Permanent Address Value:', `"${permanentAddress}"`);
                          console.log('- Permanent Address Length:', permanentAddress.length);
                          console.log('- Permanent Address Type:', typeof permanentAddress);

                          console.log('STEP 8: Setting Target Field Value');
                          console.log('- Target Field:', field.fieldName);
                          console.log('- Value to Copy:', `"${permanentAddress}"`);

                          try {
                            console.log('- setValue function:', setValue);
                            console.log('- Has setValue:', !!setValue);

                            if (setValue) {
                              setValue(field.fieldName, permanentAddress, {
                                shouldValidate: true,
                                shouldDirty: true,
                                shouldTouch: true
                              });
                              console.log('✅ setValue executed successfully');
                            } else {
                              console.error('❌ No setValue method available from form context');
                            }
                          } catch (error) {
                            console.error('❌ setValue failed:', error);
                          }

                          console.log('STEP 9: Verifying Copy Result');
                          setTimeout(() => {
                            try {
                              // Use watch function for verification
                              if (watchFunction) {
                                const newValues = watchFunction();
                                const copiedValue = newValues?.[field.fieldName];
                                console.log('- Current Target Field Value:', `"${copiedValue}"`);
                                console.log('- Copy Successful:', copiedValue === permanentAddress);

                                if (copiedValue === permanentAddress) {
                                  console.log('🎉 COPY SUCCESS!');
                                } else {
                                  console.log('❌ COPY FAILED - Values do not match');
                                  console.log('- Expected:', permanentAddress);
                                  console.log('- Actual:', copiedValue);
                                }
                              } else {
                                console.error('❌ No watch function for verification');
                              }
                            } catch (error) {
                              console.error('❌ Verification failed:', error);
                            }
                          }, 50);
                        } else {
                          console.log('STEP 5: Toggle Disabled - No Copy Needed');
                        }

                        console.log('='.repeat(50));
                        console.log('🏁 MANUAL DEBUG - END');
                        console.log('='.repeat(50));
                      }}
                    />
                  </div>
                );
              })()}

              {/* NRC field toggle */}
              {field.fieldType === 'nrcField' && (
                <div className="flex items-center space-x-2 ml-auto">
                  <span className={`text-xs whitespace-nowrap ${isGuardianMirrored ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                    {currentLanguage === "mm" ? "စိတ်ကြိုက်ပုံစံ" : "Custom Format"}
                  </span>
                  <Switch
                    className="h-4 w-8 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input [&>*]:h-3 [&>*]:w-3 [&>*]:data-[state=checked]:translate-x-4"
                    checked={nrcToggleController.field.value}
                    disabled={isGuardianMirrored}
                    onCheckedChange={(checked) => {
                      console.log('🔄 NRC Toggle clicked (useController):', {
                        fieldName: field.fieldName,
                        toggleFieldName: `${field.fieldName}_isFreeForm`,
                        currentValue: nrcToggleController.field.value,
                        newValue: checked,
                        hasController: !!nrcToggleController,
                        hasField: !!nrcToggleController.field,
                        hasOnChange: !!nrcToggleController.field.onChange
                      });

                      // Use the controller's onChange method
                      nrcToggleController.field.onChange(checked);

                      console.log('✅ NRC Toggle updated via useController:', {
                        toggleFieldName: `${field.fieldName}_isFreeForm`,
                        newValue: checked,
                        updatedValue: nrcToggleController.field.value
                      });
                    }}
                  />
                </div>
              )}
            </FormLabel>
            <FormControl className={`${isRow2Field || isRow1Field ? 'w-full' : ''}`}>
              <StudentFormFieldInput
                field={field}
                formField={formField}
                isReadonly={isReadonly || (() => {
                  // Disable address fields when their respective toggles are enabled
                  if (field.fieldName === 'currentAddress') {
                    return currentAddressToggleController.field.value;
                  }
                  if (field.fieldName === 'guardian.address') {
                    return guardianAddressToggleController.field.value;
                  }
                  return false;
                })()}
                currentLanguage={currentLanguage}
                errors={errors}
                watchFunction={watchFunction}
                onValueChange={onValueChange}
                isRow1Field={isRow1Field}
                isRow2Field={isRow2Field}
                nrcToggleController={nrcToggleController}
                isDisabled={isDisabled}
                isGuardianMirrored={isGuardianMirrored}
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

interface StudentFormFieldInputProps {
  field: SchemaFormField
  formField: any
  isReadonly: boolean
  currentLanguage: string
  errors?: any
  watchFunction?: any
  onValueChange?: (value: any) => void
  isRow1Field?: boolean
  isRow2Field?: boolean
  nrcToggleController?: any
  isDisabled?: boolean
  isGuardianMirrored?: boolean
}

function StudentFormFieldInput({
  field,
  formField,
  isReadonly,
  currentLanguage,
  errors = {},
  watchFunction,
  onValueChange,
  isRow1Field = false,
  isRow2Field = false,
  nrcToggleController,
  isDisabled = false,
  isGuardianMirrored = false
}: StudentFormFieldInputProps) {
  const { control, watch, setValue } = useFormContext()
  const watchFunc = watchFunction || watch

  // For NRC fields, ensure we're watching the toggle state
  React.useEffect(() => {
    if (field.fieldType === 'nrcField') {
      const toggleFieldName = field.fieldName + '_isFreeForm';
      // Explicitly watch the toggle field to ensure re-renders
      const subscription = watch((value, { name }) => {
        if (name === toggleFieldName) {
          console.log('🔄 Watch triggered for toggle field:', {
            name,
            value: value[name],
            fieldName: field.fieldName
          });
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [field.fieldType, field.fieldName, watch]);

  console.log('🔍 Processing field:', field.fieldName, 'type:', field.fieldType);
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
                currentLanguage,
                hideToggle: true // Hide the toggle since it's rendered in the label
              }}
              error={!!errors[field.fieldName]}
              placeholder={field.placeHolder}
              isFreeForm={field.fieldType === 'nrcField' ? nrcToggleController.field.value : false}
              fieldName={field.fieldName} // Pass fieldName for unique identifiers
              isGuardianMirrored={isGuardianMirrored} // Pass guardian mirrored flag
              className="w-full" // Ensure full width
              onToggleChange={(isFreeForm) => {
                console.log('🔄 NrcField onToggleChange called:', {
                  fieldName: field.fieldName,
                  isFreeForm,
                  hasController: !!nrcToggleController
                });
                if (field.fieldType === 'nrcField') {
                  nrcToggleController.field.onChange(isFreeForm);
                }
              }}
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
          render={({ field: { onChange, value, name, onBlur: controllerOnBlur } }) => {
            const inputRef = useRef<HTMLInputElement>(null);
            const hasError = errors[field.fieldName];

            // Check if this is an address field with sync toggle
            const isCurrentAddress = field.fieldName === 'currentAddress';
            const isGuardianAddress = field.fieldName === 'guardian.address';
            const isAddressField = isCurrentAddress || isGuardianAddress;

            // Get the appropriate toggle controller
            const toggleController = isCurrentAddress
              ? currentAddressToggleController
              : isGuardianAddress
                ? guardianAddressToggleController
                : null;

            const isToggleEnabled = toggleController?.field?.value || false;
            const isFieldDisabled = isReadonly || (isAddressField && isToggleEnabled) || isDisabled;

            // Auto-focus on validation error
            useEffect(() => {
              if (hasError && inputRef.current) {
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 100);
              }
            }, [hasError]);

            // Address field identification for any additional logic if needed
            const isPermanentAddressField = field.fieldName === 'permanentAddress';

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
                onBlur={controllerOnBlur}
                placeholder={field.placeHolder}
                disabled={isFieldDisabled}
                readOnly={isReadonly}
                className={`${isReadonly ? 'bg-muted' : ''} ${isFieldDisabled ? 'bg-muted/50 text-muted-foreground cursor-not-allowed opacity-75' : ''} ${isGuardianMirrored ? 'bg-muted/50 border-muted-foreground/40' : ''} ${hasError ? 'border-destructive focus:ring-destructive bg-destructive/5' : ''}`}
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
          disabled={isDisabled}
          className={`${isReadonly ? 'bg-muted' : ''} ${isDisabled ? 'bg-muted/50 text-muted-foreground cursor-not-allowed opacity-75' : ''} ${isGuardianMirrored ? 'bg-muted/50 border-muted-foreground/40' : ''} ${errors[field.fieldName] ? 'border-destructive focus:ring-destructive bg-destructive/5' : ''}`}
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
          <SelectTrigger className={`${isReadonly ? 'bg-muted' : ''} ${errors[field.fieldName] ? 'border-destructive' : ''} ${isRow1Field || isRow2Field ? 'w-full' : ''}`}>
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
              <SelectTrigger className={`${isReadonly ? 'bg-muted' : ''} ${errors[field.fieldName] ? 'border-destructive' : ''} ${isRow1Field || isRow2Field ? 'w-full' : ''}`}>
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