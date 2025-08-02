// Encryption utilities for session and data protection
import {
  generateSecureRandomBytes,
  generateSecureRandomString,
} from "@repo/utils/common/security";

/**
 * Simple encryption interface for session data
 * Note: This is a basic implementation. For production, consider using established libraries
 */
export interface EncryptionResult {
  readonly encrypted: string;
  readonly iv: string;
  readonly tag?: string;
}

export interface DecryptionResult {
  readonly decrypted: string;
  readonly valid: boolean;
}

/**
 * XOR encryption/decryption (basic, for demonstration)
 * WARNING: This is not cryptographically secure and should not be used in production
 */
export function xorEncrypt(data: string, key: string): string {
  let result = "";
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result); // Base64 encode
}

export function xorDecrypt(encrypted: string, key: string): string {
  try {
    const data = atob(encrypted); // Base64 decode
    let result = "";
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  } catch (error) {
    throw new Error("Decryption failed");
  }
}

/**
 * Generate encryption key
 */
export function generateEncryptionKey(length: number = 32): string {
  return generateSecureRandomString(length);
}

/**
 * Simple session data encryption (for demonstration)
 * In production, use proper encryption libraries like crypto-js or node's crypto
 */
export function encryptSessionData(
  data: string,
  key: string
): EncryptionResult {
  const iv = generateSecureRandomString(16);
  const encrypted = xorEncrypt(data + iv, key);

  return {
    encrypted,
    iv,
  };
}

/**
 * Simple session data decryption (for demonstration)
 */
export function decryptSessionData(
  encryptedData: EncryptionResult,
  key: string
): DecryptionResult {
  try {
    const decrypted = xorDecrypt(encryptedData.encrypted, key);
    const iv = decrypted.slice(-32); // Extract IV from end
    const data = decrypted.slice(0, -32); // Extract data

    // Verify IV matches
    if (iv === encryptedData.iv) {
      return {
        decrypted: data,
        valid: true,
      };
    }

    return {
      decrypted: "",
      valid: false,
    };
  } catch (error) {
    return {
      decrypted: "",
      valid: false,
    };
  }
}

/**
 * Web Crypto API encryption (browser-compatible)
 */
export class WebCryptoEncryption {
  private static async getKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("salt"), // In production, use random salt
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  static async encrypt(
    data: string,
    password: string
  ): Promise<EncryptionResult> {
    if (typeof crypto === "undefined" || !crypto.subtle) {
      throw new Error("Web Crypto API not available");
    }

    const encoder = new TextEncoder();
    const key = await this.getKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encoder.encode(data)
    );

    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv)),
    };
  }

  static async decrypt(
    encryptedData: EncryptionResult,
    password: string
  ): Promise<DecryptionResult> {
    if (typeof crypto === "undefined" || !crypto.subtle) {
      throw new Error("Web Crypto API not available");
    }

    try {
      const decoder = new TextDecoder();
      const key = await this.getKey(password);
      const iv = new Uint8Array(
        atob(encryptedData.iv)
          .split("")
          .map((c) => c.charCodeAt(0))
      );
      const encrypted = new Uint8Array(
        atob(encryptedData.encrypted)
          .split("")
          .map((c) => c.charCodeAt(0))
      );

      const decrypted = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        encrypted
      );

      return {
        decrypted: decoder.decode(decrypted),
        valid: true,
      };
    } catch (error) {
      return {
        decrypted: "",
        valid: false,
      };
    }
  }
}

/**
 * Node.js crypto encryption (server-side)
 */
export class NodeCryptoEncryption {
  static encrypt(data: string, password: string): EncryptionResult {
    if (typeof window !== "undefined") {
      throw new Error("Node.js crypto not available in browser");
    }

    try {
      const crypto = require("crypto");
      const algorithm = "aes-256-gcm";
      const key = crypto.scryptSync(password, "salt", 32);
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipher(algorithm, key);
      cipher.setAAD(Buffer.from("additional data"));

      let encrypted = cipher.update(data, "utf8", "hex");
      encrypted += cipher.final("hex");

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString("hex"),
        tag: tag.toString("hex"),
      };
    } catch (error) {
      throw new Error("Encryption failed");
    }
  }

  static decrypt(
    encryptedData: EncryptionResult,
    password: string
  ): DecryptionResult {
    if (typeof window !== "undefined") {
      throw new Error("Node.js crypto not available in browser");
    }

    try {
      const crypto = require("crypto");
      const algorithm = "aes-256-gcm";
      const key = crypto.scryptSync(password, "salt", 32);
      const iv = Buffer.from(encryptedData.iv, "hex");
      const tag = Buffer.from(encryptedData.tag || "", "hex");

      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAAD(Buffer.from("additional data"));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return {
        decrypted,
        valid: true,
      };
    } catch (error) {
      return {
        decrypted: "",
        valid: false,
      };
    }
  }
}

/**
 * Universal encryption that works in both browser and Node.js
 */
export class UniversalEncryption {
  static async encrypt(
    data: string,
    password: string
  ): Promise<EncryptionResult> {
    if (typeof window !== "undefined" && crypto.subtle) {
      return WebCryptoEncryption.encrypt(data, password);
    } else if (typeof require !== "undefined") {
      return NodeCryptoEncryption.encrypt(data, password);
    } else {
      // Fallback to basic encryption (not recommended for production)
      return encryptSessionData(data, password);
    }
  }

  static async decrypt(
    encryptedData: EncryptionResult,
    password: string
  ): Promise<DecryptionResult> {
    if (typeof window !== "undefined" && crypto.subtle) {
      return WebCryptoEncryption.decrypt(encryptedData, password);
    } else if (typeof require !== "undefined") {
      return NodeCryptoEncryption.decrypt(encryptedData, password);
    } else {
      // Fallback to basic decryption
      return decryptSessionData(encryptedData, password);
    }
  }
}

/**
 * Simple data obfuscation (not encryption, just for basic protection)
 */
export function obfuscateData(data: string): string {
  return btoa(data.split("").reverse().join(""));
}

export function deobfuscateData(obfuscated: string): string {
  try {
    return atob(obfuscated).split("").reverse().join("");
  } catch (error) {
    throw new Error("Deobfuscation failed");
  }
}

/**
 * Generate secure salt for password hashing
 */
export function generateSalt(length: number = 32): string {
  return generateSecureRandomString(length);
}

/**
 * Simple password hashing (for demonstration - use bcrypt in production)
 */
export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } else if (typeof require !== "undefined") {
    const crypto = require("crypto");
    return crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");
  } else {
    throw new Error("No hashing implementation available");
  }
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  try {
    const computedHash = await hashPassword(password, salt);
    return computedHash === hash;
  } catch (error) {
    return false;
  }
}
