// Schema-driven table components
export { ModuleDataTable } from './ModuleDataTable';
export { DynamicSearch } from './DynamicSearch';
export { PrefilterSelect } from './PrefilterSelect';
export { PrefilterDependentSelect } from './PrefilterDependentSelect';
export { PrefilterTypeahead } from './PrefilterTypeahead';
export { PrefilterTabGroup } from './PrefilterTabGroup';
export { PrefilterSheet } from './PrefilterSheet';
export { PrefilterSheetTrigger } from './PrefilterSheetTrigger';
export { RecycleBinDialog, RecycleBinTrigger } from './RecycleBinDialog';

// Column ordering utilities - re-export from @repo/ui for backward compatibility
export {
  loadColumnOrder,
  saveColumnOrder,
  moveColumn,
  moveColumnToFirst,
  moveColumnToLast,
  enforceFixedColumnPositions,
  getDefaultColumnOrder,
  getColumnOrderStorageKey,
  isFixedColumn,
  FIXED_COLUMNS,
  type FixedColumn,
} from '@repo/ui';