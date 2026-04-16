/**
 * Integration tests for SubmissionReportGateway Connection methods
 *
 * Tests verify:
 * - GraphQL Connection structure (edges, nodes, pageInfo)
 * - Cursor-based pagination
 * - Error handling
 * - Pagination + filtering combinations
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemorySubmissionReportGateway } from "./gateway";
import type {
  SubmissionReportDTO,
  SubmissionReportCursorData,
} from "@mirai-app/use-cases";
import { ReportReason } from "@mirai-app/domain";

describe("[INTEGRATION] SubmissionReportGateway - Connection Methods", () => {
  let gateway: InMemorySubmissionReportGateway;

  beforeEach(async () => {
    gateway = new InMemorySubmissionReportGateway();
    await Effect.runPromise(gateway.reset());
  });

  // ============================================================================
  // Test Data Helpers
  // ============================================================================

  const createMockReport = (
    id: string,
    overrides?: Partial<SubmissionReportDTO>,
  ): SubmissionReportDTO => ({
    id,
    submissionId: "submission-1",
    reporterId: "user-1",
    reason: new ReportReason("SPAM"),
    description: "Test report description",
    status: "PENDING",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    resolvedById: null,
    resolvedAt: null,
    ...overrides,
  });

  // ============================================================================
  // GraphQL Connection Structure Tests
  // ============================================================================

  describe("Connection structure verification", () => {
    it("returns proper Connection structure with edges, nodes, pageInfo", async () => {
      const report = createMockReport("report-1");
      await Effect.runPromise(gateway.create(report));

      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection("submission-1", { first: 10 }),
      );

      // Verify edges array structure
      expect(result.edges).toBeDefined();
      expect(Array.isArray(result.edges)).toBe(true);

      if (result.edges.length > 0) {
        const edge = result.edges[0];
        expect(edge).toBeDefined();
        expect(edge.node).toBeDefined();
        expect(edge.cursor).toBeDefined();
        expect(typeof edge.cursor).toBe("string");
      }

      // Verify nodes array
      expect(result.nodes).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(result.nodes.length).toBe(result.edges.length);

      // Verify pageInfo structure
      expect(result.pageInfo).toBeDefined();
      expect(typeof result.pageInfo.hasNextPage).toBe("boolean");
      expect(typeof result.pageInfo.hasPreviousPage).toBe("boolean");
      expect(result.pageInfo.startCursor !== undefined).toBe(true);
      expect(result.pageInfo.endCursor !== undefined).toBe(true);
    });

    it("cursors are valid base64 encoded strings", async () => {
      const report = createMockReport("report-1", {
        createdAt: new Date("2024-01-15T10:00:00Z"),
      });
      await Effect.runPromise(gateway.create(report));

      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection("submission-1", { first: 10 }),
      );

      if (result.edges.length > 0) {
        const edge = result.edges[0];
        expect(edge).toBeDefined();
        const cursor = edge.cursor;
        // Verify cursor is base64url encoded
        expect(() => {
          const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
          const data = JSON.parse(decoded);
          expect(data.id).toBe("report-1");
          expect(data.createdAt).toBeDefined();
        }).not.toThrow();
      }
    });
  });

  // ============================================================================
  // Cursor-based Pagination Tests - findBySubmissionIdConnection
  // ============================================================================

  describe("findBySubmissionIdConnection - cursor pagination", () => {
    it("returns first page with hasNextPage=true when more items exist", async () => {
      const submissionId = "submission-123";
      const reports = Array.from({ length: 25 }, (_, i) =>
        createMockReport(`report-${String(i).padStart(3, "0")}`, {
          submissionId,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      for (const report of reports) {
        await Effect.runPromise(gateway.create(report));
      }

      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(submissionId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns hasNextPage=false on last page", async () => {
      const submissionId = "submission-123";
      const reports = Array.from({ length: 15 }, (_, i) =>
        createMockReport(`report-${i}`, {
          submissionId,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      for (const report of reports) {
        await Effect.runPromise(gateway.create(report));
      }

      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(submissionId, { first: 20 }),
      );

      expect(result.edges).toHaveLength(15);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns subsequent page using endCursor", async () => {
      const submissionId = "submission-123";
      const reports = Array.from({ length: 25 }, (_, i) =>
        createMockReport(`report-${String(i).padStart(3, "0")}`, {
          submissionId,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      for (const report of reports) {
        await Effect.runPromise(gateway.create(report));
      }

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(submissionId, { first: 10 }),
      );

      // Decode cursor to get SubmissionReportCursorData
      const lastEdge = firstPage.edges[firstPage.edges.length - 1];
      expect(lastEdge).toBeDefined();
      const cursorStr = Buffer.from(lastEdge.cursor, "base64url").toString(
        "utf-8",
      );
      const cursorData: SubmissionReportCursorData = JSON.parse(cursorStr);

      // Get second page using cursor data
      const secondPage = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(submissionId, {
          first: 10,
          after: cursorData,
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);

      // Verify no overlap
      const firstPageIds = new Set(firstPage.nodes.map((n) => n.id));
      for (const node of secondPage.nodes) {
        expect(firstPageIds.has(node.id)).toBe(false);
      }
    });

    it("returns empty result for submission with no reports", async () => {
      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection("submission-empty", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });
  });

  // ============================================================================
  // Cursor-based Pagination Tests - findByReporterIdConnection
  // ============================================================================

  describe("findByReporterIdConnection - cursor pagination", () => {
    it("returns first page with hasNextPage=true when more items exist", async () => {
      const reporterId = "reporter-123";
      const reports = Array.from({ length: 25 }, (_, i) =>
        createMockReport(`report-${String(i).padStart(3, "0")}`, {
          reporterId,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      for (const report of reports) {
        await Effect.runPromise(gateway.create(report));
      }

      const result = await Effect.runPromise(
        gateway.findByReporterIdConnection(reporterId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("returns empty result for reporter with no reports", async () => {
      const result = await Effect.runPromise(
        gateway.findByReporterIdConnection("reporter-empty", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  // ============================================================================
  // Cursor-based Pagination Tests - findByReasonConnection
  // ============================================================================

  describe("findByReasonConnection - cursor pagination", () => {
    it("returns first page with hasNextPage=true when more items exist", async () => {
      const reports = Array.from({ length: 25 }, (_, i) =>
        createMockReport(`report-${String(i).padStart(3, "0")}`, {
          reason: new ReportReason("HARASSMENT"),
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      for (const report of reports) {
        await Effect.runPromise(gateway.create(report));
      }

      const result = await Effect.runPromise(
        gateway.findByReasonConnection("HARASSMENT", { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("filters by reason correctly", async () => {
      const spamReports = Array.from({ length: 10 }, (_, i) =>
        createMockReport(`spam-${i}`, {
          reason: new ReportReason("SPAM"),
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      const harassmentReports = Array.from({ length: 5 }, (_, i) =>
        createMockReport(`harassment-${i}`, {
          reason: new ReportReason("HARASSMENT"),
          createdAt: new Date(2024, 0, i + 1),
        }),
      );

      for (const report of [...spamReports, ...harassmentReports]) {
        await Effect.runPromise(gateway.create(report));
      }

      const result = await Effect.runPromise(
        gateway.findByReasonConnection("SPAM", { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes.every((n) => n.reason.value === "SPAM")).toBe(true);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe("error handling", () => {
    it("handles invalid cursor gracefully", async () => {
      const reports = Array.from({ length: 5 }, (_, i) =>
        createMockReport(`report-${i}`, {
          submissionId: "submission-1",
        }),
      );
      for (const report of reports) {
        await Effect.runPromise(gateway.create(report));
      }

      // Should handle invalid cursor without crashing
      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection("submission-1", {
          first: 10,
          after: { id: "invalid", createdAt: "invalid-date" },
        }),
      );

      // Should handle gracefully without crashing
      expect(result.edges).toBeDefined();
      expect(result.pageInfo).toBeDefined();
    });

    it("handles empty result", async () => {
      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection("submission-empty", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });
  });

  // ============================================================================
  // Pagination + Filtering Tests
  // ============================================================================

  describe("pagination + filtering combinations", () => {
    it("combines submission filter with cursor pagination", async () => {
      const submissionId = "submission-abc";
      const otherSubmissionId = "submission-xyz";

      // Create reports for submission-abc
      const targetReports = Array.from({ length: 15 }, (_, i) =>
        createMockReport(`target-${i}`, {
          submissionId,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );

      // Create reports for other submission
      const otherReports = Array.from({ length: 8 }, (_, i) =>
        createMockReport(`other-${i}`, {
          submissionId: otherSubmissionId,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );

      for (const report of [...targetReports, ...otherReports]) {
        await Effect.runPromise(gateway.create(report));
      }

      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(submissionId, { first: 10 }),
      );

      expect(result.edges.length).toBe(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.nodes.every((n) => n.submissionId === submissionId)).toBe(
        true,
      );
    });

    it("combines reporter filter with cursor pagination", async () => {
      const reporterId = "reporter-abc";
      const otherReporterId = "reporter-xyz";

      // Create reports by reporter-abc
      const targetReports = Array.from({ length: 12 }, (_, i) =>
        createMockReport(`target-${i}`, {
          reporterId,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );

      // Create reports by other reporter
      const otherReports = Array.from({ length: 8 }, (_, i) =>
        createMockReport(`other-${i}`, {
          reporterId: otherReporterId,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );

      for (const report of [...targetReports, ...otherReports]) {
        await Effect.runPromise(gateway.create(report));
      }

      const result = await Effect.runPromise(
        gateway.findByReporterIdConnection(reporterId, { first: 10 }),
      );

      expect(result.edges.length).toBe(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.nodes.every((n) => n.reporterId === reporterId)).toBe(true);
    });
  });

  // ============================================================================
  // Cursor Stability Tests
  // ============================================================================

  describe("cursor stability", () => {
    it("maintains stable sort with id tiebreaker when timestamps collide", async () => {
      const sameTime = new Date("2024-01-01T12:00:00Z");
      const reports = [
        createMockReport("report-c", {
          submissionId: "submission-1",
          createdAt: sameTime,
        }),
        createMockReport("report-a", {
          submissionId: "submission-1",
          createdAt: sameTime,
        }),
        createMockReport("report-b", {
          submissionId: "submission-1",
          createdAt: sameTime,
        }),
      ];
      for (const report of reports) {
        await Effect.runPromise(gateway.create(report));
      }

      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection("submission-1", { first: 10 }),
      );

      // Should be sorted by id when timestamps are equal
      expect(result.nodes.map((n) => n.id)).toEqual([
        "report-a",
        "report-b",
        "report-c",
      ]);
    });

    it("cursor works correctly with same timestamp items", async () => {
      const sameTime = new Date("2024-01-01T12:00:00Z");
      const reports = [
        createMockReport("report-a", {
          submissionId: "submission-1",
          createdAt: sameTime,
        }),
        createMockReport("report-b", {
          submissionId: "submission-1",
          createdAt: sameTime,
        }),
        createMockReport("report-c", {
          submissionId: "submission-1",
          createdAt: sameTime,
        }),
      ];
      for (const report of reports) {
        await Effect.runPromise(gateway.create(report));
      }

      const firstPage = await Effect.runPromise(
        gateway.findBySubmissionIdConnection("submission-1", { first: 1 }),
      );

      // Decode cursor for second page
      const lastEdge = firstPage.edges[firstPage.edges.length - 1];
      expect(lastEdge).toBeDefined();
      const cursorStr = Buffer.from(lastEdge.cursor, "base64url").toString(
        "utf-8",
      );
      const cursorData: SubmissionReportCursorData = JSON.parse(cursorStr);

      const secondPage = await Effect.runPromise(
        gateway.findBySubmissionIdConnection("submission-1", {
          first: 1,
          after: cursorData,
        }),
      );

      expect(secondPage.nodes[0].id).not.toBe(firstPage.nodes[0].id);
    });
  });
});
