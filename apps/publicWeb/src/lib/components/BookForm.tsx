'use client';

import React, { useState } from 'react';
import { TypeaheadSelect } from './TypeaheadSelect';
import { useTypeahead } from '../hooks/useTypeahead';

interface BookFormData {
  title: string;
  authorId: string | number | null;
  publisherId: string | number | null;
  subjectId: string | number | null;
}

export function BookForm() {
  const { searchAuthors, searchPublishers, searchSubjects } = useTypeahead();
  
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    authorId: null,
    publisherId: null,
    subjectId: null
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BookFormData, string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Partial<Record<keyof BookFormData, string>> = {};
    
    if (!formData.title) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.authorId) {
      newErrors.authorId = 'Please select an author';
    }
    
    if (!formData.publisherId) {
      newErrors.publisherId = 'Please select a publisher';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Clear errors and submit
    setErrors({});
    console.log('Form submitted:', formData);
    
    // Here you would typically send the data to your API
    alert('Form submitted successfully! Check console for details.');
  };

  const handleInputChange = (field: keyof BookFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user makes a change
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Book Information Form</h2>
      
      {/* Title Field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Book Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={`
            w-full px-3 py-2 border rounded-md
            ${errors.title ? 'border-red-500' : 'border-gray-300'}
            focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
          placeholder="Enter book title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Author Field with TypeaheadSelect */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Author <span className="text-red-500">*</span>
        </label>
        <TypeaheadSelect
          name="authorId"
          value={formData.authorId}
          onChange={(value) => handleInputChange('authorId', value)}
          onSearch={searchAuthors}
          placeholder="Search for an author..."
          error={errors.authorId}
          required
          debounceMs={300}
          minSearchLength={2}
          emptyMessage="No authors found. Try a different search term."
        />
      </div>

      {/* Publisher Field with TypeaheadSelect */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Publisher <span className="text-red-500">*</span>
        </label>
        <TypeaheadSelect
          name="publisherId"
          value={formData.publisherId}
          onChange={(value) => handleInputChange('publisherId', value)}
          onSearch={searchPublishers}
          placeholder="Search for a publisher..."
          error={errors.publisherId}
          required
          debounceMs={300}
          minSearchLength={2}
          emptyMessage="No publishers found. Try a different search term."
        />
      </div>

      {/* Subject Field with TypeaheadSelect (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subject
        </label>
        <TypeaheadSelect
          name="subjectId"
          value={formData.subjectId}
          onChange={(value) => handleInputChange('subjectId', value)}
          onSearch={searchSubjects}
          placeholder="Search for a subject (optional)..."
          debounceMs={300}
          minSearchLength={2}
          emptyMessage="No subjects found. Try a different search term."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => {
            setFormData({
              title: '',
              authorId: null,
              publisherId: null,
              subjectId: null
            });
            setErrors({});
          }}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Submit
        </button>
      </div>

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-gray-100 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Form Data (Debug)</h3>
        <pre className="text-xs text-gray-600">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </form>
  );
}