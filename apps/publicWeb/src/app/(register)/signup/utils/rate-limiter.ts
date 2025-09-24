// Simple in-memory rate limiter for signup attempts
// In production, use Redis or a proper rate limiting service

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
}

class SignupRateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  private readonly cleanupInterval = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Periodic cleanup of old entries
    if (typeof window === 'undefined') { // Server-side only
      setInterval(() => this.cleanup(), this.cleanupInterval);
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.attempts.entries()) {
      if (now - entry.lastAttempt > this.windowMs * 2) {
        this.attempts.delete(key);
      }
    }
  }

  private getKey(identifier: string, ip?: string): string {
    // Use combination of identifier (email/username) and IP for rate limiting
    return `${identifier.toLowerCase()}:${ip || 'unknown'}`;
  }

  isRateLimited(identifier: string, ip?: string): boolean {
    const key = this.getKey(identifier, ip);
    const entry = this.attempts.get(key);

    if (!entry) return false;

    const now = Date.now();
    const timeSinceFirst = now - entry.firstAttempt;

    // Reset if outside window
    if (timeSinceFirst > this.windowMs) {
      this.attempts.delete(key);
      return false;
    }

    return entry.attempts >= this.maxAttempts;
  }

  recordAttempt(identifier: string, ip?: string): { limited: boolean; remaining: number } {
    const key = this.getKey(identifier, ip);
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry) {
      this.attempts.set(key, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return { limited: false, remaining: this.maxAttempts - 1 };
    }

    const timeSinceFirst = now - entry.firstAttempt;

    // Reset if outside window
    if (timeSinceFirst > this.windowMs) {
      this.attempts.set(key, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return { limited: false, remaining: this.maxAttempts - 1 };
    }

    entry.attempts++;
    entry.lastAttempt = now;

    const limited = entry.attempts > this.maxAttempts;
    const remaining = Math.max(0, this.maxAttempts - entry.attempts);

    return { limited, remaining };
  }

  getRemainingTime(identifier: string, ip?: string): number {
    const key = this.getKey(identifier, ip);
    const entry = this.attempts.get(key);

    if (!entry) return 0;

    const elapsed = Date.now() - entry.firstAttempt;
    const remaining = Math.max(0, this.windowMs - elapsed);

    return Math.ceil(remaining / 1000); // Return seconds
  }
}

// Singleton instance
let rateLimiterInstance: SignupRateLimiter | null = null;

export function getRateLimiter(): SignupRateLimiter {
  if (!rateLimiterInstance && typeof window === 'undefined') {
    rateLimiterInstance = new SignupRateLimiter();
  }
  return rateLimiterInstance!;
}