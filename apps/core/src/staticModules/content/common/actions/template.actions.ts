/**
 * Template Server Actions
 *
 * Next.js Server Actions wrapping `TemplateService`. All actions are
 * tenant-scoped: tenant context resolves via `x-tenant-id` header /
 * `getCurrentUser`/`getCurrentSession` on the server. Backend's
 * CoreGuard re-validates org-scope on every call.
 */

'use server';

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { TemplateService } from '../services/template.service';
import type { ApiResponse } from '@repo/types';
import type {
  Template,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateQuery,
  TemplateListResponse,
  TemplateRefItem,
} from '../types';

async function getTemplateService(): Promise<TemplateService> {
  const headerStore = await headers();
  const [user, session] = await Promise.all([
    getCurrentUser(headerStore),
    getCurrentSession(headerStore),
  ]);
  if (!user || !session) {
    throw new Error('Authentication required');
  }
  const tenantId =
    headerStore.get('x-tenant-id') || user.tenantId || session.tenantId;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  const apiUrl = await getApiDomain();
  return new TemplateService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

function failure(message: string, error?: unknown): ApiResponse<any> {
  return {
    success: false,
    error: error instanceof Error ? error.message : message,
    message,
    data: null as any,
    timestamp: new Date(),
  };
}

export async function createTemplate(
  data: CreateTemplateDto,
): Promise<ApiResponse<Template>> {
  try {
    if (!data.name) {
      return failure('Template name is required');
    }
    const service = await getTemplateService();
    return await service.create(data);
  } catch (error) {
    console.error('Create template error:', error);
    return failure('Failed to create template', error);
  }
}

export async function getTemplates(
  params?: TemplateQuery,
): Promise<ApiResponse<TemplateListResponse>> {
  try {
    const service = await getTemplateService();
    return await service.getAll(params);
  } catch (error) {
    console.error('Get templates error:', error);
    return failure('Failed to fetch templates', error);
  }
}

/**
 * Reference list for the Page form's template dropdown. Returns
 * lightweight `{ id, label, value, slug, category, previewImage }`.
 */
export async function getTemplateReference(): Promise<
  ApiResponse<TemplateRefItem[]>
> {
  try {
    const service = await getTemplateService();
    return await service.getReference();
  } catch (error) {
    console.error('Get template reference error:', error);
    return failure('Failed to fetch template references', error);
  }
}

export async function getTemplateById(
  id: string,
): Promise<ApiResponse<Template>> {
  try {
    const service = await getTemplateService();
    return await service.getById(id);
  } catch (error) {
    console.error('Get template error:', error);
    return failure('Failed to fetch template', error);
  }
}

export async function updateTemplate(
  id: string,
  data: UpdateTemplateDto,
): Promise<ApiResponse<Template>> {
  try {
    const service = await getTemplateService();
    return await service.update(id, data);
  } catch (error) {
    console.error('Update template error:', error);
    return failure('Failed to update template', error);
  }
}

export async function deleteTemplate(id: string): Promise<ApiResponse<void>> {
  try {
    const service = await getTemplateService();
    return await service.delete(id);
  } catch (error) {
    console.error('Delete template error:', error);
    return failure('Failed to delete template', error);
  }
}

export async function hardDeleteTemplate(
  id: string,
): Promise<ApiResponse<void>> {
  try {
    const service = await getTemplateService();
    return await service.hardDelete(id);
  } catch (error) {
    console.error('Hard delete template error:', error);
    return failure('Failed to permanently delete template', error);
  }
}

export async function getDeletedTemplates(
  page: number = 1,
  limit: number = 10,
): Promise<ApiResponse<TemplateListResponse>> {
  try {
    const service = await getTemplateService();
    return await service.getDeleted(page, limit);
  } catch (error) {
    console.error('Get deleted templates error:', error);
    return failure('Failed to fetch deleted templates', error);
  }
}

export async function getDeletedTemplateCount(): Promise<
  ApiResponse<{ count: number }>
> {
  try {
    const service = await getTemplateService();
    return await service.getDeletedCount();
  } catch (error) {
    console.error('Get deleted template count error:', error);
    return failure('Failed to fetch deleted count', error);
  }
}

export async function restoreTemplate(
  id: string,
): Promise<ApiResponse<Template>> {
  try {
    const service = await getTemplateService();
    return await service.restore(id);
  } catch (error) {
    console.error('Restore template error:', error);
    return failure('Failed to restore template', error);
  }
}
