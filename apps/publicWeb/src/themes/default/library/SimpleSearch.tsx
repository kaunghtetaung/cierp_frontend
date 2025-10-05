'use client';

import { useState, FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCatalogTypesReference, type CatalogType } from '@/actions/library/catalog-types.actions';
import { useLangSelector } from '@/feature-components/lang-selector';

export type SearchType = 'exact' | 'contains';
export type SortBy = 'title' | 'year' | 'author' | 'publisher';
export type SortOrder = 'asc' | 'desc';

interface SimpleSearchProps {
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

export function SimpleSearch({
  onSearch,
  isLoading,
  initialQuery = '',
  initialSearchType = 'contains',
  initialCatalogType = '',
  initialSortBy = 'year',
  initialSortOrder = 'desc'
}: SimpleSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>(initialSearchType);
  const [catalogTypeName, setCatalogTypeName] = useState(initialCatalogType);
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);
  const { currentLanguage } = useLangSelector();

  // Fetch catalog types using React Query
  const { data: catalogTypes, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['catalog-types-reference'],
    queryFn: () => getCatalogTypesReference(),
    staleTime: 10 * 60 * 1000, // 10 minutes - reference data doesn't change often
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), searchType, catalogTypeName, sortBy, sortOrder);
    }
  };

  // Multilingual text
  const texts = {
    allCategories: currentLanguage === 'mm' ? 'အမျိုးအစားအားလုံး' : 'All Categories',
    loading: currentLanguage === 'mm' ? 'ရှာဖွေနေသည်...' : 'Loading...',
    searchPlaceholder: currentLanguage === 'mm'
      ? 'စာအုပ်များ၊ စာရေးဆရာများ၊ ISBN...'
      : 'Search books, authors, ISBN...',
    searchButton: currentLanguage === 'mm' ? 'ရှာဖွေမည်' : 'Search',
    searching: currentLanguage === 'mm' ? 'ရှာဖွေနေသည်...' : 'Searching...',
    exactMatch: currentLanguage === 'mm' ? 'အတိအကျ' : 'Exact match',
    contains: currentLanguage === 'mm' ? 'ပါဝင်သော' : 'Contains',
    searchTip: currentLanguage === 'mm'
      ? 'ခေါင်းစဉ်၊ စာရေးဆရာ၊ ထုတ်ဝေသူ၊ ဘာသာရပ်၊ ဘွဲ့အလိုက် ရှာဖွေနိုင်သည်'
      : 'Search by title, author, publisher, subject, degree',
    sortBy: currentLanguage === 'mm' ? 'စီစဉ်ပုံ' : 'Sort by',
    sortOrder: currentLanguage === 'mm' ? 'စီစဉ်ဖြင့်' : 'Order',
    title: currentLanguage === 'mm' ? 'ခေါင်းစဉ်' : 'Title',
    year: currentLanguage === 'mm' ? 'နှစ်' : 'Year',
    author: currentLanguage === 'mm' ? 'စာရေးသူ' : 'Author',
    publisher: currentLanguage === 'mm' ? 'ထုတ်ဝေသူ' : 'Publisher',
    ascending: currentLanguage === 'mm' ? 'အတက်' : 'Ascending',
    descending: currentLanguage === 'mm' ? 'အဆင်း' : 'Descending'
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Search Input Row: Catalog Type + Search Input + Search Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Catalog Type Select */}
          <div className="sm:w-[220px]">
            <select
              id="catalogType"
              aria-label="Catalog Type"
              value={catalogTypeName}
              onChange={(e) => setCatalogTypeName(e.target.value)}
              disabled={isLoading || isLoadingTypes}
              className="w-full h-[52px] border-2 border-input bg-background text-foreground rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-primary/50"
            >
              <option value="">{texts.allCategories}</option>
              {isLoadingTypes ? (
                <option disabled>{texts.loading}</option>
              ) : (
                catalogTypes?.map((type) => (
                  <option key={type._id} value={type.label}>
                    {type.label}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={texts.searchPlaceholder}
              className="w-full h-[52px] border-2 border-input bg-background text-foreground rounded-lg px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 shadow-sm hover:border-primary/50"
              disabled={isLoading}
              autoFocus={!!initialQuery}
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="h-[52px] px-10 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: '#FF6855',
              color: '#FFF'
            }}
          >
            {isLoading ? texts.searching : texts.searchButton}
          </button>
        </div>

        {/* Search Type Row: Radio Buttons */}
        <div className="flex items-center justify-center gap-8">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="searchType"
              value="exact"
              checked={searchType === 'exact'}
              onChange={(e) => setSearchType(e.target.value as SearchType)}
              disabled={isLoading}
              className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary border-input disabled:opacity-50 cursor-pointer"
            />
            <span className="text-sm font-medium group-hover:opacity-80 transition-colors" style={{ color: '#FFF' }}>
              {texts.exactMatch}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="searchType"
              value="contains"
              checked={searchType === 'contains'}
              onChange={(e) => setSearchType(e.target.value as SearchType)}
              disabled={isLoading}
              className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary border-input disabled:opacity-50 cursor-pointer"
            />
            <span className="text-sm font-medium group-hover:opacity-80 transition-colors" style={{ color: '#FFF' }}>
              {texts.contains}
            </span>
          </label>
        </div>

        {/* Sort Controls Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Sort By */}
          <div className="flex items-center gap-2">
            <label htmlFor="sortBy" className="text-sm font-medium whitespace-nowrap" style={{ color: '#FFF' }}>
              {texts.sortBy}:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              disabled={isLoading}
              className="px-3 py-1.5 border border-input bg-background text-foreground text-sm rounded-lg hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <option value="title">{texts.title}</option>
              <option value="year">{texts.year}</option>
              <option value="author">{texts.author}</option>
              <option value="publisher">{texts.publisher}</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <label htmlFor="sortOrder" className="text-sm font-medium whitespace-nowrap" style={{ color: '#FFF' }}>
              {texts.sortOrder}:
            </label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              disabled={isLoading}
              className="px-3 py-1.5 border border-input bg-background text-foreground text-sm rounded-lg hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <option value="asc">{texts.ascending}</option>
              <option value="desc">{texts.descending}</option>
            </select>
          </div>
        </div>
      </form>

      {/* Search Tips */}
      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{texts.searchTip}</span>
      </div>
    </div>
  );
}
