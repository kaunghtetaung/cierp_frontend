/**
 * File Picker Field Component
 * React Hook Form integration
 */

'use client';

import { useState } from 'react';
import { Controller } from 'react-hook-form';
import type { FilePickerFieldProps, MediaFile } from '../../types';
import { FilePickerModal } from './FilePickerModal';
import { X, Upload } from 'lucide-react';

export function FilePickerField({
  control,
  name,
  label,
  basePath,
  accept,
  required = false,
  helperText,
  multiple = false,
}: FilePickerFieldProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      rules={{ required: required ? `${label || name} is required` : false }}
      render={({ field, fieldState }) => {
        const value = field.value as MediaFile | MediaFile[] | string | string[] | undefined;
        const hasValue = Array.isArray(value) ? value.length > 0 : !!value;

        const handleSelect = (selected: MediaFile | MediaFile[]) => {
          if (multiple && Array.isArray(selected)) {
            // Store array of URLs or full objects
            field.onChange(selected.map((f) => f.url));
          } else if (!Array.isArray(selected)) {
            // Store single URL or full object
            field.onChange(selected.url);
          }
        };

        const handleClear = () => {
          field.onChange(multiple ? [] : null);
        };

        return (
          <div className="space-y-2">
            {/* Label */}
            {label && (
              <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}

            {/* Preview / Select Button */}
            <div className="space-y-2">
              {hasValue ? (
                <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                  <div className="flex-1 truncate">
                    {Array.isArray(value) ? (
                      <span className="text-sm text-gray-700">{value.length} file(s) selected</span>
                    ) : (
                      <span className="text-sm text-gray-700">
                        {typeof value === 'string' ? value : (value as MediaFile).name}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      aria-label="Clear"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 transition-colors"
                >
                  <Upload size={20} className="mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Select File</span>
                </button>
              )}
            </div>

            {/* Helper Text */}
            {helperText && !fieldState.error && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}

            {/* Error */}
            {fieldState.error && (
              <p className="text-sm text-red-600">{fieldState.error.message}</p>
            )}

            {/* File Picker Modal */}
            <FilePickerModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSelect={handleSelect}
              basePath={basePath}
              accept={accept}
              multiSelect={multiple}
            />
          </div>
        );
      }}
    />
  );
}
