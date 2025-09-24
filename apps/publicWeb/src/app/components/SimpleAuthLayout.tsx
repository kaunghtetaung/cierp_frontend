"use client";

import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SimpleAuthLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  pageIcon?: ReactNode;
}

export function SimpleAuthLayout({
  children,
  pageTitle,
  pageSubtitle,
  pageIcon,
}: SimpleAuthLayoutProps) {
  return (
    <div className="min-h-screen h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      <div className="w-full max-w-lg animate-fadeIn">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 text-sm mb-6 transition-all hover:-translate-x-1"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          {(pageTitle || pageSubtitle) && (
            <div className="bg-gradient-to-b from-gray-50 to-white px-8 py-6 border-b border-gray-100">
              {pageTitle && (
                <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                  {pageIcon}
                  {pageTitle}
                </h1>
              )}
              {pageSubtitle && (
                <p className="text-sm text-gray-600 text-center mt-2">
                  {pageSubtitle}
                </p>
              )}
            </div>
          )}

          {/* Content - Fixed height with scroll if needed */}
          <div className="p-8 max-h-[60vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}