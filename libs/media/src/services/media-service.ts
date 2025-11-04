/**
 * Media Service
 * Client-side service for media operations via Server Actions
 */

import type {
  MediaFile,
  MediaFolder,
  ListMediaParams,
  ListMediaResponse,
  UploadMediaParams,
  DeleteMediaParams,
  CreateFolderParams,
  MoveMediaParams,
  RenameMediaParams,
  UploadProgress,
  MediaServiceConfig,
} from '../types';

// Server action function types
export interface MediaServerActions {
  listMediaAction: (params: {
    tenantId: string;
    app: string;
    path?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => Promise<ListMediaResponse>;
  uploadMediaAction: (params: {
    tenantId: string;
    app: string;
    path?: string;
    file: File;
  }) => Promise<MediaFile>;
  deleteMediaAction: (params: {
    tenantId: string;
    app: string;
    path?: string;
    keys: string[];
  }) => Promise<{ success: boolean }>;
  createFolderAction: (params: {
    tenantId: string;
    app: string;
    path?: string;
    folderName: string;
  }) => Promise<{ success: boolean }>;
  moveMediaAction: (params: {
    tenantId: string;
    app: string;
    sourceKeys: string[];
    sourcePath?: string;
    destinationPath: string;
  }) => Promise<{ success: boolean }>;
  renameMediaAction: (params: {
    tenantId: string;
    app: string;
    key: string;
    newName: string;
  }) => Promise<{ success: boolean }>;
}

export class MediaService {
  private config: MediaServiceConfig;
  private tenantId: string;
  private actions: MediaServerActions;

  constructor(config: MediaServiceConfig, tenantId: string, actions: MediaServerActions) {
    this.config = config;
    this.tenantId = tenantId;
    this.actions = actions;
  }

  /**
   * List files and folders
   */
  async listMedia(params: ListMediaParams): Promise<ListMediaResponse> {
    return this.actions.listMediaAction({
      tenantId: this.tenantId,
      app: this.config.app,
      path: params.path,
      page: params.page,
      limit: params.limit,
      search: params.search,
    });
  }

  /**
   * Upload files with progress tracking
   */
  async uploadFiles(params: UploadMediaParams): Promise<MediaFile[]> {
    const { path, files, onProgress } = params;

    const uploads = files.map((file, index) =>
      this.uploadSingleFile(file, path, onProgress, index)
    );

    return Promise.all(uploads);
  }

  /**
   * Upload a single file
   */
  private async uploadSingleFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress[]) => void,
    index: number = 0
  ): Promise<MediaFile> {
    try {
      if (onProgress) {
        onProgress([{
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        }]);
      }

      const result = await this.actions.uploadMediaAction({
        tenantId: this.tenantId,
        app: this.config.app,
        path,
        file,
      });

      if (onProgress) {
        onProgress([{
          fileName: file.name,
          progress: 100,
          status: 'success',
        }]);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      if (onProgress) {
        onProgress([{
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: errorMessage,
        }]);
      }

      throw error;
    }
  }

  /**
   * Delete files or folders
   */
  async deleteMedia(params: DeleteMediaParams): Promise<void> {
    await this.actions.deleteMediaAction({
      tenantId: this.tenantId,
      app: this.config.app,
      path: params.path,
      keys: params.keys,
    });
  }

  /**
   * Create a new folder
   */
  async createFolder(params: CreateFolderParams): Promise<void> {
    await this.actions.createFolderAction({
      tenantId: this.tenantId,
      app: this.config.app,
      path: params.path,
      folderName: params.folderName,
    });
  }

  /**
   * Move files or folders
   */
  async moveMedia(params: MoveMediaParams): Promise<void> {
    await this.actions.moveMediaAction({
      tenantId: this.tenantId,
      app: this.config.app,
      sourceKeys: params.sourceKeys,
      destinationPath: params.destinationPath,
    });
  }

  /**
   * Rename file or folder
   */
  async renameMedia(params: RenameMediaParams): Promise<void> {
    await this.actions.renameMediaAction({
      tenantId: this.tenantId,
      app: this.config.app,
      key: params.key,
      newName: params.newName,
    });
  }
}

/**
 * Create media service instance
 */
export function createMediaService(config: MediaServiceConfig, tenantId: string, actions: MediaServerActions): MediaService {
  return new MediaService(config, tenantId, actions);
}
