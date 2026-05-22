import {
  isScheduleSubmitDisabled,
  canSubmitSchedule,
  buildScheduleInput,
} from "../../notifications/CreateScheduleModal";

describe("CreateScheduleModal pure functions", () => {
  describe("isScheduleSubmitDisabled", () => {
    it("returns true when name is empty", () => {
      expect(
        isScheduleSubmitDisabled("", "2024-01-01", "2024-01-02", "custom", null, false),
      ).toBe(true);
    });

    it("returns true when start date is empty", () => {
      expect(
        isScheduleSubmitDisabled("Name", "", "2024-01-02", "custom", null, false),
      ).toBe(true);
    });

    it("returns true when end date is empty", () => {
      expect(
        isScheduleSubmitDisabled("Name", "2024-01-01", "", "custom", null, false),
      ).toBe(true);
    });

    it("returns true when ranking type has no trip", () => {
      expect(
        isScheduleSubmitDisabled("Name", "2024-01-01", "2024-01-02", "ranking", null, false),
      ).toBe(true);
    });

    it("returns true when mutation is pending", () => {
      expect(
        isScheduleSubmitDisabled("Name", "2024-01-01", "2024-01-02", "custom", null, true),
      ).toBe(true);
    });

    it("returns false when all required fields are filled for custom", () => {
      expect(
        isScheduleSubmitDisabled("Name", "2024-01-01", "2024-01-02", "custom", null, false),
      ).toBe(false);
    });

    it("returns false when all required fields are filled for ranking", () => {
      expect(
        isScheduleSubmitDisabled("Name", "2024-01-01", "2024-01-02", "ranking", "trip-1", false),
      ).toBe(false);
    });
  });

  describe("canSubmitSchedule", () => {
    it("returns false when name is empty", () => {
      expect(
        canSubmitSchedule("", "2024-01-01", "2024-01-02", "custom", null),
      ).toBe(false);
    });

    it("returns false when start date is empty", () => {
      expect(
        canSubmitSchedule("Name", "", "2024-01-02", "custom", null),
      ).toBe(false);
    });

    it("returns false when ranking type has no trip", () => {
      expect(
        canSubmitSchedule("Name", "2024-01-01", "2024-01-02", "ranking", null),
      ).toBe(false);
    });

    it("returns true for valid custom schedule", () => {
      expect(
        canSubmitSchedule("Name", "2024-01-01", "2024-01-02", "custom", null),
      ).toBe(true);
    });

    it("returns true for valid ranking schedule", () => {
      expect(
        canSubmitSchedule("Name", "2024-01-01", "2024-01-02", "ranking", "trip-1"),
      ).toBe(true);
    });
  });

  describe("buildScheduleInput", () => {
    it("builds custom schedule input", () => {
      const result = buildScheduleInput(
        "Test Schedule",
        "custom",
        null,
        "Title",
        "Body",
        "2024-01-01",
        "2024-01-02",
        "9",
        "30",
      );

      expect(result.name).toBe("Test Schedule");
      expect(result.notificationType).toBe("custom");
      expect(result.notificationTitle).toBe("Title");
      expect(result.notificationBody).toBe("Body");
      expect(result.startDate).toEqual(new Date("2024-01-01"));
      expect(result.endDate).toEqual(new Date("2024-01-02"));
      expect(result.hour).toBe(9);
      expect(result.minute).toBe(30);
      expect(result.isActive).toBe(true);
      expect(result).not.toHaveProperty("tripId");
    });

    it("builds ranking schedule input with tripId", () => {
      const result = buildScheduleInput(
        "Ranking",
        "ranking",
        "trip-1",
        "Title",
        "Body",
        "2024-01-01",
        "2024-01-02",
        "10",
        "0",
      );

      expect(result.notificationType).toBe("ranking");
      expect(result.notificationTitle).toBeUndefined();
      expect(result.notificationBody).toBeUndefined();
      expect(result.tripId).toBe("trip-1");
    });

    it("trims the name", () => {
      const result = buildScheduleInput(
        "  Trimmed  ",
        "custom",
        null,
        "",
        "",
        "2024-01-01",
        "2024-01-02",
        "0",
        "0",
      );
      expect(result.name).toBe("Trimmed");
    });
  });
});
