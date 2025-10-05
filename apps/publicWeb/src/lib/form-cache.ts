/**
 * Form data caching utilities using browser localStorage
 * Stores form data per user and role for restoration on page reload
 */

const FORM_CACHE_PREFIX = "student_registration_form";
const ROLE_CACHE_KEY = "student_registration_role";

export type UserRole = "student" | "staff";

export interface FormCacheData {
  userId: string;
  role: UserRole;
  formData: Record<string, any>;
  timestamp: number;
  currentStep: number;
}

/**
 * Generate cache key for a specific user
 */
function getCacheKey(userId: string): string {
  return `${FORM_CACHE_PREFIX}_${userId}`;
}

/**
 * Save form data to localStorage
 */
export function saveFormDataToCache(
  userId: string,
  role: UserRole,
  formData: Record<string, any>,
  currentStep: number
): void {
  try {
    const cacheData: FormCacheData = {
      userId,
      role,
      formData,
      currentStep,
      timestamp: Date.now(),
    };

    const cacheKey = getCacheKey(userId);
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));

    // Also save role separately for quick access
    localStorage.setItem(ROLE_CACHE_KEY, role);
  } catch (error) {
    console.error("Error saving form data to cache:", error);
  }
}

/**
 * Load form data from localStorage
 */
export function loadFormDataFromCache(userId: string): FormCacheData | null {
  try {
    const cacheKey = getCacheKey(userId);
    const cachedData = localStorage.getItem(cacheKey);

    if (!cachedData) {
      return null;
    }

    const parsed = JSON.parse(cachedData) as FormCacheData;

    // Validate that the cached data is for the correct user
    if (parsed.userId !== userId) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Error loading form data from cache:", error);
    return null;
  }
}

/**
 * Clear form data from cache
 */
export function clearFormDataCache(userId: string): void {
  try {
    const cacheKey = getCacheKey(userId);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error("Error clearing form data cache:", error);
  }
}

/**
 * Save role selection to localStorage
 */
export function saveRoleToCache(role: UserRole): void {
  try {
    localStorage.setItem(ROLE_CACHE_KEY, role);
  } catch (error) {
    console.error("Error saving role to cache:", error);
  }
}

/**
 * Load role selection from localStorage
 */
export function loadRoleFromCache(): UserRole | null {
  try {
    const role = localStorage.getItem(ROLE_CACHE_KEY);
    if (role === "student" || role === "staff") {
      return role;
    }
    return null;
  } catch (error) {
    console.error("Error loading role from cache:", error);
    return null;
  }
}

/**
 * Check if cached data exists for a user
 */
export function hasCachedFormData(userId: string): boolean {
  try {
    const cacheKey = getCacheKey(userId);
    return localStorage.getItem(cacheKey) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get the age of cached data in milliseconds
 */
export function getCachedDataAge(userId: string): number | null {
  try {
    const cachedData = loadFormDataFromCache(userId);
    if (!cachedData) {
      return null;
    }
    return Date.now() - cachedData.timestamp;
  } catch (error) {
    return null;
  }
}

/**
 * Format cache age for display (e.g., "5 minutes ago", "2 hours ago")
 */
export function formatCacheAge(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  return "just now";
}
