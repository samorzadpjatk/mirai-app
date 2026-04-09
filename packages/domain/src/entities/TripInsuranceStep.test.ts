import { describe, it, expect } from "bun:test";
import { TripInsuranceStep } from "./TripInsuranceStep";

describe("[UNIT] TripInsuranceStep Entity", () => {
  describe("TripInsuranceStep.create", () => {
    it("should create insurance step with valid data", () => {
      const result = TripInsuranceStep.create({
        insuranceId: "insurance-123",
        stepNumber: 1,
        title: "Call Emergency Number",
        text: "Dial the emergency number provided on your insurance card.",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.insuranceId).toBe("insurance-123");
        expect(result.value.stepNumber).toBe(1);
        expect(result.value.title).toBe("Call Emergency Number");
        expect(result.value.hasRequiredInfo()).toBe(false);
        expect(result.value.hasExampleCall()).toBe(false);
      }
    });

    it("should create step with all optional fields", () => {
      const result = TripInsuranceStep.create({
        insuranceId: "insurance-123",
        stepNumber: 2,
        title: "Provide Information",
        text: "Give your policy number and personal details.",
        requiredInfo: ["Policy number", "Full name", "Date of birth"],
        exampleCall: "Hello, my name is John Doe...",
        additionalText: "Be prepared to answer questions.",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.requiredInfo).toHaveLength(3);
        expect(result.value.hasRequiredInfo()).toBe(true);
        expect(result.value.hasExampleCall()).toBe(true);
        expect(result.value.hasAdditionalText()).toBe(true);
      }
    });

    it("should reject step number less than 1", () => {
      const result = TripInsuranceStep.create({
        insuranceId: "insurance-123",
        stepNumber: 0,
        title: "Step",
        text: "Description",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("stepNumber");
      }
    });

    it("should reject empty insuranceId", () => {
      const result = TripInsuranceStep.create({
        insuranceId: "",
        stepNumber: 1,
        title: "Step",
        text: "Description",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty title", () => {
      const result = TripInsuranceStep.create({
        insuranceId: "insurance-123",
        stepNumber: 1,
        title: "",
        text: "Description",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty text", () => {
      const result = TripInsuranceStep.create({
        insuranceId: "insurance-123",
        stepNumber: 1,
        title: "Step",
        text: "",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject too many requiredInfo items", () => {
      const result = TripInsuranceStep.create({
        insuranceId: "insurance-123",
        stepNumber: 1,
        title: "Step",
        text: "Description",
        requiredInfo: Array(21).fill("item"),
      });

      expect(result.kind).toBe("err");
    });

    it("should reject too long requiredInfo item", () => {
      const result = TripInsuranceStep.create({
        insuranceId: "insurance-123",
        stepNumber: 1,
        title: "Step",
        text: "Description",
        requiredInfo: ["a".repeat(101)],
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("TripInsuranceStep.updateContent", () => {
    it("should update step content", () => {
      const stepResult = TripInsuranceStep.create({
        insuranceId: "insurance-123",
        stepNumber: 1,
        title: "Old Title",
        text: "Old text.",
      });

      expect(stepResult.kind).toBe("ok");
      if (stepResult.kind !== "ok") return;

      const step = stepResult.value;
      const updated = step.updateContent({
        title: "New Title",
        text: "New text.",
      });

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.title).toBe("New Title");
        expect(updated.value.text).toBe("New text.");
      }
    });

    it("should update example call", () => {
      const stepResult = TripInsuranceStep.create({
        insuranceId: "insurance-123",
        stepNumber: 1,
        title: "Step",
        text: "Description",
      });

      expect(stepResult.kind).toBe("ok");
      if (stepResult.kind !== "ok") return;

      const step = stepResult.value;
      const updated = step.updateContent({
        exampleCall: "Example conversation...",
      });

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.exampleCall).toBe("Example conversation...");
        expect(updated.value.hasExampleCall()).toBe(true);
      }
    });
  });

  describe("TripInsuranceStep.updateRequiredInfo", () => {
    it("should update required info list", () => {
      const stepResult = TripInsuranceStep.create({
        insuranceId: "insurance-123",
        stepNumber: 1,
        title: "Step",
        text: "Description",
      });

      expect(stepResult.kind).toBe("ok");
      if (stepResult.kind !== "ok") return;

      const step = stepResult.value;
      const updated = step.updateRequiredInfo(["Item 1", "Item 2"]);

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.requiredInfo).toHaveLength(2);
        expect(updated.value.getRequiredInfoCount()).toBe(2);
      }
    });

    it("should reject too many items", () => {
      const stepResult = TripInsuranceStep.create({
        insuranceId: "insurance-123",
        stepNumber: 1,
        title: "Step",
        text: "Description",
      });

      expect(stepResult.kind).toBe("ok");
      if (stepResult.kind !== "ok") return;

      const step = stepResult.value;
      const updated = step.updateRequiredInfo(Array(21).fill("item"));

      expect(updated.kind).toBe("err");
    });
  });
});
