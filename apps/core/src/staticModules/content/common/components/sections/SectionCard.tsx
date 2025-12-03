'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Button, Badge } from '@repo/ui';
import { getLocalizedText } from '@repo/utils';
import {
  GripVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  MoreHorizontal,
  Star,
  Image,
  Layout,
  Quote,
  BarChart3,
  HelpCircle,
  Users,
  DollarSign,
  Mail,
  FileText,
  Settings,
  Layers,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui';
import type { Section, SectionType } from '../../types';

const SECTION_ICONS: Record<SectionType, React.ReactNode> = {
  hero: <Star className="h-4 w-4" />,
  featureList: <Layout className="h-4 w-4" />,
  cta: <Mail className="h-4 w-4" />,
  testimonials: <Quote className="h-4 w-4" />,
  gallery: <Image className="h-4 w-4" />,
  stats: <BarChart3 className="h-4 w-4" />,
  faq: <HelpCircle className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
  pricing: <DollarSign className="h-4 w-4" />,
  contact: <Mail className="h-4 w-4" />,
  content: <FileText className="h-4 w-4" />,
  custom: <Settings className="h-4 w-4" />,
};

const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero Section',
  featureList: 'Feature List',
  cta: 'Call to Action',
  testimonials: 'Testimonials',
  gallery: 'Gallery',
  stats: 'Statistics',
  faq: 'FAQ',
  team: 'Team',
  pricing: 'Pricing',
  contact: 'Contact',
  content: 'Content Block',
  custom: 'Custom Section',
};

interface SectionCardProps {
  section: Section;
  index: number;
  isDragging?: boolean;
  onEdit?: (section: Section) => void;
  onDelete?: (sectionId: string) => void;
  onDuplicate?: (section: Section) => void;
  onToggleVisibility?: (sectionId: string) => void;
  currentLanguage?: 'en' | 'mm';
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function SectionCard({
  section,
  index,
  isDragging,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  currentLanguage = 'en',
  dragHandleProps,
}: SectionCardProps) {
  const title = getLocalizedText(section.title, currentLanguage);
  const name = section.name;
  const isVisible = section.isVisible !== false;

  return (
    <Card
      className={`transition-all ${
        isDragging
          ? 'shadow-lg border-primary ring-2 ring-primary/20'
          : 'hover:shadow-md'
      } ${!isVisible ? 'opacity-60' : ''}`}
    >
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Section Icon and Info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-2 bg-muted rounded-lg">
              {SECTION_ICONS[section.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{title || name}</span>
                {section.isReusable && (
                  <Badge variant="outline" className="text-xs">
                    <Layers className="h-3 w-3 mr-1" />
                    Reusable
                  </Badge>
                )}
                {!isVisible && (
                  <Badge variant="secondary" className="text-xs">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hidden
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {SECTION_LABELS[section.type]} • Order: {section.order}
              </div>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(section)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onToggleVisibility && (
                <DropdownMenuItem onClick={() => onToggleVisibility(section._id)}>
                  {isVisible ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(section)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(section._id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
    </Card>
  );
}

export default SectionCard;
