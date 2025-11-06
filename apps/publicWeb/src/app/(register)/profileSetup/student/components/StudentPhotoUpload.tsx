"use client";

import React, { useState, useRef } from "react";
import { Upload, X, User, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@repo/ui";
import { cn } from "@repo/utils";
import { S3Image } from "@/components/common/S3Image";

interface StudentPhotoUploadProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  tenantId: string;
  appId: string;
}

export function StudentPhotoUpload({
  value,
  onChange,
  error,
  disabled,
  tenantId,
  appId,
}: StudentPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(value || "");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch signed URL if value is an S3 key (for edit mode)
  React.useEffect(() => {
    const fetchSignedUrl = async () => {
      // Check if value looks like an S3 key (contains path structure)
      // S3 keys look like: "um1/cpms/private/common/students/photos/filename.jpg"
      if (value && value.includes('/') && !value.startsWith('http') && !value.startsWith('blob:')) {
        console.log('📸 [PhotoUpload] Detected S3 key, fetching signed URL:', value);
        setIsLoadingPreview(true);

        try {
          // Import the action to get signed URL
          const { getProfilePhotoUrl } = await import('@/app/profile/student/actions');

          // Fetch signed URL - pass tenant info
          // Extract tenant root domain from current hostname
          // e.g., "app.um1ygn.edu.mm" -> "um1ygn.edu.mm"
          const hostname = window.location.hostname;
          const tenantRootDomain = hostname.split('.').slice(1).join('.'); // Remove first subdomain (app/publicWeb)

          console.log('📸 [PhotoUpload] Tenant info:', {
            tenantId,
            tenantSlug: value.split('/')[0],
            tenantRootDomain,
            hostname
          });

          const result = await getProfilePhotoUrl({
            s3Key: value,
            tenantId: tenantId,
            tenantSlug: value.split('/')[0], // Extract slug from key
            tenantRootDomain: tenantRootDomain,
          });

          if (result.success && result.signedUrl) {
            console.log('✅ [PhotoUpload] Got signed URL');
            setPreviewUrl(result.signedUrl);
          } else {
            console.error('❌ [PhotoUpload] Failed to get signed URL:', result);
            setPreviewUrl(''); // Clear preview if fetch fails
          }
        } catch (err) {
          console.error('❌ [PhotoUpload] Error fetching signed URL:', err);
          setPreviewUrl(''); // Clear preview on error
        } finally {
          setIsLoadingPreview(false);
        }
      } else if (value && (value.startsWith('http') || value.startsWith('blob:'))) {
        // Already a URL (either signed URL or blob URL from upload)
        setPreviewUrl(value);
      } else {
        // No value or invalid format
        setPreviewUrl('');
      }
    };

    fetchSignedUrl();
  }, [value, tenantId]);

  // Validate file before upload
  const validateFile = (file: File): string | null => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "Please upload a JPEG, PNG, or WebP image";
    }

    if (file.size > maxSize) {
      return "Image size must be less than 2MB";
    }

    return null;
  };

  // Generate random 15-character filename
  const generateRandomFilename = (originalFilename: string): string => {
    const extension = originalFilename.split('.').pop() || 'jpg';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < 15; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `${randomString}.${extension}`;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous errors and success state
    setUploadError(null);
    setUploadSuccess(false);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      event.target.value = ""; // Reset input
      return;
    }

    // Show preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      // Import upload action
      const { uploadStudentPhotoAction } = await import("@/actions/student-photo-upload");

      // Generate random filename
      const randomFilename = generateRandomFilename(file.originalName || file.name);

      // Upload to S3 with custom path structure
      const result = await uploadStudentPhotoAction({
        tenantId,
        file,
        filename: randomFilename,
      });

      // Update form value with S3 key path (for database storage)
      // Format: {tenantSlug}/cpms/private/common/students/photos/{randomFilename}
      onChange(result.s3Key);

      // Set preview URL (signed URL for immediate display)
      setPreviewUrl(result.signedUrl);
      setUploadSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error("Upload failed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to upload photo. Please try again.";
      setUploadError(errorMessage);
      setPreviewUrl(""); // Clear preview on error
      onChange(""); // Clear form value
    } finally {
      setIsUploading(false);
      event.target.value = ""; // Reset input for re-upload
      // Clean up local preview URL
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl("");
    setUploadError(null);
    setUploadSuccess(false);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Photo Preview or Placeholder */}
      <div className="relative">
        {isLoadingPreview ? (
          // Loading Preview
          <div className="relative w-40 h-40 mx-auto rounded-lg border-2 border-gray-300 bg-gray-50 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
              <p className="text-sm">Loading photo...</p>
            </div>
          </div>
        ) : previewUrl ? (
          // Photo Preview
          <div className="relative w-40 h-40 mx-auto rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-50">
            <S3Image
              src={previewUrl}
              alt="Student photo"
              fill
              className="object-cover"
            />
            {!isUploading && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                aria-label="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Uploading...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Empty Placeholder
          <div
            className={cn(
              "w-40 h-40 mx-auto rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors",
              disabled
                ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                : "border-gray-400 bg-gray-50 hover:border-[#4C67E1] hover:bg-blue-50",
              error && "border-red-400 bg-red-50"
            )}
            onClick={!disabled ? triggerFileSelect : undefined}
          >
            <User className={cn("w-12 h-12 mb-2", disabled ? "text-gray-400" : "text-gray-500")} />
            <p className="text-sm text-gray-600 text-center px-2">
              {disabled ? "Upload disabled" : "Click to upload photo"}
            </p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
        />
        <Button
          type="button"
          variant={previewUrl ? "outline" : "default"}
          onClick={triggerFileSelect}
          disabled={disabled || isUploading}
          className={cn(
            "flex items-center gap-2",
            !previewUrl && "bg-[#4C67E1] hover:bg-[#3154A1] text-white"
          )}
        >
          <Upload className="w-4 h-4" />
          {isUploading
            ? "Uploading..."
            : previewUrl
            ? "Change Photo"
            : "Upload Photo"}
        </Button>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 border border-green-300 bg-green-50 rounded-md text-green-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Photo uploaded successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 border border-red-300 bg-red-50 rounded-md text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Upload Failed</p>
            <p className="text-sm">{uploadError}</p>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-700 hover:text-red-900"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form Validation Error */}
      {error && !uploadError && (
        <div className="flex items-center gap-2 p-2 text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* File Requirements */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>Accepted formats: JPEG, PNG, WebP</p>
        <p>Maximum size: 2MB</p>
        <p>Recommended: Clear, front-facing photo</p>
      </div>
    </div>
  );
}
