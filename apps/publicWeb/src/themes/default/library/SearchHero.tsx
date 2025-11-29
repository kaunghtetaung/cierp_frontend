'use client';

import { useState } from 'react';
import { SearchTabs } from './SearchTabs';
import { SearchType, SortBy, SortOrder } from './SimpleSearch';
import { type AdvancedSearchParams } from './AdvancedSearch';
import { getAsset } from '@/lib/theme-assets';
import { useLangSelector } from '@/feature-components/lang-selector';

type SearchMode = 'simple' | 'advanced';

interface SearchHeroProps {
  onSearch: (
    query: string,
    searchType: SearchType,
    catalogTypeName: string,
    sortBy: SortBy,
    sortOrder: SortOrder
  ) => void;
  onAdvancedSearch?: (params: AdvancedSearchParams) => void;
  isLoading?: boolean;
  initialQuery?: string;
  initialSearchType?: SearchType;
  initialCatalogType?: string;
  initialSortBy?: SortBy;
  initialSortOrder?: SortOrder;
  initialAdvancedParams?: Partial<AdvancedSearchParams>;
  initialMode?: SearchMode;
  title?: string;
  subtitle?: string;
  collapsible?: boolean;
}

export function SearchHero({
  onSearch,
  onAdvancedSearch,
  isLoading,
  initialQuery,
  initialSearchType,
  initialCatalogType,
  initialSortBy,
  initialSortOrder,
  initialAdvancedParams,
  initialMode = 'simple',
  title = 'Library Catalog',
  subtitle = 'Explore our extensive collection of books, journals, and digital resources',
  collapsible = false
}: SearchHeroProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const { currentLanguage } = useLangSelector();

  // Get theme-specific banner
  const bannerSvg = getAsset('banners', 'library');

  const texts = {
    searchPlaceholder: currentLanguage === 'mm'
      ? 'စာအုပ်များ၊ စာရေးဆရာများ၊ ISBN...'
      : 'Search books, authors, ISBN...',
    expand: currentLanguage === 'mm' ? 'တိုးချဲ့မည်' : 'Expand',
    collapse: currentLanguage === 'mm' ? 'ခေါက်သိမ်းမည်' : 'Collapse'
  };

  return (
    <section
      className="border-b border-border bg-no-repeat bg-center bg-cover"
      style={{
        backgroundImage: `url('${bannerSvg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className={`container mx-auto px-4 ${collapsible ? 'py-4' : 'py-12 md:py-16'}`}>
        <div className="max-w-3xl mx-auto text-center">
          {/* Header - Only show when not collapsible or when expanded */}
          {(!collapsible || isExpanded) && (
            <>
              <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#FFF' }}>
                {title}
              </h1>
              <p className="text-lg mb-8" style={{ color: '#FFF' }}>
                {subtitle}
              </p>
            </>
          )}

          {/* Search Box with Tabs - Mirror Design */}
          <div className="relative">
            {/* Main Search Box */}
            <div
              className="backdrop-blur-sm rounded-xl shadow-lg border border-white/30 relative z-10 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(38, 102, 189, 0.75), rgba(32, 54, 117, 0.75))'
              }}
            >
              {/* Mini Search Bar - Only in collapsible mode when collapsed */}
              {collapsible && !isExpanded && (
                <div className="flex items-center gap-3 p-3 bg-white">
                  {/* Search Icon */}
                  <div className="flex-shrink-0 ml-2 text-primary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Search Input - Full width */}
                  <div className="flex-1">
                    <input
                      type="text"
                      defaultValue={initialQuery}
                      placeholder={texts.searchPlaceholder}
                      onClick={() => setIsExpanded(true)}
                      className="w-full bg-transparent border-0 focus:outline-none text-sm text-primary placeholder:text-primary/60 font-medium"
                      readOnly
                    />
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="flex-shrink-0 p-2 rounded-lg hover:bg-primary/10 transition-all text-primary"
                    title={texts.expand}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Full Search Form */}
              {(!collapsible || isExpanded) && (
                <div className="p-6">
                  <SearchTabs
                    onSearch={onSearch}
                    onAdvancedSearch={onAdvancedSearch}
                    isLoading={isLoading}
                    initialQuery={initialQuery}
                    initialSearchType={initialSearchType}
                    initialCatalogType={initialCatalogType}
                    initialSortBy={initialSortBy}
                    initialSortOrder={initialSortOrder}
                    initialAdvancedParams={initialAdvancedParams}
                    initialMode={initialMode}
                  />
                </div>
              )}
            </div>

            {/* Collapse Button - Below the search box when expanded and collapsible */}
            {collapsible && isExpanded && (
              <div className="flex justify-center mt-3 mb-4">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-all backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  title={texts.collapse}
                >
                  <svg
                    className="w-5 h-5 rotate-180"
                    style={{ color: '#FFF' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Mirror/Reflection Effect - Only show when not collapsible or expanded */}
            {(!collapsible || isExpanded) && (
              <div
                className="absolute inset-x-0 top-full mt-2 h-24 rounded-xl opacity-30 blur-sm pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(38, 102, 189, 0.4), rgba(32, 54, 117, 0.4))',
                  transform: 'scaleY(-0.5)',
                  transformOrigin: 'top',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)'
                }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
