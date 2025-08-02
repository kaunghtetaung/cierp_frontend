// Search component types
// Based on managementpanel architecture

export interface SearchResult {
  id: string;
  title: string;
  type: 'page' | 'post' | 'category' | 'tag';
  url: string;
  excerpt?: string;
  thumbnail?: string;
  date?: string;
}

export interface SearchContextValue {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  hasSearched: boolean;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export interface SearchProviderProps {
  children: React.ReactNode;
  searchEndpoint?: string;
  debounceMs?: number;
}

export interface SearchBoxProps {
  variant?: 'default' | 'compact' | 'placeholderOnly';
  placeholder?: string;
  expandOnMobile?: boolean;
  showSearchIcon?: boolean;
  autoFocus?: boolean;
  className?: string;
  onSubmit?: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
  className?: string;
  onResultClick?: (result: SearchResult) => void;
}

export interface SearchWrapperProps {
  children: React.ReactNode;
  className?: string;
  searchEndpoint?: string;
  debounceMs?: number;
}