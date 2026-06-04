import { useEffect, useRef, useState } from "react";
import { useFileDownload } from "~/hooks/files/useFileDownload";

let placeholderUriCache: string | null | undefined;
let placeholderErrorLogged = false;

export function getPlaceholderPath(): string {
  return "image/placeholder/partner-logo.png";
}

export function isComponentUnmountedErrorMessage(message: string): boolean {
  return message.includes("component unmounted");
}

export function resolveImageUrlFromDownloadResult(
  result: { uri?: string } | null | undefined,
): string | null {
  return result?.uri ?? null;
}

export function calculatePartnerImageLoadingState(
  isLoading: boolean,
  downloadStatus: string,
): boolean {
  return isLoading || downloadStatus === "loading";
}

export function usePartnerImageDownload(logoPath: string | null | undefined) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { download, status: downloadStatus, error: downloadError } = useFileDownload();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadImage = async () => {
      if (!mountedRef.current) return;
      setIsLoading(true);
      setImageUrl("");

      try {
        // If there's a logo path, download it using useFileDownload
        if (logoPath) {
          const result = await download({
            storagePath: logoPath,
            expiresInSeconds: 60 * 60, // 1 hour
          });

          if (!mountedRef.current) return;

          const uri = resolveImageUrlFromDownloadResult(result);
          if (uri) {
            setImageUrl(uri);
            return;
          }
        }

        if (!mountedRef.current) return;

        // If no logo path or download failed, try to get placeholder from Supabase (once)
        if (placeholderUriCache === undefined) {
          const placeholderPath = getPlaceholderPath();
          try {
            const placeholderResult = await download({
              storagePath: placeholderPath,
              expiresInSeconds: 60 * 60, // 1 hour
            });

            placeholderUriCache = resolveImageUrlFromDownloadResult(placeholderResult);
          } catch {
            placeholderUriCache = null;
            if (!placeholderErrorLogged) {
              placeholderErrorLogged = true;
            }
          }
        }

        if (!mountedRef.current) return;

        if (placeholderUriCache) {
          setImageUrl(placeholderUriCache);
          return;
        }

        // Final fallback - null (no image)
        setImageUrl("");
      } catch (error) {
        if (!mountedRef.current) return;
        const message = error instanceof Error ? error.message : String(error);
        if (!isComponentUnmountedErrorMessage(message)) {
          // TODO: Add Sentry crash reporting for production errors
        }
        if (mountedRef.current) setImageUrl("");
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    void loadImage();
  }, [logoPath, download]);

  return {
    imageUrl,
    isLoading: calculatePartnerImageLoadingState(isLoading, downloadStatus),
    error: downloadError,
    status: downloadStatus,
  };
}
