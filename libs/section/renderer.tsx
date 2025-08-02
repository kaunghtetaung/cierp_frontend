// Section renderer component for dynamic section rendering
import React from "react";
import type { SectionData, SectionType } from "../types/section";
import {
  getSectionComponent,
  buildSectionClasses,
  buildSectionStyles,
  getLocalizedText,
  trackSectionView,
  getSectionAriaProps,
  shouldHaveLandmarkRole,
} from "./components";

/**
 * Props for SectionRenderer component
 */
export interface SectionRendererProps {
  section: SectionData;
  language?: string;
  className?: string;
  style?: React.CSSProperties;
  onSectionView?: (section: SectionData) => void;
  onSectionError?: (section: SectionData, error: Error) => void;
  trackAnalytics?: boolean;
  editMode?: boolean;
  placeholder?: React.ReactNode;
}

/**
 * Section renderer component that dynamically renders sections based on type
 */
export function SectionRenderer({
  section,
  language = "en",
  className,
  style,
  onSectionView,
  onSectionError,
  trackAnalytics = false,
  editMode = false,
  placeholder,
}: SectionRendererProps) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  // Get the component for this section type
  const SectionComponent = getSectionComponent(section.type);

  // Set up intersection observer for analytics
  React.useEffect(() => {
    if (!trackAnalytics || !sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            trackSectionView(section, language);
            onSectionView?.(section);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, [section, language, trackAnalytics, isVisible, onSectionView]);

  // Error boundary effect
  React.useEffect(() => {
    if (hasError && error) {
      onSectionError?.(section, error);
    }
  }, [hasError, error, section, onSectionError]);

  // Build section props
  const sectionClasses = buildSectionClasses(
    section,
    className ? [className] : []
  );
  const sectionStyles = { ...buildSectionStyles(section), ...style };
  const ariaProps = getSectionAriaProps(section, language);

  // Determine the HTML tag to use
  const Tag = shouldHaveLandmarkRole(section.type) ? "section" : "div";

  // Error boundary wrapper
  const renderWithErrorBoundary = (content: React.ReactNode) => {
    try {
      return content;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setHasError(true);
      setError(error);
      return (
        <SectionErrorFallback
          section={section}
          error={error}
          language={language}
        />
      );
    }
  };

  // Hide section if not visible and not in edit mode
  if (!section.isVisible && !editMode) {
    return null;
  }

  // Hide inactive sections unless in edit mode
  if (section.status === "Inactive" && !editMode) {
    return null;
  }

  // Render placeholder if no component is registered
  if (!SectionComponent) {
    return (
      <Tag
        ref={sectionRef}
        className={sectionClasses}
        style={sectionStyles}
        {...ariaProps}
      >
        {placeholder || (
          <SectionPlaceholder
            section={section}
            language={language}
            editMode={editMode}
          />
        )}
      </Tag>
    );
  }

  // Render the section with error boundary
  return (
    <Tag
      ref={sectionRef}
      className={sectionClasses}
      style={sectionStyles}
      {...ariaProps}
    >
      {renderWithErrorBoundary(
        <SectionComponent section={section} language={language} />
      )}
      {editMode && <SectionEditOverlay section={section} />}
    </Tag>
  );
}

/**
 * Error fallback component for section rendering errors
 */
interface SectionErrorFallbackProps {
  section: SectionData;
  error: Error;
  language: string;
}

function SectionErrorFallback({
  section,
  error,
  language,
}: SectionErrorFallbackProps) {
  return (
    <div className="section-error bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div className="text-red-600 mb-2">
        <svg
          className="w-8 h-8 mx-auto mb-2"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <h3 className="text-lg font-semibold">Section Error</h3>
      </div>
      <p className="text-gray-600 mb-3">
        Failed to render section: {getLocalizedText(section.title, language)}
      </p>
      <details className="text-sm text-gray-500">
        <summary className="cursor-pointer font-medium">Error Details</summary>
        <pre className="mt-2 text-left bg-gray-100 p-2 rounded overflow-auto">
          {error.message}
        </pre>
      </details>
    </div>
  );
}

/**
 * Placeholder component for unregistered section types
 */
interface SectionPlaceholderProps {
  section: SectionData;
  language: string;
  editMode: boolean;
}

function SectionPlaceholder({
  section,
  language,
  editMode,
}: SectionPlaceholderProps) {
  return (
    <div className="section-placeholder bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <div className="text-gray-500 mb-4">
        <svg
          className="w-12 h-12 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700">
          {getLocalizedText(section.title, language)}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Section type: {section.type}
        </p>
      </div>

      {editMode ? (
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            Component not registered for this section type.
          </p>
          <p>
            Register a component using{" "}
            <code className="bg-gray-200 px-1 rounded">
              registerSectionComponent
            </code>
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          This section is not available for display.
        </p>
      )}
    </div>
  );
}

/**
 * Edit mode overlay for sections
 */
interface SectionEditOverlayProps {
  section: SectionData;
}

function SectionEditOverlay({ section }: SectionEditOverlayProps) {
  return (
    <div className="section-edit-overlay absolute top-0 right-0 z-10 bg-blue-600 text-white px-2 py-1 text-xs rounded-bl">
      {section.type}
    </div>
  );
}

/**
 * Batch renderer for multiple sections
 */
export interface SectionListRendererProps {
  sections: SectionData[];
  language?: string;
  className?: string;
  onSectionView?: (section: SectionData) => void;
  onSectionError?: (section: SectionData, error: Error) => void;
  trackAnalytics?: boolean;
  editMode?: boolean;
  placeholder?: React.ReactNode;
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

export function SectionListRenderer({
  sections,
  language = "en",
  className = "sections-container",
  onSectionView,
  onSectionError,
  trackAnalytics = false,
  editMode = false,
  placeholder,
  wrapper: Wrapper,
}: SectionListRendererProps) {
  // Sort sections by order
  const sortedSections = React.useMemo(() => {
    return [...sections].sort((a, b) => a.order - b.order);
  }, [sections]);

  // Filter visible sections (unless in edit mode)
  const visibleSections = React.useMemo(() => {
    if (editMode) return sortedSections;
    return sortedSections.filter(
      (section) => section.isVisible && section.status === "Active"
    );
  }, [sortedSections, editMode]);

  const content = (
    <div className={className}>
      {visibleSections.map((section) => (
        <SectionRenderer
          key={section._id}
          section={section}
          language={language}
          onSectionView={onSectionView}
          onSectionError={onSectionError}
          trackAnalytics={trackAnalytics}
          editMode={editMode}
          placeholder={placeholder}
        />
      ))}
    </div>
  );

  return Wrapper ? <Wrapper>{content}</Wrapper> : content;
}

/**
 * Hook for section visibility tracking
 */
export function useSectionVisibility(
  sections: SectionData[],
  callback?: (visibleSections: string[]) => void
) {
  const [visibleSections, setVisibleSections] = React.useState<string[]>([]);

  const handleSectionView = React.useCallback((section: SectionData) => {
    setVisibleSections((prev) => {
      const newVisible = [...prev];
      if (!newVisible.includes(section._id)) {
        newVisible.push(section._id);
      }
      return newVisible;
    });
  }, []);

  React.useEffect(() => {
    callback?.(visibleSections);
  }, [visibleSections, callback]);

  return {
    visibleSections,
    handleSectionView,
  };
}

/**
 * Hook for section intersection observer
 */
export function useSectionIntersection(
  threshold: number = 0.1,
  rootMargin: string = "0px"
) {
  const [intersectingSections, setIntersectingSections] = React.useState<
    string[]
  >([]);

  const observerRef = React.useRef<IntersectionObserver | null>(null);

  React.useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const updates: { id: string; isIntersecting: boolean }[] = [];

        entries.forEach((entry) => {
          const sectionId = entry.target.getAttribute("data-section-id");
          if (sectionId) {
            updates.push({
              id: sectionId,
              isIntersecting: entry.isIntersecting,
            });
          }
        });

        if (updates.length > 0) {
          setIntersectingSections((prev) => {
            const newIntersecting = [...prev];
            updates.forEach(({ id, isIntersecting }) => {
              const index = newIntersecting.indexOf(id);
              if (isIntersecting && index === -1) {
                newIntersecting.push(id);
              } else if (!isIntersecting && index !== -1) {
                newIntersecting.splice(index, 1);
              }
            });
            return newIntersecting;
          });
        }
      },
      { threshold, rootMargin }
    );

    // Observe all existing sections
    const sections = document.querySelectorAll("[data-section-id]");
    sections.forEach((section) => observerRef.current?.observe(section));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin]);

  return intersectingSections;
}

export default SectionRenderer;
