/**
 * Test helper for creating mock Request objects with working headers
 *
 * Happy DOM's Request implementation has a bug where it doesn't properly
 * copy headers passed to the constructor. This helper creates a Request
 * mock that properly implements the headers interface.
 *
 * @module websocket/test-helpers
 */

/**
 * Create a mock Request with properly functioning headers
 *
 * This is needed because Happy DOM's Request implementation doesn't
 * properly handle the headers init parameter.
 */
export function createMockRequest(
  url: string,
  init?: { headers?: Headers | Record<string, string> },
): Request {
  // Create a Headers object from the init
  const headers = new Headers();

  if (init?.headers) {
    if (init.headers instanceof Headers) {
      // Copy from existing Headers
      for (const [name, value] of init.headers.entries()) {
        headers.set(name, value);
      }
    } else {
      // Copy from plain object
      for (const [name, value] of Object.entries(init.headers)) {
        headers.set(name, value);
      }
    }
  }

  // Create a minimal Request-like object that implements the interface
  // we need for extractAuthToken
  const request = {
    url,
    headers: {
      get: (name: string) => headers.get(name),
      entries: () => headers.entries(),
    },
  } as Request;

  return request;
}
