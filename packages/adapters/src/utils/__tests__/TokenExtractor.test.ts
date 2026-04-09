import { describe, it, expect } from "bun:test";
import { TokenExtractor } from "../TokenExtractor";

describe("[UNIT] TokenExtractor", () => {
  describe("extract", () => {
    it("should return null for null input", () => {
      const result = TokenExtractor.extract(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = TokenExtractor.extract(undefined);
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = TokenExtractor.extract("");
      expect(result).toBeNull();
    });

    it("should return null for whitespace-only string", () => {
      const result = TokenExtractor.extract("   ");
      expect(result).toBeNull();
    });

    it("should extract token from valid Bearer header", () => {
      const result = TokenExtractor.extract("Bearer validToken123");
      expect(result).toBe("validToken123");
    });

    it("should extract token from valid lowercase bearer header", () => {
      const result = TokenExtractor.extract("bearer lowercaseToken");
      expect(result).toBe("lowercaseToken");
    });

    it("should extract token from valid mixed case Bearer header", () => {
      const result = TokenExtractor.extract("BeArEr mixedCaseToken");
      expect(result).toBe("mixedCaseToken");
    });

    it("should return null for Basic auth scheme", () => {
      const result = TokenExtractor.extract("Basic dXNlcjpwYXNzd29yZA==");
      expect(result).toBeNull();
    });

    it("should return null for Digest auth scheme", () => {
      const result = TokenExtractor.extract('Digest username="admin"');
      expect(result).toBeNull();
    });

    it("should return null for missing token after Bearer", () => {
      const result = TokenExtractor.extract("Bearer ");
      expect(result).toBeNull();
    });

    it("should return null for Bearer without space", () => {
      const result = TokenExtractor.extract("Bearer");
      expect(result).toBeNull();
    });

    it("should return null for single part input", () => {
      const result = TokenExtractor.extract("singlepart");
      expect(result).toBeNull();
    });

    it("should return null for more than two parts", () => {
      const result = TokenExtractor.extract("Bearer token extra");
      expect(result).toBeNull();
    });

    it("should extract token with special characters", () => {
      const result = TokenExtractor.extract(
        "Bearer token_with-special.chars+123",
      );
      expect(result).toBe("token_with-special.chars+123");
    });

    it("should extract JWT-style token", () => {
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const result = TokenExtractor.extract(`Bearer ${jwt}`);
      expect(result).toBe(jwt);
    });

    it("should trim leading whitespace", () => {
      const result = TokenExtractor.extract("   Bearer token123");
      expect(result).toBe("token123");
    });

    it("should trim trailing whitespace", () => {
      const result = TokenExtractor.extract("Bearer token123   ");
      expect(result).toBe("token123");
    });
  });

  describe("fromHeaders", () => {
    it("should extract token from headers with lowercase authorization", () => {
      const result = TokenExtractor.fromHeaders({
        authorization: "Bearer token123",
      });
      expect(result).toBe("token123");
    });

    it("should return null when authorization header is missing", () => {
      const result = TokenExtractor.fromHeaders({});
      expect(result).toBeNull();
    });

    it("should return null when authorization header is undefined", () => {
      const result = TokenExtractor.fromHeaders({ authorization: undefined });
      expect(result).toBeNull();
    });

    it("should return null for invalid authorization header", () => {
      const result = TokenExtractor.fromHeaders({
        authorization: "Basic dXNlcjpwYXNzd29yZA==",
      });
      expect(result).toBeNull();
    });

    it("should extract JWT token from headers", () => {
      const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      const result = TokenExtractor.fromHeaders({
        authorization: `Bearer ${jwt}`,
      });
      expect(result).toBe(jwt);
    });
  });
});
