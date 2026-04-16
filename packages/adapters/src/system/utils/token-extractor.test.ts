import { describe, it, expect } from "bun:test";
import { TokenExtractor } from "./token-extractor";

describe("[UNIT] TokenExtractor", () => {
  describe("extract", () => {
    describe("null and undefined inputs", () => {
      it("returns null for null input", () => {
        const result = TokenExtractor.extract(null);
        expect(result).toBeNull();
      });

      it("returns null for undefined input", () => {
        const result = TokenExtractor.extract(undefined);
        expect(result).toBeNull();
      });
    });

    describe("empty and whitespace inputs", () => {
      it("returns null for empty string", () => {
        const result = TokenExtractor.extract("");
        expect(result).toBeNull();
      });

      it("returns null for whitespace-only string", () => {
        const result = TokenExtractor.extract("   ");
        expect(result).toBeNull();
      });

      it("returns null for string with only newlines and tabs", () => {
        const result = TokenExtractor.extract("\n\t  ");
        expect(result).toBeNull();
      });
    });

    describe("invalid formats", () => {
      it("returns null for string without Bearer prefix", () => {
        const result = TokenExtractor.extract("invalid_token_123");
        expect(result).toBeNull();
      });

      it("returns null for Basic auth scheme", () => {
        const result = TokenExtractor.extract("Basic dXNlcjpwYXNzd29yZA==");
        expect(result).toBeNull();
      });

      it("returns null for Digest auth scheme", () => {
        const result = TokenExtractor.extract('Digest username="admin"');
        expect(result).toBeNull();
      });

      it("returns null for single word without space", () => {
        const result = TokenExtractor.extract("Bearer");
        expect(result).toBeNull();
      });

      it("returns null for more than two parts", () => {
        const result = TokenExtractor.extract("Bearer token123 extra");
        expect(result).toBeNull();
      });

      it("returns null for empty token after Bearer", () => {
        const result = TokenExtractor.extract("Bearer ");
        expect(result).toBeNull();
      });

      it("returns null for whitespace-only token after Bearer", () => {
        const result = TokenExtractor.extract("Bearer   ");
        expect(result).toBeNull();
      });
    });

    describe("case sensitivity", () => {
      it("returns token for lowercase 'bearer' scheme", () => {
        const result = TokenExtractor.extract("bearer validToken123");
        expect(result).toBe("validToken123");
      });

      it("returns token for uppercase 'BEARER' scheme", () => {
        const result = TokenExtractor.extract("BEARER validToken123");
        expect(result).toBe("validToken123");
      });

      it("returns token for mixed case 'BeArEr' scheme", () => {
        const result = TokenExtractor.extract("BeArEr validToken123");
        expect(result).toBe("validToken123");
      });
    });

    describe("whitespace handling", () => {
      it("trims leading whitespace before extracting", () => {
        const result = TokenExtractor.extract("  Bearer token123");
        expect(result).toBe("token123");
      });

      it("trims trailing whitespace before extracting", () => {
        const result = TokenExtractor.extract("Bearer token123  ");
        expect(result).toBe("token123");
      });

      it("handles multiple spaces between scheme and token", () => {
        const result = TokenExtractor.extract("Bearer   token123");
        // Split creates: ['Bearer', '', '', 'token123'] - length 4
        expect(result).toBeNull();
      });

      it("handles tabs between scheme and token", () => {
        const result = TokenExtractor.extract("Bearer\ttoken123");
        // Tab splits as separate part
        expect(result).toBeNull();
      });
    });

    describe("valid token extraction", () => {
      it("extracts JWT-style token", () => {
        const jwt =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
        const result = TokenExtractor.extract(`Bearer ${jwt}`);
        expect(result).toBe(jwt);
      });

      it("extracts simple alphanumeric token", () => {
        const result = TokenExtractor.extract("Bearer abc123XYZ");
        expect(result).toBe("abc123XYZ");
      });

      it("extracts token with special characters", () => {
        const result = TokenExtractor.extract(
          "Bearer token_with-special.chars+plus/",
        );
        expect(result).toBe("token_with-special.chars+plus/");
      });

      it("extracts long token", () => {
        const longToken = "a".repeat(1000);
        const result = TokenExtractor.extract(`Bearer ${longToken}`);
        expect(result).toBe(longToken);
      });

      it("extracts token with numbers only", () => {
        const result = TokenExtractor.extract("Bearer 123456789");
        expect(result).toBe("123456789");
      });

      it("extracts single character token", () => {
        const result = TokenExtractor.extract("Bearer x");
        expect(result).toBe("x");
      });
    });
  });

  describe("fromHeaders", () => {
    describe("missing authorization header", () => {
      it("returns null for empty headers object", () => {
        const result = TokenExtractor.fromHeaders({});
        expect(result).toBeNull();
      });

      it("returns null for headers with other fields", () => {
        // Runtime scenario: headers object without authorization field
        const headers: { authorization?: string } = {};
        // Simulate adding other headers that the function will ignore
        const extendedHeaders = {
          ...headers,
          "content-type": "application/json",
        } as { authorization?: string };
        const result = TokenExtractor.fromHeaders(extendedHeaders);
        expect(result).toBeNull();
      });

      it("returns null for undefined authorization", () => {
        const result = TokenExtractor.fromHeaders({ authorization: undefined });
        expect(result).toBeNull();
      });
    });

    describe("invalid authorization values", () => {
      it("returns null for empty authorization string", () => {
        const result = TokenExtractor.fromHeaders({ authorization: "" });
        expect(result).toBeNull();
      });

      it("returns null for Basic auth in headers", () => {
        const result = TokenExtractor.fromHeaders({
          authorization: "Basic dXNlcjpwYXNzd29yZA==",
        });
        expect(result).toBeNull();
      });

      it("returns null for malformed Bearer token", () => {
        const result = TokenExtractor.fromHeaders({
          authorization: "Bearer",
        });
        expect(result).toBeNull();
      });
    });

    describe("valid authorization header", () => {
      it("extracts token from headers with valid Bearer token", () => {
        const result = TokenExtractor.fromHeaders({
          authorization: "Bearer validToken123",
        });
        expect(result).toBe("validToken123");
      });

      it("extracts JWT token from headers", () => {
        const jwt =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w7N_X";
        const result = TokenExtractor.fromHeaders({
          authorization: `Bearer ${jwt}`,
        });
        expect(result).toBe(jwt);
      });

      it("extracts token with lowercase bearer scheme", () => {
        const result = TokenExtractor.fromHeaders({
          authorization: "bearer lowercaseToken",
        });
        expect(result).toBe("lowercaseToken");
      });

      it("handles headers object with authorization and ignores other properties at runtime", () => {
        // The type only allows 'authorization' but at runtime we may receive more headers
        const headers = {
          authorization: "Bearer token123",
        };
        const result = TokenExtractor.fromHeaders(headers);
        expect(result).toBe("token123");
      });
    });

    describe("edge cases with headers object", () => {
      it("handles headers with null prototype", () => {
        const headers = Object.create(null);
        headers.authorization = "Bearer token123";
        const result = TokenExtractor.fromHeaders(headers);
        expect(result).toBe("token123");
      });

      it("handles authorization with leading/trailing whitespace", () => {
        const result = TokenExtractor.fromHeaders({
          authorization: "  Bearer token123  ",
        });
        expect(result).toBe("token123");
      });
    });
  });
});
