/**
 * Settings Service
 * Handles all API calls to the settings module
 * Following ModuleService pattern with httpClient.request()
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type { ApiResponse } from '@repo/types';
import type {
  Settings,
  PublicSettings,
  UpdateSettingsDto,
  SettingsResponse,
  PublicSettingsResponse,
} from '../types';

// Base endpoint for settings API
const SETTINGS_BASE = '/content/settings';

/**
 * Recursively strip `_id` keys from every nested plain-object /
 * array so the backend's `forbidNonWhitelisted` ValidationPipe
 * doesn't reject the round-tripped Mongoose subdocs.
 */
function stripIdsDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripIdsDeep(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === '_id') continue;
      out[k] = stripIdsDeep(v);
    }
    return out as T;
  }
  return value;
}

/**
 * `homePageId` may arrive on the form as the raw post object
 * (Mongoose populate / older API shape) or as a bare string. The
 * backend DTO expects a string. Normalise here so admins picking
 * the home page from the dropdown — which stores the post id —
 * AND the round-tripped object case both work.
 */
function flattenHomePageId(data: UpdateSettingsDto): UpdateSettingsDto {
  const ref = (data as any).homePageId;
  if (ref && typeof ref === 'object' && ref._id) {
    return { ...data, homePageId: String(ref._id) };
  }
  return data;
}

function sanitiseUpdatePayload(
  data: UpdateSettingsDto,
): UpdateSettingsDto {
  return stripIdsDeep(flattenHomePageId(data));
}

/**
 * Settings Service Class
 * Follows ModuleService pattern with proper request config
 */
export class SettingsService {
  private httpClient;
  private baseURL: string;
  private tenantId?: string;
  private userSessionId?: string;
  private userId?: string;

  constructor(
    baseURL: string,
    options?: {
      tenantId?: string;
      userSessionId?: string;
      userId?: string;
    }
  ) {
    this.baseURL = baseURL;
    this.httpClient = getCachedServerHttpClient(baseURL);
    this.tenantId = options?.tenantId;
    this.userSessionId = options?.userSessionId;
    this.userId = options?.userId;
  }

  /**
   * Get current settings.
   *
   * Backend `@Get()` is a list endpoint (`findAll`) — it returns
   * `data: SettingsDocument[]` filtered by the access-context's
   * `organizationId`. Since each tenant has at most one settings doc
   * (unique index on `organizationId`), we normalise the response
   * to the single doc here. Callers expect a single Settings object,
   * not an array. Without this normalisation, `result.data.themeName`
   * (and every other field accessor in the admin Settings page) would
   * be `undefined` and the form would silently load with defaults.
   */
  async get(): Promise<ApiResponse<Settings>> {
    const response = await this.httpClient.request<any>(
      SETTINGS_BASE,
      {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch settings');
    }

    // Three shapes can land here depending on which response-handler
    // branch fired:
    //   1. Plain unwrap   → response.data is the array OR a doc.
    //   2. Wrap preserved → response.data is `{ data: [...], meta }`
    //      (StandardResponseHandler now keeps that wrap when both
    //       `data` and `meta` are on the body — see response-handler.ts).
    // Drill through both shapes to land on the settings doc.
    let raw: any = response.data;
    if (
      raw &&
      typeof raw === 'object' &&
      !Array.isArray(raw) &&
      'data' in raw &&
      ('meta' in raw || 'pagination' in raw)
    ) {
      raw = (raw as any).data;
    }
    const single = Array.isArray(raw) ? raw[0] : raw;

    return {
      ...response,
      data: single ?? null,
    } as ApiResponse<Settings>;
  }

  /**
   * Get public settings (no auth required)
   */
  async getPublic(): Promise<ApiResponse<PublicSettings>> {
    const response = await this.httpClient.request<PublicSettings>(
      `${SETTINGS_BASE}/public`,
      {
        method: 'GET',
        tenantId: this.tenantId,
        withAuth: false,
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch public settings');
    }

    return response;
  }

  /**
   * Initialize settings (if not exists)
   */
  async initialize(): Promise<ApiResponse<Settings>> {
    const response = await this.httpClient.request<Settings>(
      SETTINGS_BASE,
      {
        method: 'POST',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to initialize settings');
    }

    return response;
  }

  /**
   * Update settings.
   *
   * Backend exposes `@Patch(':id')` only — the frontend used to omit
   * the id and PATCH `/content/settings`, which never matched a
   * route. We resolve the id by GETing the tenant's settings list
   * (the GET route is `findAll`, returns an array filtered by
   * tenant), pick the first/only doc, then PATCH `/content/settings/:id`.
   *
   * The payload also gets sanitised before sending:
   *   - `_id` keys stripped recursively from every nested object
   *     (Mongoose subdoc round-trip pollution; the backend DTOs
   *     have `forbidNonWhitelisted: true` and reject any `_id`
   *     showing up under HeaderSettingsDto, FooterSettingsDto, etc.)
   *   - `homePageId` flattened from `{ _id, title, slug }` (Mongoose
   *     populated form) back to its bare `_id` string, which is what
   *     the DTO expects.
   */
  async update(data: UpdateSettingsDto): Promise<ApiResponse<Settings>> {
    const current = await this.get();
    const raw = current.data as any;
    let doc = Array.isArray(raw) ? raw[0] : raw;
    let id = doc?._id;

    // First-save bootstrap. The settings doc is created lazily on the
    // tenant's first save — earlier this threw "no existing settings
    // doc, initialize first", which surfaced as a hard error in the
    // admin UI on a brand-new tenant. Detect the missing-doc case and
    // POST `/settings` to create it, then continue with the PATCH so
    // the user's payload (banner / theme / etc.) is the FIRST thing
    // that lands in the new doc.
    if (!id) {
      const initRes = await this.initialize();
      const initDoc = (initRes?.data as any) ?? null;
      doc = Array.isArray(initDoc) ? initDoc[0] : initDoc;
      id = doc?._id;
      if (!id) {
        throw new Error(
          'Failed to initialize settings doc before update — ' +
            'check that the content service /settings POST route is reachable.',
        );
      }
    }

    const sanitisedBody = sanitiseUpdatePayload(data);

    const response = await this.httpClient.request<Settings>(
      `${SETTINGS_BASE}/${id}`,
      {
        method: 'PATCH',
        body: sanitisedBody,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to update settings');
    }

    return response;
  }

  /**
   * Update theme settings
   */
  async updateTheme(themeName: string): Promise<ApiResponse<Settings>> {
    return this.update({ themeName });
  }

  /**
   * Update layout settings
   */
  async updateLayout(layout: UpdateSettingsDto['layout']): Promise<ApiResponse<Settings>> {
    return this.update({ layout });
  }

  /**
   * Update header settings
   */
  async updateHeader(header: UpdateSettingsDto['header']): Promise<ApiResponse<Settings>> {
    return this.update({ header });
  }

  /**
   * Update footer settings
   */
  async updateFooter(footer: UpdateSettingsDto['footer']): Promise<ApiResponse<Settings>> {
    return this.update({ footer });
  }

  /**
   * Update SEO defaults
   */
  async updateSeo(data: Pick<UpdateSettingsDto, 'metaTitle' | 'metaDescription' | 'metaKeywords'>): Promise<ApiResponse<Settings>> {
    return this.update(data);
  }

  /**
   * Update language settings
   */
  async updateLanguages(defaultLanguage: string, availableLanguages: string[]): Promise<ApiResponse<Settings>> {
    return this.update({ defaultLanguage, availableLanguages });
  }

  /**
   * Set home page
   */
  async setHomePage(homePageId: string): Promise<ApiResponse<Settings>> {
    return this.update({ homePageId });
  }

  /**
   * Enable/disable header menu
   */
  async toggleHeaderMenu(enabled: boolean, menuId?: string): Promise<ApiResponse<Settings>> {
    return this.update({
      enableHeaderMenu: enabled,
      headerMenuId: menuId,
    });
  }

  /**
   * Enable/disable footer menu
   */
  async toggleFooterMenu(enabled: boolean, menuId?: string): Promise<ApiResponse<Settings>> {
    return this.update({
      enableFooterMenu: enabled,
      footerMenuId: menuId,
    });
  }
}
