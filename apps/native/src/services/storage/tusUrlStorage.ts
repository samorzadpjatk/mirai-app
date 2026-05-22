import * as SecureStore from "expo-secure-store";
import type { PreviousUpload, UrlStorage } from "tus-js-client";
type StoredUploadsMap = Record<string, Record<string, PreviousUpload>>;
const STORAGE_KEY = "tus.uploads.v1";
const readStore = async (): Promise<StoredUploadsMap> => {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredUploadsMap;
    return parsed ?? {};
  } catch {
    return {};
  }
};
const writeStore = async (store: StoredUploadsMap): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* no-op */
  }
};
const createStorageKey = (fingerprint: string) => {
  return `${fingerprint}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
export const tusUrlStorage = (): UrlStorage => ({
  findAllUploads: async () => {
    const store = await readStore();
    return Object.values(store).flatMap((uploads) => Object.values(uploads));
  },
  findUploadsByFingerprint: async (fingerprint: string) => {
    const store = await readStore();
    return Object.values(store[fingerprint] ?? {});
  },
  addUpload: async (fingerprint: string, upload: PreviousUpload) => {
    const store = await readStore();
    const urlStorageKey = upload.urlStorageKey || createStorageKey(fingerprint);
    const normalizedUpload: PreviousUpload = {
      ...upload,
      urlStorageKey,
    };
    const uploadsForFingerprint = store[fingerprint] ?? {};
    uploadsForFingerprint[urlStorageKey] = normalizedUpload;
    store[fingerprint] = uploadsForFingerprint;
    await writeStore(store);
    return urlStorageKey;
  },
  removeUpload: async (urlStorageKey: string) => {
    const store = await readStore();
    let updated = false;
    for (const fingerprint of Object.keys(store)) {
      const uploads = store[fingerprint];
      if (!uploads || !(urlStorageKey in uploads)) continue;
      delete uploads[urlStorageKey];
      updated = true;
      if (Object.keys(uploads).length === 0) {
        delete store[fingerprint];
      } else {
        store[fingerprint] = uploads;
      }
      break;
    }
    if (updated) {
      await writeStore(store);
    }
  },
});
