// Centralized JWT utilities to eliminate code duplication
import type { User } from "@repo/types";

/**
 * Extract user info from JWT token
 * Centralized function used by both API routes and core auth
 */
export function extractUserInfoFromJWT(token: string): Partial<User> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};

    let base64Payload = parts[1];
    base64Payload = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
    while (base64Payload.length % 4) {
      base64Payload += "=";
    }

    const payload = JSON.parse(atob(base64Payload));

    // Extract roles and organization data from the id_token format
    const roles = payload.roles || [];
    const organizationRoles = Array.isArray(roles) ? roles : [];

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.username || payload.preferred_username,
      displayName: payload.name || payload.username || payload.preferred_username, // Backward compatibility
      roles: organizationRoles, // Full role objects with Organization, Department, Role
      role: organizationRoles.length > 0 ? organizationRoles[0].Role as any : undefined, // Backward compatibility - first role
      permissions: payload.permissions || [],
      tenantId: payload.tenant_id || payload.aud,
      sub: payload.sub, // Backward compatibility
      isActive: true,
      createdAt: new Date(payload.iat * 1000),
      updatedAt: new Date(),
    };
  } catch {
    return {};
  }
}