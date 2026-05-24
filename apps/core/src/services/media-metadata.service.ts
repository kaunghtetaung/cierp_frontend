/**
 * MediaMetadataService — thin wrapper around the backend `/core/media/*`
 * endpoints. Used by media server actions to keep file content (MinIO) in
 * sync with metadata records (MongoDB).
 *
 * Pattern follows other module services (PostService, etc.). Auth context
 * (tenantId, userSessionId, userId) is required for every call.
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type { ApiResponse } from '@repo/types';

const MEDIA_BASE = '/core/media';

/**
 * Backend Media document shape (kept in sync with `apps/core/src/media`
 * Mongoose schema). Hand-written here because there is no shared types
 * package between backend and frontend yet.
 */
export interface MediaMetadata {
  _id: string;
  id?: string;
  organizationId: string;
  uploadedBy: string;
  uploadedFromIp?: string;
  key: string;
  url: string;
  storageProvider: 'minio' | 's3' | 'azure' | 'gcs';
  storageBucket?: string;
  visibility: 'public' | 'private' | 'personal';
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  checksum?: string;
  alt?: { en?: string; mm?: string };
  caption?: { en?: string; mm?: string };
  tags?: string[];
  folderPath?: string;
  thumbnails?: { small?: string; medium?: string; large?: string };
  deletedAt?: string | null;
  deletedBy?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMediaMetadataInput {
  key: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  checksum?: string;
  storageProvider?: 'minio' | 's3' | 'azure' | 'gcs';
  storageBucket?: string;
  visibility?: 'public' | 'private' | 'personal';
  alt?: { en?: string; mm?: string };
  caption?: { en?: string; mm?: string };
  tags?: string[];
  folderPath?: string;
  thumbnails?: { small?: string; medium?: string; large?: string };
  uploadedFromIp?: string;
}

export interface UpdateMediaMetadataInput {
  alt?: { en?: string; mm?: string };
  caption?: { en?: string; mm?: string };
  tags?: string[];
  folderPath?: string;
  visibility?: 'public' | 'private' | 'personal';
  version?: number;
}

export interface MediaListQuery {
  page?: number;
  limit?: number;
  search?: string;
  mimeType?: string;
  visibility?: 'public' | 'private' | 'personal';
  folderPath?: string;
  tag?: string;
  uploadedBy?: string;
  sortBy?: 'filename' | 'size' | 'mimeType' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MediaListResponse {
  data: MediaMetadata[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface RequestContext {
  tenantId?: string;
  userSessionId?: string;
  userId?: string;
}

export class MediaMetadataService {
  private readonly httpClient: ReturnType<typeof getCachedServerHttpClient>;
  private readonly ctx: RequestContext;

  constructor(baseURL: string, ctx: RequestContext = {}) {
    this.httpClient = getCachedServerHttpClient(baseURL);
    this.ctx = ctx;
  }

  /** Register file metadata after a successful storage upload. */
  async create(
    data: CreateMediaMetadataInput,
  ): Promise<ApiResponse<MediaMetadata>> {
    return this.httpClient.request<MediaMetadata>(MEDIA_BASE, {
      method: 'POST',
      body: data,
      ...this.requestOpts(),
    });
  }

  async list(query?: MediaListQuery): Promise<ApiResponse<MediaListResponse>> {
    let endpoint = MEDIA_BASE;
    if (query) {
      const params = new URLSearchParams();
      if (query.page) params.set('page', String(query.page));
      if (query.limit) params.set('limit', String(query.limit));
      if (query.search) params.set('search', query.search);
      if (query.mimeType) params.set('mimeType', query.mimeType);
      if (query.visibility) params.set('visibility', query.visibility);
      if (query.folderPath) params.set('folderPath', query.folderPath);
      if (query.tag) params.set('tag', query.tag);
      if (query.uploadedBy) params.set('uploadedBy', query.uploadedBy);
      if (query.sortBy) params.set('sortBy', query.sortBy);
      if (query.sortOrder) params.set('sortOrder', query.sortOrder);
      const qs = params.toString();
      if (qs) endpoint += `?${qs}`;
    }
    return this.httpClient.request<MediaListResponse>(endpoint, {
      method: 'GET',
      ...this.requestOpts(),
    });
  }

  async getById(id: string): Promise<ApiResponse<MediaMetadata>> {
    return this.httpClient.request<MediaMetadata>(`${MEDIA_BASE}/${id}`, {
      method: 'GET',
      ...this.requestOpts(),
    });
  }

  async update(
    id: string,
    data: UpdateMediaMetadataInput,
  ): Promise<ApiResponse<MediaMetadata>> {
    return this.httpClient.request<MediaMetadata>(`${MEDIA_BASE}/${id}`, {
      method: 'PATCH',
      body: data,
      ...this.requestOpts(),
    });
  }

  async softDelete(id: string): Promise<ApiResponse<MediaMetadata>> {
    return this.httpClient.request<MediaMetadata>(`${MEDIA_BASE}/${id}`, {
      method: 'DELETE',
      ...this.requestOpts(),
    });
  }

  async restore(id: string): Promise<ApiResponse<MediaMetadata>> {
    return this.httpClient.request<MediaMetadata>(
      `${MEDIA_BASE}/restore/${id}`,
      {
        method: 'PATCH',
        ...this.requestOpts(),
      },
    );
  }

  /**
   * Permanent delete — also removes the underlying storage object on the
   * backend side. Use only when the caller already verified the media is
   * unreferenced (or accepts the risk).
   */
  async hardDelete(
    id: string,
  ): Promise<ApiResponse<{ deleted: true; id: string; key: string }>> {
    return this.httpClient.request<{
      deleted: true;
      id: string;
      key: string;
    }>(`${MEDIA_BASE}/hard/${id}`, {
      method: 'DELETE',
      ...this.requestOpts(),
    });
  }

  async findByKeys(keys: string[]): Promise<ApiResponse<MediaMetadata[]>> {
    return this.httpClient.request<MediaMetadata[]>(
      `${MEDIA_BASE}/by-keys`,
      {
        method: 'POST',
        body: { keys },
        ...this.requestOpts(),
      },
    );
  }

  async findByIds(ids: string[]): Promise<ApiResponse<MediaMetadata[]>> {
    return this.httpClient.request<MediaMetadata[]>(
      `${MEDIA_BASE}/bulk/find-by-ids`,
      {
        method: 'POST',
        body: { ids },
        ...this.requestOpts(),
      },
    );
  }

  async getUsage(
    id: string,
  ): Promise<
    ApiResponse<{
      mediaId: string;
      usages: { collection: string; count: number; ids: string[] }[];
    }>
  > {
    return this.httpClient.request<{
      mediaId: string;
      usages: { collection: string; count: number; ids: string[] }[];
    }>(`${MEDIA_BASE}/${id}/usage`, {
      method: 'GET',
      ...this.requestOpts(),
    });
  }

  private requestOpts() {
    return {
      tenantId: this.ctx.tenantId,
      userSessionId: this.ctx.userSessionId,
      userId: this.ctx.userId,
      withAuth: true,
      tokenStrategy: 'auto' as const,
    };
  }
}
