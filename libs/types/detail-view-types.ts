/**
 * Detail view schema types for displaying record details
 */

import { MultilingualText } from './module-schema';

// Layout types for detail view
export type DetailViewLayout = 'standard' | 'card' | 'tabbed' | 'printable';

// Section layout types
export type SectionLayout = 'grid' | 'list' | 'table';

// Field rendering types
export type FieldRenderType = 'text' | 'badge' | 'link' | 'list' | 'table';

// Field type
export type DetailFieldType = 'text' | 'textArea' | 'number' | 'date' | 'checkbox' | 'select';

// Print configuration
export interface PrintConfig {
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  showHeader: boolean;
  showFooter: boolean;
  headerContent: MultilingualText;
  footerContent: MultilingualText;
}

// Detail view field configuration
export interface DetailViewField {
  fieldName: string; // Path to data field (supports nested: 'author.name')
  label: MultilingualText;
  type: DetailFieldType;
  visible: boolean;
  printable: boolean;
  colspan?: number; // Grid column span (1-4)
  renderAs?: FieldRenderType; // How to render the field
  displayFormat?: string; // Format string for dates/numbers
}

// Detail view section configuration
export interface DetailViewSection {
  name: string; // Section identifier
  title: MultilingualText;
  layout: SectionLayout;
  columns?: number; // Number of columns for grid layout
  fields: DetailViewField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  printable?: boolean;
}

// Complete detail view schema
export interface DetailViewSchema {
  layout: DetailViewLayout;
  sections: DetailViewSection[];
  printConfig?: PrintConfig;
}