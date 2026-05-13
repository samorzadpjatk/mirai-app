export interface MockFetchResponse {
  blob: () => Promise<Blob>;
}

export function setupMockFetch(response?: MockFetchResponse): jest.Mock {
  const defaultResponse: MockFetchResponse = {
    blob: jest.fn().mockResolvedValue(new Blob(["test content"])),
  };

  const mockFetch = jest.fn().mockResolvedValue(response ?? defaultResponse);

  Object.defineProperty(globalThis, "fetch", {
    value: mockFetch,
    writable: true,
    configurable: true,
  });

  return mockFetch;
}
