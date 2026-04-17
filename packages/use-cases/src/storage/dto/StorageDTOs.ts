/**
 * DTO for storage upload URL result
 */
export interface StorageUploadUrlDTO {
  resumableUrl: string;
  token: string;
  bucket: string;
  objectPath: string;
  storagePath: string;
}

/**
 * DTO for storage download URL result
 */
export interface StorageDownloadUrlDTO {
  signedUrl: string;
  expiresAt: string;
}

/**
 * DTO for storage public URL result
 */
export interface StoragePublicUrlDTO {
  publicUrl: string;
}

/**
 * DTO for storage path info
 */
export interface StoragePathInfoDTO {
  bucket: string;
  path: string;
  storagePath: string;
}
