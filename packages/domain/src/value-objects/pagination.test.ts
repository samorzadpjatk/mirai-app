import { describe, it, expect } from "bun:test";
import {
  isForwardPagination,
  isBackwardPagination,
  type ForwardPaginationArgs,
  type BackwardPaginationArgs,
  type PaginationArgs,
} from "./pagination";

describe("[UNIT] Pagination", () => {
  describe("[UNIT] isForwardPagination", () => {
    it("should return true for forward pagination args with first", () => {
      const args: PaginationArgs = { first: 10 };
      expect(isForwardPagination(args)).toBe(true);
    });

    it("should return true for forward pagination args with first and after", () => {
      const args: PaginationArgs = { first: 10, after: "cursor123" };
      expect(isForwardPagination(args)).toBe(true);
    });

    it("should return true for forward pagination args with first and after null", () => {
      const args: ForwardPaginationArgs = { first: 10, after: null };
      expect(isForwardPagination(args)).toBe(true);
    });

    it("should return false for backward pagination args", () => {
      const args: PaginationArgs = { last: 10 };
      expect(isForwardPagination(args)).toBe(false);
    });

    it("should return false for backward pagination args with before", () => {
      const args: BackwardPaginationArgs = { last: 10, before: "cursor123" };
      expect(isForwardPagination(args)).toBe(false);
    });
  });

  describe("[UNIT] isBackwardPagination", () => {
    it("should return true for backward pagination args with last", () => {
      const args: PaginationArgs = { last: 10 };
      expect(isBackwardPagination(args)).toBe(true);
    });

    it("should return true for backward pagination args with last and before", () => {
      const args: PaginationArgs = { last: 10, before: "cursor123" };
      expect(isBackwardPagination(args)).toBe(true);
    });

    it("should return true for backward pagination args with last and before null", () => {
      const args: BackwardPaginationArgs = { last: 10, before: null };
      expect(isBackwardPagination(args)).toBe(true);
    });

    it("should return false for forward pagination args", () => {
      const args: PaginationArgs = { first: 10 };
      expect(isBackwardPagination(args)).toBe(false);
    });

    it("should return false for forward pagination args with after", () => {
      const args: ForwardPaginationArgs = { first: 10, after: "cursor123" };
      expect(isBackwardPagination(args)).toBe(false);
    });
  });

  describe("[UNIT] type guards are mutually exclusive", () => {
    it("should only match one type guard at a time", () => {
      const forwardArgs: PaginationArgs = { first: 10 };
      const backwardArgs: PaginationArgs = { last: 10 };

      // Forward pagination
      expect(isForwardPagination(forwardArgs)).toBe(true);
      expect(isBackwardPagination(forwardArgs)).toBe(false);

      // Backward pagination
      expect(isForwardPagination(backwardArgs)).toBe(false);
      expect(isBackwardPagination(backwardArgs)).toBe(true);
    });
  });
});
