'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Plus, Layers } from 'lucide-react';
import { SectionCard } from './SectionCard';
import { SectionTypeSelector } from './SectionTypeSelector';
import type { Section, SectionType } from '../../types';

interface SortableSectionProps {
  section: Section;
  index: number;
  onEdit?: (section: Section) => void;
  onDelete?: (sectionId: string) => void;
  onDuplicate?: (section: Section) => void;
  onToggleVisibility?: (sectionId: string) => void;
  currentLanguage?: 'en' | 'mm';
}

function SortableSection({
  section,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  currentLanguage,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <SectionCard
        section={section}
        index={index}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onToggleVisibility={onToggleVisibility}
        currentLanguage={currentLanguage}
        dragHandleProps={listeners}
      />
    </div>
  );
}

interface SectionBuilderProps {
  sections: Section[];
  onChange?: (sections: Section[]) => void;
  onAddSection?: (type: SectionType) => void;
  onEditSection?: (section: Section) => void;
  onDeleteSection?: (sectionId: string) => void;
  onDuplicateSection?: (section: Section) => void;
  onToggleVisibility?: (sectionId: string) => void;
  currentLanguage?: 'en' | 'mm';
  disabled?: boolean;
}

export function SectionBuilder({
  sections,
  onChange,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onDuplicateSection,
  onToggleVisibility,
  currentLanguage = 'en',
  disabled = false,
}: SectionBuilderProps) {
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = sections.findIndex((s) => s._id === active.id);
        const newIndex = sections.findIndex((s) => s._id === over.id);

        const newSections = arrayMove(sections, oldIndex, newIndex).map(
          (section, index) => ({
            ...section,
            order: index,
          })
        );

        onChange?.(newSections);
      }
    },
    [sections, onChange]
  );

  const handleTypeSelect = (type: SectionType) => {
    onAddSection?.(type);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-5 w-5" />
            Page Sections
            <span className="text-sm font-normal text-muted-foreground">
              ({sections.length})
            </span>
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowTypeSelector(true)}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Section
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No sections yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add sections to build your page content
            </p>
            <Button
              variant="outline"
              onClick={() => setShowTypeSelector(true)}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Section
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sections
                  .sort((a, b) => a.order - b.order)
                  .map((section, index) => (
                    <SortableSection
                      key={section._id}
                      section={section}
                      index={index}
                      onEdit={onEditSection}
                      onDelete={onDeleteSection}
                      onDuplicate={onDuplicateSection}
                      onToggleVisibility={onToggleVisibility}
                      currentLanguage={currentLanguage}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Add Section Button (at bottom when sections exist) */}
        {sections.length > 0 && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTypeSelector(true)}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Section
            </Button>
          </div>
        )}
      </CardContent>

      {/* Section Type Selector Dialog */}
      <SectionTypeSelector
        open={showTypeSelector}
        onOpenChange={setShowTypeSelector}
        onSelect={handleTypeSelect}
      />
    </Card>
  );
}

export default SectionBuilder;
