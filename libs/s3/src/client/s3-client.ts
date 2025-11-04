/**
 * Internal S3 Client with Full Access
 * Used server-side for all S3 operations
 */

import {
  S3Client as AWSS3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  type PutObjectCommandInput,
  type GetObjectCommandInput,
  type DeleteObjectCommandInput,
  type ListObjectsV2CommandInput,
  type HeadObjectCommandInput,
  type CopyObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { S3Config, S3Object, S3ListResult, PreSignedUrlOptions, UploadOptions } from '../types';
import { getS3Config, validateS3Config } from '../config';

export class S3Client {
  private client: AWSS3Client;
  private config: S3Config;

  constructor(config?: S3Config) {
    this.config = config || getS3Config();
    validateS3Config(this.config);

    const endpoint = this.config.port
      ? `${this.config.useSSL ? 'https' : 'http'}://${this.config.endpoint}:${this.config.port}`
      : `${this.config.useSSL ? 'https' : 'http'}://${this.config.endpoint}`;

    this.client = new AWSS3Client({
      endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  /**
   * Upload a file to S3
   */
  async putObject(
    key: string,
    body: Buffer | Uint8Array | string,
    options?: UploadOptions
  ): Promise<void> {
    const input: PutObjectCommandInput = {
      Bucket: this.config.bucketName,
      Key: key,
      Body: body,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
      ACL: options?.acl,
    };

    const command = new PutObjectCommand(input);
    await this.client.send(command);
  }

  /**
   * Download a file from S3
   */
  async getObject(key: string): Promise<Buffer> {
    const input: GetObjectCommandInput = {
      Bucket: this.config.bucketName,
      Key: key,
    };

    const command = new GetObjectCommand(input);
    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`No body in response for key: ${key}`);
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  /**
   * Delete a file from S3
   */
  async deleteObject(key: string): Promise<void> {
    const input: DeleteObjectCommandInput = {
      Bucket: this.config.bucketName,
      Key: key,
    };

    const command = new DeleteObjectCommand(input);
    await this.client.send(command);
  }

  /**
   * Delete multiple files from S3
   */
  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const command = new DeleteObjectsCommand({
      Bucket: this.config.bucketName,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
      },
    });

    await this.client.send(command);
  }

  /**
   * List objects in a prefix
   */
  async listObjects(
    prefix: string,
    options?: { maxKeys?: number; continuationToken?: string; delimiter?: string }
  ): Promise<S3ListResult> {
    const input: ListObjectsV2CommandInput = {
      Bucket: this.config.bucketName,
      Prefix: prefix,
      MaxKeys: options?.maxKeys || 1000,
      ContinuationToken: options?.continuationToken,
      Delimiter: options?.delimiter || '/',
    };

    const command = new ListObjectsV2Command(input);
    const response = await this.client.send(command);

    const objects: S3Object[] =
      response.Contents?.map(obj => ({
        key: obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag || '',
      })) || [];

    const folders: string[] = response.CommonPrefixes?.map(prefix => prefix.Prefix!) || [];

    return {
      objects,
      folders,
      prefix,
      continuationToken: response.NextContinuationToken,
    };
  }

  /**
   * Get object metadata
   */
  async getObjectMetadata(key: string): Promise<S3Object> {
    const input: HeadObjectCommandInput = {
      Bucket: this.config.bucketName,
      Key: key,
    };

    const command = new HeadObjectCommand(input);
    const response = await this.client.send(command);

    return {
      key,
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      etag: response.ETag || '',
      contentType: response.ContentType,
    };
  }

  /**
   * Generate pre-signed URL for GET operation
   * @param publicEndpoint - If provided, generates signed URL using this endpoint (for reverse proxy)
   */
  async getPreSignedUrl(key: string, options?: PreSignedUrlOptions, publicEndpoint?: string): Promise<string> {
    const input: GetObjectCommandInput = {
      Bucket: this.config.bucketName,
      Key: key,
      ResponseContentType: options?.responseContentType,
      ResponseContentDisposition: options?.responseContentDisposition,
    };

    const command = new GetObjectCommand(input);

    // If public endpoint is provided, create a temporary client with public endpoint for signing
    // This ensures the signature is valid when accessing through the reverse proxy
    if (publicEndpoint) {
      const publicClient = new AWSS3Client({
        endpoint: publicEndpoint,
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKey,
          secretAccessKey: this.config.secretKey,
        },
        forcePathStyle: true,
      });

      const url = await getSignedUrl(publicClient, command, {
        expiresIn: options?.expiresIn || 3600,
      });

      return url;
    }

    // Default: use internal endpoint
    const url = await getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn || 3600, // Default 1 hour
    });

    return url;
  }

  /**
   * Generate pre-signed URL for PUT operation (for client-side uploads)
   */
  async getPreSignedPutUrl(
    key: string,
    contentType?: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const input: PutObjectCommandInput = {
      Bucket: this.config.bucketName,
      Key: key,
      ContentType: contentType,
    };

    const command = new PutObjectCommand(input);
    const url = await getSignedUrl(this.client, command, { expiresIn });

    return url;
  }

  /**
   * Copy object to new location
   */
  async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
    const input: CopyObjectCommandInput = {
      Bucket: this.config.bucketName,
      CopySource: `${this.config.bucketName}/${sourceKey}`,
      Key: destinationKey,
    };

    const command = new CopyObjectCommand(input);
    await this.client.send(command);
  }

  /**
   * Move object (copy then delete)
   */
  async moveObject(sourceKey: string, destinationKey: string): Promise<void> {
    console.log('[S3Client] moveObject called', {
      sourceKey,
      destinationKey,
      bucket: this.config.bucketName,
    });
    await this.copyObject(sourceKey, destinationKey);
    console.log('[S3Client] Copy complete, now deleting source');
    await this.deleteObject(sourceKey);
    console.log('[S3Client] Move complete');
  }

  /**
   * Check if object exists
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      await this.getObjectMetadata(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a "folder" (empty object with trailing slash)
   */
  async createFolder(prefix: string): Promise<void> {
    const folderKey = prefix.endsWith('/') ? prefix : `${prefix}/`;
    await this.putObject(folderKey, Buffer.from(''));
  }

  /**
   * Check if bucket exists
   */
  async bucketExists(bucketName: string): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucketName }));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create bucket if it doesn't exist
   */
  async ensureBucketExists(bucketName: string): Promise<void> {
    const exists = await this.bucketExists(bucketName);
    if (!exists) {
      console.log(`[S3] Creating bucket: ${bucketName}`);
      await this.client.send(new CreateBucketCommand({ Bucket: bucketName }));
    }
  }

  /**
   * Set up folder structure for tenant bucket
   * Creates:
   * - {app}/public
   * - {app}/private/common
   * - {app}/private/departments
   * - personal/{username} (created dynamically per user, not during initialization)
   *
   * Intelligently checks if folders exist before creating them
   */
  async setupTenantBucketStructure(bucketName: string, apps: string[] = ['core', 'publicWeb']): Promise<void> {
    console.log(`[S3] Setting up folder structure for bucket: ${bucketName}, apps: ${apps.join(', ')}`);

    const folders: string[] = [];

    // Create app-specific folders
    for (const app of apps) {
      folders.push(`${app}/public/.keep`);
      folders.push(`${app}/private/common/.keep`);
      folders.push(`${app}/private/departments/.keep`);
    }

    // Create all folders (only if they don't exist)
    let createdCount = 0;
    let existingCount = 0;

    for (const folder of folders) {
      try {
        // Check if folder already exists
        try {
          await this.client.send(new HeadObjectCommand({
            Bucket: bucketName,
            Key: folder,
          }));
          // Folder exists
          existingCount++;
          console.log(`[S3] Folder already exists: ${folder}`);
          continue;
        } catch (error: any) {
          // 404 means folder doesn't exist, continue to create
          if (error.name !== 'NotFound' && error.$metadata?.httpStatusCode !== 404) {
            throw error;
          }
        }

        // Create folder
        await this.client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: folder,
          Body: Buffer.from(''),
        }));
        createdCount++;
        console.log(`[S3] Created folder: ${folder}`);
      } catch (error) {
        console.error(`[S3] Failed to create folder ${folder}:`, error);
      }
    }

    console.log(`[S3] Folder setup complete: ${createdCount} created, ${existingCount} already existed. Personal folders will be created per user.`);
  }

  /**
   * Ensure personal folder exists for a user
   * Creates: personal/{username}/.keep
   * Note: Personal folders are NOT app-specific
   */
  async ensurePersonalFolder(bucketName: string, username: string): Promise<void> {
    const personalFolderKey = `personal/${username}/.keep`;

    try {
      // Check if folder already exists
      try {
        await this.client.send(new HeadObjectCommand({
          Bucket: bucketName,
          Key: personalFolderKey,
        }));
        // Folder exists, no need to create
        return;
      } catch (error: any) {
        // 404 means folder doesn't exist, continue to create
        if (error.name !== 'NotFound' && error.$metadata?.httpStatusCode !== 404) {
          throw error;
        }
      }

      // Create personal folder
      await this.client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: personalFolderKey,
        Body: Buffer.from(''),
      }));

      console.log(`[S3] Created personal folder for user: ${username}`);
    } catch (error) {
      console.error(`[S3] Failed to create personal folder for ${username}:`, error);
      throw error;
    }
  }

  /**
   * Set public access policy for bucket
   * Allows public read access to */public/* paths
   */
  async setPublicAccessPolicy(bucketName: string): Promise<void> {
    console.log(`[S3] Setting public access policy for bucket: ${bucketName}`);

    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [
            `arn:aws:s3:::${bucketName}/*/public/*`,
          ],
        },
      ],
    };

    try {
      await this.client.send(new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(policy),
      }));
    } catch (error) {
      console.error(`[S3] Failed to set public access policy:`, error);
    }
  }

  /**
   * Initialize complete tenant bucket with structure and policies
   */
  async initializeTenantBucket(bucketName: string, apps?: string[]): Promise<void> {
    console.log(`[S3] Initializing tenant bucket: ${bucketName}`);

    // Create bucket if needed
    await this.ensureBucketExists(bucketName);

    // Set up folder structure
    await this.setupTenantBucketStructure(bucketName, apps);

    // Set public access policy
    await this.setPublicAccessPolicy(bucketName);

    console.log(`[S3] Tenant bucket ${bucketName} initialized successfully`);
  }
}

// Singleton instance
let s3ClientInstance: S3Client | null = null;

/**
 * Get or create S3 client instance
 */
export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client();
  }
  return s3ClientInstance;
}
