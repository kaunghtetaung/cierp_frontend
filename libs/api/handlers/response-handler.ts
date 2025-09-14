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

    // Debug logging for response
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 StandardResponseHandler: Processing response:', {
        url: response.url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries([...response.headers.entries()]),
        contentType
      });
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: any = undefined;

      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData;
          
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ StandardResponseHandler: Error response JSON:', {
              status: response.status,
              errorData,
              errorMessage
            });
          }
        } catch (jsonError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ StandardResponseHandler: Failed to parse error JSON:', {
              status: response.status,
              jsonError: jsonError instanceof Error ? jsonError.message : jsonError
            });
          }
          // Ignore JSON parsing errors for error responses
        }
      } else {
        // Try to get text content for non-JSON errors
        try {
          const errorText = await response.text();
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ StandardResponseHandler: Error response text:', {
              status: response.status,
              errorText: errorText.substring(0, 500) // Limit length
            });
          }
          if (errorText && errorText.length > 0) {
            errorMessage = errorText;
          }
        } catch (textError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ StandardResponseHandler: Failed to get error text:', textError);
          }
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
      
      // Check if this is a paginated response (has both data array and pagination object)
      if (data && typeof data === 'object' && 'data' in data && 'pagination' in data) {
        // Return the full response structure for paginated responses
        return {
          data: data, // Return the entire object including both data and pagination
          message: data.message || "Success",
          success: data.success !== false,
          timestamp: new Date(),
        };
      }
      
      // Check if this is a response with navigation metadata (has both data and navigation object)
      if (data && typeof data === 'object' && 'data' in data && 'navigation' in data) {
        console.log('📍 [RESPONSE HANDLER] Detected navigation response structure:', {
          hasData: 'data' in data,
          hasNavigation: 'navigation' in data,
          navigation: data.navigation
        });
        // Return the full response structure for navigation responses
        return {
          data: data, // Return the entire object including both data and navigation
          message: data.message || "Success",
          success: data.success !== false,
          timestamp: new Date(),
        };
      }
      
      // For non-paginated/non-navigation responses, extract the data as before
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