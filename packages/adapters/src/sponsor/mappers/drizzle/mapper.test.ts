import { describe, it, expect } from "bun:test";
import { SponsorDrizzleMapper } from "./mapper";
import { Sponsor } from "@mirai-app/domain";
import type { SponsorSelect } from "@mirai-app/frameworks/drizzle";

describe("[UNIT] SponsorDrizzleMapper", () => {
  const mapper = SponsorDrizzleMapper.instance;

  // Factory for creating mock Drizzle Sponsor records
  const createMockSponsorSelect = (
    overrides: Partial<SponsorSelect> = {},
  ): SponsorSelect => ({
    id: "sponsor-123",
    name: "Test Sponsor",
    description: "A test sponsor description",
    logoPath: "https://example.com/logo.png",
    height: null,
    offsetX: null,
    offsetY: null,
    isActive: true,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to SponsorDTO", () => {
      const record = createMockSponsorSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("sponsor-123");
      expect(dto.name).toBe("Test Sponsor");
      expect(dto.description).toBe("A test sponsor description");
      expect(dto.logoUrl).toBe("https://example.com/logo.png");
      expect(dto.websiteUrl).toBeNull();
      expect(dto.contactEmail).toBeNull();
      expect(dto.contactPhone).toBeNull();
      expect(dto.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("handles null description", () => {
      const record = createMockSponsorSelect({
        description: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.description).toBeNull();
    });

    it("handles null logoPath", () => {
      const record = createMockSponsorSelect({
        logoPath: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.logoUrl).toBeNull();
    });
  });

  describe("toDomain", () => {
    it("converts Drizzle record to domain Sponsor entity", () => {
      const record = createMockSponsorSelect();

      const entity = mapper.toDomain(record);

      expect(entity.id).toBe("sponsor-123");
      expect(entity.name).toBe("Test Sponsor");
      expect(entity.description).toBe("A test sponsor description");
      expect(entity.logoPath).toBe("https://example.com/logo.png");
      expect(entity.isActive).toBe(true);
    });

    it("creates Sponsor with numeric height, offsetX, offsetY", () => {
      const record = createMockSponsorSelect({
        height: 100,
        offsetX: 10,
        offsetY: 20,
      });

      const entity = mapper.toDomain(record);

      expect(entity.height).toBe(100);
      expect(entity.offsetX).toBe(10);
      expect(entity.offsetY).toBe(20);
    });

    it("handles null height, offsetX, offsetY", () => {
      const record = createMockSponsorSelect({
        height: null,
        offsetX: null,
        offsetY: null,
      });

      const entity = mapper.toDomain(record);

      expect(entity.height).toBeNull();
      expect(entity.offsetX).toBeNull();
      expect(entity.offsetY).toBeNull();
    });

    it("throws error for invalid data", () => {
      const record = createMockSponsorSelect({
        name: "", // Invalid: empty name should fail validation
      });

      expect(() => mapper.toDomain(record)).toThrow();
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts SponsorDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockSponsorSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("sponsor-123");
      expect(insert.name).toBe("Test Sponsor");
      expect(insert.description).toBe("A test sponsor description");
      expect(insert.logoPath).toBe("https://example.com/logo.png");
      expect(insert.height).toBeNull();
      expect(insert.offsetX).toBeNull();
      expect(insert.offsetY).toBeNull();
      expect(insert.isActive).toBe(true);
      expect(insert.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("converts null description to empty string", () => {
      const record = createMockSponsorSelect({
        description: null,
      });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.description).toBe("");
    });

    it("converts null logoUrl to empty string", () => {
      const record = createMockSponsorSelect({
        logoPath: null,
      });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.logoPath).toBe("");
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts SponsorDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockSponsorSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id or createdAt
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("createdAt");

      // Should include updatable fields
      expect(update.name).toBe("Test Sponsor");
      expect(update.description).toBe("A test sponsor description");
      expect(update.logoPath).toBe("https://example.com/logo.png");
    });

    it("converts null description to empty string in update", () => {
      const record = createMockSponsorSelect({
        description: null,
      });
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.description).toBe("");
    });

    it("converts null logoUrl to empty string in update", () => {
      const record = createMockSponsorSelect({
        logoPath: null,
      });
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.logoPath).toBe("");
    });

    it("updates updatedAt to current time", () => {
      const dto = mapper.toDTO(createMockSponsorSelect());
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(dto);

      const afterUpdate = new Date();
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(update.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = SponsorDrizzleMapper.instance;
      const instance2 = SponsorDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});
