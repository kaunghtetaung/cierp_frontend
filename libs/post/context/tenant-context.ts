// Tenant Context Implementation - Single Responsibility: Tenant ID extraction
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import type { TenantContext } from "../types/post-types";

export class StandardTenantContext implements TenantContext {
  async getTenantId(): Promise<string> {
    const middlewareData = await getMiddlewareDataFromHeaders();
    const tenantId = middlewareData.tenantId;

    if (!tenantId) {
      throw new Error("No tenant ID found in request headers");
    }

    return tenantId;
  }
}
