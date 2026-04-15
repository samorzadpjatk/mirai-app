import { useEffect, useRef, useState } from "react";
import { clientLogger } from "@mirai-app/shared";
import { useFileDownload } from "~/hooks/files/useFileDownload";

let placeholderUriCache: string | null | undefined;
let placeholderErrorLogged = false;

export function usePartnerImageDownload(logoPath: string | null | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    download,
    status: downloadStatus,
    error: downloadError,
  } = useFileDownload();
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
      setImageUrl(null);

      try {
        // If there's a logo path, download it using useFileDownload
        if (logoPath) {
          const result = await download({
            storagePath: logoPath,
            expiresInSeconds: 60 * 60, // 1 hour
          });

          if (!mountedRef.current) return;

          if (result?.uri) {
            setImageUrl(result.uri);
            return;
          }
        }

        if (!mountedRef.current) return;

        // If no logo path or download failed, try to get placeholder from Supabase (once)
        if (placeholderUriCache === undefined) {
          const placeholderPath = "image/placeholder/partner-logo.png";
          try {
            const placeholderResult = await download({
              storagePath: placeholderPath,
              expiresInSeconds: 60 * 60, // 1 hour
            });

            if (placeholderResult?.uri) {
              placeholderUriCache = placeholderResult.uri;
            } else {
              placeholderUriCache = null;
            }
          } catch (placeholderError) {
            placeholderUriCache = null;
            if (!placeholderErrorLogged) {
              clientLogger.warn(
                "Failed to download partner placeholder image:",
                {
                  error: placeholderError,
                },
              );
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
        setImageUrl(null);
      } catch (error) {
        if (!mountedRef.current) return;
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("component unmounted")) {
          clientLogger.error("Failed to load partner image:", error as Error);
        }
        if (mountedRef.current) setImageUrl(null);
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    void loadImage();
  }, [logoPath, download]);

  return {
    imageUrl,
    isLoading: isLoading || downloadStatus === "loading",
    error: downloadError,
    status: downloadStatus,
  };
}
