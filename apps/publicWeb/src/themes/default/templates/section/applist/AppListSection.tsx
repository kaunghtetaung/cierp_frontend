"use client";

import React from "react";
import Link from "next/link";
import { SectionProps } from "../types";
import { getLocalizedText } from "../utils";

export interface AppListSectionData {
  _id: string;
  type: "appList";
  enabled: boolean;
  title?: { en: string; mm: string };
  subtitle?: { en: string; mm: string };
  apps: Array<{
    id: string;
    name: { en: string; mm: string };
    description: { en: string; mm: string };
    url: string;
    icon: string;
    color: string;
  }>;
  layout?: "grid" | "list";
  columns?: number;
}

/**
 * App List Section Component
 * Displays a grid of application cards with icons, names, descriptions, and links
 */
export function AppListSection({
  section,
  currentLanguage = "en",
}: SectionProps<AppListSectionData>) {
  const title = section.title ? getLocalizedText(section.title, currentLanguage) : null;
  const subtitle = section.subtitle ? getLocalizedText(section.subtitle, currentLanguage) : null;
  const layout = section.layout || "grid";
  const columns = section.columns || 4;

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "library":
        return (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case "graduation":
        return (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        );
      case "student":
        return (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case "staff":
        return (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const gridColsClass = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }[columns] || "md:grid-cols-2 lg:grid-cols-4";

  return (
    <section
      className="py-16 tech-pattern-bg"
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {subtitle && (
              <p className="text-sm font-semibold uppercase tracking-wider mb-2 text-white">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {title}
              </h2>
            )}
          </div>
        )}

        {/* App Grid */}
        <div className={`grid ${gridColsClass} gap-6`}>
          {section.apps.map((app) => {
            const appName = getLocalizedText(app.name, currentLanguage);
            const appDescription = getLocalizedText(app.description, currentLanguage);

            return (
              <Link
                key={app.id}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="h-full backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 hover:border-white/30 transition-all duration-300 p-6 flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className="mb-4 text-white transition-transform duration-300 group-hover:scale-110">
                    {getIconComponent(app.icon)}
                  </div>

                  {/* Content */}
                  <h3
                    className={`font-bold text-white mb-2 ${
                      currentLanguage === 'mm' ? 'text-lg' : 'text-xl'
                    }`}
                  >
                    {appName}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed mb-4">
                    {appDescription}
                  </p>

                  {/* Arrow Icon */}
                  <div className="flex items-center justify-center text-white/90 font-medium text-sm group-hover:translate-x-2 transition-transform">
                    <span>Access Portal</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default AppListSection;
