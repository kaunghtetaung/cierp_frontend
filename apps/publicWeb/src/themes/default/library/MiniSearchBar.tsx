'use client';

import { useState } from 'react';
import { SearchTabs } from './SearchTabs';
import { SearchType, SortBy, SortOrder } from './SimpleSearch';
import { useLangSelector } from '@/feature-components/lang-selector';
import { getAsset } from '@/lib/theme-assets';

interface MiniSearchBarProps {
  onSearch: (
    query: string,
    searchType: SearchType,
    catalogTypeName: string,
    sortBy: SortBy,
    sortOrder: SortOrder
  ) => void;
  isLoading?: boolean;
  initialQuery?: string;
  initialSearchType?: SearchType;
  initialCatalogType?: string;
  initialSortBy?: SortBy;
  initialSortOrder?: SortOrder;
}

export function MiniSearchBar({
  onSearch,
  isLoading,
  initialQuery,
  initialSearchType,
  initialCatalogType,
  initialSortBy,
  initialSortOrder
}: MiniSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentLanguage } = useLangSelector();

  const texts = {
    search: currentLanguage === 'mm' ? 'ရှာဖွေမည်' : 'Search',
    searchPlaceholder: currentLanguage === 'mm'
      ? 'စာအုပ်များ၊ စာရေးဆရာများ၊ ISBN...'
      : 'Search books, authors, ISBN...',
    expand: currentLanguage === 'mm' ? 'တိုးချဲ့မည်' : 'Expand',
    collapse: currentLanguage === 'mm' ? 'ခေါက်သိမ်းမည်' : 'Collapse'
  };

  // Get theme-specific banner
  const bannerSvg = getAsset('banners', 'library');

  return (
    <div className="w-full">
      {/* Mini Search Bar - Always Visible */}
      <div
        className="border border-white/30 rounded-2xl shadow-md overflow-hidden bg-no-repeat bg-center bg-cover"
        style={{
          backgroundImage: `url('${bannerSvg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="flex items-center gap-3 p-3 backdrop-blur-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(38, 102, 189, 0.75), rgba(32, 54, 117, 0.75))'
          }}
        >
          {/* Search Icon */}
          <div className="flex-shrink-0 ml-2" style={{ color: '#FFF' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Search Input - Click to expand */}
          <div className="flex-1">
            <input
              type="text"
              defaultValue={initialQuery}
              placeholder={texts.searchPlaceholder}
              onClick={() => setIsExpanded(true)}
              className="w-full bg-transparent border-0 focus:outline-none text-sm"
              style={{ color: '#FFF' }}
              readOnly
            />
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-all"
            title={isExpanded ? texts.collapse : texts.expand}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              style={{ color: '#FFF' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Expanded Search Form */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div
            className="border-t border-white/30 p-6 backdrop-blur-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(38, 102, 189, 0.75), rgba(32, 54, 117, 0.75))'
            }}
          >
            <SearchTabs
              onSearch={onSearch}
              isLoading={isLoading}
              initialQuery={initialQuery}
              initialSearchType={initialSearchType}
              initialCatalogType={initialCatalogType}
              initialSortBy={initialSortBy}
              initialSortOrder={initialSortOrder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
