import { describe, it, expect } from "bun:test";
import { LocationDrizzleMapper } from "./mapper";
import type { LocationSelect } from "@mirai-app/frameworks/drizzle";

describe("[UNIT] LocationDrizzleMapper", () => {
  const mapper = LocationDrizzleMapper.instance;

  // Factory for creating mock Drizzle Location records
  const createMockLocationSelect = (
    overrides: Partial<LocationSelect> = {},
  ): LocationSelect => ({
    id: "location-123",
    userId: "user-456",
    latitude: 52.2297,
    longitude: 21.0122,
    accuracy: 10.5,
    altitude: 100.0,
    altitudeAccuracy: null,
    heading: 45.0,
    speed: 5.5,
    isSharingLocation: true,
    timestamp: new Date("2024-01-15T10:00:00Z"),
    lastInactivityNotification: null,
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to LocationDTO", () => {
      const record = createMockLocationSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("location-123");
      expect(dto.userId).toBe("user-456");
      expect(dto.latitude).toBe(52.2297);
      expect(dto.longitude).toBe(21.0122);
      expect(dto.accuracy).toBe(10.5);
      expect(dto.altitude).toBe(100.0);
      expect(dto.heading).toBe(45.0);
      expect(dto.speed).toBe(5.5);
      expect(dto.recordedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("uses 0 as default for null latitude", () => {
      const record = createMockLocationSelect({ latitude: null });

      const dto = mapper.toDTO(record);

      expect(dto.latitude).toBe(0);
    });

    it("uses 0 as default for null longitude", () => {
      const record = createMockLocationSelect({ longitude: null });

      const dto = mapper.toDTO(record);

      expect(dto.longitude).toBe(0);
    });

    it("handles null optional fields", () => {
      const record = createMockLocationSelect({
        accuracy: null,
        altitude: null,
        heading: null,
        speed: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.accuracy).toBeNull();
      expect(dto.altitude).toBeNull();
      expect(dto.heading).toBeNull();
      expect(dto.speed).toBeNull();
    });

    it("delegates to toDTO for toDomain method", () => {
      const record = createMockLocationSelect();

      const domainResult = mapper.toDomain(record);
      const dtoResult = mapper.toDTO(record);

      expect(domainResult).toEqual(dtoResult);
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts LocationDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockLocationSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("location-123");
      expect(insert.userId).toBe("user-456");
      expect(insert.latitude).toBe(52.2297);
      expect(insert.longitude).toBe(21.0122);
      expect(insert.accuracy).toBe(10.5);
      expect(insert.altitude).toBe(100.0);
      expect(insert.altitudeAccuracy).toBeNull();
      expect(insert.heading).toBe(45.0);
      expect(insert.speed).toBe(5.5);
      expect(insert.isSharingLocation).toBe(false);
      expect(insert.timestamp).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.lastInactivityNotification).toBeNull();
    });

    it("handles null values in DTO", () => {
      const record = createMockLocationSelect({
        accuracy: null,
        altitude: null,
        heading: null,
        speed: null,
      });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.accuracy).toBeNull();
      expect(insert.altitude).toBeNull();
      expect(insert.heading).toBeNull();
      expect(insert.speed).toBeNull();
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts LocationDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockLocationSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id
      expect(update).not.toHaveProperty("id");

      // Should include all fields
      expect(update.latitude).toBe(52.2297);
      expect(update.longitude).toBe(21.0122);
      expect(update.accuracy).toBe(10.5);
      expect(update.altitude).toBe(100.0);
      expect(update.heading).toBe(45.0);
      expect(update.speed).toBe(5.5);
      expect(update.timestamp).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("handles null values in update", () => {
      const record = createMockLocationSelect({
        accuracy: null,
        altitude: null,
      });
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.accuracy).toBeNull();
      expect(update.altitude).toBeNull();
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = LocationDrizzleMapper.instance;
      const instance2 = LocationDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});
