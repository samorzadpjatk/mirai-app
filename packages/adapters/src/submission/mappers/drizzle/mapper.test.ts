import { describe, it, expect } from "bun:test";
import { SubmissionReportDrizzleMapper } from "./mapper";
import { ReportReason } from "@mirai-app/domain";
import type { SubmissionReportSelect } from "@mirai-app/frameworks/drizzle/schema";

describe("[UNIT] SubmissionReportDrizzleMapper", () => {
  const mapper = SubmissionReportDrizzleMapper.instance;

  // Factory for creating mock Drizzle SubmissionReport records
  const createMockSubmissionReportSelect = (
    overrides: Partial<SubmissionReportSelect> & Record<string, unknown> = {},
  ): SubmissionReportSelect => ({
    id: "report-123",
    submissionId: "submission-456",
    reporterId: "user-789",
    reason: "INAPPROPRIATE_CONTENT",
    details: "This content is inappropriate",
    status: "PENDING",
    reviewedById: null,
    reviewedAt: null,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to SubmissionReportDTO", () => {
      const record = createMockSubmissionReportSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("report-123");
      expect(dto.submissionId).toBe("submission-456");
      expect(dto.reporterId).toBe("user-789");
      expect(dto.reason.value).toBe("INAPPROPRIATE_CONTENT");
      expect(dto.description).toBe("This content is inappropriate");
      expect(dto.status).toBe("PENDING");
      expect(dto.reviewedById).toBeNull();
      expect(dto.reviewedAt).toBeNull();
      expect(dto.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("creates ReportReason value object for reason", () => {
      const record = createMockSubmissionReportSelect({
        reason: "SPAM",
      });

      const dto = mapper.toDTO(record);

      expect(dto.reason.value).toBe("SPAM");
    });

    it("handles null description", () => {
      const record = createMockSubmissionReportSelect({
        details: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.description).toBeNull();
    });

    it("defaults null status to PENDING", () => {
      const record = createMockSubmissionReportSelect({
        status: null as unknown as string,
      });

      const dto = mapper.toDTO(record);

      // Mapper defaults null status to "PENDING"
      expect(dto.status).toBe("PENDING");
    });

    it("handles approved status with reviewer info", () => {
      const record = createMockSubmissionReportSelect({
        status: "APPROVED",
        reviewedById: "admin-001",
        reviewedAt: new Date("2024-01-16T12:00:00Z"),
      });

      const dto = mapper.toDTO(record);

      expect(dto.status).toBe("APPROVED");
      expect(dto.reviewedById).toBe("admin-001");
      expect(dto.reviewedAt).toEqual(new Date("2024-01-16T12:00:00Z"));
    });

    it("uses createdAt as updatedAt fallback when updatedAt is null", () => {
      const record = createMockSubmissionReportSelect({
        updatedAt: null as unknown as Date,
      });

      const dto = mapper.toDTO(record);

      expect(dto.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("handles toDomain with extended fields", () => {
      const record = createMockSubmissionReportSelect({
        participantId: "participant-001" as unknown as undefined,
        userId: "user-789" as unknown as undefined,
        userFirstName: "John" as unknown as undefined,
        userLastName: "Doe" as unknown as undefined,
        userHasAvatar: true as unknown as undefined,
      });

      const dto = mapper.toDomain(record);

      expect(dto.id).toBe("report-123");
      expect(dto.reporterId).toBe("user-789");
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts SubmissionReportDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockSubmissionReportSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("report-123");
      expect(insert.submissionId).toBe("submission-456");
      expect(insert.reporterId).toBe("user-789");
      expect(insert.reason).toBe("INAPPROPRIATE_CONTENT");
      expect(insert.details).toBe("This content is inappropriate");
      expect(insert.status).toBe("PENDING");
      expect(insert.reviewedById).toBeNull();
      expect(insert.reviewedAt).toBeNull();
      expect(insert.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("converts ReportReason value object to string", () => {
      const record = createMockSubmissionReportSelect({
        reason: "SPAM",
      });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.reason).toBe("SPAM");
    });

    it("handles null description in insert", () => {
      const record = createMockSubmissionReportSelect({
        details: null,
      });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.details).toBeNull();
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts SubmissionReportDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockSubmissionReportSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id, submissionId, reporterId, reason, createdAt
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("submissionId");
      expect(update).not.toHaveProperty("reporterId");
      expect(update).not.toHaveProperty("reason");
      expect(update).not.toHaveProperty("createdAt");

      // Should include updatable fields
      expect(update.details).toBe("This content is inappropriate");
      expect(update.status).toBe("PENDING");
      expect(update.reviewedById).toBeNull();
      expect(update.reviewedAt).toBeNull();
    });

    it("updates updatedAt to current time", () => {
      const dto = mapper.toDTO(createMockSubmissionReportSelect());
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(dto);

      const afterUpdate = new Date();
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(update.updatedAt!.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("handles reviewed status in update", () => {
      const record = createMockSubmissionReportSelect({
        status: "APPROVED",
        reviewedById: "admin-001",
        reviewedAt: new Date("2024-01-16T12:00:00Z"),
      });
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.status).toBe("APPROVED");
      expect(update.reviewedById).toBe("admin-001");
      expect(update.reviewedAt).toEqual(new Date("2024-01-16T12:00:00Z"));
    });
  });

  describe("fromPartial", () => {
    it("creates partial entity with all fields present", () => {
      const record = {
        id: "report-123",
        submissionId: "submission-456",
        reporterId: "user-789",
        reason: "SPAM",
        details: "Spam content",
        status: "APPROVED",
        reviewedById: "admin-001",
        reviewedAt: new Date("2024-01-16T12:00:00Z"),
        createdAt: new Date("2024-01-15T10:00:00Z"),
        updatedAt: new Date("2024-01-16T12:00:00Z"),
      };

      const partial = mapper.fromPartial(record);

      expect(partial.id).toBe("report-123");
      expect(partial.submissionId).toBe("submission-456");
      expect(partial.reporterId).toBe("user-789");
      expect(partial.reason?.value).toBe("SPAM");
      expect(partial.description).toBe("Spam content");
      expect(partial.status).toBe("APPROVED");
      expect(partial.reviewedById).toBe("admin-001");
      expect(partial.reviewedAt).toEqual(new Date("2024-01-16T12:00:00Z"));
      expect(partial.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(partial.updatedAt).toEqual(new Date("2024-01-16T12:00:00Z"));
    });

    it("creates partial entity with only some fields present", () => {
      const record = {
        id: "report-123",
        status: "REJECTED",
      };

      const partial = mapper.fromPartial(record);

      expect(partial.id).toBe("report-123");
      expect(partial.status).toBe("REJECTED");
      expect(partial.submissionId).toBeUndefined();
      expect(partial.reason).toBeUndefined();
    });

    it("handles null values correctly", () => {
      const record = {
        details: null,
        reviewedById: null,
        reviewedAt: null,
      };

      const partial = mapper.fromPartial(record);

      expect(partial.description).toBeNull();
      expect(partial.reviewedById).toBeNull();
      expect(partial.reviewedAt).toBeNull();
    });

    it("creates ReportReason from reason string", () => {
      const record = {
        reason: "HARASSMENT",
      };

      const partial = mapper.fromPartial(record);

      expect(partial.reason?.value).toBe("HARASSMENT");
    });

    it("returns empty object when no fields match", () => {
      const record = {};

      const partial = mapper.fromPartial(record);

      expect(partial).toEqual({});
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = SubmissionReportDrizzleMapper.instance;
      const instance2 = SubmissionReportDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});
