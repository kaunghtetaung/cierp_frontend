/**
 * Internal Full Access Strategy
 * For server-side operations with full S3 access
 */

import type { S3Operation, S3OperationContext } from '../types';
import { BaseS3Strategy } from './base-strategy';
import { TenantS3Client } from '../client/tenant-s3-client';

export class InternalS3Strategy extends BaseS3Strategy {
  name = 'InternalS3Strategy';

  /**
   * Can handle all operations when explicitly requested
   * This strategy should be used programmatically, not through path matching
   */
  canHandle(_path: string, _operation: S3Operation): boolean {
    // This strategy is used explicitly, not through automatic detection
    return false;
  }

  /**
   * Execute with full S3 access
   */
  async execute(context: S3OperationContext): Promise<unknown> {
    const { tenantId, app, path, operation, options } = context;

    // Create tenant-scoped client with full access
    const client = new TenantS3Client({ tenantId, app });

    switch (operation) {
      case 'getObject':
        return client.getObject(path);

      case 'putObject':
        return client.putObject(
          path,
          options?.body as Buffer,
          options?.uploadOptions as any
        );

      case 'deleteObject':
        return client.deleteObject(path);

      case 'listObjects':
        return client.listObjects(path, {
          maxKeys: options?.maxKeys as number,
          continuationToken: options?.continuationToken as string,
        });

      case 'getMetadata':
        return client.getObjectMetadata(path);

      case 'getPreSignedUrl':
        return client.getPreSignedUrl(path, options?.preSignedOptions as any);

      default:
        throw new Error(`Operation ${operation} not supported`);
    }
  }
}

/**
 * Helper function to execute operations with internal strategy
 */
export async function executeInternalOperation<T>(
  context: S3OperationContext
): Promise<T> {
  const strategy = new InternalS3Strategy();
  return (await strategy.execute(context)) as T;
}
