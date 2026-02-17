import { useEffect, useState } from "react";
import { useFileDownload } from "~/hooks/files/useFileDownload";

let placeholderUriCache: string | null | undefined;
let placeholderErrorLogged = false;

export function useTripBackgroundImageDownload(backgroundImagePath: string | null | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { download, status: downloadStatus, error: downloadError } = useFileDownload();

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setImageUrl(null);
      
      try {
        // If there's a background image path, download it using useFileDownload
        if (backgroundImagePath) {
          const result = await download({
            storagePath: backgroundImagePath,
            expiresInSeconds: 60 * 60, // 1 hour
          });
          
          if (result?.uri) {
            setImageUrl(result.uri);
            return;
          }
        }
        
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
          } catch (placeholderError) {
            placeholderUriCache = null;
            if (!placeholderErrorLogged) {
              console.warn('Failed to download placeholder image:', placeholderError);
              placeholderErrorLogged = true;
            }
          }
        }

        if (placeholderUriCache) {
          setImageUrl(placeholderUriCache);
          return;
        }
        
        // Final fallback - null (no image)
        setImageUrl(null);
      } catch (error) {
        console.error('Failed to load trip background image:', error);
        setImageUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadImage();
  }, [backgroundImagePath, download]);

  return { 
    imageUrl, 
    isLoading: isLoading || downloadStatus === "loading",
    error: downloadError,
    status: downloadStatus
  };
}
