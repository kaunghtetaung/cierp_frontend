// Utils - Main entry point
// Exports common utilities that work in both client and server environments

// Re-export all common utilities
export * from "./common";

// Re-export client utilities (for client components only)
// Note: These will only work in client components ('use client')
export * from "./client";

// Type exports
export type { MultilingualText } from "./common/localization";

// Z-index system
export * from "./z-index";

// Toast utilities
export * from "./toast";

// Note: Server-specific utilities should be imported directly:
// - Use "@repo/utils/server" for server-side utilities
