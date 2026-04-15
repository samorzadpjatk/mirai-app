import { useEffect, useRef, useState } from "react";
import { useFileDownload } from "~/hooks/files/useFileDownload";

let placeholderUriCache: string | null | undefined;
let placeholderErrorLogged = false;

export function useTripBackgroundImageDownload(
  backgroundImagePath: string | null | undefined,
) {
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
        // If there's a background image path, download it using useFileDownload
        if (backgroundImagePath) {
          const result = await download({
            storagePath: backgroundImagePath,
            expiresInSeconds: 60 * 60, // 1 hour
          });

          if (!mountedRef.current) return;

          if (result?.uri) {
            setImageUrl(result.uri);
            return;
          }
        }

        if (!mountedRef.current) return;

        // If no background image or download failed, try to get placeholder from Supabase (once)
        if (placeholderUriCache === undefined) {
          const placeholderPath = "image/placeholder/trip-background.png";
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
          } catch {
            placeholderUriCache = null;
            placeholderErrorLogged = true;
          }
        }

        if (!mountedRef.current) return;

        if (placeholderUriCache) {
          setImageUrl(placeholderUriCache);
          return;
        }

        // Final fallback - null (no image)
        setImageUrl(null);
      } catch {
        if (!mountedRef.current) return;
        if (mountedRef.current) setImageUrl(null);
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    void loadImage();
  }, [backgroundImagePath, download]);

  return {
    imageUrl,
    isLoading: isLoading || downloadStatus === "loading",
    error: downloadError,
    status: downloadStatus,
  };
}
