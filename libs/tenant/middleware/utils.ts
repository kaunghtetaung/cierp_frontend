// libs/tenant/middleware/utils.ts
import { v4 as uuidv4 } from "uuid";
import { MiddlewareConfig } from "./types";

/**
 * Check if path should be excluded from middleware processing
 */
export function shouldExcludePath(
  pathname: string,
  excludePaths: string[] = []
): boolean {
  const allExcludePaths = [...excludePaths];

  return (
    allExcludePaths.some((excludePath) => pathname.startsWith(excludePath)) ||
    (pathname.includes(".") && !pathname.endsWith(".html"))
  );
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${uuidv4().split("-")[0]}`;
}
