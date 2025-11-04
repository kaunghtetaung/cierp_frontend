/**
 * Thumbnail Component
 * Displays image thumbnail with fallback to file icon
 */

import { useState } from 'react';
import { FileIcon } from './FileIcon';

export interface ThumbnailProps {
  url?: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  className?: string;
  // For PDFs, optionally provide a custom thumbnail URL
  customThumbnailUrl?: string;
}

export function Thumbnail({
  url,
  fileName,
  mimeType,
  size = 48,
  className,
  customThumbnailUrl
}: ThumbnailProps) {
  const [imageError, setImageError] = useState(false);

  // If we have a custom thumbnail URL (for PDFs), use that
  const thumbnailUrl = customThumbnailUrl || url;

  // For PDFs, if we have a thumbnail URL, it's a custom uploaded thumbnail
  // For images, check if it's an image type
  const canDisplayThumbnail = thumbnailUrl && (
    mimeType?.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    customThumbnailUrl ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)
  );

  if (!canDisplayThumbnail || imageError) {
    return <FileIcon fileName={fileName} mimeType={mimeType} size={size} className={className} />;
  }

  return (
    <img
      src={thumbnailUrl}
      alt={fileName}
      className={className}
      style={{ width: size, height: size, objectFit: 'cover' }}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
}
