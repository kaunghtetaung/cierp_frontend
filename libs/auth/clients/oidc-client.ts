// OIDC Client implementation - Single Responsibility: OIDC communication
import { getAuthDomain, getApiDomain } from '@repo/utils/server';
import type { OIDCClient, TokenData, TOKEN_CONSTANTS } from '../types/token-types';

export class StandardOIDCClient implements OIDCClient {
  
  async fetchToken(endpoint: string, params: Record<string, string>): Promise<TokenData> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OIDC token request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const tokenData = await response.json();
    if (!tokenData.access_token) {
      throw new Error("No access token received from OIDC endpoint");
    }

    return tokenData;
  }

  async refreshUserToken(refreshToken: string): Promise<TokenData> {
    const authDomain = await this.getAuthDomain();
    const tokenEndpoint = `${authDomain}/oidc/token`;

    const params = {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    };

    return this.fetchToken(tokenEndpoint, params);
  }

  async getAuthDomain(): Promise<string> {
    return await getAuthDomain();
  }

  async getApiDomain(): Promise<string> {
    return await getApiDomain();
  }

  // Helper method for client credentials flow
  async fetchClientCredentialsToken(
    clientId: string,
    clientSecret: string,
    scope: string,
    resource: string
  ): Promise<TokenData> {
    const authDomain = await this.getAuthDomain();
    const tokenEndpoint = `${authDomain}/oidc/token`;

    const params = {
      grant_type: "client_credentials",
      scope,
      resource,
    };

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams(params).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Client credentials token request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const tokenData = await response.json();
    if (!tokenData.access_token) {
      throw new Error("No access token received from OIDC endpoint");
    }

    return tokenData;
  }
}