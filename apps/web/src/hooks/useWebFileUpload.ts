"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useClient } from "urql";
import { authStore } from "@mirai-app/frameworks/auth/client";
import {
  validateImageFile,
  type FileValidationOptions,
} from "../lib/fileValidation";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface UploadProgress {
  loadedBytes: number;
  totalBytes: number | null;
  percent: number | null;
}

export interface UploadResult {
  bucket: string;
  objectPath: string;
  storagePath: string;
}

export interface UploadInput {
  storagePath: string;
  file?: File;
  upsert?: boolean;
}

interface UploadTicket {
  token: string;
  bucket: string;
  objectPath: string;
  storagePath: string;
}

const initialProgress: UploadProgress = {
  loadedBytes: 0,
  totalBytes: null,
  percent: null,
};

const encodePathSegments = (path: string): string =>
  path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const buildSignedUploadUrl = (
  baseUrl: string,
  bucket: string,
  objectPath: string,
  token: string,
): string => {
  const base = baseUrl.replace(/\/$/, "");
  const encodedBucket = encodeURIComponent(bucket);
  const encodedPath = encodePathSegments(objectPath);

  return `${base}/storage/v1/object/upload/sign/${encodedBucket}/${encodedPath}?token=${encodeURIComponent(token)}`;
};

const uploadWithProgress = (
  url: string,
  file: File,
  options: {
    upsert: boolean;
    onProgress: (event: ProgressEvent<EventTarget>) => void;
    accessToken: string | undefined;
    supabaseAnonKey: string;
  },
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.responseType = "json";

    xhr.setRequestHeader("apikey", options.supabaseAnonKey);
    xhr.setRequestHeader("x-upsert", options.upsert ? "true" : "false");
    xhr.setRequestHeader(
      "content-type",
      file.type || "application/octet-stream",
    );

    if (options.accessToken) {
      xhr.setRequestHeader("authorization", `Bearer ${options.accessToken}`);
    }

    xhr.upload.onprogress = options.onProgress;

    xhr.onerror = () => {
      reject(new Error("Upload failed due to a network error."));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      const xhrResponse: unknown = xhr.response;
      const responseMessage =
        xhrResponse &&
        typeof xhrResponse === "object" &&
        xhrResponse !== null &&
        "message" in xhrResponse &&
        typeof xhrResponse.message === "string"
          ? xhrResponse.message
          : null;

      reject(
        new Error(
          responseMessage ??
            `Upload failed with status ${xhr.status}. Please try again.`,
        ),
      );
    };

    xhr.send(file);
  });

// GraphQL mutation for creating upload URL
const CREATE_UPLOAD_URL_MUTATION = `
  mutation CreateUploadUrl($input: CreateUploadUrlInput!) {
    createUploadUrl(input: $input) {
      token
      bucket
      objectPath
      storagePath
      url
    }
  }
`;

// GraphQL query for creating download URL
const CREATE_DOWNLOAD_URL_QUERY = `
  query CreateDownloadUrl($input: CreateDownloadUrlInput!) {
    createDownloadUrl(input: $input) {
      signedUrl
      storagePath
      expiresIn
    }
  }
`;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseUploadTicket = (value: unknown): UploadTicket => {
  if (!isObject(value)) {
    throw new Error("Invalid upload response from server.");
  }

  const token = value.token;
  const bucket = value.bucket;
  const objectPath = value.objectPath;
  const storagePath = value.storagePath;

  if (
    typeof token !== "string" ||
    typeof bucket !== "string" ||
    typeof objectPath !== "string" ||
    typeof storagePath !== "string"
  ) {
    throw new Error("Invalid upload response from server.");
  }

  return {
    token,
    bucket,
    objectPath,
    storagePath,
  };
};

const parseSignedUrlResult = (value: unknown): string => {
  if (!isObject(value) || typeof value.signedUrl !== "string") {
    throw new Error("Invalid download URL response from server.");
  }

  return value.signedUrl;
};

export function useWebFileUpload(validationOptions?: FileValidationOptions) {
  const urqlClient = useClient();

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<UploadProgress>(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const setPreviewFromFile = useCallback((file: File | null) => {
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      if (!file) {
        return null;
      }

      return URL.createObjectURL(file);
    });
  }, []);

  const selectFile = useCallback(
    (file: File | null) => {
      setError(null);

      if (!file) {
        setSelectedFile(null);
        setPreviewFromFile(null);
        return;
      }

      const validationError = validateImageFile(file, validationOptions);
      if (validationError) {
        setSelectedFile(null);
        setPreviewFromFile(null);
        setError(validationError);
        return;
      }

      setSelectedFile(file);
      setPreviewFromFile(file);
    },
    [setPreviewFromFile, validationOptions],
  );

  const onFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      selectFile(file);
    },
    [selectFile],
  );

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setPreviewFromFile(null);
    setError(null);
  }, [setPreviewFromFile]);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(initialProgress);
    setError(null);
    setResult(null);
  }, []);

  const upload = useCallback(
    async (input: UploadInput): Promise<UploadResult> => {
      const fileToUpload = input.file ?? selectedFile;
      if (!fileToUpload) {
        const message = "Please select a file before uploading.";
        setStatus("error");
        setError(message);
        throw new Error(message);
      }

      setStatus("uploading");
      setProgress(initialProgress);
      setError(null);
      setResult(null);

      try {
        // Use urql to get upload URL
        const uploadResult = await urqlClient
          .mutation(CREATE_UPLOAD_URL_MUTATION, {
            input: {
              storagePath: input.storagePath,
              upsert: input.upsert ?? true,
            },
          })
          .toPromise();

        if (uploadResult.error) {
          throw uploadResult.error;
        }

        if (!uploadResult.data?.createUploadUrl) {
          throw new Error("Failed to get upload URL.");
        }

        const ticket = parseUploadTicket(uploadResult.data.createUploadUrl);

        // Get supabase URL from env
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl) {
          throw new Error("Supabase URL not configured.");
        }

        const signedUploadUrl = buildSignedUploadUrl(
          supabaseUrl,
          ticket.bucket,
          ticket.objectPath,
          ticket.token,
        );

        const accessToken = authStore.getState().session?.access_token;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseAnonKey) {
          throw new Error("Supabase anon key not configured.");
        }

        await uploadWithProgress(signedUploadUrl, fileToUpload, {
          upsert: input.upsert ?? true,
          accessToken,
          supabaseAnonKey,
          onProgress: (event) => {
            const totalBytes = event.lengthComputable ? event.total : null;
            const loadedBytes = event.loaded;

            setProgress({
              loadedBytes,
              totalBytes,
              percent:
                totalBytes && totalBytes > 0 ? loadedBytes / totalBytes : null,
            });
          },
        });

        const nextResult: UploadResult = {
          bucket: ticket.bucket,
          objectPath: ticket.objectPath,
          storagePath: ticket.storagePath,
        };

        setResult(nextResult);
        setStatus("success");
        return nextResult;
      } catch (uploadError) {
        const message =
          uploadError instanceof Error
            ? uploadError.message
            : "Upload failed. Please try again.";
        setStatus("error");
        setError(message);
        throw new Error(message);
      }
    },
    [selectedFile, urqlClient],
  );

  const verifyFileAccessible = useCallback(
    async (storagePath: string): Promise<string> => {
      const response = await urqlClient
        .query(CREATE_DOWNLOAD_URL_QUERY, {
          input: {
            storagePath,
          },
        })
        .toPromise();

      if (response.error) {
        throw response.error;
      }

      if (!response.data?.createDownloadUrl?.signedUrl) {
        throw new Error("Failed to get download URL.");
      }

      return parseSignedUrlResult(response.data.createDownloadUrl);
    },
    [urqlClient],
  );

  return {
    status,
    progress,
    error,
    result,
    selectedFile,
    previewUrl,
    onFileInputChange,
    selectFile,
    clearSelection,
    upload,
    verifyFileAccessible,
    reset,
  };
}
