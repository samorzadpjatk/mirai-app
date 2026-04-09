// Mock for superjson - avoids ESM issues in Jest
// This is a simple JSON-based replacement for testing

export default {
  stringify: (data: unknown): string => JSON.stringify(data),
  parse: <T = unknown>(str: string): T => JSON.parse(str) as T,
  serialize: (data: unknown) => ({ json: data }),
  deserialize: <T = unknown>(data: { json: T }): T => data.json,
};

export const stringify = (data: unknown): string => JSON.stringify(data);
export const parse = <T = unknown>(str: string): T => JSON.parse(str) as T;
export const serialize = (data: unknown) => ({ json: data });
export const deserialize = <T = unknown>(data: { json: T }): T => data.json;
