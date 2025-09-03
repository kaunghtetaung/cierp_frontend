// DOM utility functions with Next.js 15 compatibility
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine and merge Tailwind CSS classes
 * Enhanced version of the cn utility
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Check if code is running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if code is running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Safe document query selector
 */
export function querySelector(selector: string): Element | null {
  if (!isBrowser()) return null;
  return document.querySelector(selector);
}

/**
 * Safe document query selector all
 */
export function querySelectorAll(selector: string): NodeListOf<Element> | null {
  if (!isBrowser()) return null;
  return document.querySelectorAll(selector);
}

/**
 * Get element by ID safely
 */
export function getElementById(id: string): HTMLElement | null {
  if (!isBrowser()) return null;
  return document.getElementById(id);
}

/**
 * Add event listener safely
 */
export function addEventListener<K extends keyof WindowEventMap>(
  element: Element | Window,
  type: K,
  listener: (this: Element, ev: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void {
  if (!isBrowser()) return;
  element.addEventListener(type, listener as EventListener, options);
}

/**
 * Remove event listener safely
 */
export function removeEventListener<K extends keyof WindowEventMap>(
  element: Element | Window,
  type: K,
  listener: (this: Element, ev: WindowEventMap[K]) => void,
  options?: boolean | EventListenerOptions
): void {
  if (!isBrowser()) return;
  element.removeEventListener(type, listener as EventListener, options);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser()) return false;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error);
    return false;
  }
}

/**
 * Get scroll position
 */
export function getScrollPosition(): { x: number; y: number } {
  if (!isBrowser()) return { x: 0, y: 0 };
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
    y: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
  };
}

/**
 * Smooth scroll to element
 */
export function scrollToElement(element: Element | string, offset: number = 0): void {
  if (!isBrowser()) return;

  const targetElement = typeof element === 'string' ? querySelector(element) : element;
  if (!targetElement) return;

  const elementPosition = targetElement.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

/**
 * Get element dimensions
 */
export function getElementDimensions(element: Element): { width: number; height: number } {
  if (!isBrowser()) return { width: 0, height: 0 };
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height
  };
}

/**
 * Check if element is in viewport
 */
export function isElementInViewport(element: Element): boolean {
  if (!isBrowser()) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: never[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions(): { width: number; height: number } {
  if (!isBrowser()) return { width: 0, height: 0 };
  return {
    width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
  };
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  if (!isBrowser()) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Generate unique ID
 */
export function generateUniqueId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Focus trap utility
 */
export function trapFocus(element: Element): () => void {
  if (!isBrowser()) return () => {};

  const focusableElements = element.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
  );

  const firstFocusableElement = focusableElements[0] as HTMLElement;
  const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleKeyDown = (e: Event) => {
    const keyEvent = e as KeyboardEvent;
    if (keyEvent.key === 'Tab') {
      if (keyEvent.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          keyEvent.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          keyEvent.preventDefault();
        }
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}