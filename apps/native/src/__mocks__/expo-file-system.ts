// Mock for expo-file-system module
export const documentDirectory = "/mock/documents/";

export const cacheDirectory = "/mock/cache/";

export const getInfoAsync = jest.fn((uri: string) =>
  Promise.resolve({
    exists: true,
    uri,
    size: 1024,
    isDirectory: false,
    modificationTime: Date.now(),
  }),
);

export const readAsStringAsync = jest.fn(() =>
  Promise.resolve("mock-file-content"),
);

export const writeAsStringAsync = jest.fn(() => Promise.resolve());

export const deleteAsync = jest.fn(() => Promise.resolve());

export const moveAsync = jest.fn(() => Promise.resolve());

export const copyAsync = jest.fn(() => Promise.resolve());

export const makeDirectoryAsync = jest.fn(() => Promise.resolve());

export const readDirectoryAsync = jest.fn(() =>
  Promise.resolve(["file1.txt", "file2.txt"]),
);

export const downloadAsync = jest.fn(() =>
  Promise.resolve({
    uri: "/mock/downloaded-file",
    status: 200,
    headers: {},
    mimeType: "application/octet-stream",
  }),
);

export const createDownloadResumable = jest.fn(() => ({
  downloadAsync: jest.fn(() =>
    Promise.resolve({
      uri: "/mock/downloaded-file",
      status: 200,
      headers: {},
    }),
  ),
  pauseAsync: jest.fn(() => Promise.resolve()),
  resumeAsync: jest.fn(() => Promise.resolve()),
  savable: jest.fn(() => ({})),
}));

export const getFreeDiskStorageAsync = jest.fn(() =>
  Promise.resolve(1000000000),
);

export const getTotalDiskCapacityAsync = jest.fn(() =>
  Promise.resolve(50000000000),
);

export const StorageAccessFramework = {
  requestDirectoryPermissionsAsync: jest.fn(() =>
    Promise.resolve({
      granted: true,
      directoryUri: "content://mock-directory",
    }),
  ),
  readDirectoryAsync: jest.fn(() => Promise.resolve(["file1.txt"])),
  createFileAsync: jest.fn(() => Promise.resolve("content://mock-file")),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
};

export default {
  documentDirectory,
  cacheDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  moveAsync,
  copyAsync,
  makeDirectoryAsync,
  readDirectoryAsync,
  downloadAsync,
  createDownloadResumable,
  getFreeDiskStorageAsync,
  getTotalDiskCapacityAsync,
  StorageAccessFoundation: StorageAccessFramework,
};
