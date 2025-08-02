// Validation Interceptor - Single Responsibility: Input validation
import { validateUserInput } from "@repo/security/validation";
import { HTTP_STATUS } from "@repo/utils/common/constants";
import type { RequestInterceptor, HttpRequestContext } from '../types/http-types';
import { ApiError } from '../handlers/response-handler';

export class ValidationRequestInterceptor implements RequestInterceptor {
  
  async intercept(context: HttpRequestContext): Promise<HttpRequestContext> {
    // Validate endpoint
    const inputValidation = validateUserInput(context.url);
    if (!inputValidation.valid) {
      throw new ApiError(
        "Invalid endpoint",
        "VALIDATION_ERROR",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    return context;
  }
}