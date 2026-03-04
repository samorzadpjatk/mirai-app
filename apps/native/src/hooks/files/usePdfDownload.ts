import { useCallback, useState } from "react";
import { Directory, File, Paths } from "expo-file-system/next";

type DownloadStatus = "idle" | "loading" | "success" | "error";

interface PdfDownloadResult {
  uri: string;
  fileName: string;
  exists: boolean;
}

interface UsePdfDownloadOptions {
  pdfDir?: string;
  onSuccess?: (result: PdfDownloadResult) => void;
  onError?: (error: Error) => void;
}

export const usePdfDownload = (options: UsePdfDownloadOptions = {}) => {
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<PdfDownloadResult | null>(null);

  const { pdfDir = "pdfs", onSuccess, onError } = options;

  const checkIfFileExists = useCallback(
    (fileName: string): PdfDownloadResult | null => {
      try {
        const directory = new Directory(Paths.document, pdfDir);
        const file = new File(directory, fileName);

        if (file.exists) {
          const fileResult: PdfDownloadResult = {
            uri: file.uri,
            fileName,
            exists: true,
          };
          return fileResult;
        }

        return null;
      } catch (err) {
        console.error("Error checking if file exists:", err);
        return null;
      }
    },
    [pdfDir]
  );

  const downloadPdf = useCallback(
    async (url: string, fileName: string): Promise<PdfDownloadResult> => {
      setStatus("loading");
      setError(null);
      setResult(null);

      try {
        // Check if file already exists
        const existingFile = checkIfFileExists(fileName);
        if (existingFile) {
          setStatus("success");
          setResult(existingFile);
          onSuccess?.(existingFile);
          return existingFile;
        }

        // Create directory if it doesn't exist
        const directory = new Directory(Paths.document, pdfDir);
        if (!directory.exists) {
          directory.create();
        }

        // Download the file
        const downloadedFile = await File.downloadFileAsync(url, directory);

        const downloadResult: PdfDownloadResult = {
          uri: downloadedFile.uri,
          fileName,
          exists: true,
        };

        setStatus("success");
        setResult(downloadResult);
        onSuccess?.(downloadResult);

        return downloadResult;
      } catch (downloadError) {
        const error = downloadError as Error;
        
        // Handle "destination already exists" error
        if (
          error instanceof Error &&
          (error as { code?: string }).code === "ERR_DESTINATION_ALREADY_EXISTS"
        ) {
          // Try to get the existing file
          const existingFile = checkIfFileExists(fileName);
          if (existingFile) {
            setStatus("success");
            setResult(existingFile);
            onSuccess?.(existingFile);
            return existingFile;
          }
        }

        console.error("Error downloading PDF:", error);
        setStatus("error");
        setError(error);
        onError?.(error);

        throw error;
      }
    },
    [checkIfFileExists, pdfDir, onSuccess, onError]
  );

  const getOrDownloadPdf = useCallback(
    async (url: string, fileName: string): Promise<PdfDownloadResult> => {
      // First check if file exists
      const existingFile = checkIfFileExists(fileName);
      if (existingFile) {
        setStatus("success");
        setResult(existingFile);
        onSuccess?.(existingFile);
        return existingFile;
      }

      // If not, download it
      return downloadPdf(url, fileName);
    },
    [checkIfFileExists, downloadPdf, onSuccess]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
  }, []);

  return {
    downloadPdf,
    getOrDownloadPdf,
    checkIfFileExists,
    status,
    error,
    result,
    reset,
  } as const;
};
