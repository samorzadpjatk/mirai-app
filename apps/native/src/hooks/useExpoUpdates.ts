import { useState, useEffect, useCallback, useRef } from 'react';
import * as Updates from 'expo-updates';

interface UseExpoUpdatesReturn {
  isUpdateAvailable: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  showUpdatePopup: boolean;
  isInitialized: boolean;
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
  const [isInitialized, setIsInitialized] = useState(false);
  const hasAutoChecked = useRef(false);

  const checkForUpdates = useCallback(async (isAutoCheck = false) => {
    if (__DEV__) {
      if (isAutoCheck) {
        setIsInitialized(true);
      }
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
      console.error('Error checking for updates:', err);
      setError('Failed to check for updates');
    } finally {
      setIsChecking(false);
      if (isAutoCheck) {
        setIsInitialized(true);
      }
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
      console.error('Error downloading update:', err);
      setError('Failed to download update');
      setIsDownloading(false);
    }
  }, []);

  const skipUpdate = useCallback(() => {
    setShowUpdatePopup(false);
    setIsUpdateAvailable(false);
    setDownloadProgress(0);
  }, []);

  useEffect(() => {
    if (!__DEV__ && Updates.isEnabled && !hasAutoChecked.current) {
      hasAutoChecked.current = true;
      void checkForUpdates(true);
    } else if (__DEV__ || !Updates.isEnabled) {
      setIsInitialized(true);
    }
  }, [checkForUpdates]);

  return {
    isUpdateAvailable,
    isChecking,
    isDownloading,
    downloadProgress,
    showUpdatePopup,
    isInitialized,
    checkForUpdates,
    startUpdate,
    skipUpdate,
    error,
  };
}
