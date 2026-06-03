import {
  clamp,
  formatCountdown,
  formatDeadlineDate,
  getNextRecurringDeadline,
  parseClockToMinutes,
  toDate,
} from "../../../trips/challenges/ChallengeTimeLeftCard";

describe("ChallengeTimeLeftCard pure functions", () => {
  describe("toDate", () => {
    it("returns null for undefined", () => {
      expect(toDate(undefined)).toBeNull();
    });

    it("returns null for null", () => {
      expect(toDate(null)).toBeNull();
    });

    it("returns the same Date instance", () => {
      const d = new Date("2024-01-15T12:00:00Z");
      expect(toDate(d)).toBe(d);
    });

    it("parses a string to Date", () => {
      const result = toDate("2024-01-15T12:00:00Z");
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("2024-01-15T12:00:00.000Z");
    });
  });

  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("returns min when below range", () => {
      expect(clamp(-2, 0, 10)).toBe(0);
    });

    it("returns max when above range", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it("handles equal boundaries", () => {
      expect(clamp(5, 5, 5)).toBe(5);
    });
  });

  describe("parseClockToMinutes", () => {
    it("returns null for undefined", () => {
      expect(parseClockToMinutes(undefined)).toBeNull();
    });

    it("returns null for null", () => {
      expect(parseClockToMinutes(null)).toBeNull();
    });

    it("parses valid time string", () => {
      expect(parseClockToMinutes("09:30")).toBe(570);
    });

    it("parses midnight", () => {
      expect(parseClockToMinutes("00:00")).toBe(0);
    });

    it("parses last minute of day", () => {
      expect(parseClockToMinutes("23:59")).toBe(1439);
    });

    it("returns null for invalid hours", () => {
      expect(parseClockToMinutes("25:00")).toBeNull();
    });

    it("returns null for invalid minutes", () => {
      expect(parseClockToMinutes("12:60")).toBeNull();
    });

    it("returns null for negative values", () => {
      expect(parseClockToMinutes("-1:30")).toBeNull();
    });

    it("returns null for malformed string", () => {
      expect(parseClockToMinutes("abc")).toBeNull();
    });
  });

  describe("getNextRecurringDeadline", () => {
    it("returns null for undefined dailyEndTime", () => {
      expect(getNextRecurringDeadline(undefined)).toBeNull();
    });

    it("returns null for null dailyEndTime", () => {
      expect(getNextRecurringDeadline(null)).toBeNull();
    });

    it("returns null for invalid time format", () => {
      expect(getNextRecurringDeadline("25:00")).toBeNull();
    });

    it("returns target time on same day when target is in the future", () => {
      const now = new Date(2024, 0, 15, 10, 0);
      const result = getNextRecurringDeadline("17:00", now);
      expect(result).not.toBeNull();
      expect(result?.getHours()).toBe(17);
      expect(result?.getDate()).toBe(15);
    });

    it("returns target time on next day when target has passed", () => {
      const now = new Date(2024, 0, 15, 18, 0);
      const result = getNextRecurringDeadline("17:00", now);
      expect(result).not.toBeNull();
      expect(result?.getHours()).toBe(17);
      expect(result?.getDate()).toBe(16);
    });

    it("uses current time when nowDate is not provided", () => {
      const result = getNextRecurringDeadline("23:59");
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("formatCountdown", () => {
    it('returns "Ended" for zero or negative ms', () => {
      expect(formatCountdown(0)).toBe("Ended");
      expect(formatCountdown(-1000)).toBe("Ended");
    });

    it("formats days, hours, minutes", () => {
      expect(formatCountdown(90061000)).toBe("1d 1h 1m");
    });

    it("formats hours, minutes, seconds", () => {
      expect(formatCountdown(3661000)).toBe("1h 1m 1s");
    });

    it("formats minutes and seconds", () => {
      expect(formatCountdown(61000)).toBe("1m 1s");
    });

    it("formats seconds only", () => {
      expect(formatCountdown(5000)).toBe("5s");
    });

    it("formats exactly 1 second", () => {
      expect(formatCountdown(1000)).toBe("1s");
    });
  });

  describe("formatDeadlineDate", () => {
    it("formats date with zero-padded values", () => {
      const date = new Date(2024, 0, 15, 9, 5);
      expect(formatDeadlineDate(date)).toBe("15.01.2024 09:05");
    });

    it("formats end of year", () => {
      const date = new Date(2024, 11, 31, 23, 59);
      expect(formatDeadlineDate(date)).toBe("31.12.2024 23:59");
    });
  });
});
