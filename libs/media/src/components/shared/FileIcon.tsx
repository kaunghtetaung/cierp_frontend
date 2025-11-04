/**
 * File Icon Component
 * Displays icon based on file type
 */

import {
  FileIcon as FileIconLucide,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  FileArchive,
  Folder,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';

export interface FileIconProps {
  fileName?: string;
  mimeType?: string;
  isFolder?: boolean;
  size?: number;
  className?: string;
}

export function FileIcon({
  fileName,
  mimeType,
  isFolder,
  size = 24,
  className,
}: FileIconProps) {
  const iconProps = {
    size,
    className,
  };

  if (isFolder) {
    return <Folder {...iconProps} />;
  }

  // Determine icon by MIME type
  if (mimeType) {
    if (mimeType.startsWith('image/')) {
      return <FileImage {...iconProps} />;
    }
    if (mimeType.startsWith('video/')) {
      return <FileVideo {...iconProps} />;
    }
    if (mimeType.startsWith('audio/')) {
      return <FileAudio {...iconProps} />;
    }
    if (mimeType === 'application/pdf') {
      return <FileText {...iconProps} />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet {...iconProps} />;
    }
    if (
      mimeType.includes('zip') ||
      mimeType.includes('rar') ||
      mimeType.includes('tar') ||
      mimeType.includes('7z')
    ) {
      return <FileArchive {...iconProps} />;
    }
    if (mimeType.startsWith('text/')) {
      return <FileText {...iconProps} />;
    }
  }

  // Determine icon by file extension
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <FileImage {...iconProps} />;
    }
    if (['mp4', 'avi', 'mov', 'webm'].includes(ext || '')) {
      return <FileVideo {...iconProps} />;
    }
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) {
      return <FileAudio {...iconProps} />;
    }
    if (ext === 'pdf') {
      return <FileText {...iconProps} />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet {...iconProps} />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return <FileArchive {...iconProps} />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'py'].includes(ext || '')) {
      return <FileCode {...iconProps} />;
    }
    if (['txt', 'md', 'log'].includes(ext || '')) {
      return <FileText {...iconProps} />;
    }
  }

  return <FileIconLucide {...iconProps} />;
}
