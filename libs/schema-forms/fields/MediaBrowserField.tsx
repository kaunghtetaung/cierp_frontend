/**
 * Media Browser Field Component
 * Form field that opens media browser dialog for file selection
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui';
import {
  X,
  File,
  Image as ImageIcon,
  FileText,
  Film,
  AlertCircle,
  FileSpreadsheet,
  FileArchive,
  Upload
} from 'lucide-react';
import { MediaBrowserDialog } from './MediaBrowserDialog';
import { useAppContext } from '../hooks/use-app-context';
import type { MediaFile } from '@repo/media';
import type { MediaBrowserConfig, MultilingualText } from '@repo/types';
import { getLocalizedText } from '@repo/utils';

export interface MediaBrowserFieldProps {
  value: string | string[] | Record<string, any> | Record<string, any>[] | null;
  onChange: (value: any) => void;
  config: MediaBrowserConfig;
  label: MultilingualText;
  fieldName: string;
  error?: string;
  disabled?: boolean;
  currentLanguage: string;
  showUploadButton?: boolean; // Show direct upload button for mediaUploader type
}

export function MediaBrowserField({
  value,
  onChange,
  config,
  label,
  fieldName,
  error,
  disabled,
  currentLanguage,
  showUploadButton = false,
}: MediaBrowserFieldProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [displayValue, setDisplayValue] = useState<any>(null);
  const [isTransformingUrl, setIsTransformingUrl] = useState(false);
  const { tenantId, appId, username, isLoading, error: contextError } = useAppContext();

  // Transform S3 keys to signed URLs for display
  useEffect(() => {
    const transformS3KeyToUrl = async () => {
      // Check if value looks like an S3 key (contains path structure but not a URL)
      if (value && typeof value === 'string' && value.includes('/') && !value.startsWith('http') && !value.startsWith('blob:')) {
        console.log(`[MediaBrowserField] Detected S3 key for ${fieldName}, fetching signed URL:`, value);
        setIsTransformingUrl(true);

        try {
          // Import the action to get signed URL
          const { getPrivateFileUrl } = await import('@/actions/media-url');

          // Extract tenant root domain from current hostname
          const hostname = window.location.hostname;
          const tenantRootDomain = hostname.split('.').slice(1).join('.');
          const tenantSlug = value.split('/')[0]; // Extract slug from S3 key

          // Extract app from URL path (e.g., /cpms/students -> cpms)
          const pathParts = window.location.pathname.split('/').filter(Boolean);
          const appFromPath = pathParts[0] || 'cpms';

          // Use fallback values if context is not available
          const contextTenantId = tenantId || tenantSlug;
          const contextAppId = appId || appFromPath;

          console.log(`[MediaBrowserField] Fetching signed URL with context:`, {
            tenantId: contextTenantId,
            tenantSlug,
            tenantRootDomain,
            appId: contextAppId,
            extractedFromUrl: !tenantId || !appId
          });

          const result = await getPrivateFileUrl({
            s3Key: value,
            tenantId: contextTenantId,
            tenantSlug: tenantSlug,
            tenantRootDomain: tenantRootDomain,
            app: contextAppId,
            includeThumbnails: true, // Request thumbnails for preview
          });

          if (result.success && result.signedUrl) {
            console.log(`[MediaBrowserField] Successfully transformed S3 key to signed URL for ${fieldName}`, {
              hasThumbnails: !!result.thumbnails,
            });
            // Create display object with signed URL and thumbnails
            setDisplayValue({
              name: value.split('/').pop() || value,
              url: result.signedUrl,
              key: value,
              type: guessFileType(value),
              thumbnails: result.thumbnails, // Add thumbnails for preview
            });
          } else {
            console.error(`[MediaBrowserField] Failed to get signed URL for ${fieldName}:`, result);
            setDisplayValue(parseValue(value, config.returnFormat));
          }
        } catch (err) {
          console.error(`[MediaBrowserField] Error fetching signed URL for ${fieldName}:`, err);
          setDisplayValue(parseValue(value, config.returnFormat));
        } finally {
          setIsTransformingUrl(false);
        }
      } else {
        // Value is already a URL or object, use as-is
        setDisplayValue(parseValue(value, config.returnFormat));
      }
    };

    transformS3KeyToUrl();
  }, [value, fieldName, config.returnFormat, tenantId, appId]);

  // Use displayValue instead of parsing value directly
  const displayFiles = displayValue;

  const handleSelect = (files: MediaFile[]) => {
    // Format value based on returnFormat
    const formattedValue = formatValue(files, config);
    onChange(formattedValue);
  };

  const handleRemove = (index?: number) => {
    if (index !== undefined && Array.isArray(displayFiles)) {
      const newFiles = displayFiles.filter((_, i) => i !== index);
      const formattedValue = formatValue(newFiles as MediaFile[], config);
      onChange(formattedValue);
    } else {
      // For single file removal, use empty string instead of null to satisfy Zod validation
      // Empty string is a valid value that passes string validation schemas
      onChange('');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null); // Clear previous errors

    try {
      // Import upload action dynamically
      const { uploadMediaAction } = await import('@/actions/media');

      const uploadPath = config.uploadPath || config.basePath || 'public';
      const uploadedFiles: MediaFile[] = [];
      const failedFiles: string[] = [];

      for (const file of Array.from(files)) {
        try {
          const result = await uploadMediaAction({
            tenantId: tenantId || '',
            app: appId || 'core',
            path: uploadPath,
            file,
          });

          uploadedFiles.push(result);
        } catch (error) {
          console.error('Failed to upload file:', file.name, error);
          failedFiles.push(file.name);
        }
      }

      if (uploadedFiles.length > 0) {
        // Add uploaded files to existing files (for multiple) or replace (for single)
        if (isMultiple) {
          const existing = Array.isArray(displayFiles) ? displayFiles : [];
          const combined = [...existing, ...uploadedFiles];
          const formattedValue = formatValue(combined as MediaFile[], config);
          console.log('[MediaBrowserField] Saving value (multiple):', formattedValue);
          onChange(formattedValue);
        } else {
          const formattedValue = formatValue([uploadedFiles[0]], config);
          console.log('[MediaBrowserField] Saving value (single):', formattedValue);
          onChange(formattedValue);
        }
      }

      // Show error for failed uploads
      if (failedFiles.length > 0) {
        setUploadError(`Failed to upload: ${failedFiles.join(', ')}`);
      }

      // Show error if all uploads failed
      if (uploadedFiles.length === 0 && failedFiles.length > 0) {
        setUploadError('All files failed to upload. Please check file size and format.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const isMultiple = config.selectionMode === 'multiple';

  // Show error if context loading failed
  if (contextError && !isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 border border-red-300 bg-red-50 rounded-md text-red-700">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">
          {contextError}. Media browser is not available.
        </span>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 border border-gray-300 bg-gray-50 rounded-md text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        <span className="text-sm">Loading media browser...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">

      {/* Selected Files Preview */}
      {displayFiles && (
        <div className="space-y-2">
          {Array.isArray(displayFiles) ? (
            displayFiles.map((file, index) => (
              <FilePreview
                key={index}
                file={file}
                onRemove={() => handleRemove(index)}
                disabled={disabled}
              />
            ))
          ) : (
            <FilePreview
              file={displayFiles}
              onRemove={() => handleRemove()}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {/* Action Buttons */}
      {showUploadButton ? (
        // For mediaUploader: Show both Upload and Browse buttons
        <div className="grid grid-cols-2 gap-2">
          <label className="w-full">
            <input
              type="file"
              multiple={isMultiple}
              accept={config.allowedTypes?.join(',')}
              onChange={handleFileUpload}
              disabled={disabled || isUploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isUploading}
              className="w-full"
              asChild
            >
              <span className="flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </span>
            </Button>
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDialogOpen(true)}
            disabled={disabled}
            className="w-full"
          >
            Browse Library
          </Button>
        </div>
      ) : (
        // For mediaBrowser/mediaGallery: Show only Select button
        <>
          {(!displayFiles || isMultiple) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
              disabled={disabled}
              className="w-full"
            >
              {displayFiles ? 'Add More Files' : 'Select File(s)'}
            </Button>
          )}

          {/* Change button for single file */}
          {displayFiles && !isMultiple && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
              disabled={disabled}
              className="w-full mt-2"
            >
              Change File
            </Button>
          )}
        </>
      )}

      {/* Upload Error Message */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 border border-red-300 bg-red-50 rounded-md text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Upload Failed</p>
            <p className="text-sm">{uploadError}</p>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-red-700 hover:text-red-900"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Media Browser Dialog */}
      <MediaBrowserDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSelect={handleSelect}
        config={config}
        tenantId={tenantId || ''}
        appId={appId || 'core'}
        username={username || 'user'}
        currentLanguage={currentLanguage}
      />
    </div>
  );
}

/**
 * File Preview Component
 */
function FilePreview({
  file,
  onRemove,
  disabled,
}: {
  file: any;
  onRemove: () => void;
  disabled?: boolean;
}) {
  /**
   * Get file type and icon based on MIME type or extension
   */
  const getFileTypeInfo = () => {
    const type = file.type || '';
    const name = file.name || '';
    const ext = name.split('.').pop()?.toLowerCase();

    // Image files
    if (type.startsWith('image/')) {
      return { icon: ImageIcon, color: 'text-blue-500', label: 'Image' };
    }

    // Video files
    if (type.startsWith('video/')) {
      return { icon: Film, color: 'text-purple-500', label: 'Video' };
    }

    // PDF files
    if (type.includes('pdf') || ext === 'pdf') {
      return { icon: FileText, color: 'text-red-500', label: 'PDF' };
    }

    // Excel files (xlsx, xls)
    if (
      type.includes('spreadsheet') ||
      type.includes('excel') ||
      ext === 'xlsx' ||
      ext === 'xls' ||
      ext === 'csv'
    ) {
      return { icon: FileSpreadsheet, color: 'text-green-500', label: 'Excel' };
    }

    // Word documents (docx, doc)
    if (
      type.includes('word') ||
      type.includes('document') ||
      ext === 'docx' ||
      ext === 'doc'
    ) {
      return { icon: FileText, color: 'text-blue-500', label: 'Word' };
    }

    // Archive files (zip, rar, 7z, etc.)
    if (
      type.includes('zip') ||
      type.includes('compressed') ||
      type.includes('archive') ||
      ext === 'zip' ||
      ext === 'rar' ||
      ext === '7z' ||
      ext === 'tar' ||
      ext === 'gz'
    ) {
      return { icon: FileArchive, color: 'text-yellow-500', label: 'Archive' };
    }

    // Default file icon
    return { icon: File, color: 'text-gray-500', label: 'File' };
  };

  const fileInfo = getFileTypeInfo();
  const Icon = fileInfo.icon;
  const isImage = file.type?.startsWith('image/');
  const isPdf = file.type?.includes('pdf') || file.name?.endsWith('.pdf');

  // Determine thumbnail URL with priority:
  // 1. file.thumbnails.small (for images - auto-generated)
  // 2. file.thumbnails.medium (fallback)
  // 3. file.thumbnail (legacy/custom thumbnail)
  // 4. file.url (for images only, use full image as last resort)
  const getThumbnailUrl = () => {
    // Check for thumbnails object (new structure)
    if (file.thumbnails) {
      return file.thumbnails.small || file.thumbnails.medium || file.thumbnails.large;
    }
    // Legacy thumbnail field
    if (file.thumbnail) {
      return file.thumbnail;
    }
    // For images, use full URL as fallback
    if (isImage && file.url) {
      return file.url;
    }
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();
  const hasThumbnail = !!thumbnailUrl;

  return (
    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
      {/* Thumbnail/Icon */}
      <div className="w-12 h-12 flex-shrink-0 bg-white rounded overflow-hidden border border-gray-200">
        {hasThumbnail ? (
          <img
            src={thumbnailUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className={`w-6 h-6 ${fileInfo.color}`} />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
          {file.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {file.size && (
            <span className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </span>
          )}
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">{fileInfo.label}</span>
        </div>
      </div>

      {/* Remove Button */}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 p-1.5 hover:bg-red-100 rounded-md transition-colors group"
          title="Remove file"
        >
          <X className="w-4 h-4 text-gray-600 group-hover:text-red-600" />
        </button>
      )}
    </div>
  );
}

/**
 * Parse stored value to display format
 */
function parseValue(value: any, returnFormat?: string): any {
  if (!value) return null;

  // If already an object/array with name/url, return as is
  if (typeof value === 'object' && (value.name || value.url)) {
    return value;
  }

  // If array, parse each item
  if (Array.isArray(value)) {
    return value.map((v) => parseValue(v, returnFormat)).filter(Boolean);
  }

  // If string (URL or key), convert to object
  if (typeof value === 'string') {
    const isUrl = value.startsWith('http');

    // Extract filename from URL or path
    // For URLs with query params (signed URLs), extract filename before '?'
    let filename = value.split('/').pop() || value;
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }

    return {
      name: filename,
      url: isUrl ? value : value,
      key: isUrl ? value : value,
      type: guessFileType(filename),
    };
  }

  return null;
}

/**
 * Format files to store based on returnFormat
 */
function formatValue(files: MediaFile[], config: MediaBrowserConfig): any {
  const format = config.returnFormat || 'url';
  const isSingle = config.selectionMode === 'single';

  console.log('[formatValue] Input files:', files);
  console.log('[formatValue] Config:', { format, isSingle, returnFormat: config.returnFormat, selectionMode: config.selectionMode });

  if (format === 'url') {
    const result = isSingle ? (files[0]?.url || '') : files.map((f) => f.url);
    console.log('[formatValue] URL format result:', result);
    return result;
  } else if (format === 'key') {
    const result = isSingle ? (files[0]?.key || '') : files.map((f) => f.key);
    console.log('[formatValue] Key format result:', result);
    return result;
  } else {
    // object format
    const fileObjects = files.map((f) => ({
      key: f.key,
      url: f.url,
      name: f.name,
      size: f.size,
      type: f.type,
      thumbnail: f.thumbnail,
    }));
    const result = isSingle ? (fileObjects[0] || null) : fileObjects;
    console.log('[formatValue] Object format result:', result);
    return result;
  }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Guess file type from filename
 */
function guessFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov'];
  const docExts = ['pdf', 'doc', 'docx', 'txt'];

  if (imageExts.includes(ext || '')) return 'image/*';
  if (videoExts.includes(ext || '')) return 'video/*';
  if (docExts.includes(ext || '')) return 'application/pdf';
  return 'application/octet-stream';
}
