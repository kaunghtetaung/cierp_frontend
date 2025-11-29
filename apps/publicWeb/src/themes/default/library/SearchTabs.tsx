'use client';

import { useState } from 'react';
import { useLangSelector } from '@/feature-components/lang-selector';
import { SimpleSearch, SearchType, SortBy, SortOrder } from './SimpleSearch';
import { AdvancedSearch, type AdvancedSearchParams } from './AdvancedSearch';

type SearchMode = 'simple' | 'advanced';

interface SearchTabsProps {
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
}

export function SearchTabs({
  onSearch,
  onAdvancedSearch,
  isLoading,
  initialQuery,
  initialSearchType,
  initialCatalogType,
  initialSortBy,
  initialSortOrder,
  initialAdvancedParams,
  initialMode = 'simple'
}: SearchTabsProps) {
  // Auto-select advanced tab if initialAdvancedParams exists or initialMode is 'advanced'
  const [activeTab, setActiveTab] = useState<SearchMode>(
    initialAdvancedParams?.searchCriteria?.length ? 'advanced' : initialMode
  );
  const { currentLanguage } = useLangSelector();

  const texts = {
    simpleSearch: currentLanguage === 'mm' ? 'ရိုးရှင်းရှာဖွေမှု' : 'Simple Search',
    advancedSearch: currentLanguage === 'mm' ? 'အဆင့်မြင့်ရှာဖွေမှု' : 'Advanced Search',
  };

  return (
    <div className="w-full">
      {/* Tab Header */}
      <div className="flex border-b border-white/30 mb-6">
        <button
          onClick={() => setActiveTab('simple')}
          className={`px-6 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'simple'
              ? 'border-b-2'
              : 'hover:text-white/90'
          }`}
          style={{
            color: '#FFF',
            borderBottomColor: activeTab === 'simple' ? '#FF6855' : 'transparent'
          }}
        >
          {texts.simpleSearch}
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`px-6 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'advanced'
              ? 'border-b-2'
              : 'hover:text-white/90'
          }`}
          style={{
            color: '#FFF',
            borderBottomColor: activeTab === 'advanced' ? '#FF6855' : 'transparent'
          }}
        >
          {texts.advancedSearch}
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'simple' ? (
          <SimpleSearch
            onSearch={onSearch}
            isLoading={isLoading}
            initialQuery={initialQuery}
            initialSearchType={initialSearchType}
            initialCatalogType={initialCatalogType}
            initialSortBy={initialSortBy}
            initialSortOrder={initialSortOrder}
          />
        ) : (
          <AdvancedSearch
            onSearch={(params) => {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('🔗 [SearchTabs] onSearch wrapper called!');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('   params:', JSON.stringify(params, null, 2));
              console.log('   onAdvancedSearch exists:', !!onAdvancedSearch);
              console.log('   onAdvancedSearch type:', typeof onAdvancedSearch);
              if (onAdvancedSearch) {
                console.log('🚀 [SearchTabs] Calling onAdvancedSearch...');
                onAdvancedSearch(params);
                console.log('✅ [SearchTabs] onAdvancedSearch called!');
              } else {
                console.warn('⚠️ [SearchTabs] onAdvancedSearch is NOT defined!');
              }
            }}
            isLoading={isLoading}
            initialParams={initialAdvancedParams}
          />
        )}
      </div>
    </div>
  );
}
