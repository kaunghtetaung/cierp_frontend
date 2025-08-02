import React from 'react';
import Link from 'next/link';
import { FooterData } from './types';

interface FooterContentProps {
  footerData: FooterData;
  currentLanguage: 'en' | 'mm';
  className?: string;
}

/**
 * Footer Content Component
 * Renders the footer layout and content
 */
export function FooterContent({
  footerData,
  currentLanguage,
  className = ''
}: FooterContentProps) {
  const { footerSettings, socialLinks, footerColumns, copyrightText, customFooterText } = footerData;

  return (
    <footer className={`bg-muted border-t border-border ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Footer Links */}
          {footerSettings?.showLinks && footerColumns?.length > 0 && (
            <div className="lg:col-span-8">
              <div className={`grid gap-8 ${
                footerColumns.length === 1 ? 'grid-cols-1' :
                footerColumns.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                footerColumns.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
              }`}>
                {footerColumns
                  ?.sort((a, b) => (a?.order || 0) - (b?.order || 0))
                  ?.map((column) => (
                    <div key={column.id} className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        {column.title?.[currentLanguage] || column.title?.en || 'Links'}
                      </h3>
                      <ul className="space-y-2">
                        {column.links?.map((link) => (
                          <li key={link.id}>
                            <Link
                              href={link.url || '#'}
                              className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                              target={link.openInNewTab ? '_blank' : undefined}
                              rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                            >
                              {link.title?.[currentLanguage] || link.title?.en || 'Link'}
                              {link.openInNewTab && (
                                <span className="text-xs opacity-60" aria-hidden="true">↗</span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {footerSettings?.showSocialLinks && socialLinks?.length > 0 && (
            <div className="lg:col-span-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {currentLanguage === 'mm' ? 'လူမှုကွန်ယက်များ' : 'Follow Us'}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {socialLinks?.map((social) => (
                    <a
                      key={social?.id || Math.random()}
                      href={social?.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-200"
                      aria-label={social?.title?.[currentLanguage] || social?.title?.en || social?.platform || 'Social link'}
                    >
                      {social?.icon ? (
                        <span className="text-lg" aria-hidden="true">
                          {social.icon}
                        </span>
                      ) : (
                        <span className="text-xs font-medium">
                          {social?.platform?.charAt(0)?.toUpperCase() || 'S'}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-border pt-8 space-y-4">
          {/* Custom Footer Text */}
          {customFooterText && (
            <div className="text-center">
              <p className="text-muted-foreground">{customFooterText}</p>
            </div>
          )}

          {/* Copyright and Legal Links */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            {footerSettings?.showCopyright && (
              <div className="text-center sm:text-left">
                <p className="text-muted-foreground text-sm">{copyrightText}</p>
              </div>
            )}

            {/* Legal Links */}
            <div className="flex items-center gap-4">
              <Link 
                href="/privacy" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {currentLanguage === 'mm' ? 'ကိုယ်ရေးကာကွယ်ရေး' : 'Privacy Policy'}
              </Link>
              <span className="text-muted-foreground/60">•</span>
              <Link 
                href="/terms" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {currentLanguage === 'mm' ? 'အသုံးပြုမှုစည်းမျဉ်း' : 'Terms of Service'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default FooterContent;