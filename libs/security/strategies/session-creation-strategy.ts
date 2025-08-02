// Session Creation Strategy - Single Responsibility: Session creation logic
import { generateSecureSessionId } from "@repo/utils/common/security";
import type {
  SessionCreationStrategy,
  SessionData,
  SessionConfig,
  SessionCreateOptions,
} from "../types/session-types";

export class StandardSessionCreationStrategy
  implements SessionCreationStrategy
{
  constructor(private config: SessionConfig) {}

  createSession(
    userId: string,
    tenantId: string,
    options: SessionCreateOptions = {}
  ): SessionData {
    const sessionId = generateSecureSessionId();
    const now = new Date();
    const maxAge = options.maxAge || this.config.maxAge;
    const expiresAt = new Date(now.getTime() + maxAge * 1000);

    return {
      sessionId,
      userId,
      tenantId,
      createdAt: now,
      expiresAt,
      lastActivityAt: now,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      metadata: options.metadata,
    };
  }
}
