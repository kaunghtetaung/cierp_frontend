// Icon Selector Component for CMS Management Panel
// Dropdown with search, categories, and icon preview
'use client';

import React, { useState, useMemo } from 'react';
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
  
  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    if (searchQuery.trim()) {
      return searchIcons(searchQuery);
    }
    
    if (selectedCategory === 'all') {
      return Object.entries(ICON_REGISTRY).flatMap(([category, icons]) =>
        icons.map(iconName => ({ iconName, category: category as IconCategory }))
      );
    }
    
    return getIconsByCategory(selectedCategory).map(iconName => ({
      iconName,
      category: selectedCategory,
    }));
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
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
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
            <button
              type="button"
              onClick={handleClearSelection}
              className="flex items-center p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown 
            size={16} 
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        </div>
      </button>
      
      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`
            absolute top-full left-0 right-0 z-50 mt-1
            border border-border rounded-md bg-popover text-popover-foreground
            shadow-lg max-h-[${maxHeight}px] overflow-hidden
            flex flex-col
          `}
          style={{ maxHeight: `${maxHeight}px` }}
        >
          {/* Search and Filter Header */}
          <div className="p-3 border-b border-border">
            {/* Search Input */}
            <div className="relative mb-2">
              <Search 
                size={16} 
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as IconCategory | 'all')}
              className="w-full p-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
          <div className="flex-1 overflow-auto p-2">
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
                      onClick={() => handleIconSelect(iconName)}
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
                      <IconComponent name={iconName} size={20} />
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
      )}
      
      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default IconSelector;