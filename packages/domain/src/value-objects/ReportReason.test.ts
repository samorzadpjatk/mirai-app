import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { ReportReason } from "./ReportReason";
import { ValidationError } from "../errors";

describe("[UNIT] ReportReason", () => {
  describe("[UNIT] ReportReason.create", () => {
    it("creates INAPPROPRIATE reason", async () => {
      const result = await Effect.runPromise(
        ReportReason.create("INAPPROPRIATE"),
      );
      expect(result.value).toBe("INAPPROPRIATE");
    });

    it("creates CHEATING reason", async () => {
      const result = await Effect.runPromise(ReportReason.create("CHEATING"));
      expect(result.value).toBe("CHEATING");
    });

    it("creates SPAM reason", async () => {
      const result = await Effect.runPromise(ReportReason.create("SPAM"));
      expect(result.value).toBe("SPAM");
    });

    it("creates WRONG_SUBMISSION reason", async () => {
      const result = await Effect.runPromise(
        ReportReason.create("WRONG_SUBMISSION"),
      );
      expect(result.value).toBe("WRONG_SUBMISSION");
    });

    it("creates OTHER reason", async () => {
      const result = await Effect.runPromise(ReportReason.create("OTHER"));
      expect(result.value).toBe("OTHER");
    });

    it("normalizes to uppercase", async () => {
      const result = await Effect.runPromise(
        ReportReason.create("inappropriate"),
      );
      expect(result.value).toBe("INAPPROPRIATE");
    });

    it("allows custom reasons with at least 3 characters", async () => {
      const result = await Effect.runPromise(
        ReportReason.create("CUSTOM_REASON"),
      );
      expect(result.value).toBe("CUSTOM_REASON");
    });

    it("fails for empty string", async () => {
      const exit = await Effect.runPromiseExit(ReportReason.create(""));
      expect(exit._tag).toBe("Failure");
    });

    it("fails for whitespace only", async () => {
      const exit = await Effect.runPromiseExit(ReportReason.create("   "));
      expect(exit._tag).toBe("Failure");
    });

    it("fails for custom reason under 3 characters", async () => {
      const exit = await Effect.runPromiseExit(ReportReason.create("AB"));
      expect(exit._tag).toBe("Failure");
    });

    it("returns ValidationError on failure", async () => {
      const result = await Effect.runPromise(
        Effect.either(ReportReason.create("")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe("Report reason is required");
      }
    });

    it("returns correct error for short custom reason", async () => {
      const result = await Effect.runPromise(
        Effect.either(ReportReason.create("AB")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe(
          "Report reason must be at least 3 characters",
        );
      }
    });
  });

  describe("[UNIT] ReportReason.unsafeCreate", () => {
    it("creates reason without validation", () => {
      const result = ReportReason.unsafeCreate("ANYTHING");
      expect(result.value).toBe("ANYTHING");
    });

    it("normalizes to uppercase", () => {
      const result = ReportReason.unsafeCreate("lowercase");
      expect(result.value).toBe("LOWERCASE");
    });
  });

  describe("[UNIT] ReportReason factory methods", () => {
    it("inappropriate() creates INAPPROPRIATE reason", () => {
      const result = ReportReason.inappropriate();
      expect(result.value).toBe("INAPPROPRIATE");
    });

    it("cheating() creates CHEATING reason", () => {
      const result = ReportReason.cheating();
      expect(result.value).toBe("CHEATING");
    });

    it("spam() creates SPAM reason", () => {
      const result = ReportReason.spam();
      expect(result.value).toBe("SPAM");
    });

    it("wrongSubmission() creates WRONG_SUBMISSION reason", () => {
      const result = ReportReason.wrongSubmission();
      expect(result.value).toBe("WRONG_SUBMISSION");
    });

    it("other() creates OTHER reason", () => {
      const result = ReportReason.other();
      expect(result.value).toBe("OTHER");
    });
  });

  describe("[UNIT] ReportReason check methods", () => {
    it("isInappropriate returns true for INAPPROPRIATE", () => {
      const reason = ReportReason.inappropriate();
      expect(reason.isInappropriate()).toBe(true);
    });

    it("isInappropriate returns false for other", () => {
      const reason = ReportReason.cheating();
      expect(reason.isInappropriate()).toBe(false);
    });

    it("isCheating returns true for CHEATING", () => {
      const reason = ReportReason.cheating();
      expect(reason.isCheating()).toBe(true);
    });

    it("isSpam returns true for SPAM", () => {
      const reason = ReportReason.spam();
      expect(reason.isSpam()).toBe(true);
    });

    it("isWrongSubmission returns true for WRONG_SUBMISSION", () => {
      const reason = ReportReason.wrongSubmission();
      expect(reason.isWrongSubmission()).toBe(true);
    });

    it("isOther returns true for OTHER", () => {
      const reason = ReportReason.other();
      expect(reason.isOther()).toBe(true);
    });
  });

  describe("[UNIT] ReportReason.isStandardReason", () => {
    it("returns true for standard reasons", async () => {
      const reason = await Effect.runPromise(
        ReportReason.create("INAPPROPRIATE"),
      );
      expect(reason.isStandardReason()).toBe(true);
    });

    it("returns false for custom reasons", async () => {
      const reason = await Effect.runPromise(
        ReportReason.create("CUSTOM_REASON"),
      );
      expect(reason.isStandardReason()).toBe(false);
    });
  });

  describe("[UNIT] ReportReason.getDisplayText", () => {
    it("returns display text for INAPPROPRIATE", () => {
      const reason = ReportReason.inappropriate();
      expect(reason.getDisplayText()).toBe("Inappropriate Content");
    });

    it("returns display text for CHEATING", () => {
      const reason = ReportReason.cheating();
      expect(reason.getDisplayText()).toBe("Cheating");
    });

    it("returns display text for SPAM", () => {
      const reason = ReportReason.spam();
      expect(reason.getDisplayText()).toBe("Spam");
    });

    it("returns display text for WRONG_SUBMISSION", () => {
      const reason = ReportReason.wrongSubmission();
      expect(reason.getDisplayText()).toBe("Wrong Submission");
    });

    it("returns display text for OTHER", () => {
      const reason = ReportReason.other();
      expect(reason.getDisplayText()).toBe("Other");
    });

    it("returns raw value for custom reasons", async () => {
      const reason = await Effect.runPromise(
        ReportReason.create("CUSTOM_REASON"),
      );
      expect(reason.getDisplayText()).toBe("CUSTOM_REASON");
    });
  });

  describe("[UNIT] ReportReason.equals", () => {
    it("returns true for equal reasons", async () => {
      const reason1 = await Effect.runPromise(ReportReason.create("SPAM"));
      const reason2 = await Effect.runPromise(ReportReason.create("spam"));
      expect(reason1.equals(reason2)).toBe(true);
    });

    it("returns false for different reasons", async () => {
      const reason1 = await Effect.runPromise(ReportReason.create("SPAM"));
      const reason2 = await Effect.runPromise(ReportReason.create("CHEATING"));
      expect(reason1.equals(reason2)).toBe(false);
    });
  });

  describe("[UNIT] ReportReason.toString", () => {
    it("returns the value", async () => {
      const reason = await Effect.runPromise(ReportReason.create("SPAM"));
      expect(reason.toString()).toBe("SPAM");
    });
  });
});
