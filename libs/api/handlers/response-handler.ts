// Response Handler Strategy - Single Responsibility: HTTP response processing
import { HTTP_STATUS } from "@repo/utils/common/constants";
import type { ResponseHandler } from '../types/http-types';
import type { ApiResponse } from "@repo/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class StandardResponseHandler implements ResponseHandler {
  
  async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: any = undefined;

      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData;
        } catch {
          // Ignore JSON parsing errors for error responses
        }
      }

      throw new ApiError(
        errorMessage,
        "HTTP_ERROR",
        response.status,
        errorDetails
      );
    }

    if (isJson) {
      const data = await response.json();
      return {
        data: data.data || data,
        message: data.message || "Success",
        success: data.success !== false,
        timestamp: new Date(),
      };
    }

    // For non-JSON responses
    const text = await response.text();
    return {
      data: text as any,
      message: "Success",
      success: true,
      timestamp: new Date(),
    };
  }

  handleError<T>(error: unknown): ApiResponse<T> {
    if (error instanceof ApiError) {
      return {
        data: null as any,
        message: error.message,
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      data: null as any,
      message,
      success: false,
      error: message,
      timestamp: new Date(),
    };
  }
}