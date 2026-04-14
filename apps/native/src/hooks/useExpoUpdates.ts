import { useState, useEffect, useCallback } from "react";
import * as Updates from "expo-updates";
import { clientLogger } from "@mirai-app/shared";

interface UseExpoUpdatesReturn {
  isUpdateAvailable: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  showUpdatePopup: boolean;
  checkForUpdates: () => Promise<void>;
  startUpdate: () => Promise<void>;
  skipUpdate: () => void;
  error: string | null;
}

export function useExpoUpdates(): UseExpoUpdatesReturn {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = useCallback(async () => {
    if (__DEV__) {
      // Skip update checks in development
      return;
    }

    try {
      setIsChecking(true);
      setError(null);

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setIsUpdateAvailable(true);
        setShowUpdatePopup(true);
      }
    } catch (err) {
      clientLogger.error("Error checking for updates:", { error: err });
      setError("Failed to check for updates");
    } finally {
      setIsChecking(false);
    }
  }, []);

  const startUpdate = useCallback(async () => {
    try {
      setIsDownloading(true);
      setError(null);

      // Download the update
      await Updates.fetchUpdateAsync();

      // Restart the app to apply the update
      await Updates.reloadAsync();
    } catch (err) {
      clientLogger.error("Error downloading update:", { error: err });
      setError("Failed to download update");
      setIsDownloading(false);
    }
  }, []);

  const skipUpdate = useCallback(() => {
    setShowUpdatePopup(false);
    setIsUpdateAvailable(false);
    setDownloadProgress(0);
  }, []);

  // Check for updates when the hook is first used
  useEffect(() => {
    // Only check for updates if we're running in a production build
    if (!__DEV__ && Updates.isEnabled) {
      void checkForUpdates();
    }
  }, [checkForUpdates]);

  return {
    isUpdateAvailable,
    isChecking,
    isDownloading,
    downloadProgress,
    showUpdatePopup,
    checkForUpdates,
    startUpdate,
    skipUpdate,
    error,
  };
}
