// Re-export the appropriate component based on usage context
// This file acts as the main entry point for AppSelector

// Export the client component as the default for backward compatibility
export { ClientAppSelector as AppSelector } from "./ClientAppSelector";
export { ClientAppSelector as default } from "./ClientAppSelector";

// Also export client component for direct usage if needed
export { ClientAppSelector } from "./ClientAppSelector";

// Note: ServerAppSelector should be imported directly from its file when needed
// to avoid bundling server-only code in client contexts