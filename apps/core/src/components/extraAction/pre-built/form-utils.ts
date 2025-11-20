/**
 * Utility functions for pre-built forms
 */

/**
 * Extract ID from selected items
 * Handles both string IDs and object records with _id/id fields
 *
 * @param selectedItems - Array of selected items (can be strings or objects)
 * @param index - Index of the item to extract (default: 0)
 * @returns The extracted ID string or null if not found
 */
export function extractItemId(selectedItems: any[], index: number = 0): string | null {
  if (!selectedItems || selectedItems.length === 0 || index >= selectedItems.length) {
    return null;
  }

  const item = selectedItems[index];

  // If it's already a string, return it
  if (typeof item === 'string') {
    return item;
  }

  // If it's an object, extract _id or id
  if (typeof item === 'object' && item !== null) {
    return item._id || item.id || null;
  }

  return null;
}

/**
 * Extract multiple IDs from selected items
 *
 * @param selectedItems - Array of selected items (can be strings or objects)
 * @returns Array of extracted ID strings
 */
export function extractItemIds(selectedItems: any[]): string[] {
  if (!selectedItems || selectedItems.length === 0) {
    return [];
  }

  return selectedItems
    .map(item => {
      if (typeof item === 'string') {
        return item;
      }
      if (typeof item === 'object' && item !== null) {
        return item._id || item.id || null;
      }
      return null;
    })
    .filter((id): id is string => id !== null);
}
