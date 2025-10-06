// Enhanced auth types with proper role/permission constraints
import type { MultilingualText } from './tenant';

export type UserRole = "admin" | "editor" | "viewer" | "moderator";

export type UserPermission =
  | "read"
  | "write"
  | "delete"
  | "manage_users"
  | "manage_content"
  | "manage_settings"
  | "view_analytics";

export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly displayName?: string; // Backward compatibility alias for name
  readonly localizedDisplayName?: MultilingualText;
  readonly roles: UserRole[];
  readonly role?: UserRole; // Backward compatibility - first role
  readonly permissions: UserPermission[];
  readonly tenantId: string;
  readonly sub?: string; // Backward compatibility alias for id
  readonly profileState?: "created" | "profile_completed" | "approved"; // Profile completion state
  readonly isActive: boolean;
  readonly lastLoginAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly tokenType: string;
}

export interface AuthSession {
  readonly id: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly lastActivityAt: Date;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
  readonly tenantId?: string;
}

export interface LoginResponse {
  readonly user: User;
  readonly tokens: AuthTokens;
  readonly session: AuthSession;
}

export interface RefreshTokenRequest {
  readonly refreshToken: string;
}

export interface AuthContextValue {
  readonly user: User | null;
  readonly session: AuthSession | null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export interface AuthProviderProps {
  readonly children: React.ReactNode;
  readonly initialUser?: User | null;
  readonly initialSession?: AuthSession | null;
}

export interface AuthenticationResult {
  readonly isAuthenticated: boolean;
  readonly user: User | null;
  readonly session: AuthSession | null;
  readonly tenantId: string | null;
  readonly error?: string;
}

export interface JwtPayload {
  readonly sub: string;
  readonly email: string;
  readonly role: UserRole;
  readonly tenantId: string;
  readonly iat: number;
  readonly exp: number;
}
