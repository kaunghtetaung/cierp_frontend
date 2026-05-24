'use client';

import { useQuery } from '@tanstack/react-query';
import { getCatalogTypesReference, type CatalogType } from '@/actions/library/catalog-types.actions';

interface CatalogTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CatalogTypeSelect({ value, onChange, disabled }: CatalogTypeSelectProps) {
  // Fetch catalog types using React Query
  const { data: catalogTypes, isLoading } = useQuery({
    queryKey: ['catalog-types-reference'],
    queryFn: () => getCatalogTypesReference(),
    staleTime: 10 * 60 * 1000, // 10 minutes - reference data doesn't change often
  });

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="catalogType" className="text-sm font-medium text-foreground whitespace-nowrap">
        Catalog Type:
      </label>
      <select
        id="catalogType"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        className="border border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
      >
        <option value="">All Categories</option>
        {isLoading ? (
          <option disabled>Loading...</option>
        ) : (
          catalogTypes?.map((type: CatalogType) => (
            <option key={type._id} value={type.label}>
              {type.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
