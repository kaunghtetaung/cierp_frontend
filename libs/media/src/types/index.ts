/**
 * Media Library Type Definitions
 */

export interface MediaFile {
  key: string; // S3 key
  name: string; // Display name
  size: number;
  type: string; // MIME type
  url: string; // Pre-signed URL or access URL
  thumbnail?: string; // Thumbnail URL for images (deprecated - use thumbnails)
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  lastModified: Date;
  isFolder: boolean;
}

export interface MediaFolder {
  name: string;
  path: string;
  itemCount?: number;
}

export interface MediaBrowserProps {
  basePath: string; // e.g., "core/public" or "core/private/personal/{userId}"
  permissions?: MediaPermissions;
  allowedTypes?: string[]; // MIME types or extensions
  maxFileSize?: number; // bytes
  viewMode?: 'grid' | 'list';
  onFileSelect?: (file: MediaFile) => void;
  multiSelect?: boolean;
}

export interface MediaPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canCreateFolder: boolean;
}

export interface FilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: MediaFile | MediaFile[]) => void;
  basePath: string;
  accept?: string; // e.g., "image/*" or ".jpg,.png"
  multiSelect?: boolean;
  title?: string;
}

export interface FilePickerFieldProps {
  control: any; // React Hook Form control
  name: string;
  label?: string;
  basePath: string;
  accept?: string;
  required?: boolean;
  helperText?: string;
  multiple?: boolean;
}

export interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface MediaServiceConfig {
  apiBasePath: string; // e.g., "/api/media"
  tenantId?: string; // Optional - will be sent via x-tenant-id header from session
  app: string;
}

export interface ListMediaParams {
  path: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListMediaResponse {
  files: MediaFile[];
  folders: MediaFolder[];
  total: number;
  hasMore: boolean;
}

export interface UploadMediaParams {
  path: string;
  files: File[];
  onProgress?: (progress: UploadProgress[]) => void;
}

export interface DeleteMediaParams {
  path: string; // Current folder path (e.g., "public" or "public/subfolder")
  keys: string[]; // File keys relative to current path
}

export interface CreateFolderParams {
  path: string;
  folderName: string;
}

export interface MoveMediaParams {
  sourceKeys: string[];
  destinationPath: string;
}

export interface RenameMediaParams {
  key: string;
  newName: string;
}
