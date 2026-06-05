import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

/**
 * Helper to create an oRPC MSW handler.
 * oRPC requests are POST to /{router}/{procedure} with body { json: input, meta: [...] }
 * and expect response { json: output, meta: [...] }.
 *
 * @param path - Router path segments, e.g. ["trip", "getAll"]
 * @param resolver - Function that receives the deserialized input and returns output
 */
export function createORPCHandler(path: string[], resolver: (input: any) => any) {
  const urlPath = `http://localhost:9999/${path.join("/")}`;

  return http.post(urlPath, async ({ request }) => {
    const body = (await request.json()) as { json: unknown; meta?: unknown[] };
    const input = body.json;
    try {
      const output = await resolver(input);
      if (output instanceof Response) {
        return output;
      }
      return HttpResponse.json({ json: output, meta: [] });
    } catch (error) {
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
  });
}

/**
 * MSW server instance for native tests.
 * Start with `server.listen()` before tests and `server.close()` after.
 */
export const server = setupServer();

/**
 * Reset MSW handlers to clean state.
 * Call in `beforeEach` or `afterEach` to remove custom handlers.
 */
export function resetHandlers() {
  server.resetHandlers();
}

export { http, HttpResponse };
