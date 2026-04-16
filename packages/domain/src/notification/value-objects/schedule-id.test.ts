import { describe, it, expect } from "bun:test";
import { ScheduleId } from "./schedule-id";

describe("[UNIT] NotificationScheduleId", () => {
  describe("[UNIT] ScheduleId.create", () => {
    it("should create NotificationScheduleId from valid UUID", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const scheduleId = ScheduleId.create(validUUID);
      expect(ScheduleId.toString(scheduleId)).toBe(validUUID);
    });

    it("should throw for invalid UUID", () => {
      expect(() => ScheduleId.create("not-a-uuid")).toThrow();
    });

    it("should throw for empty string", () => {
      expect(() => ScheduleId.create("")).toThrow();
    });
  });

  describe("[UNIT] ScheduleId.generate", () => {
    it("should generate a valid NotificationScheduleId", () => {
      const scheduleId = ScheduleId.generate();
      expect(typeof scheduleId).toBe("string");
      expect(scheduleId.length).toBe(36); // UUID v4 length
    });

    it("should generate unique IDs", () => {
      const id1 = ScheduleId.generate();
      const id2 = ScheduleId.generate();
      expect(id1).not.toBe(id2);
    });
  });

  describe("[UNIT] ScheduleId.equals", () => {
    it("should return true for same ID", () => {
      const id = ScheduleId.generate();
      expect(ScheduleId.equals(id, id)).toBe(true);
    });

    it("should return false for different IDs", () => {
      const id1 = ScheduleId.generate();
      const id2 = ScheduleId.generate();
      expect(ScheduleId.equals(id1, id2)).toBe(false);
    });
  });

  describe("[UNIT] ScheduleId.toString", () => {
    it("should convert to string", () => {
      const id = ScheduleId.generate();
      expect(ScheduleId.toString(id)).toBe(id);
    });
  });
});
