export const buildUploadResponse = (
  token: string,
  bucket: string,
  objectPath: string,
  storagePath: string,
  resumableUrl: string,
) => ({
  token,
  bucket,
  objectPath,
  storagePath,
  resumableUrl,
});

export const buildDownloadResponse = (signedUrl: string, expiresAt: string) => ({
  signedUrl,
  expiresAt,
});

export const buildPublicUrlResponse = (publicUrl: string) => ({
  publicUrl,
});

export const calculateExpiresAtISO = (expiresInSeconds: number, nowMs: number): string => {
  return new Date(nowMs + expiresInSeconds * 1000).toISOString();
};
