// Icon Selector Component for CMS Management Panel
// Dropdown with search, categories, and icon preview
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X } from 'lucide-react';
import { 
  ICON_CATEGORIES, 
  ICON_REGISTRY, 
  searchIcons, 
  getIconsByCategory,
  type IconCategory 
} from './icon-registry';
import { IconComponent } from './IconComponent';

export interface IconSelectorProps {
  /** Currently selected icon name */
  value?: string;
  /** Callback when icon is selected */
  onSelect: (iconName: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** CSS class name for the container */
  className?: string;
  /** Maximum height for the dropdown */
  maxHeight?: number;
  /** Show category labels */
  showCategories?: boolean;
  /** Icons per row in the grid */
  iconsPerRow?: number;
}

/**
 * IconSelector - Advanced icon picker for CMS management
 * 
 * Features:
 * - Search functionality
 * - Category filtering
 * - Icon preview
 * - Keyboard navigation
 * - Responsive grid layout
 */
export function IconSelector({
  value,
  onSelect,
  placeholder = 'Select an icon...',
  disabled = false,
  className = '',
  maxHeight = 400,
  showCategories = true,
  iconsPerRow = 8,
}: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IconCategory | 'all'>('all');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // Calculate dropdown position based on trigger button
  const DROPDOWN_MIN_WIDTH = 420;
  const VIEWPORT_PADDING = 8;

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vpHeight = window.innerHeight;
    const vpWidth = window.innerWidth;
    const dropWidth = Math.max(rect.width, DROPDOWN_MIN_WIDTH);
    const gap = 4;
    const spaceBelow = vpHeight - rect.bottom - gap - VIEWPORT_PADDING;
    const spaceAbove = rect.top - gap - VIEWPORT_PADDING;
    const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
    const availableSpace = openAbove ? spaceAbove : spaceBelow;
    const effectiveMaxH = Math.min(maxHeight, Math.max(availableSpace, 200));

    // Align right edge to trigger right edge; clamp so it doesn't go off-screen left
    let left = rect.right - dropWidth;
    if (left < VIEWPORT_PADDING) left = VIEWPORT_PADDING;
    if (left + dropWidth > vpWidth - VIEWPORT_PADDING) left = vpWidth - VIEWPORT_PADDING - dropWidth;

    setDropdownStyle({
      position: 'fixed',
      top: openAbove ? undefined : rect.bottom + gap,
      bottom: openAbove ? vpHeight - rect.top + gap : undefined,
      left,
      width: dropWidth,
      maxHeight: effectiveMaxH,
    });
  }, [maxHeight]);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      // Update position on scroll/resize (handles dialog scrolling too)
      const handleReposition = () => updateDropdownPosition();
      window.addEventListener('scroll', handleReposition, true);
      window.addEventListener('resize', handleReposition);
      return () => {
        window.removeEventListener('scroll', handleReposition, true);
        window.removeEventListener('resize', handleReposition);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Defeat Radix Dialog's scroll-lock (react-remove-scroll) which registers a
  // document-level `wheel` listener that calls `preventDefault()` on events from
  // elements outside the dialog.  We stop propagation at the portal level so the
  // document listener never sees it.
  useEffect(() => {
    if (!isOpen) return;
    const portalRoot = document.querySelector(
      'body > [data-icon-selector-portal]'
    ) as HTMLElement | null;
    if (!portalRoot) return;

    const stopWheel = (e: Event) => {
      e.stopPropagation();
    };
    portalRoot.addEventListener('wheel', stopWheel, { passive: true });

    return () => {
      portalRoot.removeEventListener('wheel', stopWheel);
    };
  }, [isOpen]);

  // Defeat Radix Dialog's focus trap so our portaled dropdown can receive focus.
  // Radix FocusScope registers a `focusin` listener on the document BEFORE our
  // useEffect runs, so `stopImmediatePropagation` cannot beat it.  Instead, we
  // temporarily override `HTMLElement.prototype.focus` to suppress the `.focus()`
  // call Radix makes on elements outside our portal.
  useEffect(() => {
    if (!isOpen) return;

    const input = searchInputRef.current;
    if (!input) return;

    // Use the outermost portal wrapper for containment checks
    const portalRoot = document.querySelector(
      'body > [data-icon-selector-portal]'
    ) as HTMLElement | null;
    if (!portalRoot) return;

    const originalFocus = HTMLElement.prototype.focus;

    // When the icon-selector portal is open, prevent Radix from pulling focus
    // back into the dialog by silently ignoring `.focus()` calls on elements
    // that live outside the portal.
    HTMLElement.prototype.focus = function (...args: [FocusOptions?]) {
      if (portalRoot.contains(this)) {
        return originalFocus.apply(this, args);
      }
      // Swallow – Radix is trying to reclaim focus
      return undefined as void;
    };

    // Delay initial focus so the portal DOM is fully mounted
    const timer = setTimeout(() => {
      originalFocus.call(input, { preventScroll: true });
    }, 0);

    return () => {
      clearTimeout(timer);
      HTMLElement.prototype.focus = originalFocus;
    };
  }, [isOpen]);

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    let icons: { iconName: string; category: IconCategory }[] = [];
    
    if (searchQuery.trim()) {
      icons = searchIcons(searchQuery);
    } else if (selectedCategory === 'all') {
      icons = Object.entries(ICON_REGISTRY).flatMap(([category, iconNames]) =>
        iconNames.map(iconName => ({ iconName, category: category as IconCategory }))
      );
    } else {
      icons = getIconsByCategory(selectedCategory).map(iconName => ({
        iconName,
        category: selectedCategory,
      }));
    }
    
    // Remove duplicates by iconName, keeping the first occurrence
    const uniqueIcons = icons.filter((icon, index, array) => 
      array.findIndex(item => item.iconName === icon.iconName) === index
    );
    
    return uniqueIcons;
  }, [searchQuery, selectedCategory]);
  
  // Group icons by category for display
  const groupedIcons = useMemo(() => {
    const groups: Record<string, { iconName: string; category: IconCategory }[]> = {};
    
    filteredIcons.forEach(item => {
      const categoryKey = showCategories ? item.category : 'all';
      if (!groups[categoryKey]) {
        groups[categoryKey] = [];
      }
      groups[categoryKey].push(item);
    });
    
    return groups;
  }, [filteredIcons, showCategories]);
  
  const handleIconSelect = (iconName: string) => {
    onSelect(iconName);
    setIsOpen(false);
    setSearchQuery('');
  };
  
  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect('');
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className={`
          flex items-center justify-between gap-2 w-full px-3 py-2 
          border border-input rounded-md bg-background text-foreground
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          hover:bg-accent hover:text-accent-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        `}
      >
        <div className="flex items-center gap-2 flex-1">
          {value ? (
            <>
              <IconComponent name={value} size={16} />
              <span>{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">
              {placeholder}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {value && (
            <span
              onClick={handleClearSelection}
              className="flex items-center p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown 
            size={16} 
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        </div>
      </button>
      
      {/* Portal-rendered backdrop + dropdown to escape dialog overflow/z-index */}
      {isOpen && createPortal(
        <div
          data-icon-selector-portal=""
          className="fixed inset-0"
          style={{ zIndex: 99999, pointerEvents: 'none' }}
        >
          {/* Backdrop to close dropdown — stop propagation so the dialog underneath doesn't also close */}
          <div
            className="fixed inset-0 cursor-default"
            style={{ zIndex: 1, pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsOpen(false);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          />

          {/* Dropdown Panel */}
          <div
            data-icon-selector-portal=""
            className="border border-border rounded-md bg-popover text-popover-foreground shadow-lg overflow-hidden flex flex-col"
            style={{ ...dropdownStyle, zIndex: 2, pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Search and Filter Header */}
            <div className="p-3 border-b border-border">
              {/* Search Input */}
              <div className="mb-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search icons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as IconCategory | 'all')}
                className="w-full p-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {Object.entries(ICON_CATEGORIES).map(([key, category]) => (
                  <option key={key} value={key}>
                    {category.label} ({ICON_REGISTRY[key as IconCategory]?.length || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Icons Grid */}
            <div className="flex-1 overflow-auto p-2" style={{ scrollbarWidth: 'thin' }}>
              {Object.entries(groupedIcons).map(([categoryKey, icons]) => (
                <div key={categoryKey} className="mb-4">
                  {showCategories && categoryKey !== 'all' && (
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                      {ICON_CATEGORIES[categoryKey as IconCategory]?.label || categoryKey}
                    </h4>
                  )}

                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${iconsPerRow}, 1fr)`,
                    }}
                  >
                    {icons.map(({ iconName }) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleIconSelect(iconName);
                        }}
                        title={iconName}
                        className={`
                          flex items-center justify-center p-2 min-h-[2.5rem]
                          border border-transparent rounded-md cursor-pointer
                          transition-all duration-200 ease-in-out
                          ${value === iconName
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'hover:bg-accent hover:text-accent-foreground hover:border-border'
                          }
                        `}
                      >
                        <IconComponent name={iconName} size={20} className="pointer-events-none" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {filteredIcons.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <IconComponent name="Search" size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No icons found</p>
                  {searchQuery && (
                    <p className="text-sm mt-1">
                      Try a different search term
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer with count */}
            <div className="px-3 py-2 border-t border-border text-xs text-muted-foreground text-center">
              {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default IconSelector;