import { type FastifyRequest } from "fastify";

// Normalizes Fastify (Node) headers to Fetch API headers expected by downstream utilities.
export const fastifyHeadersToFetchHeaders = (
  headers: FastifyRequest["headers"],
): Headers => {
  const fetchHeaders = new Headers();

  for (const [key, value] of Object.entries(headers ?? {})) {
    if (typeof value === "undefined") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string") {
          fetchHeaders.append(key, entry);
        }
      }
    } else {
      fetchHeaders.set(key, String(value));
    }
  }

  return fetchHeaders;
};
