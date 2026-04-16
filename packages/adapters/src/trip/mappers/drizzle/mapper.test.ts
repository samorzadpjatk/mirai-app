import { describe, it, expect } from "bun:test";
import { TripDrizzleMapper } from "./mapper";
import { TripStatus } from "@mirai-app/domain";
import type { TripSelect } from "@mirai-app/frameworks/drizzle";

/**
 * Extended TripSelect with fields used by the mapper via (record as any)
 * These fields may come from database views or extended queries
 */
interface ExtendedTripSelect extends TripSelect {
  destination?: string;
  basePrice?: number | null;
  totalSpots?: number | null;
  availableSpots?: number | null;
  registrationDeadline?: Date | null;
}

describe("[UNIT] TripDrizzleMapper", () => {
  const mapper = TripDrizzleMapper.instance;

  // Factory for creating mock Drizzle Trip records
  const createMockTripSelect = (
    overrides: Partial<ExtendedTripSelect> = {},
  ): ExtendedTripSelect => ({
    id: "trip-123",
    name: "Summer Adventure",
    description: "An exciting summer trip to the mountains",
    startDate: new Date("2024-07-01T00:00:00Z"),
    endDate: new Date("2024-07-07T00:00:00Z"),
    backgroundImagePath: "https://example.com/trip-banner.jpg",
    status: "PLANNING",
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to TripDTO", () => {
      const record = createMockTripSelect();

      const dto = mapper.toDTO(record as TripSelect);

      expect(dto.id).toBe("trip-123");
      expect(dto.name).toBe("Summer Adventure");
      expect(dto.description).toBe("An exciting summer trip to the mountains");
      expect(dto.imageUrl).toBe("https://example.com/trip-banner.jpg");
      expect(dto.destination).toBe("");
      expect(dto.startDate).toEqual(new Date("2024-07-01T00:00:00Z"));
      expect(dto.endDate).toEqual(new Date("2024-07-07T00:00:00Z"));
      expect(dto.status).toBe(TripStatus.PLANNING);
      expect(dto.basePrice).toBeNull();
      expect(dto.totalSpots).toBeNull();
      expect(dto.availableSpots).toBeNull();
      expect(dto.registrationDeadline).toBeNull();
      expect(dto.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("handles null values for optional fields", () => {
      const record = createMockTripSelect({
        description: null,
        backgroundImagePath: null,
      });

      const dto = mapper.toDTO(record as TripSelect);

      expect(dto.description).toBeNull();
      expect(dto.imageUrl).toBeNull();
    });

    it("maps all TripStatus values correctly", () => {
      expect(
        mapper.toDTO(createMockTripSelect({ status: "PLANNING" }) as TripSelect)
          .status,
      ).toBe(TripStatus.PLANNING);
      expect(
        mapper.toDTO(createMockTripSelect({ status: "ACTIVE" }) as TripSelect)
          .status,
      ).toBe(TripStatus.ACTIVE);
      expect(
        mapper.toDTO(
          createMockTripSelect({ status: "COMPLETED" }) as TripSelect,
        ).status,
      ).toBe(TripStatus.COMPLETED);
      expect(
        mapper.toDTO(
          createMockTripSelect({ status: "CANCELLED" }) as TripSelect,
        ).status,
      ).toBe(TripStatus.CANCELLED);
    });

    it("uses defaults for extended fields not in base schema", () => {
      const record = createMockTripSelect();

      const dto = mapper.toDTO(record as TripSelect);

      // These fields use (record as any) with defaults
      expect(dto.destination).toBe("");
      expect(dto.basePrice).toBeNull();
      expect(dto.totalSpots).toBeNull();
      expect(dto.availableSpots).toBeNull();
      expect(dto.registrationDeadline).toBeNull();
    });

    it("reads extended fields when present", () => {
      const record = createMockTripSelect({
        destination: "Swiss Alps",
        basePrice: 1500,
        totalSpots: 20,
        availableSpots: 5,
        registrationDeadline: new Date("2024-06-15T00:00:00Z"),
      });

      const dto = mapper.toDTO(record as TripSelect);

      expect(dto.destination).toBe("Swiss Alps");
      expect(dto.basePrice).toBe(1500);
      expect(dto.totalSpots).toBe(20);
      expect(dto.availableSpots).toBe(5);
      expect(dto.registrationDeadline).toEqual(
        new Date("2024-06-15T00:00:00Z"),
      );
    });

    it("defaults status to PLANNING when not specified", () => {
      const record = createMockTripSelect({ status: undefined });

      const dto = mapper.toDTO(record as TripSelect);

      expect(dto.status).toBe(TripStatus.PLANNING);
    });
  });

  describe("toDomain", () => {
    it("converts Drizzle record to Trip domain entity", async () => {
      const record = createMockTripSelect();

      const trip = mapper.toDomain(record as TripSelect);

      expect(trip.id).toBe("trip-123");
      expect(trip.name).toBe("Summer Adventure");
      expect(trip.description).toBe("An exciting summer trip to the mountains");
      expect(trip.backgroundImagePath).toBe(
        "https://example.com/trip-banner.jpg",
      );
      expect(trip.startDate).toEqual(new Date("2024-07-01T00:00:00Z"));
      expect(trip.endDate).toEqual(new Date("2024-07-07T00:00:00Z"));
      expect(trip.status).toBe(TripStatus.PLANNING);
      expect(trip.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(trip.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("handles null description and backgroundImagePath", async () => {
      const record = createMockTripSelect({
        description: null,
        backgroundImagePath: null,
      });

      const trip = mapper.toDomain(record as TripSelect);

      expect(trip.description).toBeNull();
      expect(trip.backgroundImagePath).toBeNull();
    });

    it("maps all TripStatus values to domain entity", async () => {
      const planning = mapper.toDomain(
        createMockTripSelect({ status: "PLANNING" }) as TripSelect,
      );
      const active = mapper.toDomain(
        createMockTripSelect({ status: "ACTIVE" }) as TripSelect,
      );
      const completed = mapper.toDomain(
        createMockTripSelect({ status: "COMPLETED" }) as TripSelect,
      );
      const cancelled = mapper.toDomain(
        createMockTripSelect({ status: "CANCELLED" }) as TripSelect,
      );

      expect(planning.status).toBe(TripStatus.PLANNING);
      expect(active.status).toBe(TripStatus.ACTIVE);
      expect(completed.status).toBe(TripStatus.COMPLETED);
      expect(cancelled.status).toBe(TripStatus.CANCELLED);
    });

    it("defaults status to PLANNING when not specified", async () => {
      const record = createMockTripSelect({ status: undefined });

      const trip = mapper.toDomain(record as TripSelect);

      expect(trip.status).toBe(TripStatus.PLANNING);
    });

    it("throws error for invalid trip data", () => {
      // Trip.create validates dates - endDate must be after startDate
      const invalidRecord = createMockTripSelect({
        startDate: new Date("2024-07-07T00:00:00Z"),
        endDate: new Date("2024-07-01T00:00:00Z"),
      });

      expect(() => mapper.toDomain(invalidRecord as TripSelect)).toThrow(
        /Failed to map Trip from Drizzle/,
      );
    });

    it("throws error for empty name", () => {
      const invalidRecord = createMockTripSelect({
        name: "",
      });

      expect(() => mapper.toDomain(invalidRecord as TripSelect)).toThrow(
        /Failed to map Trip from Drizzle/,
      );
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts TripDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockTripSelect() as TripSelect);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("trip-123");
      expect(insert.name).toBe("Summer Adventure");
      expect(insert.description).toBe(
        "An exciting summer trip to the mountains",
      );
      expect(insert.backgroundImagePath).toBe(
        "https://example.com/trip-banner.jpg",
      );
      expect(insert.startDate).toEqual(new Date("2024-07-01T00:00:00Z"));
      expect(insert.endDate).toEqual(new Date("2024-07-07T00:00:00Z"));
      expect(insert.status).toBe(TripStatus.PLANNING);
      expect((insert as Record<string, unknown>).destination).toBe("");
      expect((insert as Record<string, unknown>).basePrice).toBeNull();
      expect((insert as Record<string, unknown>).totalSpots).toBeNull();
      expect((insert as Record<string, unknown>).availableSpots).toBeNull();
      expect(
        (insert as Record<string, unknown>).registrationDeadline,
      ).toBeNull();
      expect(insert.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("maps imageUrl to backgroundImagePath", () => {
      const dtoWithImage = mapper.toDTO(
        createMockTripSelect({
          backgroundImagePath: "https://example.com/image.png",
        }) as TripSelect,
      );
      const dtoWithoutImage = mapper.toDTO(
        createMockTripSelect({ backgroundImagePath: null }) as TripSelect,
      );

      expect(mapper.toDrizzleInsert(dtoWithImage).backgroundImagePath).toBe(
        "https://example.com/image.png",
      );
      expect(
        mapper.toDrizzleInsert(dtoWithoutImage).backgroundImagePath,
      ).toBeNull();
    });

    it("includes all numeric fields", () => {
      const dto = mapper.toDTO(
        createMockTripSelect({
          basePrice: 2000,
          totalSpots: 30,
          availableSpots: 10,
        }) as TripSelect,
      );

      const insert = mapper.toDrizzleInsert(dto);

      expect((insert as Record<string, unknown>).basePrice).toBe(2000);
      expect((insert as Record<string, unknown>).totalSpots).toBe(30);
      expect((insert as Record<string, unknown>).availableSpots).toBe(10);
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts TripDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockTripSelect() as TripSelect);

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id or createdAt
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("createdAt");

      // Should include all other fields
      expect(update.name).toBe("Summer Adventure");
      expect(update.description).toBe(
        "An exciting summer trip to the mountains",
      );
      expect(update.backgroundImagePath).toBe(
        "https://example.com/trip-banner.jpg",
      );
      expect(update.startDate).toEqual(new Date("2024-07-01T00:00:00Z"));
      expect(update.endDate).toEqual(new Date("2024-07-07T00:00:00Z"));
      expect(update.status).toBe(TripStatus.PLANNING);
      expect((update as Record<string, unknown>).destination).toBe("");
      expect((update as Record<string, unknown>).basePrice).toBeNull();
      expect((update as Record<string, unknown>).totalSpots).toBeNull();
      expect((update as Record<string, unknown>).availableSpots).toBeNull();
      expect(
        (update as Record<string, unknown>).registrationDeadline,
      ).toBeNull();
    });

    it("sets updatedAt to current time", () => {
      const dto = mapper.toDTO(createMockTripSelect() as TripSelect);
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(dto);

      const afterUpdate = new Date();
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect((update.updatedAt as Date).getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect((update.updatedAt as Date).getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("maps all status values correctly", () => {
      const planningDto = mapper.toDTO(
        createMockTripSelect({ status: "PLANNING" }) as TripSelect,
      );
      const activeDto = mapper.toDTO(
        createMockTripSelect({ status: "ACTIVE" }) as TripSelect,
      );
      const completedDto = mapper.toDTO(
        createMockTripSelect({ status: "COMPLETED" }) as TripSelect,
      );
      const cancelledDto = mapper.toDTO(
        createMockTripSelect({ status: "CANCELLED" }) as TripSelect,
      );

      expect(mapper.toDrizzleUpdate(planningDto).status).toBe(
        TripStatus.PLANNING,
      );
      expect(mapper.toDrizzleUpdate(activeDto).status).toBe(TripStatus.ACTIVE);
      expect(mapper.toDrizzleUpdate(completedDto).status).toBe(
        TripStatus.COMPLETED,
      );
      expect(mapper.toDrizzleUpdate(cancelledDto).status).toBe(
        TripStatus.CANCELLED,
      );
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = TripDrizzleMapper.instance;
      const instance2 = TripDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });

  describe("round-trip conversion", () => {
    it("preserves data through toDTO -> toDrizzleInsert cycle", () => {
      const originalRecord = createMockTripSelect();
      const dto = mapper.toDTO(originalRecord as TripSelect);
      const insert = mapper.toDrizzleInsert(dto);

      // Core fields should be preserved
      expect(insert.id).toBe(originalRecord.id);
      expect(insert.name).toBe(originalRecord.name);
      expect(insert.description).toBe(originalRecord.description);
      expect(insert.backgroundImagePath).toBe(
        originalRecord.backgroundImagePath,
      );
      expect(insert.startDate).toEqual(originalRecord.startDate);
      expect(insert.endDate).toEqual(originalRecord.endDate);
      expect(insert.createdAt).toEqual(originalRecord.createdAt);
      expect(insert.updatedAt).toEqual(originalRecord.updatedAt);
    });

    it("preserves extended fields through round-trip", () => {
      const originalRecord = createMockTripSelect({
        destination: "Paris",
        basePrice: 2500,
        totalSpots: 50,
        availableSpots: 20,
        registrationDeadline: new Date("2024-06-01T00:00:00Z"),
      });

      const dto = mapper.toDTO(originalRecord as TripSelect);
      const insert = mapper.toDrizzleInsert(dto);

      expect((insert as Record<string, unknown>).destination).toBe("Paris");
      expect((insert as Record<string, unknown>).basePrice).toBe(2500);
      expect((insert as Record<string, unknown>).totalSpots).toBe(50);
      expect((insert as Record<string, unknown>).availableSpots).toBe(20);
      expect((insert as Record<string, unknown>).registrationDeadline).toEqual(
        new Date("2024-06-01T00:00:00Z"),
      );
    });
  });
});
