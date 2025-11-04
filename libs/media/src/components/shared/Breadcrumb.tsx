/**
 * Breadcrumb Component
 * Shows current path and allows navigation
 */

import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
  className?: string;
}

export function Breadcrumb({ path, onNavigate, className }: BreadcrumbProps) {
  const pathParts = path.split('/').filter(Boolean);

  return (
    <nav className={className} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {/* Home/Root */}
        <li>
          <button
            onClick={() => onNavigate('')}
            className="flex items-center text-gray-600 hover:text-gray-900"
            aria-label="Home"
          >
            <Home size={16} />
          </button>
        </li>

        {/* Path segments */}
        {pathParts.map((part, index) => {
          const partPath = pathParts.slice(0, index + 1).join('/');
          const isLast = index === pathParts.length - 1;

          return (
            <li key={partPath} className="flex items-center">
              <ChevronRight size={16} className="text-gray-400 mx-1" />
              {isLast ? (
                <span className="font-medium text-gray-900">{part}</span>
              ) : (
                <button
                  onClick={() => onNavigate(partPath)}
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  {part}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
