/**
 * File Upload Component
 *
 * UI component for resumable file uploads with SeaweedFS Filer native TUS support.
 * Provides file selection, validation, progress indication, and error handling.
 *
 * Features:
 * - Drag-and-drop file selection
 * - File validation (type, size)
 * - Real-time progress indicator
 * - Pause/resume controls
 * - Error display with retry option
 * - Preview for images
 *
 * @module @mirai-app/web/components/FileUpload
 */

import React, { useCallback, useState, useRef } from "react";
import {
  Button,
  Card,
  Text,
  YStack,
  XStack,
  type ButtonProps,
} from "@/components/ui";
import {
  useFileUpload,
  type UseFileUploadOptions,
  type UploadStatus,
} from "@/hooks/useFileUpload";

// =============================================================================
// Component Props
// =============================================================================

export interface FileUploadProps {
  /** Called when upload completes successfully with the file URL */
  onUpload: (url: string) => void;

  /** Accepted MIME types (e.g., "image/jpeg,image/png") - defaults to images */
  accept?: string;

  /** Maximum file size in bytes - defaults to 50MB */
  maxSize?: number;

  /** Storage bucket identifier */
  bucket?: string;

  /** Button text for file selection */
  buttonText?: string;

  /** Placeholder text when no file selected */
  placeholder?: string;

  /** Show preview for images */
  showPreview?: boolean;

  /** Disable the upload component */
  disabled?: boolean;

  /** Existing file URL (for edit mode) */
  existingUrl?: string;

  /** Called when upload errors */
  onError?: (error: Error) => void;

  /** Called on progress updates */
  onProgress?: (progress: number) => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get status display text
 */
function getStatusText(status: UploadStatus): string {
  switch (status) {
    case "idle":
      return "Ready to upload";
    case "validating":
      return "Validating file...";
    case "getting-url":
      return "Getting upload URL...";
    case "uploading":
      return "Uploading...";
    case "paused":
      return "Upload paused";
    case "completed":
      return "Upload complete";
    case "error":
      return "Upload failed";
    default:
      return "";
  }
}

/**
 * Get file type category for icon display
 */
function getFileCategory(type: string): "image" | "video" | "document" | "other" {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (
    type.includes("pdf") ||
    type.includes("document") ||
    type.includes("text")
  ) {
    return "document";
  }
  return "other";
}

// =============================================================================
// File Icon Component
// =============================================================================

/**
 * Simple file type icon using text/emoji symbols
 */
function FileIcon({ type, size = 48 }: { type: string; size?: number }) {
  const category = getFileCategory(type);

  const icons = {
    image: "🖼️",
    video: "🎬",
    document: "📄",
    other: "📎",
  };

  return (
    <span
      style={{
        fontSize: size,
        lineHeight: 1,
        display: "inline-block",
      }}
    >
      {icons[category]}
    </span>
  );
}

// =============================================================================
// Progress Bar Component
// =============================================================================

interface ProgressBarProps {
  progress: number;
  status: UploadStatus;
}

function ProgressBar({ progress, status }: ProgressBarProps) {
  const isPaused = status === "paused";
  const isError = status === "error";
  const isComplete = status === "completed";

  let barColor = "#0066cc";
  if (isPaused) barColor = "#ff9500";
  if (isError) barColor = "#dc3545";
  if (isComplete) barColor = "#28a745";

  return (
    <div
      style={{
        width: "100%",
        height: "8px",
        backgroundColor: "#e9ecef",
        borderRadius: "4px",
        overflow: "hidden",
        marginTop: "8px",
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, progress))}%`,
          height: "100%",
          backgroundColor: barColor,
          transition: "width 0.3s ease, background-color 0.3s ease",
          borderRadius: "4px",
        }}
      />
    </div>
  );
}

// =============================================================================
// File Preview Component
// =============================================================================

interface FilePreviewProps {
  file: File | null;
  url: string | null;
  showPreview: boolean;
}

function FilePreview({ file, url, showPreview }: FilePreviewProps) {
  if (!file && !url) return null;

  const previewUrl = url ?? (file ? URL.createObjectURL(file) : null);
  const isImage = file?.type?.startsWith("image/") || url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  if (!showPreview || !isImage || !previewUrl) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          marginTop: "12px",
        }}
      >
        <FileIcon type={file?.type ?? "application/octet-stream"} />
        <div style={{ flex: 1 }}>
          <Text fontWeight="500" fontSize="$sm">
            {file?.name ?? "Unknown file"}
          </Text>
          <Text fontSize="$xs" color="gray">
            {file ? formatBytes(file.size) : ""}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: "12px",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid #e9ecef",
      }}
    >
      <img
        src={previewUrl}
        alt="File preview"
        style={{
          width: "100%",
          maxHeight: "200px",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid #e9ecef",
        }}
      >
        <Text fontSize="$xs" color="gray" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file?.name ?? "Uploaded image"}
        </Text>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * File upload component with resumable upload support
 *
 * Provides a complete file upload experience:
 * - File selection (click or drag-and-drop)
 * - File validation (type, size)
 * - Progress tracking with visual indicator
 * - Pause/resume capability for network interruptions
 * - Error handling with retry
 * - Image preview
 *
 * ## Usage
 *
 * ```tsx
 * <FileUpload
 *   onUpload={(url) => console.log("File uploaded to:", url)}
 *   accept="image/jpeg,image/png"
 *   maxSize={50 * 1024 * 1024} // 50MB
 *   showPreview={true}
 * />
 * ```
 */
export function FileUpload({
  onUpload,
  accept = "image/jpeg,image/jpg,image/png,image/webp",
  maxSize = 50 * 1024 * 1024,
  bucket,
  buttonText = "Select File",
  placeholder = "No file selected",
  showPreview = true,
  disabled = false,
  existingUrl,
  onError,
  onProgress,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // File upload hook
  const {
    upload,
    progress,
    status,
    error,
    pause,
    resume,
    reset,
    selectedFile,
    uploadedUrl,
  } = useFileUpload({
    accept,
    maxSize,
    bucket,
    onComplete: onUpload,
    onError,
    onProgress,
  });

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        await upload(file);
      } catch {
        // Error is handled by the hook's onError callback
        // and reflected in the error state
      }
    },
    [upload]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // Handle button click
  const handleButtonClick = useCallback(() => {
    if (!disabled && status !== "uploading" && status !== "getting-url") {
      fileInputRef.current?.click();
    }
  }, [disabled, status]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || status === "uploading" || status === "getting-url") {
        return;
      }

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [disabled, status, handleFileSelect]
  );

  // Handle retry
  const handleRetry = useCallback(() => {
    reset();
    fileInputRef.current?.click();
  }, [reset]);

  // Determine if we should show controls
  const showControls = status === "uploading" || status === "paused";
  const isComplete = status === "completed";
  const isError = status === "error";
  const isProcessing = status === "uploading" || status === "getting-url" || status === "validating";

  // Display URL (either newly uploaded or existing)
  const displayUrl: string | null = uploadedUrl ?? existingUrl ?? null;

  return (
    <YStack>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: "none" }}
        disabled={disabled || isProcessing}
      />

      {/* Main upload area - use div wrapper for drag events */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ width: "100%" }}
      >
        <Card
          padding="$4"
          borderStyle="dashed"
          borderWidth={isDragging ? 2 : 1}
          borderColor={isDragging ? "blue" : "gray"}
          backgroundColor={isDragging ? "blue" : undefined}
          opacity={disabled ? 0.6 : 1}
          onPress={handleButtonClick}
        >
          <YStack
            alignItems="center"
            gap="$3"
            padding="$4"
          >
            {!selectedFile && !existingUrl && (
              <>
                <Text fontSize="$xl" lineHeight={1}>
                  📤
                </Text>
                <Text fontSize="$sm" color="gray" textAlign="center">
                  {placeholder}
                </Text>
                <Text fontSize="$xs" color="gray" textAlign="center">
                  Drag & drop or click to select
                </Text>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={handleButtonClick}
                  disabled={disabled || isProcessing}
                >
                  {buttonText}
                </Button>
              </>
            )}

            {(selectedFile || existingUrl) && (
              <YStack width="100%">
                <FilePreview
                  file={selectedFile}
                  url={displayUrl}
                  showPreview={showPreview}
                />

                {/* Progress section */}
                {showControls && (
                  <YStack marginTop="$4">
                    <XStack
                      justifyContent="space-between"
                      alignItems="center"
                      marginBottom="$1"
                    >
                      <Text fontSize="$sm" fontWeight="500">
                        {getStatusText(status)}
                      </Text>
                      <Text fontSize="$sm" color="gray">
                        {progress}%
                      </Text>
                    </XStack>

                    <ProgressBar progress={progress} status={status} />

                    {/* Pause/Resume buttons */}
                    <XStack
                      gap="$2"
                      marginTop="$3"
                      justifyContent="center"
                    >
                      {status === "uploading" && (
                        <Button size="sm" variant="secondary" onPress={pause}>
                          Pause
                        </Button>
                      )}
                      {status === "paused" && (
                        <Button size="sm" variant="primary" onPress={resume}>
                          Resume
                        </Button>
                      )}
                    </XStack>
                  </YStack>
                )}

                {/* Complete state */}
                {isComplete && (
                  <YStack
                    marginTop="$4"
                    padding="$3"
                    backgroundColor="#d4edda"
                    borderRadius="$2"
                    alignItems="center"
                  >
                    <Text fontSize="$sm" color="#155724" fontWeight="500">
                      Upload complete
                    </Text>
                    <Text fontSize="$xs" color="#155724" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "4px" }}>
                      {uploadedUrl ?? ""}
                    </Text>
                  </YStack>
                )}

                {/* Error state */}
                {isError && error && (
                  <YStack
                    marginTop="$4"
                    padding="$3"
                    backgroundColor="#f8d7da"
                    borderRadius="$2"
                    alignItems="center"
                  >
                    <Text fontSize="$sm" color="#721c24" fontWeight="500">
                      Upload failed
                    </Text>
                    <Text
                      fontSize="$xs"
                      color="#721c24"
                      style={{ marginTop: "4px" }}
                    >
                      {error.message}
                    </Text>
                    <YStack marginTop="$2">
                      <Button size="sm" variant="secondary" onPress={handleRetry}>
                        Try Again
                      </Button>
                    </YStack>
                  </YStack>
                )}

                {/* Change file button (when complete or idle) */}
                {(isComplete || (!isProcessing && !isError)) && (
                  <YStack marginTop="$3" alignItems="center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => {
                        reset();
                        fileInputRef.current?.click();
                      }}
                    >
                      Change File
                    </Button>
                  </YStack>
                )}
              </YStack>
            )}
          </YStack>
        </Card>
      </div>

      {/* File size hint */}
      <Text
        fontSize="$xs"
        color="gray"
        textAlign="center"
        marginTop="$2"
      >
        Max size: {formatBytes(maxSize)} · Accepted: {accept.split(",").join(", ")}
      </Text>
    </YStack>
  );
}

// =============================================================================
// Simplified Variant Components
// =============================================================================

export interface FileUploadButtonProps extends Omit<ButtonProps, 'children'> {
  /** Called when upload completes */
  onUpload: (url: string) => void;

  /** Accepted MIME types */
  accept?: string;

  /** Maximum file size */
  maxSize?: number;

  /** Storage bucket */
  bucket?: string;

  /** Button text */
  children?: React.ReactNode;

  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Simplified button-only file upload variant
 *
 * Shows a button that opens file picker, with minimal inline progress
 */
export function FileUploadButton({
  onUpload,
  accept = "image/jpeg,image/jpg,image/png",
  maxSize = 50 * 1024 * 1024,
  bucket,
  children = "Upload File",
  onError,
  ...buttonProps
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    upload,
    progress,
    status,
    error,
    reset,
  } = useFileUpload({
    accept,
    maxSize,
    bucket,
    onComplete: (url) => {
      setIsUploading(false);
      onUpload(url);
    },
    onError: (err) => {
      setIsUploading(false);
      onError?.(err);
    },
  });

  const handleClick = useCallback(() => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  }, [isUploading]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      reset();

      try {
        await upload(file);
      } catch {
        // Error handled by hook
      }
    },
    [upload, reset]
  );

  const isProcessing = status === "uploading" || status === "getting-url" || status === "validating";

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <XStack alignItems="center" gap="$2">
        <Button
          {...buttonProps}
          onPress={handleClick}
          disabled={isUploading || buttonProps.disabled}
        >
          {isProcessing ? `Uploading ${progress}%...` : children}
        </Button>

        {isProcessing && (
          <div
            style={{
              width: "60px",
              height: "4px",
              backgroundColor: "#e9ecef",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                backgroundColor: "#0066cc",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        )}

        {error && (
          <Text fontSize="$xs" color="red">
            {error.message}
          </Text>
        )}
      </XStack>
    </>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default FileUpload;
