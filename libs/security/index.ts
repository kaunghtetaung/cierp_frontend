// Main exports from security package
export * from './core/csrf';
export * from './core/cookies';
export * from './utils/session';
export * from './managers/session-manager';
export * from './core/validation';
export * from './core/encryption';

// Re-export commonly used utilities
export {
  generateCSRFToken,
  validateCSRFToken,
  generateDoubleSubmitCSRF,
  validateDoubleSubmitCSRF
} from './core/csrf';

export {
  createSecureCookieOptions,
  createStandardCookieOptions,
  createSessionCookieOptions,
  createTenantCookieOptions,
  createCSRFCookieOptions,
  createThemeCookieOptions,
  createLanguageCookieOptions,
  serializeCookie,
  parseCookies,
  ServerCookieManager
} from './core/cookies';

export {
  createSession,
  validateSession,
  renewSession,
  updateSessionActivity,
  toAuthSession,
  fromAuthSession
} from './utils/session';

// Export the SessionManager
export { SessionManager } from './managers/session-manager';

export {
  validateAuthCredentials,
  validateSessionToken,
  validateCSRFTokenFormat,
  validateRedirectUrl,
  validateUserInput,
  validateFileUpload
} from './core/validation';

export {
  generateEncryptionKey,
  encryptSessionData,
  decryptSessionData,
  UniversalEncryption,
  generateSalt,
  hashPassword,
  verifyPassword
} from './core/encryption';