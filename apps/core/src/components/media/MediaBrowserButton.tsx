/**
 * Media Browser Button Component
 * Reusable button that opens media browser dialog for image selection
 */

'use client';

import { useState } from 'react';
import { Button } from '@repo/ui';
import { ImageIcon } from 'lucide-react';
import { MediaBrowserDialog } from '@repo/schema-forms/fields/MediaBrowserDialog';
import type { MediaFile } from '@repo/media';
import type { MediaBrowserConfig } from '@repo/types';
import { useTenant } from '@repo/tenant';

interface MediaBrowserButtonProps {
  /**
   * Legacy single-string callback. Receives the URL of the first selected
   * file. Kept for backwards compatibility with existing form fields that
   * only persist URLs. New code should prefer `onSelectMedia` so the form
   * also stores `mediaId` and alt text.
   */
  onSelect?: (url: string) => void;
  /**
   * Richer callback. Receives the full MediaFile objects (with `id`,
   * `alt`, `caption`, `tags`, etc.) so consumers can persist a proper
   * `{ mediaId, url, alt }` reference instead of a bare URL string.
   */
  onSelectMedia?: (media: MediaFile[]) => void;
  currentValue?: string;
  label?: string;
  config?: Partial<MediaBrowserConfig>;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  tenantId?: string; // Optional prop to override context
  /** Override the leading icon. Defaults to the image icon. Useful for
   *  file-attachment pickers that want a paperclip instead. */
  icon?: React.ReactNode;
}

export function MediaBrowserButton({
  onSelect,
  onSelectMedia,
  currentValue,
  label = 'Browse Images',
  config,
  variant = 'outline',
  size = 'default',
  className,
  tenantId: tenantIdProp,
  icon,
}: MediaBrowserButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Try to get tenant from context first, fallback to prop
  let tenant = null;
  let isLoading = false;

  try {
    const tenantContext = useTenant();
    tenant = tenantContext.tenant;
    isLoading = tenantContext.isLoading;
  } catch {
    // useTenant throws if not within TenantProvider — fall back to the prop.
  }

  // TenantSettings exposes `id` (no underscore). The previous version read
  // `tenant?._id` which was always undefined, so the button stayed disabled.
  const tenantId =
    tenantIdProp || (tenant as any)?.id || (tenant as any)?._id || '';

  const handleSelect = (files: MediaFile[]) => {
    if (files.length === 0) return;
    onSelectMedia?.(files);
    onSelect?.(files[0].url);
  };

  const defaultConfig: MediaBrowserConfig = {
    selectionMode: 'single',
    allowedTypes: ['image/*'],
    basePath: 'public',
    viewMode: 'grid',
    dialogSize: 'xl',
    showFolderTree: true,
    allowUpload: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    returnFormat: 'url',
    ...config,
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setIsDialogOpen(true)}
        disabled={isLoading || !tenantId}
        className={className}
        title={isLoading ? 'Loading tenant info...' : !tenantId ? 'Tenant not available' : 'Browse images'}
      >
        {icon ?? <ImageIcon className="mr-2 h-4 w-4" />}
        {label}
      </Button>

      {tenantId && (
        <MediaBrowserDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSelect={handleSelect}
          config={defaultConfig}
          tenantId={tenantId}
          appId="content"
          currentLanguage="en"
        />
      )}
    </>
  );
}
