// Security validation utilities
import { isValidEmail, isValidTenantId } from "@repo/utils/common/validation";
import { isValidUrl } from "@repo/utils/common/url";
import { SECURITY_CONFIG } from "@repo/utils/common/constants";

export interface SecurityValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * Validate authentication credentials
 */
export function validateAuthCredentials(
  email: string,
  password: string
): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate email
  if (!email) {
    errors.push("Email is required");
  } else if (!isValidEmail(email)) {
    errors.push("Invalid email format");
  }

  // Validate password
  if (!password) {
    errors.push("Password is required");
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (password.length > 128) {
      errors.push("Password must be less than 128 characters");
    }
    if (!/[a-z]/.test(password)) {
      warnings.push("Password should contain lowercase letters");
    }
    if (!/[A-Z]/.test(password)) {
      warnings.push("Password should contain uppercase letters");
    }
    if (!/[0-9]/.test(password)) {
      warnings.push("Password should contain numbers");
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      warnings.push("Password should contain special characters");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate session token format
 */
export function validateSessionToken(token: string): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!token) {
    errors.push("Session token is required");
  } else {
    // Check token length
    if (token.length !== SECURITY_CONFIG.SESSION_ID_LENGTH * 2) {
      // hex string is 2x length
      errors.push("Invalid session token length");
    }

    // Check token format (hex string)
    if (!/^[a-f0-9]+$/i.test(token)) {
      errors.push("Invalid session token format");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate CSRF token format
 */
export function validateCSRFTokenFormat(
  token: string
): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!token) {
    errors.push("CSRF token is required");
  } else {
    // Check token length
    if (token.length !== SECURITY_CONFIG.CSRF_TOKEN_LENGTH * 2) {
      // hex string is 2x length
      errors.push("Invalid CSRF token length");
    }

    // Check token format (hex string)
    if (!/^[a-f0-9]+$/i.test(token)) {
      errors.push("Invalid CSRF token format");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(apiKey: string): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!apiKey) {
    errors.push("API key is required");
  } else {
    // Check API key length
    if (apiKey.length !== SECURITY_CONFIG.API_KEY_LENGTH * 2) {
      // hex string is 2x length
      errors.push("Invalid API key length");
    }

    // Check API key format (hex string)
    if (!/^[a-f0-9]+$/i.test(apiKey)) {
      errors.push("Invalid API key format");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate tenant configuration
 */
export function validateTenantConfig(config: {
  id: string;
  domain: string;
  name: string;
  adminEmail?: string;
}): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate tenant ID
  if (!config.id) {
    errors.push("Tenant ID is required");
  } else if (!isValidTenantId(config.id)) {
    errors.push("Invalid tenant ID format");
  }

  // Validate domain
  if (!config.domain) {
    errors.push("Domain is required");
  } else {
    // Basic domain validation
    const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!domainRegex.test(config.domain)) {
      errors.push("Invalid domain format");
    }
  }

  // Validate name
  if (!config.name) {
    errors.push("Tenant name is required");
  } else {
    if (config.name.length < 2) {
      errors.push("Tenant name must be at least 2 characters");
    }
    if (config.name.length > 100) {
      errors.push("Tenant name must be less than 100 characters");
    }
  }

  // Validate admin email if provided
  if (config.adminEmail && !isValidEmail(config.adminEmail)) {
    errors.push("Invalid admin email format");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate redirect URL for security
 */
export function validateRedirectUrl(
  url: string,
  allowedDomains: string[] = []
): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!url) {
    errors.push("Redirect URL is required");
    return { valid: false, errors, warnings };
  }

  // Check if URL is valid
  if (!isValidUrl(url)) {
    errors.push("Invalid URL format");
    return { valid: false, errors, warnings };
  }

  try {
    const urlObj = new URL(url);

    // Prevent javascript: and data: URLs
    if (
      ["javascript:", "data:", "vbscript:", "file:"].includes(urlObj.protocol)
    ) {
      errors.push("Unsafe URL protocol");
    }

    // Check domain allowlist if provided
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(
        (domain) =>
          urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );

      if (!isAllowed) {
        errors.push("Domain not in allowlist");
      }
    }

    // Warn about external URLs
    if (
      typeof window !== "undefined" &&
      urlObj.origin !== window.location.origin
    ) {
      warnings.push("External redirect URL");
    }
  } catch (error) {
    errors.push("Failed to parse URL");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate user input for XSS prevention
 */
export function validateUserInput(input: string): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input) {
    return { valid: true, errors, warnings };
  }

  // Check for potential XSS patterns
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      errors.push("Input contains potentially malicious content");
      break;
    }
  }

  // Check for SQL injection patterns
  const sqlPatterns = [
    /('|(\-\-)|(;)|(\||\|)|(\*|\*))/, // SQL metacharacters
    /(union|select|insert|update|delete|drop|create|alter|exec|execute)/gi,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      warnings.push("Input contains SQL-like patterns");
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate file upload for security
 */
export function validateFileUpload(file: {
  name: string;
  size: number;
  type: string;
}): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    errors.push("File size exceeds 10MB limit");
  }

  // Check file type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type)) {
    errors.push("File type not allowed");
  }

  // Check file extension
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "pdf",
    "txt",
    "doc",
    "docx",
  ];

  if (!extension || !allowedExtensions.includes(extension)) {
    errors.push("File extension not allowed");
  }

  // Check for double extensions
  const parts = file.name.split(".");
  if (parts.length > 2) {
    warnings.push("File has multiple extensions");
  }

  // Check for suspicious filenames
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|com|scr|vbs|js|jar|pif)$/i,
    /^\./,
    /\.\./, // Path traversal
    /[<>:"|?*]/, // Invalid filename characters
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      errors.push("Suspicious filename detected");
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate IP address format
 */
export function validateIpAddress(ip: string): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!ip) {
    errors.push("IP address is required");
    return { valid: false, errors, warnings };
  }

  // IPv4 validation
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 validation (basic)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    errors.push("Invalid IP address format");
  }

  // Check for private IP ranges
  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;

    if (
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      warnings.push("Private IP address detected");
    }

    if (a === 127) {
      warnings.push("Loopback IP address detected");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate JWT token format (basic structure check)
 */
export function validateJWTFormat(token: string): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!token) {
    errors.push("JWT token is required");
    return { valid: false, errors, warnings };
  }

  // JWT should have 3 parts separated by dots
  const parts = token.split(".");
  if (parts.length !== 3) {
    errors.push("Invalid JWT format - should have 3 parts");
    return { valid: false, errors, warnings };
  }

  // Check if parts are base64url encoded
  const base64urlRegex = /^[A-Za-z0-9_-]+$/;

  for (let i = 0; i < 3; i++) {
    if (!base64urlRegex.test(parts[i])) {
      errors.push(`Invalid JWT part ${i + 1} - not base64url encoded`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
