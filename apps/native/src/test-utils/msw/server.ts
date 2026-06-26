import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:9999";

const orpcRegistry = new Map<string, (input: Record<string, unknown>) => unknown>();

function wrapORPCOutput(output: unknown) {
  return HttpResponse.json({ json: output, meta: [] });
}

function wrapORPCError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return HttpResponse.json(
    {
      json: {
        defined: true,
        code: "BAD_REQUEST",
        status: 400,
        message,
        data: null,
      },
      meta: [],
    },
    { status: 400 },
  );
}

async function executeORPCProcedure(pathname: string, input: unknown) {
  const resolver = orpcRegistry.get(pathname);
  if (!resolver) {
    return {
      json: {
        defined: true,
        code: "NOT_FOUND",
        status: 404,
        message: `No handler registered for ${pathname}`,
        data: null,
      },
      meta: [],
    };
  }

  try {
    if (!isRecord(input)) {
      throw new Error("Invalid oRPC input");
    }
    const output = await resolver(input);
    return { json: output instanceof Response ? undefined : output, meta: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      json: {
        defined: true,
        code: "BAD_REQUEST",
        status: 400,
        message,
        data: null,
      },
      meta: [],
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseORPCBody(raw: unknown): { json: unknown; meta?: unknown[] } {
  if (!isRecord(raw) || !("json" in raw)) {
    throw new Error("Invalid oRPC request body");
  }
  return {
    json: raw.json,
    meta: "meta" in raw && Array.isArray(raw.meta) ? raw.meta : undefined,
  };
}

function parseORPCBatchEntry(raw: unknown): {
  body: { json: unknown; meta?: unknown[] };
  url: string;
} {
  if (!isRecord(raw) || !("body" in raw) || !("url" in raw)) {
    throw new Error("Invalid oRPC batch entry");
  }
  return { body: parseORPCBody(raw.body), url: String(raw.url) };
}

function parseORPCBatch(
  raw: unknown,
): Array<{ body: { json: unknown; meta?: unknown[] }; url: string }> {
  if (!Array.isArray(raw)) {
    throw new Error("Invalid oRPC batch body");
  }
  return raw.map(parseORPCBatchEntry);
}

/**
 * Helper to create an oRPC MSW handler.
 * oRPC requests are POST to /{router}/{procedure} with body { json: input, meta: [...] }
 * and expect response { json: output, meta: [...] }.
 *
 * @param path - Router path segments, e.g. ["trip", "getAll"]
 * @param resolver - Function that receives the deserialized input and returns output
 */
export function createORPCHandler<TOutput = unknown>(
  path: string[],
  resolver: (input: Record<string, unknown>) => TOutput,
) {
  const pathname = `/${path.join("/")}`;
  const urlPath = `${BASE_URL}${pathname}`;

  orpcRegistry.set(pathname, resolver);

  return http.post(urlPath, async ({ request }) => {
    try {
      const body = parseORPCBody(await request.json());
      if (!isRecord(body.json)) {
        throw new Error("Invalid oRPC input");
      }
      const output = await resolver(body.json);
      if (output instanceof Response) {
        return output;
      }
      return wrapORPCOutput(output);
    } catch (error) {
      return wrapORPCError(error);
    }
  });
}

/**
 * oRPC batch request handler.
 * oRPC may batch multiple procedure calls into a single POST to `/{firstRouter}/{firstProcedure}/__batch__`.
 * The body is an array of `{ body: { json, meta }, url }` entries.
 */
export const orpcBatchHandler = http.post(
  new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/.+/__batch__$`),
  async ({ request }) => {
    try {
      const entries = parseORPCBatch(await request.json());

      const results = await Promise.all(
        entries.map(async (entry) => {
          const url = new URL(entry.url);
          return executeORPCProcedure(url.pathname, entry.body.json);
        }),
      );

      return HttpResponse.json(results);
    } catch (error) {
      return wrapORPCError(error);
    }
  },
);

const internalServer = setupServer();
const originalResetHandlers = internalServer.resetHandlers.bind(internalServer);

internalServer.resetHandlers = (...args: Parameters<typeof originalResetHandlers>) => {
  originalResetHandlers(...args);
  internalServer.use(orpcBatchHandler);
};

/**
 * MSW server instance for native tests.
 * Start with `server.listen()` before tests and `server.close()` after.
 */
export const server = internalServer;

/**
 * Reset MSW handlers to clean state.
 * Call in `beforeEach` or `afterEach` to remove custom handlers.
 */
export function resetHandlers() {
  server.resetHandlers();
}

export { HttpResponse, http };
