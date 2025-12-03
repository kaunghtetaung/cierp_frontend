'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@repo/ui';
import { Card, CardContent } from '@repo/ui';
import { Button } from '@repo/ui';
import {
  Star,
  Layout,
  Mail,
  Quote,
  Image,
  BarChart3,
  HelpCircle,
  Users,
  DollarSign,
  FileText,
  Settings,
} from 'lucide-react';
import type { SectionType } from '../../types';

interface SectionTypeOption {
  type: SectionType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const SECTION_TYPE_OPTIONS: SectionTypeOption[] = [
  {
    type: 'hero',
    label: 'Hero Section',
    description: 'Large banner with title, subtitle, and call-to-action buttons',
    icon: <Star className="h-6 w-6" />,
  },
  {
    type: 'featureList',
    label: 'Feature List',
    description: 'Grid or list of features with icons and descriptions',
    icon: <Layout className="h-6 w-6" />,
  },
  {
    type: 'cta',
    label: 'Call to Action',
    description: 'Prominent section to encourage user action',
    icon: <Mail className="h-6 w-6" />,
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    description: 'Customer reviews and testimonials carousel',
    icon: <Quote className="h-6 w-6" />,
  },
  {
    type: 'gallery',
    label: 'Gallery',
    description: 'Image or video gallery with lightbox support',
    icon: <Image className="h-6 w-6" />,
  },
  {
    type: 'stats',
    label: 'Statistics',
    description: 'Number counters and statistics display',
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    type: 'faq',
    label: 'FAQ',
    description: 'Frequently asked questions with accordion',
    icon: <HelpCircle className="h-6 w-6" />,
  },
  {
    type: 'team',
    label: 'Team',
    description: 'Team member profiles with photos and bios',
    icon: <Users className="h-6 w-6" />,
  },
  {
    type: 'pricing',
    label: 'Pricing',
    description: 'Pricing tables and plan comparisons',
    icon: <DollarSign className="h-6 w-6" />,
  },
  {
    type: 'contact',
    label: 'Contact',
    description: 'Contact form and information',
    icon: <Mail className="h-6 w-6" />,
  },
  {
    type: 'content',
    label: 'Content Block',
    description: 'Rich text content with optional media',
    icon: <FileText className="h-6 w-6" />,
  },
  {
    type: 'custom',
    label: 'Custom Section',
    description: 'Custom HTML/component section',
    icon: <Settings className="h-6 w-6" />,
  },
];

interface SectionTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: SectionType) => void;
}

export function SectionTypeSelector({
  open,
  onOpenChange,
  onSelect,
}: SectionTypeSelectorProps) {
  const handleSelect = (type: SectionType) => {
    onSelect(type);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
          <DialogDescription>
            Choose a section type to add to your page
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {SECTION_TYPE_OPTIONS.map((option) => (
            <Card
              key={option.type}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={() => handleSelect(option.type)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="p-3 bg-muted rounded-lg text-primary">
                    {option.icon}
                  </div>
                  <h4 className="font-medium">{option.label}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {option.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SectionTypeSelector;
