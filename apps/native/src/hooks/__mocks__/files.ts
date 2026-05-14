import { jest } from "@jest/globals";

export const mockUseFileUpload = jest.fn(() => ({
  upload: jest.fn(),
  abort: jest.fn(),
  reset: jest.fn(),
  status: "idle" as const,
  progress: {
    bytesUploaded: 0,
    bytesTotal: null as number | null,
    percent: null as number | null,
  },
  error: null as Error | null,
  result: null as { bucket: string; objectPath: string; storagePath: string } | null,
}));

export const mockUseFileDownload = jest.fn(() => ({
  download: jest.fn(),
  abort: jest.fn(),
  reset: jest.fn(),
  status: "idle" as const,
  error: null as Error | null,
  file: null as {
    uri: string;
    contentType: string | null;
    fileName: string | null;
    totalBytes: number;
  } | null,
}));

export const mockDeleteCachedDownload = jest.fn(() => Promise.resolve());

export const useFileUpload = mockUseFileUpload;
export const useFileDownload = mockUseFileDownload;
export const deleteCachedDownload = mockDeleteCachedDownload;
