/**
 * Column Ordering Utilities
 *
 * Handles column order persistence with user and module-specific storage
 */

// Fixed columns that cannot be moved or reordered
export const FIXED_COLUMNS = ['sr', 'actions', 'select'] as const;
export type FixedColumn = typeof FIXED_COLUMNS[number];

/**
 * Generate storage key for column order
 * Format: column-order:moduleSlug
 */
export function getColumnOrderStorageKey(moduleSlug: string): string {
  return `column-order:${moduleSlug}`;
}

/**
 * Check if a column is fixed (cannot be moved)
 */
export function isFixedColumn(columnId: string): boolean {
  return FIXED_COLUMNS.includes(columnId as FixedColumn);
}

/**
 * Enforce fixed column positions
 * Ensures sr, actions, select are always in the first positions in that order
 */
export function enforceFixedColumnPositions(columnOrder: string[]): string[] {
  const result: string[] = [];
  const movableColumns: string[] = [];

  // Separate fixed and movable columns
  columnOrder.forEach(colId => {
    if (isFixedColumn(colId)) {
      // Skip for now, will add in correct order
    } else {
      movableColumns.push(colId);
    }
  });

  // Add fixed columns in correct order (only if they exist in the original order)
  if (columnOrder.includes('sr')) {
    result.push('sr');
  }
  if (columnOrder.includes('actions')) {
    result.push('actions');
  }
  if (columnOrder.includes('select')) {
    result.push('select');
  }

  // Add movable columns
  result.push(...movableColumns);

  return result;
}

/**
 * Get default column order from column definitions
 */
export function getDefaultColumnOrder(columnIds: string[]): string[] {
  return enforceFixedColumnPositions(columnIds);
}

/**
 * Load column order from localStorage
 */
export function loadColumnOrder(
  moduleSlug: string,
  defaultOrder: string[]
): string[] {
  if (typeof window === 'undefined') {
    return defaultOrder;
  }

  try {
    const key = getColumnOrderStorageKey(moduleSlug);
    const stored = localStorage.getItem(key);

    if (stored) {
      const order = JSON.parse(stored) as string[];
      // Validate that stored order contains all expected columns
      const hasAllColumns = defaultOrder.every(col => order.includes(col));
      const hasNoExtraColumns = order.every(col => defaultOrder.includes(col));

      if (hasAllColumns && hasNoExtraColumns) {
        return enforceFixedColumnPositions(order);
      }
    }
  } catch (error) {
    console.warn('[columnOrderUtils] Failed to load column order:', error);
  }

  return defaultOrder;
}

/**
 * Save column order to localStorage
 */
export function saveColumnOrder(
  moduleSlug: string,
  columnOrder: string[]
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = getColumnOrderStorageKey(moduleSlug);
    const enforcedOrder = enforceFixedColumnPositions(columnOrder);
    localStorage.setItem(key, JSON.stringify(enforcedOrder));
  } catch (error) {
    console.warn('[columnOrderUtils] Failed to save column order:', error);
  }
}

/**
 * Move column to a new position
 * Returns the new column order array
 */
export function moveColumn(
  currentOrder: string[],
  columnId: string,
  targetIndex: number
): string[] {
  // Don't allow moving fixed columns
  if (isFixedColumn(columnId)) {
    return currentOrder;
  }

  const newOrder = [...currentOrder];
  const currentIndex = newOrder.indexOf(columnId);

  if (currentIndex === -1) {
    return currentOrder;
  }

  // Remove from current position
  newOrder.splice(currentIndex, 1);

  // Calculate adjusted target index (accounting for removal)
  const adjustedTargetIndex = currentIndex < targetIndex
    ? targetIndex - 1
    : targetIndex;

  // Ensure we don't insert before fixed columns
  const firstMovableIndex = newOrder.findIndex(col => !isFixedColumn(col));
  const safeTargetIndex = Math.max(adjustedTargetIndex, firstMovableIndex);

  // Insert at new position
  newOrder.splice(safeTargetIndex, 0, columnId);

  return enforceFixedColumnPositions(newOrder);
}

/**
 * Move column to first movable position (after fixed columns)
 */
export function moveColumnToFirst(currentOrder: string[], columnId: string): string[] {
  if (isFixedColumn(columnId)) {
    return currentOrder;
  }

  const newOrder = [...currentOrder];
  const currentIndex = newOrder.indexOf(columnId);

  if (currentIndex === -1) {
    return currentOrder;
  }

  // Remove column
  newOrder.splice(currentIndex, 1);

  // Find first movable position
  const firstMovableIndex = newOrder.findIndex(col => !isFixedColumn(col));
  const targetIndex = firstMovableIndex === -1 ? newOrder.length : firstMovableIndex;

  // Insert at first movable position
  newOrder.splice(targetIndex, 0, columnId);

  return enforceFixedColumnPositions(newOrder);
}

/**
 * Move column to last position
 */
export function moveColumnToLast(currentOrder: string[], columnId: string): string[] {
  if (isFixedColumn(columnId)) {
    return currentOrder;
  }

  const newOrder = [...currentOrder];
  const currentIndex = newOrder.indexOf(columnId);

  if (currentIndex === -1) {
    return currentOrder;
  }

  // Remove column
  newOrder.splice(currentIndex, 1);

  // Add to end
  newOrder.push(columnId);

  return enforceFixedColumnPositions(newOrder);
}
