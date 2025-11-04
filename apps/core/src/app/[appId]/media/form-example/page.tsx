/**
 * Media Form Integration Example
 * Shows how to use FilePickerField in forms
 */

'use client';

import { useForm } from 'react-hook-form';
import { FilePickerField } from '@repo/media';

interface FormData {
  logo: string;
  banner: string;
  documents: string[];
}

export default function MediaFormExamplePage() {
  const { control, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      logo: '',
      banner: '',
      documents: [],
    },
  });

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    alert('Form submitted! Check console for data.');
  };

  const formValues = watch();

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Media Form Integration Example</h1>
        <p className="text-gray-600 mt-1">Using FilePickerField with React Hook Form</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo Picker */}
        <FilePickerField
          control={control}
          name="logo"
          label="Company Logo"
          basePath="public/logos"
          accept="image/*"
          required
          helperText="Select a logo image (JPG, PNG, GIF)"
        />

        {/* Banner Picker */}
        <FilePickerField
          control={control}
          name="banner"
          label="Banner Image"
          basePath="public/banners"
          accept="image/*"
          helperText="Select a banner image for the homepage"
        />

        {/* Multiple Documents */}
        <FilePickerField
          control={control}
          name="documents"
          label="Supporting Documents"
          basePath="private/documents"
          accept=".pdf,.doc,.docx"
          multiple
          helperText="Select one or more documents (PDF, Word)"
        />

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </form>

      {/* Debug: Show current form values */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Form Values (Debug)</h3>
        <pre className="text-xs text-gray-700 overflow-auto">
          {JSON.stringify(formValues, null, 2)}
        </pre>
      </div>
    </div>
  );
}
