import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemorySubmissionReportGateway } from "./gateway";
import type { SubmissionReportDTO } from "@mirai-app/use-cases";
import type { ReportReason, SubmissionId } from "@mirai-app/domain";

// Helper to create mock DTOs
const createMockReportDTO = (
  id: string,
  overrides?: Partial<SubmissionReportDTO>,
): SubmissionReportDTO => ({
  id,
  submissionId: "submission-123",
  reporterId: "reporter-123",
  reason: { value: "INAPPROPRIATE" } as ReportReason,
  description: "Test description",
  status: "PENDING" as unknown as SubmissionReportDTO["status"],
  reviewedById: null,
  reviewedAt: null,
  createdAt: new Date(
    `2024-01-${id.split("-")[1]?.padStart(2, "0") ?? "01"}T10:00:00Z`,
  ),
  updatedAt: new Date(),
  ...overrides,
});

describe("[UNIT] InMemorySubmissionReportGateway - Connection Methods", () => {
  let gateway: InMemorySubmissionReportGateway;
  const submissionId = "submission-123" as unknown as SubmissionId;

  beforeEach(async () => {
    gateway = new InMemorySubmissionReportGateway();
    await Effect.runPromise(gateway.reset());
  });

  describe("findBySubmissionIdConnection", () => {
    it("returns empty result when no reports exist", async () => {
      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(submissionId, { first: 10 }),
      );

      expect(result.edges).toEqual([]);
      expect(result.nodes).toEqual([]);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("returns first page with hasNextPage=true when more items exist", async () => {
      // Seed 25 reports
      const reports = Array.from({ length: 25 }, (_, i) =>
        createMockReportDTO(`report-${i + 1}`, {
          submissionId: "submission-123",
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(reports));

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
      // Seed 15 reports
      const reports = Array.from({ length: 15 }, (_, i) =>
        createMockReportDTO(`report-${i + 1}`, {
          submissionId: "submission-123",
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(reports));

      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(submissionId, { first: 20 }),
      );

      expect(result.edges).toHaveLength(15);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns subsequent page using cursor", async () => {
      // Seed 25 reports
      const reports = Array.from({ length: 25 }, (_, i) =>
        createMockReportDTO(`report-${i + 1}`, {
          submissionId: "submission-123",
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(reports));

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(submissionId, { first: 10 }),
      );

      // Get second page using end cursor
      const secondPage = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(submissionId, {
          first: 10,
          after: firstPage.pageInfo.endCursor
            ? {
                id: "report-10",
                createdAt: new Date(2024, 0, 10).toISOString(),
              }
            : null,
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
      expect(secondPage.nodes[0]?.id).toBe("report-11");
    });
  });

  describe("findByReporterIdConnection", () => {
    it("filters reports by reporter ID", async () => {
      const reports = [
        createMockReportDTO("report-1", { reporterId: "reporter-A" }),
        createMockReportDTO("report-2", { reporterId: "reporter-B" }),
        createMockReportDTO("report-3", { reporterId: "reporter-A" }),
      ];
      await Effect.runPromise(gateway.seed(reports));

      const result = await Effect.runPromise(
        gateway.findByReporterIdConnection("reporter-A", { first: 10 }),
      );

      expect(result.edges).toHaveLength(2);
      expect(result.nodes.map((n: { id: string }) => n.id)).toContain(
        "report-1",
      );
      expect(result.nodes.map((n: { id: string }) => n.id)).toContain(
        "report-3",
      );
    });

    it("returns empty result when no reports match reporter", async () => {
      await Effect.runPromise(
        gateway.seed([
          createMockReportDTO("report-1", { reporterId: "reporter-A" }),
        ]),
      );

      const result = await Effect.runPromise(
        gateway.findByReporterIdConnection("reporter-B", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("paginates reporter reports correctly", async () => {
      const reports = Array.from({ length: 30 }, (_, i) =>
        createMockReportDTO(`report-${i + 1}`, {
          reporterId: "reporter-A",
          createdAt: new Date(2024, 0, (i % 30) + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(reports));

      const result = await Effect.runPromise(
        gateway.findByReporterIdConnection("reporter-A", { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });
  });

  describe("findByReasonConnection", () => {
    it("filters reports by reason", async () => {
      const reports = [
        createMockReportDTO("report-1", {
          reason: { value: "SPAM" } as ReportReason,
        }),
        createMockReportDTO("report-2", {
          reason: { value: "INAPPROPRIATE" } as ReportReason,
        }),
        createMockReportDTO("report-3", {
          reason: { value: "SPAM" } as ReportReason,
        }),
      ];
      await Effect.runPromise(gateway.seed(reports));

      const result = await Effect.runPromise(
        gateway.findByReasonConnection("SPAM", { first: 10 }),
      );

      expect(result.edges).toHaveLength(2);
      expect(result.nodes.map((n: { id: string }) => n.id)).toContain(
        "report-1",
      );
      expect(result.nodes.map((n: { id: string }) => n.id)).toContain(
        "report-3",
      );
    });

    it("handles reason case-insensitively", async () => {
      await Effect.runPromise(
        gateway.seed([
          createMockReportDTO("report-1", {
            reason: { value: "SPAM" } as ReportReason,
          }),
        ]),
      );

      const result = await Effect.runPromise(
        gateway.findByReasonConnection("spam", { first: 10 }),
      );

      expect(result.edges).toHaveLength(1);
    });

    it("paginates reason-filtered reports correctly", async () => {
      const reports = Array.from({ length: 25 }, (_, i) =>
        createMockReportDTO(`report-${i + 1}`, {
          reason: { value: "SPAM" } as ReportReason,
          createdAt: new Date(2024, 0, (i % 25) + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(reports));

      const result = await Effect.runPromise(
        gateway.findByReasonConnection("SPAM", { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });
  });

  describe("cursor encoding", () => {
    it("includes id and createdAt in cursor", async () => {
      await Effect.runPromise(
        gateway.seed([
          createMockReportDTO("report-1", {
            createdAt: new Date("2024-01-15T10:30:00Z"),
          }),
        ]),
      );

      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(submissionId, { first: 10 }),
      );

      expect(result.edges[0]?.cursor).toBeDefined();
      // Cursor should be base64 encoded JSON
      const decoded = Buffer.from(
        result.edges[0]?.cursor ?? "",
        "base64url",
      ).toString();
      const cursorData = JSON.parse(decoded);
      expect(cursorData.id).toBe("report-1");
      expect(cursorData.createdAt).toBe("2024-01-15T10:30:00.000Z");
    });
  });

  describe("pagination limits", () => {
    it("caps first to maximum of 100", async () => {
      const reports = Array.from({ length: 150 }, (_, i) =>
        createMockReportDTO(`report-${i + 1}`, {
          createdAt: new Date(2024, 0, (i % 28) + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(reports));

      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(submissionId, { first: 200 }),
      );

      // Should be capped at 100, plus 1 to check hasNextPage = 101 fetched, 100 returned
      expect(result.edges.length).toBeLessThanOrEqual(100);
    });

    it("uses default of 20 when first not specified", async () => {
      const reports = Array.from({ length: 30 }, (_, i) =>
        createMockReportDTO(`report-${i + 1}`, {
          createdAt: new Date(2024, 0, (i % 28) + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(reports));

      const result = await Effect.runPromise(
        gateway.findBySubmissionIdConnection(submissionId, {}),
      );

      expect(result.edges.length).toBeLessThanOrEqual(20);
    });
  });
});
