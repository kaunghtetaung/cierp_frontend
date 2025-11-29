'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCatalogTypesReference, type CatalogType } from '@/actions/library/catalog-types.actions';
import { useLangSelector } from '@/feature-components/lang-selector';
import { Plus, Minus, Search, RotateCcw } from 'lucide-react';

// Types matching the API specification
export type SearchField = 'title' | 'subject' | 'publisher' | 'accessionNo' | 'year' | 'author' | 'degree' | 'any';
export type SearchOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'not';
export type LogicalOperator = 'AND' | 'OR' | 'NOT';
export type WordMatchMode = 'all' | 'any' | 'exact';
export type GlobalOperator = 'AND' | 'OR';
export type AdvancedSortBy = 'title' | 'year' | 'createdAt' | 'updatedAt' | 'relevance';

export interface SearchCriterion {
  id: string;
  field: SearchField;
  operator: SearchOperator;
  value: string;
  logicalOperator: LogicalOperator;
}

export interface AdvancedSearchParams {
  catalogTypeFilter: 'specific' | 'any';
  catalogTypeId?: string;
  searchCriteria: Omit<SearchCriterion, 'id'>[];
  wordMatchMode: WordMatchMode;
  globalOperator: GlobalOperator;
  page: number;
  limit: number;
  sortBy: AdvancedSortBy;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  onSearch: (params: AdvancedSearchParams) => void;
  isLoading?: boolean;
  initialParams?: Partial<AdvancedSearchParams>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultCriterion = (): SearchCriterion => ({
  id: generateId(),
  field: 'any',
  operator: 'contains',
  value: '',
  logicalOperator: 'AND',
});

export function AdvancedSearch({
  onSearch,
  isLoading,
  initialParams
}: AdvancedSearchProps) {
  const { currentLanguage } = useLangSelector();

  // Form state
  const [catalogTypeFilter, setCatalogTypeFilter] = useState<'specific' | 'any'>(
    initialParams?.catalogTypeFilter || 'any'
  );
  const [catalogTypeId, setCatalogTypeId] = useState(initialParams?.catalogTypeId || '');
  const [criteria, setCriteria] = useState<SearchCriterion[]>(
    initialParams?.searchCriteria?.map(c => ({ ...c, id: generateId() })) || [defaultCriterion()]
  );
  const [wordMatchMode, setWordMatchMode] = useState<WordMatchMode>(
    initialParams?.wordMatchMode || 'any'
  );
  const [globalOperator, setGlobalOperator] = useState<GlobalOperator>(
    initialParams?.globalOperator || 'AND'
  );
  const [sortBy, setSortBy] = useState<AdvancedSortBy>(
    initialParams?.sortBy || 'relevance'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    initialParams?.sortOrder || 'desc'
  );
  const [validationError, setValidationError] = useState<string>('');

  // Update form state when initialParams changes (for maintaining state after search)
  useEffect(() => {
    if (initialParams) {
      if (initialParams.catalogTypeFilter) setCatalogTypeFilter(initialParams.catalogTypeFilter);
      if (initialParams.catalogTypeId) setCatalogTypeId(initialParams.catalogTypeId);
      if (initialParams.searchCriteria?.length) {
        setCriteria(initialParams.searchCriteria.map(c => ({ ...c, id: generateId() })));
      }
      if (initialParams.wordMatchMode) setWordMatchMode(initialParams.wordMatchMode);
      if (initialParams.globalOperator) setGlobalOperator(initialParams.globalOperator);
      if (initialParams.sortBy) setSortBy(initialParams.sortBy);
      if (initialParams.sortOrder) setSortOrder(initialParams.sortOrder);
    }
  }, [initialParams]);

  // Fetch catalog types
  const { data: catalogTypes, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['catalog-types-reference'],
    queryFn: async () => {
      const result = await getCatalogTypesReference();
      console.log('📚 [AdvancedSearch] Catalog types loaded:', result);
      return result;
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  // Multilingual text
  const texts = {
    // Field labels
    searchField: currentLanguage === 'mm' ? 'ရှာဖွေရန် အကွက်' : 'Search Field',
    operator: currentLanguage === 'mm' ? 'စစ်ဆေးမှု' : 'Operator',
    value: currentLanguage === 'mm' ? 'တန်ဖိုး' : 'Value',

    // Fields
    any: currentLanguage === 'mm' ? 'အကွက်အားလုံး' : 'Any Field',
    title: currentLanguage === 'mm' ? 'ခေါင်းစဉ်' : 'Title',
    author: currentLanguage === 'mm' ? 'စာရေးသူ' : 'Author',
    publisher: currentLanguage === 'mm' ? 'ထုတ်ဝေသူ' : 'Publisher',
    subject: currentLanguage === 'mm' ? 'ဘာသာရပ်' : 'Subject',
    degree: currentLanguage === 'mm' ? 'ဘွဲ့' : 'Degree',
    year: currentLanguage === 'mm' ? 'ခုနှစ်' : 'Year',
    accessionNo: currentLanguage === 'mm' ? 'စာအုပ်နံပါတ်' : 'Accession No.',

    // Operators
    equals: currentLanguage === 'mm' ? 'အတိအကျ' : 'Equals',
    contains: currentLanguage === 'mm' ? 'ပါဝင်သော' : 'Contains',
    startsWith: currentLanguage === 'mm' ? 'စတင်သော' : 'Starts with',
    endsWith: currentLanguage === 'mm' ? 'အဆုံးသတ်' : 'Ends with',
    not: currentLanguage === 'mm' ? 'မပါဝင်သော' : 'Does not contain',

    // Logical operators
    and: 'AND',
    or: 'OR',
    notLogical: 'NOT',

    // Word match modes
    wordMatchMode: currentLanguage === 'mm' ? 'စကားလုံးတိုက်ဆိုင်မှု' : 'Word Match Mode',
    matchAll: currentLanguage === 'mm' ? 'အားလုံးတိုက်ဆိုင်' : 'All words must match',
    matchAny: currentLanguage === 'mm' ? 'တစ်ခုခုတိုက်ဆိုင်' : 'Any word matches',
    matchExact: currentLanguage === 'mm' ? 'စကားစုအတိအကျ' : 'Exact phrase',

    // Global operator
    combineWith: currentLanguage === 'mm' ? 'စည်းမျဥ်းများပေါင်းစည်း' : 'Combine criteria with',

    // Catalog type
    catalogType: currentLanguage === 'mm' ? 'အမျိုးအစား' : 'Catalog Type',
    allCategories: currentLanguage === 'mm' ? 'အမျိုးအစားအားလုံး' : 'All Categories',
    specificCategory: currentLanguage === 'mm' ? 'သတ်မှတ်ထားသော' : 'Specific Type',

    // Sort
    sortBy: currentLanguage === 'mm' ? 'စီစဉ်ပုံ' : 'Sort by',
    sortOrder: currentLanguage === 'mm' ? 'အစဉ်' : 'Order',
    relevance: currentLanguage === 'mm' ? 'ဆက်စပ်မှု' : 'Relevance',
    createdAt: currentLanguage === 'mm' ? 'ထည့်သွင်းသည့်ရက်' : 'Date Added',
    updatedAt: currentLanguage === 'mm' ? 'ပြင်ဆင်သည့်ရက်' : 'Last Updated',
    ascending: currentLanguage === 'mm' ? 'အတက်' : 'Ascending',
    descending: currentLanguage === 'mm' ? 'အဆင်း' : 'Descending',

    // Actions
    addCriterion: currentLanguage === 'mm' ? 'စည်းမျဥ်းထပ်ထည့်' : 'Add Criterion',
    removeCriterion: currentLanguage === 'mm' ? 'ဖယ်ရှား' : 'Remove',
    search: currentLanguage === 'mm' ? 'ရှာဖွေမည်' : 'Search',
    searching: currentLanguage === 'mm' ? 'ရှာဖွေနေသည်...' : 'Searching...',
    reset: currentLanguage === 'mm' ? 'ပြန်လည်စတင်' : 'Reset',

    // Validation
    enterSearchTerm: currentLanguage === 'mm' ? 'ရှာဖွေရန် စာသားထည့်ပါ' : 'Please enter at least one search term',

    // Tips
    searchTip: currentLanguage === 'mm'
      ? 'အဆင့်မြင့်ရှာဖွေမှုဖြင့် မျိုးစုံသော စည်းမျဥ်းများကို ပေါင်းစပ်ရှာဖွေနိုင်သည်'
      : 'Combine multiple search criteria with AND/OR logic',

    // Loading
    loading: currentLanguage === 'mm' ? 'ခေါ်ယူနေသည်...' : 'Loading...',
  };

  const fieldOptions: { value: SearchField; label: string }[] = [
    { value: 'any', label: texts.any },
    { value: 'title', label: texts.title },
    { value: 'author', label: texts.author },
    { value: 'publisher', label: texts.publisher },
    { value: 'subject', label: texts.subject },
    { value: 'degree', label: texts.degree },
    { value: 'year', label: texts.year },
    { value: 'accessionNo', label: texts.accessionNo },
  ];

  const operatorOptions: { value: SearchOperator; label: string }[] = [
    { value: 'contains', label: texts.contains },
    { value: 'equals', label: texts.equals },
    { value: 'startsWith', label: texts.startsWith },
    { value: 'endsWith', label: texts.endsWith },
    { value: 'not', label: texts.not },
  ];

  const logicalOperatorOptions: { value: LogicalOperator; label: string }[] = [
    { value: 'AND', label: texts.and },
    { value: 'OR', label: texts.or },
  ];

  // Handlers
  const handleAddCriterion = () => {
    setCriteria([...criteria, defaultCriterion()]);
  };

  const handleRemoveCriterion = (id: string) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter(c => c.id !== id));
    }
  };

  const handleCriterionChange = (id: string, field: keyof SearchCriterion, value: string) => {
    setCriteria(criteria.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleReset = () => {
    setCatalogTypeFilter('any');
    setCatalogTypeId('');
    setCriteria([defaultCriterion()]);
    setWordMatchMode('any');
    setGlobalOperator('AND');
    setSortBy('relevance');
    setSortOrder('desc');
    setValidationError('');
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('📋 [AdvancedSearch] Form submitted!');
    console.log('📋 [AdvancedSearch] onSearch function exists:', typeof onSearch === 'function');
    setValidationError('');

    // Validate: at least one criterion with a value
    const hasValidCriteria = criteria.some(c => c.value.trim().length > 0);
    if (!hasValidCriteria) {
      console.log('⚠️ [AdvancedSearch] Validation failed - no search terms');
      setValidationError(texts.enterSearchTerm);
      return;
    }

    // Build search params
    const params: AdvancedSearchParams = {
      catalogTypeFilter,
      ...(catalogTypeFilter === 'specific' && catalogTypeId && { catalogTypeId }),
      searchCriteria: criteria
        .filter(c => c.value.trim().length > 0)
        .map(({ field, operator, value, logicalOperator }) => ({
          field,
          operator,
          value: value.trim(),
          logicalOperator,
        })),
      wordMatchMode,
      globalOperator,
      page: 1,
      limit: 20,
      sortBy,
      sortOrder,
    };

    console.log('🔍 [AdvancedSearch] Calling onSearch with params:', JSON.stringify(params, null, 2));

    try {
      onSearch(params);
      console.log('✅ [AdvancedSearch] onSearch called successfully');
    } catch (error) {
      console.error('❌ [AdvancedSearch] Error calling onSearch:', error);
    }
  };

  return (
    <div className="w-full">
      {/* Validation Error */}
      {validationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-red-800">{validationError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Catalog Type Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="text-sm font-medium whitespace-nowrap" style={{ color: '#FFF' }}>
            {texts.catalogType}:
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="catalogTypeFilter"
                value="any"
                checked={catalogTypeFilter === 'any'}
                onChange={() => setCatalogTypeFilter('any')}
                disabled={isLoading}
                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm" style={{ color: '#FFF' }}>{texts.allCategories}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="catalogTypeFilter"
                value="specific"
                checked={catalogTypeFilter === 'specific'}
                onChange={() => setCatalogTypeFilter('specific')}
                disabled={isLoading}
                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm" style={{ color: '#FFF' }}>{texts.specificCategory}</span>
            </label>
            {catalogTypeFilter === 'specific' && (
              <select
                value={catalogTypeId}
                onChange={(e) => setCatalogTypeId(e.target.value)}
                disabled={isLoading || isLoadingTypes}
                className="px-3 py-1.5 border border-input bg-background text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{texts.allCategories}</option>
                {isLoadingTypes ? (
                  <option disabled>{texts.loading}</option>
                ) : (
                  Array.isArray(catalogTypes) && catalogTypes.map((type) => (
                    <option key={type._id} value={type.id || type._id}>
                      {type.label || type.name}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
        </div>

        {/* Search Criteria */}
        <div className="space-y-3">
          {criteria.map((criterion, index) => (
            <div
              key={criterion.id}
              className="p-4 rounded-lg border border-white/20 bg-white/5"
            >
              <div className="flex flex-col lg:flex-row gap-3 items-center">
                {/* Field Selector */}
                <div className="flex-1 lg:max-w-[180px]">
                  <select
                    value={criterion.field}
                    onChange={(e) => handleCriterionChange(criterion.id, 'field', e.target.value)}
                    disabled={isLoading}
                    aria-label={texts.searchField}
                    className="w-full h-10 px-3 border border-input bg-background text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {fieldOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Operator Selector */}
                <div className="flex-1 lg:max-w-[160px]">
                  <select
                    value={criterion.operator}
                    onChange={(e) => handleCriterionChange(criterion.id, 'operator', e.target.value)}
                    disabled={isLoading}
                    className="w-full h-10 px-3 border border-input bg-background text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {operatorOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Value Input */}
                <div className="flex-[2]">
                  <input
                    type="text"
                    value={criterion.value}
                    onChange={(e) => {
                      handleCriterionChange(criterion.id, 'value', e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    placeholder={texts.value}
                    disabled={isLoading}
                    className="w-full h-10 px-3 border border-input bg-background text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* AND/OR Selector (for non-last criteria) OR Add Button (for last criterion) */}
                {index < criteria.length - 1 ? (
                  <select
                    value={criteria[index + 1]?.logicalOperator || 'AND'}
                    onChange={(e) => {
                      const nextCriterion = criteria[index + 1];
                      if (nextCriterion) {
                        handleCriterionChange(nextCriterion.id, 'logicalOperator', e.target.value);
                      }
                    }}
                    disabled={isLoading}
                    aria-label="Logical operator"
                    className="w-16 h-10 px-2 border border-input bg-background text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary flex-shrink-0"
                  >
                    {logicalOperatorOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    disabled={isLoading}
                    className="w-16 h-10 flex-shrink-0 flex items-center justify-center text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 border border-green-300 hover:border-green-400 rounded-lg transition-colors"
                    title={texts.addCriterion}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}

                {/* Remove Button (after AND/OR or Add button) */}
                {criteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(criterion.id)}
                    disabled={isLoading}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-300 hover:border-red-400 rounded-lg transition-colors"
                    title={texts.removeCriterion}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Options and Sort Controls Row */}
        <div className="flex flex-wrap justify-center gap-6">
          {/* Word Match Mode */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium whitespace-nowrap" style={{ color: '#FFF' }}>
              {texts.wordMatchMode}
            </label>
            <select
              value={wordMatchMode}
              onChange={(e) => setWordMatchMode(e.target.value as WordMatchMode)}
              disabled={isLoading}
              className="px-3 py-1.5 border border-input bg-background text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="any">{texts.matchAny}</option>
              <option value="all">{texts.matchAll}</option>
              <option value="exact">{texts.matchExact}</option>
            </select>
          </div>

          {/* Global Operator */}
          {criteria.length > 1 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium whitespace-nowrap" style={{ color: '#FFF' }}>
                {texts.combineWith}
              </label>
              <select
                value={globalOperator}
                onChange={(e) => setGlobalOperator(e.target.value as GlobalOperator)}
                disabled={isLoading}
                className="px-3 py-1.5 border border-input bg-background text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="AND">{texts.and}</option>
                <option value="OR">{texts.or}</option>
              </select>
            </div>
          )}

          {/* Sort By */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium whitespace-nowrap" style={{ color: '#FFF' }}>
              {texts.sortBy}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as AdvancedSortBy)}
              disabled={isLoading}
              className="px-3 py-1.5 border border-input bg-background text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="relevance">{texts.relevance}</option>
              <option value="title">{texts.title}</option>
              <option value="year">{texts.year}</option>
              <option value="createdAt">{texts.createdAt}</option>
              <option value="updatedAt">{texts.updatedAt}</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium whitespace-nowrap" style={{ color: '#FFF' }}>
              {texts.sortOrder}
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              disabled={isLoading}
              className="px-3 py-1.5 border border-input bg-background text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="asc">{texts.ascending}</option>
              <option value="desc">{texts.descending}</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            onClick={() => console.log('🖱️ [AdvancedSearch] Search button clicked!')}
            className="h-12 px-8 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#FF6855',
              color: '#FFF'
            }}
          >
            <Search className="w-5 h-5" />
            {isLoading ? texts.searching : texts.search}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="h-12 px-6 rounded-lg font-medium border border-white/30 hover:border-white/50 text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {texts.reset}
          </button>
        </div>
      </form>

      {/* Search Tips */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white/60">
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
