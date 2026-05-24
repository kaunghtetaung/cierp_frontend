'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLangSelector } from '@/feature-components/lang-selector';

interface AlphabetIndexProps {
  className?: string;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * A-Z Index component for browsing books by first letter of title
 * Links to advanced search with startsWith operator
 */
export function AlphabetIndex({ className = '' }: AlphabetIndexProps) {
  const searchParams = useSearchParams();
  const { currentLanguage } = useLangSelector();

  // Check if we're currently viewing a letter filter
  const currentLetter = searchParams.get('startsWith');

  // Build the URL for a letter
  // Uses advanced search: /library/search?mode=advanced with sessionStorage params
  const buildLetterUrl = (letter: string) => {
    // Store advanced search params in sessionStorage format
    const advancedParams = {
      catalogTypeFilter: 'any',
      searchCriteria: [
        {
          field: 'title',
          operator: 'startsWith',
          value: letter,
          logicalOperator: 'AND'
        }
      ],
      wordMatchMode: 'any',
      globalOperator: 'AND',
      page: 1,
      limit: 20,
      sortBy: 'title',
      sortOrder: 'asc'
    };

    // Encode params to pass via URL (will be decoded on search page)
    const encodedParams = encodeURIComponent(JSON.stringify(advancedParams));
    return `/library/search?mode=advanced&startsWith=${letter}&params=${encodedParams}`;
  };

  const texts = {
    browseByLetter: currentLanguage === 'mm' ? 'အက္ခရာအလိုက်ရှာဖွေရန်' : 'Browse A-Z',
    all: currentLanguage === 'mm' ? 'အားလုံး' : 'All'
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-center flex-wrap gap-1">
        {/* All link */}
        <Link
          href="/library"
          className={`
            px-2 py-1 text-sm font-medium rounded transition-all
            ${!currentLetter
              ? 'bg-white text-primary shadow-sm'
              : 'text-white/90 hover:bg-white/20 hover:text-white'
            }
          `}
        >
          {texts.all}
        </Link>

        {/* Separator */}
        <span className="text-white/40 mx-1">|</span>

        {/* A-Z Links */}
        {ALPHABET.map((letter) => (
          <Link
            key={letter}
            href={buildLetterUrl(letter)}
            onClick={(e) => {
              // Store params in sessionStorage before navigation
              const advancedParams = {
                catalogTypeFilter: 'any',
                searchCriteria: [
                  {
                    field: 'title',
                    operator: 'startsWith',
                    value: letter,
                    logicalOperator: 'AND'
                  }
                ],
                wordMatchMode: 'any',
                globalOperator: 'AND',
                page: 1,
                limit: 20,
                sortBy: 'title',
                sortOrder: 'asc'
              };
              sessionStorage.setItem('advancedSearchParams', JSON.stringify(advancedParams));
            }}
            className={`
              w-7 h-7 flex items-center justify-center text-sm font-medium rounded transition-all
              ${currentLetter === letter
                ? 'bg-white text-primary shadow-sm'
                : 'text-white/90 hover:bg-white/20 hover:text-white'
              }
            `}
          >
            {letter}
          </Link>
        ))}
      </div>
    </div>
  );
}
