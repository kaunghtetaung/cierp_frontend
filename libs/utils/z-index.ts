/**
 * Z-Index Layer System
 * 
 * This file defines the z-index hierarchy for the entire application.
 * Use these constants instead of arbitrary z-index values to maintain proper layering.
 */

export const Z_INDEX = {
  // Base layer (default)
  BASE: 'z-0',
  
  // Content layers
  BELOW: 'z-10',
  DEFAULT: 'z-20',
  ABOVE: 'z-30',
  
  // UI component layers
  DROPDOWN: 'z-40',        // Dropdowns, selects, popovers
  SIDEBAR: 'z-50',         // Sidebar navigation
  HEADER: 'z-60',          // Fixed header/navigation
  MODAL_BACKDROP: 'z-70',  // Modal/dialog backdrops
  MODAL: 'z-80',           // Modal/dialog content
  TOOLTIP: 'z-90',         // Tooltips
  
  // Notification layers  
  TOAST: 'z-[100]',        // Toast notifications (highest priority)
  
  // Debug/dev layers (emergency use only)
  DEBUG: 'z-[9999]',
} as const;

export type ZIndexLayer = typeof Z_INDEX[keyof typeof Z_INDEX];