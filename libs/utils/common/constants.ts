// Application constants with enhanced type safety

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    SESSION: "/api/auth/session",
    CALLBACK: "/api/auth/callback",
  },
  USERS: {
    PROFILE: "/api/users/profile",
    UPDATE: "/api/users/update",
    LIST: "/api/users",
  },
  TENANT: {
    INITIALIZE: "/api/tenant/initialize",
    SETTINGS: "/api/tenant/settings",
    HEALTH: "/api/tenant/health",
  },
  CONTENT: {
    PAGES: "/api/content/pages",
    POSTS: "/api/content/posts",
    MEDIA: "/api/content/media",
  },
  HEALTH: "/api/health",
  LANGUAGE: {
    CHANGE: "/api/language/change",
  },
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  ERROR: "/error",
  NOT_FOUND: "/404",
  APPS: "/apps",
  DEPT: "/dept",
  SETTINGS: "/settings",
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,
} as const;

export const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const COOKIE_NAMES = {
  TENANT_ID: "x-tenant-id",
  LANGUAGE: "x-lang",
  SESSION: "session",
  CSRF_TOKEN: "csrf-token",
  THEME: "theme",
  REQUEST_ID: "x-request-id",
  APP_ID: "x-app-id",
} as const;

/**
 * Middleware header constants (shared between Server Components and Edge Runtime)
 */
export const MIDDLEWARE_HEADERS = {
  TENANT_ID: "x-tenant-id",
  LANGUAGE: "x-lang",
  REQUEST_ID: "x-request-id",
  HOSTNAME: "x-hostname",
  PROTOCOL: "x-protocol",
  APP_ID: "x-app-id",
} as const;

/**
 * Middleware cookie constants (subset of COOKIE_NAMES for middleware use)
 */
export const MIDDLEWARE_COOKIES = {
  TENANT_ID: "x-tenant-id",
  LANGUAGE: "x-lang",
  REQUEST_ID: "x-request-id",
  APP_ID: "x-app-id",
} as const;

export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true,
  },
  EMAIL: {
    MAX_LENGTH: 254,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
  },
  TEXT: {
    MAX_LENGTH: 1000,
  },
  FILE: {
    MAX_SIZE_MB: 10,
    ALLOWED_IMAGES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    ALLOWED_DOCUMENTS: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
} as const;

export const SECURITY_CONFIG = {
  CSRF_TOKEN_LENGTH: 32,
  SESSION_ID_LENGTH: 64,
  API_KEY_LENGTH: 48,
  NONCE_LENGTH: 16,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  SESSION_TIMEOUT_MINUTES: parseInt(process.env.AUTH_SESSION_TIMEOUT_MINUTES || '60', 10),
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
} as const;

export const CACHE_KEYS = {
  USER_SESSION: "UserSession:",
  TENANT_SETTINGS: "TenantSettings:",
  CONTENT_PAGE: "ContentPage:",
  API_RESPONSE: "ApiResponse:",
  SESSION_LOOKUP: "SessionLookup:",
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  CSRF_ERROR: "CSRF_ERROR",
  TENANT_ERROR: "TENANT_ERROR",
} as const;

export const CONTENT_TYPES = {
  PAGE: "page",
  POST: "post",
  NEWS: "news",
  EVENT: "event",
  ANNOUNCEMENT: "announcement",
  ACTIVITY: "activity",
} as const;

export const CONTENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
  SCHEDULED: "scheduled",
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
  MODERATOR: "moderator",
} as const;

export const USER_PERMISSIONS = {
  READ: "read",
  WRITE: "write",
  DELETE: "delete",
  MANAGE_USERS: "manage_users",
  MANAGE_CONTENT: "manage_content",
  MANAGE_SETTINGS: "manage_settings",
  VIEW_ANALYTICS: "view_analytics",
} as const;

export const LOCAL_STORAGE_KEYS = {
  THEME: "theme",
  LANGUAGE: "language",
  SIDEBAR_STATE: "sidebar-state",
  USER_PREFERENCES: "user-preferences",
} as const;

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  RESIZE: 100,
  SCROLL: 50,
  INPUT: 500,
} as const;
