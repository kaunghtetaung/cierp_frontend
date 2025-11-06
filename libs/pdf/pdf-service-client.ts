/**
 * PDF Watermark Service Client
 *
 * Client for calling the centralized PDF watermark service
 * Service handles:
 * - Fetching PDFs from S3
 * - Redis caching (3min TTL, configurable)
 * - Page extraction
 * - Watermark application (diagonal grid pattern)
 * - PDF or JPG output
 */

/**
 * Request format for PDF watermark service
 */
export interface PdfWatermarkRequest {
  /** S3 file path (relative to bucket) */
  filePath: string;
  /** Page number to watermark (1-indexed) */
  pageNumber: number;
  /** User's display name */
  userName: string;
  /** User ID for tracking */
  userId: string;
  /** Main watermark text (e.g., "CONFIDENTIAL", book title) */
  watermarkText: string;
  /** Tenant/Organization ID */
  tenantId: string;
  /** Tenant/Organization name */
  tenantName: string;
  /** Output format: 'pdf' or 'jpg' */
  outputFormat: 'pdf' | 'jpg';
}

/**
 * Request format for PDF metadata
 */
export interface PdfMetadataRequest {
  /** S3 file path */
  filePath: string;
  /** Tenant ID */
  tenantId: string;
}

/**
 * Response format for PDF metadata
 */
export interface PdfMetadataResponse {
  success: boolean;
  data: {
    pageCount: number;
    filePath: string;
    fileSize: number;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
  processingTime: number;
}

/**
 * PDF Service client configuration
 */
export interface PdfServiceConfig {
  /** Service base URL */
  serviceUrl: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * PDF Watermark Service Client
 */
export class PdfServiceClient {
  private serviceUrl: string;
  private timeout: number;

  constructor(config: PdfServiceConfig) {
    this.serviceUrl = config.serviceUrl;
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  /**
   * Get a watermarked PDF page
   *
   * @param request - Watermark request parameters
   * @returns Buffer containing watermarked page (PDF or JPG)
   * @throws Error if service fails or returns non-2xx status
   */
  async getWatermarkedPage(request: PdfWatermarkRequest): Promise<Buffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.serviceUrl}/watermark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `PDF service returned ${response.status}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response body is not JSON, use status text
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      // Get binary data
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`PDF service timeout after ${this.timeout}ms`);
        }
        throw error;
      }

      throw new Error('Unknown error calling PDF service');
    }
  }

  /**
   * Get PDF metadata (page count, file info, etc.)
   *
   * @param request - Metadata request parameters
   * @returns Metadata response with page count and file info
   * @throws Error if service fails or returns non-2xx status
   */
  async getMetadata(request: PdfMetadataRequest): Promise<PdfMetadataResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.serviceUrl}/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `PDF service returned ${response.status}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`PDF service timeout after ${this.timeout}ms`);
        }
        throw error;
      }

      throw new Error('Unknown error calling PDF service');
    }
  }

  /**
   * Health check for PDF service
   *
   * @returns true if service is healthy, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.serviceUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Create a PDF service client with configuration from environment
 */
export function createPdfServiceClient(): PdfServiceClient {
  const serviceUrl = process.env.PDF_SERVICE_URL || 'http://localhost:3338';
  const timeout = process.env.PDF_SERVICE_TIMEOUT
    ? parseInt(process.env.PDF_SERVICE_TIMEOUT, 10)
    : 30000;

  return new PdfServiceClient({ serviceUrl, timeout });
}
