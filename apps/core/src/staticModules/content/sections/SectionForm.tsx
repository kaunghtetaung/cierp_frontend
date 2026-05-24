'use client';

/**
 * @deprecated Replaced by `SectionEditorPage.tsx`, the split-pane editor that
 * routes all section types (hero, contentWithImage, cta, testimonials,
 * gallery, faq, featureList, pricing, dataTable) to their production
 * `*SectionForm`/`*SectionPreview` pair. This wrapper only ever
 * delegated to the legacy `HeroSectionEditor` / `ContentWithImageEditor`,
 * neither of which is imported anywhere outside this file. Safe to
 * delete after one release of confidence in `SectionEditorPage`.
 */

import React, { useState, useTransition } from 'react';
import { toastSuccess, toastError } from '@repo/utils';
import { createSection, updateSection } from '../common/actions';
import type { Section, SectionType } from '../common/types';
import { HeroSectionEditor } from './editors/HeroSectionEditor';
import { ContentWithImageEditor } from './editors/ContentWithImageEditor';

// Section form wrapper - routes to specialized editors based on type

interface SectionFormProps {
  mode: 'create' | 'edit';
  sectionType: SectionType;
  initialData?: Partial<Section>;
  onSuccess?: (section: Section) => void;
  onCancel?: () => void;
}

export function SectionForm({
  mode,
  sectionType,
  initialData,
  onSuccess,
  onCancel,
}: SectionFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSave = async (data: any) => {
    startTransition(async () => {
      try {
        const sectionData = {
          ...data,
          type: sectionType,
        };

        let result;
        if (mode === 'create') {
          result = await createSection(sectionData as any);
        } else if (initialData?._id) {
          result = await updateSection(initialData._id, sectionData as any);
        } else {
          throw new Error('Section ID is required for update');
        }

        if (result.success && result.data) {
          toastSuccess(
            mode === 'create'
              ? 'Section created successfully'
              : 'Section updated successfully'
          );
          onSuccess?.(result.data);
        } else {
          toastError(result.error || 'Failed to save section');
        }
      } catch (error) {
        console.error('Section form error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  // Route to appropriate editor based on section type
  if (sectionType === 'hero') {
    return (
      <HeroSectionEditor
        initialData={initialData as any}
        onSave={handleSave}
        onCancel={onCancel}
        saving={isPending}
      />
    );
  }

  if (sectionType === 'contentWithImage') {
    return (
      <ContentWithImageEditor
        initialData={initialData as any}
        onSave={handleSave}
        onCancel={onCancel}
        saving={isPending}
      />
    );
  }

  // Fallback for other section types (to be implemented)
  return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">
        Editor for <span className="font-semibold">{sectionType}</span> section type is not yet
        implemented.
      </p>
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Go back
        </button>
      )}
    </div>
  );
}

export default SectionForm;
