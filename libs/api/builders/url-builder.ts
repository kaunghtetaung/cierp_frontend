// URL Builder Strategy - Single Responsibility: URL construction
import type { UrlBuilder, HttpClientConfig } from '../types/http-types';

export class StandardUrlBuilder implements UrlBuilder {
  constructor(private config: HttpClientConfig) {}

  buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): string {
    let baseUrl: string;

    if (endpoint.startsWith("http")) {
      baseUrl = endpoint;
    } else {
      baseUrl = `${this.config.baseURL}${endpoint}`;
    }

    // Create URL object - handle both server and client environments
    const url = new URL(baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }
}