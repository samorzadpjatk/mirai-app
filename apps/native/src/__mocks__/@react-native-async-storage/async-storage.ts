// Mock for @react-native-async-storage/async-storage
const storage: Record<string, string> = {};

const AsyncStorage = {
  getItem: jest.fn((key: string) => Promise.resolve(storage[key] || null)),

  setItem: jest.fn((key: string, value: string) => {
    storage[key] = value;
    return Promise.resolve();
  }),

  removeItem: jest.fn((key: string) => {
    delete storage[key];
    return Promise.resolve();
  }),

  mergeItem: jest.fn((key: string, value: string) => {
    const existing = storage[key] || "{}";
    const merged = { ...JSON.parse(existing), ...JSON.parse(value) };
    storage[key] = JSON.stringify(merged);
    return Promise.resolve();
  }),

  clear: jest.fn(() => {
    Object.keys(storage).forEach((key) => delete storage[key]);
    return Promise.resolve();
  }),

  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(storage))),

  flushGetRequests: jest.fn(() => Promise.resolve()),

  multiGet: jest.fn((keys: string[]) =>
    Promise.resolve(keys.map((key) => [key, storage[key] || null])),
  ),

  multiSet: jest.fn((keyValuePairs: [string, string][]) => {
    keyValuePairs.forEach(([key, value]) => {
      storage[key] = value;
    });
    return Promise.resolve();
  }),

  multiRemove: jest.fn((keys: string[]) => {
    keys.forEach((key) => delete storage[key]);
    return Promise.resolve();
  }),

  multiMerge: jest.fn((keyValuePairs: [string, string][]) => {
    keyValuePairs.forEach(([key, value]) => {
      const existing = storage[key] || "{}";
      const merged = { ...JSON.parse(existing), ...JSON.parse(value) };
      storage[key] = JSON.stringify(merged);
    });
    return Promise.resolve();
  }),

  useAsyncStorage: jest.fn((key: string) => ({
    getItem: jest.fn(() => AsyncStorage.getItem(key)),
    setItem: jest.fn((value: string) => AsyncStorage.setItem(key, value)),
    mergeItem: jest.fn((value: string) => AsyncStorage.mergeItem(key, value)),
    removeItem: jest.fn(() => AsyncStorage.removeItem(key)),
  })),
};

export default AsyncStorage;
export const useAsyncStorage = AsyncStorage.useAsyncStorage;
