import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { TripInsurance, type InsuranceStep } from "./trip-insurance";
import { ValidationError } from "../../system/errors";

describe("[UNIT] TripInsurance Entity", () => {
  // ============================================================================
  // Factory Method - create()
  // ============================================================================
  describe("create()", () => {
    it("creates a valid TripInsurance with all properties", async () => {
      const createdAt = new Date("2024-01-01");
      const updatedAt = new Date("2024-01-01");
      const step: InsuranceStep = {
        stepNumber: 1,
        title: "Call Emergency",
        text: "Dial the emergency number",
        requiredInfo: ["Policy Number"],
        exampleCall: "Hello, I need help",
        additionalText: "Stay calm",
      };

      const effect = TripInsurance.create({
        id: "insurance-123",
        tripId: "trip-456",
        label: "Travel Insurance",
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
        hospitalName: "City General Hospital",
        hospitalAddress: "123 Main St, City",
        hospitalDistance: "2.5 km",
        steps: [step],
        createdAt,
        updatedAt,
      });

      const insurance = await Effect.runPromise(effect);

      expect(insurance.id).toBe("insurance-123");
      expect(insurance.tripId).toBe("trip-456");
      expect(insurance.label).toBe("Travel Insurance");
      expect(insurance.phoneNumber).toBe("+1-800-123-4567");
      expect(insurance.phoneDisplay).toBe("1-800-123-4567");
      expect(insurance.policyNumber).toBe("POL123456");
      expect(insurance.contractNumber).toBe("CTR789012");
      expect(insurance.providerName).toBe("Global Travel Insurance");
      expect(insurance.hospitalName).toBe("City General Hospital");
      expect(insurance.hospitalAddress).toBe("123 Main St, City");
      expect(insurance.hospitalDistance).toBe("2.5 km");
      expect(insurance.steps).toHaveLength(1);
      expect(insurance.steps[0]!.title).toBe("Call Emergency");
      expect(insurance.createdAt).toEqual(createdAt);
      expect(insurance.updatedAt).toEqual(updatedAt);
    });

    it("creates a TripInsurance with minimal required properties", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "Travel Insurance",
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
      });

      const insurance = await Effect.runPromise(effect);

      expect(insurance.tripId).toBe("trip-456");
      expect(insurance.label).toBe("Travel Insurance");
      expect(insurance.hospitalName).toBeNull();
      expect(insurance.hospitalAddress).toBeNull();
      expect(insurance.hospitalDistance).toBeNull();
      expect(insurance.steps).toHaveLength(0);
      expect(insurance.id).toBeDefined();
      expect(insurance.id.length).toBeGreaterThan(0);
      expect(insurance.createdAt).toBeInstanceOf(Date);
      expect(insurance.updatedAt).toBeInstanceOf(Date);
    });

    it("generates UUID when id is not provided", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "Travel Insurance",
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
      });

      const insurance = await Effect.runPromise(effect);

      expect(insurance.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("fails when tripId is empty", async () => {
      const effect = TripInsurance.create({
        tripId: "",
        label: "Travel Insurance",
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left._tag).toBe("ValidationError");
        expect(result.left.field).toBe("tripId");
      }
    });

    it("fails when label is empty", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "",
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("label");
      }
    });

    it("fails when label exceeds max length", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "a".repeat(101),
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("label");
      }
    });

    it("fails when phoneNumber is empty", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "Travel Insurance",
        phoneNumber: "",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("phoneNumber");
      }
    });

    it("fails when phoneNumber exceeds max length", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "Travel Insurance",
        phoneNumber: "+" + "1".repeat(50),
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("phoneNumber");
      }
    });

    it("fails when phoneDisplay is empty", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "Travel Insurance",
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("phoneDisplay");
      }
    });

    it("fails when policyNumber is empty", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "Travel Insurance",
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("policyNumber");
      }
    });

    it("fails when contractNumber is empty", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "Travel Insurance",
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "",
        providerName: "Global Travel Insurance",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("contractNumber");
      }
    });

    it("fails when providerName is empty", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "Travel Insurance",
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("providerName");
      }
    });

    it("fails when hospitalName exceeds max length", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "Travel Insurance",
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
        hospitalName: "a".repeat(201),
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("hospitalName");
      }
    });

    it("fails when hospitalAddress exceeds max length", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "Travel Insurance",
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
        hospitalAddress: "a".repeat(501),
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("hospitalAddress");
      }
    });

    it("fails when hospitalDistance exceeds max length", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "Travel Insurance",
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
        hospitalDistance: "a".repeat(101),
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("hospitalDistance");
      }
    });

    it("fails when more than 20 steps are provided", async () => {
      const steps = Array.from({ length: 21 }, (_, i) => ({
        stepNumber: i + 1,
        title: `Step ${i + 1}`,
        text: `Description for step ${i + 1}`,
        requiredInfo: [],
        exampleCall: null,
        additionalText: null,
      }));

      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "Travel Insurance",
        phoneNumber: "+1-800-123-4567",
        phoneDisplay: "1-800-123-4567",
        policyNumber: "POL123456",
        contractNumber: "CTR789012",
        providerName: "Global Travel Insurance",
        steps,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("steps");
        expect(result.left.message).toContain("Maximum 20 steps");
      }
    });

    it("trims whitespace from string fields", async () => {
      const effect = TripInsurance.create({
        tripId: "trip-456",
        label: "  Travel Insurance  ",
        phoneNumber: "  +1-800-123-4567  ",
        phoneDisplay: "  1-800-123-4567  ",
        policyNumber: "  POL123456  ",
        contractNumber: "  CTR789012  ",
        providerName: "  Global Travel Insurance  ",
      });

      const insurance = await Effect.runPromise(effect);

      expect(insurance.label).toBe("Travel Insurance");
      expect(insurance.phoneNumber).toBe("+1-800-123-4567");
      expect(insurance.phoneDisplay).toBe("1-800-123-4567");
      expect(insurance.policyNumber).toBe("POL123456");
      expect(insurance.contractNumber).toBe("CTR789012");
      expect(insurance.providerName).toBe("Global Travel Insurance");
    });
  });

  // ============================================================================
  // Update Details Method
  // ============================================================================
  describe("updateDetails()", () => {
    it("updates label", async () => {
      const insurance = await createTestInsurance({ label: "Old Label" });

      const effect = insurance.updateDetails({ label: "New Label" });
      const updated = await Effect.runPromise(effect);

      expect(updated.label).toBe("New Label");
      expect(updated.policyNumber).toBe(insurance.policyNumber);
    });

    it("updates phoneNumber", async () => {
      const insurance = await createTestInsurance({
        phoneNumber: "+1-800-OLD",
      });

      const effect = insurance.updateDetails({ phoneNumber: "+1-800-NEW" });
      const updated = await Effect.runPromise(effect);

      expect(updated.phoneNumber).toBe("+1-800-NEW");
    });

    it("updates phoneDisplay", async () => {
      const insurance = await createTestInsurance({
        phoneDisplay: "1-800-OLD",
      });

      const effect = insurance.updateDetails({ phoneDisplay: "1-800-NEW" });
      const updated = await Effect.runPromise(effect);

      expect(updated.phoneDisplay).toBe("1-800-NEW");
    });

    it("updates policyNumber", async () => {
      const insurance = await createTestInsurance({ policyNumber: "OLD123" });

      const effect = insurance.updateDetails({ policyNumber: "NEW456" });
      const updated = await Effect.runPromise(effect);

      expect(updated.policyNumber).toBe("NEW456");
    });

    it("updates contractNumber", async () => {
      const insurance = await createTestInsurance({ contractNumber: "OLD789" });

      const effect = insurance.updateDetails({ contractNumber: "NEW012" });
      const updated = await Effect.runPromise(effect);

      expect(updated.contractNumber).toBe("NEW012");
    });

    it("updates providerName", async () => {
      const insurance = await createTestInsurance({
        providerName: "Old Provider",
      });

      const effect = insurance.updateDetails({ providerName: "New Provider" });
      const updated = await Effect.runPromise(effect);

      expect(updated.providerName).toBe("New Provider");
    });

    it("updates multiple fields at once", async () => {
      const insurance = await createTestInsurance({
        label: "Old Label",
        phoneNumber: "+1-800-OLD",
        providerName: "Old Provider",
      });

      const effect = insurance.updateDetails({
        label: "New Label",
        phoneNumber: "+1-800-NEW",
        providerName: "New Provider",
      });
      const updated = await Effect.runPromise(effect);

      expect(updated.label).toBe("New Label");
      expect(updated.phoneNumber).toBe("+1-800-NEW");
      expect(updated.providerName).toBe("New Provider");
    });

    it("maintains immutability - original unchanged", async () => {
      const insurance = await createTestInsurance({ label: "Original" });

      const updated = await Effect.runPromise(
        insurance.updateDetails({ label: "Updated" }),
      );

      expect(insurance.label).toBe("Original");
      expect(updated.label).toBe("Updated");
    });

    it("refreshes updatedAt timestamp", async () => {
      const originalUpdatedAt = new Date("2024-01-01");
      const insurance = await createTestInsurance({
        updatedAt: originalUpdatedAt,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await Effect.runPromise(
        insurance.updateDetails({ label: "Updated" }),
      );

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("preserves id, tripId, and createdAt", async () => {
      const insurance = await createTestInsurance({
        id: "insurance-123",
        tripId: "trip-456",
        createdAt: new Date("2024-01-01"),
      });

      const updated = await Effect.runPromise(
        insurance.updateDetails({ label: "Updated" }),
      );

      expect(updated.id).toBe("insurance-123");
      expect(updated.tripId).toBe("trip-456");
      expect(updated.createdAt).toEqual(new Date("2024-01-01"));
    });

    it("fails when updating with empty label", async () => {
      const insurance = await createTestInsurance({ label: "Valid Label" });

      const effect = insurance.updateDetails({ label: "" });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("label");
      }
    });

    it("fails when updating with label exceeding max length", async () => {
      const insurance = await createTestInsurance({ label: "Valid" });

      const effect = insurance.updateDetails({ label: "a".repeat(101) });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("label");
      }
    });

    it("fails when updating with empty phoneNumber", async () => {
      const insurance = await createTestInsurance({
        phoneNumber: "+1-800-123",
      });

      const effect = insurance.updateDetails({ phoneNumber: "" });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("phoneNumber");
      }
    });

    it("fails when updating with empty policyNumber", async () => {
      const insurance = await createTestInsurance({ policyNumber: "POL123" });

      const effect = insurance.updateDetails({ policyNumber: "" });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("policyNumber");
      }
    });
  });

  // ============================================================================
  // Update Hospital Info Method
  // ============================================================================
  describe("updateHospitalInfo()", () => {
    it("updates hospitalName", async () => {
      const insurance = await createTestInsurance({ hospitalName: null });

      const effect = insurance.updateHospitalInfo({
        hospitalName: "New Hospital",
      });
      const updated = await Effect.runPromise(effect);

      expect(updated.hospitalName).toBe("New Hospital");
    });

    it("updates hospitalAddress", async () => {
      const insurance = await createTestInsurance({ hospitalAddress: null });

      const effect = insurance.updateHospitalInfo({
        hospitalAddress: "456 New St",
      });
      const updated = await Effect.runPromise(effect);

      expect(updated.hospitalAddress).toBe("456 New St");
    });

    it("updates hospitalDistance", async () => {
      const insurance = await createTestInsurance({ hospitalDistance: null });

      const effect = insurance.updateHospitalInfo({
        hospitalDistance: "5.0 km",
      });
      const updated = await Effect.runPromise(effect);

      expect(updated.hospitalDistance).toBe("5.0 km");
    });

    it("updates all hospital fields at once", async () => {
      const insurance = await createTestInsurance({
        hospitalName: null,
        hospitalAddress: null,
        hospitalDistance: null,
      });

      const effect = insurance.updateHospitalInfo({
        hospitalName: "City Hospital",
        hospitalAddress: "789 Main St",
        hospitalDistance: "3.2 km",
      });
      const updated = await Effect.runPromise(effect);

      expect(updated.hospitalName).toBe("City Hospital");
      expect(updated.hospitalAddress).toBe("789 Main St");
      expect(updated.hospitalDistance).toBe("3.2 km");
    });

    it("sets hospitalName to null", async () => {
      const insurance = await createTestInsurance({
        hospitalName: "Old Hospital",
      });

      const effect = insurance.updateHospitalInfo({ hospitalName: null });
      const updated = await Effect.runPromise(effect);

      expect(updated.hospitalName).toBeNull();
    });

    it("sets hospitalAddress to null", async () => {
      const insurance = await createTestInsurance({
        hospitalAddress: "Old Address",
      });

      const effect = insurance.updateHospitalInfo({ hospitalAddress: null });
      const updated = await Effect.runPromise(effect);

      expect(updated.hospitalAddress).toBeNull();
    });

    it("sets hospitalDistance to null", async () => {
      const insurance = await createTestInsurance({
        hospitalDistance: "2.5 km",
      });

      const effect = insurance.updateHospitalInfo({ hospitalDistance: null });
      const updated = await Effect.runPromise(effect);

      expect(updated.hospitalDistance).toBeNull();
    });

    it("maintains immutability - original unchanged", async () => {
      const insurance = await createTestInsurance({
        hospitalName: "Original Hospital",
      });

      const updated = await Effect.runPromise(
        insurance.updateHospitalInfo({ hospitalName: "New Hospital" }),
      );

      expect(insurance.hospitalName).toBe("Original Hospital");
      expect(updated.hospitalName).toBe("New Hospital");
    });

    it("refreshes updatedAt timestamp", async () => {
      const originalUpdatedAt = new Date("2024-01-01");
      const insurance = await createTestInsurance({
        updatedAt: originalUpdatedAt,
        hospitalName: null,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await Effect.runPromise(
        insurance.updateHospitalInfo({ hospitalName: "New Hospital" }),
      );

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("fails when hospitalName exceeds max length", async () => {
      const insurance = await createTestInsurance({ hospitalName: null });

      const effect = insurance.updateHospitalInfo({
        hospitalName: "a".repeat(201),
      });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("hospitalName");
      }
    });

    it("fails when hospitalAddress exceeds max length", async () => {
      const insurance = await createTestInsurance({ hospitalAddress: null });

      const effect = insurance.updateHospitalInfo({
        hospitalAddress: "a".repeat(501),
      });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("hospitalAddress");
      }
    });

    it("fails when hospitalDistance exceeds max length", async () => {
      const insurance = await createTestInsurance({ hospitalDistance: null });

      const effect = insurance.updateHospitalInfo({
        hospitalDistance: "a".repeat(101),
      });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("hospitalDistance");
      }
    });
  });

  // ============================================================================
  // Step Management Methods
  // ============================================================================
  describe("addStep()", () => {
    it("adds a step to empty steps array", async () => {
      const insurance = await createTestInsurance({ steps: [] });

      const effect = insurance.addStep({
        title: "First Step",
        text: "Do something",
        requiredInfo: ["Info1"],
        exampleCall: "Hello",
        additionalText: "Note",
      });
      const updated = await Effect.runPromise(effect);

      expect(updated.steps).toHaveLength(1);
      expect(updated.steps[0]!.stepNumber).toBe(1);
      expect(updated.steps[0]!.title).toBe("First Step");
      expect(updated.steps[0]!.text).toBe("Do something");
      expect(updated.steps[0]!.requiredInfo).toEqual(["Info1"]);
      expect(updated.steps[0]!.exampleCall).toBe("Hello");
      expect(updated.steps[0]!.additionalText).toBe("Note");
    });

    it("adds a step with auto-incremented stepNumber", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "First",
            text: "First text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const effect = insurance.addStep({
        title: "Second Step",
        text: "Do more",
        requiredInfo: [],
        exampleCall: null,
        additionalText: null,
      });
      const updated = await Effect.runPromise(effect);

      expect(updated.steps).toHaveLength(2);
      expect(updated.steps[1]!.stepNumber).toBe(2);
    });

    it("adds a step with minimal fields", async () => {
      const insurance = await createTestInsurance({ steps: [] });

      const effect = insurance.addStep({
        title: "Step Title",
        text: "Step description",
        requiredInfo: [],
        exampleCall: null,
        additionalText: null,
      });
      const updated = await Effect.runPromise(effect);

      expect(updated.steps[0]!.title).toBe("Step Title");
      expect(updated.steps[0]!.text).toBe("Step description");
    });

    it("fails when adding step would exceed maximum of 20", async () => {
      const steps = Array.from({ length: 20 }, (_, i) => ({
        stepNumber: i + 1,
        title: `Step ${i + 1}`,
        text: `Text ${i + 1}`,
        requiredInfo: [],
        exampleCall: null,
        additionalText: null,
      }));
      const insurance = await createTestInsurance({ steps });

      const effect = insurance.addStep({
        title: "Too Many",
        text: "This should fail",
        requiredInfo: [],
        exampleCall: null,
        additionalText: null,
      });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("steps");
        expect(result.left.message).toContain("Maximum 20 steps");
      }
    });

    it("fails when step title is empty", async () => {
      const insurance = await createTestInsurance({ steps: [] });

      const effect = insurance.addStep({
        title: "",
        text: "Valid text",
        requiredInfo: [],
        exampleCall: null,
        additionalText: null,
      });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("title");
      }
    });

    it("fails when step title exceeds max length", async () => {
      const insurance = await createTestInsurance({ steps: [] });

      const effect = insurance.addStep({
        title: "a".repeat(201),
        text: "Valid text",
        requiredInfo: [],
        exampleCall: null,
        additionalText: null,
      });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("title");
      }
    });

    it("fails when step text is empty", async () => {
      const insurance = await createTestInsurance({ steps: [] });

      const effect = insurance.addStep({
        title: "Valid Title",
        text: "",
        requiredInfo: [],
        exampleCall: null,
        additionalText: null,
      });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("text");
      }
    });

    it("fails when step text exceeds max length", async () => {
      const insurance = await createTestInsurance({ steps: [] });

      const effect = insurance.addStep({
        title: "Valid Title",
        text: "a".repeat(2001),
        requiredInfo: [],
        exampleCall: null,
        additionalText: null,
      });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("text");
      }
    });

    it("maintains immutability - original unchanged", async () => {
      const insurance = await createTestInsurance({ steps: [] });

      const updated = await Effect.runPromise(
        insurance.addStep({
          title: "New Step",
          text: "New text",
          requiredInfo: [],
          exampleCall: null,
          additionalText: null,
        }),
      );

      expect(insurance.steps).toHaveLength(0);
      expect(updated.steps).toHaveLength(1);
    });

    it("trims whitespace from step title and text", async () => {
      const insurance = await createTestInsurance({ steps: [] });

      const effect = insurance.addStep({
        title: "  Step Title  ",
        text: "  Step Description  ",
        requiredInfo: [],
        exampleCall: null,
        additionalText: null,
      });
      const updated = await Effect.runPromise(effect);

      expect(updated.steps[0]!.title).toBe("Step Title");
      expect(updated.steps[0]!.text).toBe("Step Description");
    });
  });

  describe("removeStep()", () => {
    it("removes a step by stepNumber", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "First",
            text: "First text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
          {
            stepNumber: 2,
            title: "Second",
            text: "Second text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
          {
            stepNumber: 3,
            title: "Third",
            text: "Third text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const updated = insurance.removeStep(2);

      expect(updated.steps).toHaveLength(2);
      expect(updated.steps[0]!.stepNumber).toBe(1);
      expect(updated.steps[0]!.title).toBe("First");
      expect(updated.steps[1]!.stepNumber).toBe(2);
      expect(updated.steps[1]!.title).toBe("Third");
    });

    it("removes the only step", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Only",
            text: "Only text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const updated = insurance.removeStep(1);

      expect(updated.steps).toHaveLength(0);
    });

    it("returns unchanged when stepNumber not found", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "First",
            text: "First text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const updated = insurance.removeStep(99);

      expect(updated.steps).toHaveLength(1);
      expect(updated.steps[0]!.stepNumber).toBe(1);
    });

    it("maintains immutability - original unchanged", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "First",
            text: "First text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const updated = insurance.removeStep(1);

      expect(insurance.steps).toHaveLength(1);
      expect(updated.steps).toHaveLength(0);
    });

    it("renumbers remaining steps after removal", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Step 1",
            text: "Text 1",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
          {
            stepNumber: 2,
            title: "Step 2",
            text: "Text 2",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
          {
            stepNumber: 3,
            title: "Step 3",
            text: "Text 3",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
          {
            stepNumber: 4,
            title: "Step 4",
            text: "Text 4",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const updated = insurance.removeStep(2);

      expect(updated.steps).toHaveLength(3);
      expect(updated.steps[0]!.stepNumber).toBe(1);
      expect(updated.steps[1]!.stepNumber).toBe(2);
      expect(updated.steps[2]!.stepNumber).toBe(3);
      expect(updated.steps[1]!.title).toBe("Step 3");
      expect(updated.steps[2]!.title).toBe("Step 4");
    });
  });

  describe("updateStep()", () => {
    it("updates step title", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Old Title",
            text: "Text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const effect = insurance.updateStep(1, { title: "New Title" });
      const updated = await Effect.runPromise(effect);

      expect(updated.steps[0]!.title).toBe("New Title");
      expect(updated.steps[0]!.text).toBe("Text");
    });

    it("updates step text", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Title",
            text: "Old text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const effect = insurance.updateStep(1, { text: "New text" });
      const updated = await Effect.runPromise(effect);

      expect(updated.steps[0]!.text).toBe("New text");
    });

    it("updates requiredInfo", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Title",
            text: "Text",
            requiredInfo: ["Old Info"],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const effect = insurance.updateStep(1, { requiredInfo: ["New Info"] });
      const updated = await Effect.runPromise(effect);

      expect(updated.steps[0]!.requiredInfo).toEqual(["New Info"]);
    });

    it("updates exampleCall", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Title",
            text: "Text",
            requiredInfo: [],
            exampleCall: "Old call",
            additionalText: null,
          },
        ],
      });

      const effect = insurance.updateStep(1, { exampleCall: "New call" });
      const updated = await Effect.runPromise(effect);

      expect(updated.steps[0]!.exampleCall).toBe("New call");
    });

    it("updates additionalText", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Title",
            text: "Text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: "Old text",
          },
        ],
      });

      const effect = insurance.updateStep(1, { additionalText: "New text" });
      const updated = await Effect.runPromise(effect);

      expect(updated.steps[0]!.additionalText).toBe("New text");
    });

    it("updates multiple fields at once", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Old Title",
            text: "Old text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const effect = insurance.updateStep(1, {
        title: "New Title",
        text: "New text",
        requiredInfo: ["Info"],
      });
      const updated = await Effect.runPromise(effect);

      expect(updated.steps[0]!.title).toBe("New Title");
      expect(updated.steps[0]!.text).toBe("New text");
      expect(updated.steps[0]!.requiredInfo).toEqual(["Info"]);
    });

    it("fails when stepNumber not found", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Title",
            text: "Text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const effect = insurance.updateStep(99, { title: "New Title" });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("stepNumber");
        expect(result.left.message).toContain("Step 99 not found");
      }
    });

    it("fails when updating with empty title", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Valid Title",
            text: "Text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const effect = insurance.updateStep(1, { title: "" });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("title");
      }
    });

    it("fails when updating with empty text", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Title",
            text: "Valid text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const effect = insurance.updateStep(1, { text: "" });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("text");
      }
    });

    it("maintains immutability - original unchanged", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Original Title",
            text: "Original text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const updated = await Effect.runPromise(
        insurance.updateStep(1, { title: "New Title" }),
      );

      expect(insurance.steps[0]!.title).toBe("Original Title");
      expect(updated.steps[0]!.title).toBe("New Title");
    });

    it("trims whitespace from updated title and text", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Title",
            text: "Text",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });

      const effect = insurance.updateStep(1, {
        title: "  New Title  ",
        text: "  New Text  ",
      });
      const updated = await Effect.runPromise(effect);

      expect(updated.steps[0]!.title).toBe("New Title");
      expect(updated.steps[0]!.text).toBe("New Text");
    });
  });

  // ============================================================================
  // Query Methods
  // ============================================================================
  describe("getStepCount()", () => {
    it("returns 0 for empty steps", async () => {
      const insurance = await createTestInsurance({ steps: [] });
      expect(insurance.getStepCount()).toBe(0);
    });

    it("returns correct count for multiple steps", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Step 1",
            text: "Text 1",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
          {
            stepNumber: 2,
            title: "Step 2",
            text: "Text 2",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
          {
            stepNumber: 3,
            title: "Step 3",
            text: "Text 3",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });
      expect(insurance.getStepCount()).toBe(3);
    });
  });

  describe("hasSteps()", () => {
    it("returns false for empty steps", async () => {
      const insurance = await createTestInsurance({ steps: [] });
      expect(insurance.hasSteps()).toBe(false);
    });

    it("returns true when has steps", async () => {
      const insurance = await createTestInsurance({
        steps: [
          {
            stepNumber: 1,
            title: "Step 1",
            text: "Text 1",
            requiredInfo: [],
            exampleCall: null,
            additionalText: null,
          },
        ],
      });
      expect(insurance.hasSteps()).toBe(true);
    });
  });

  describe("hasHospitalInfo()", () => {
    it("returns false when all hospital fields are null", async () => {
      const insurance = await createTestInsurance({
        hospitalName: null,
        hospitalAddress: null,
        hospitalDistance: null,
      });
      expect(insurance.hasHospitalInfo()).toBe(false);
    });

    it("returns true when hospitalName is set", async () => {
      const insurance = await createTestInsurance({
        hospitalName: "Hospital",
        hospitalAddress: null,
        hospitalDistance: null,
      });
      expect(insurance.hasHospitalInfo()).toBe(true);
    });

    it("returns true when hospitalAddress is set", async () => {
      const insurance = await createTestInsurance({
        hospitalName: null,
        hospitalAddress: "123 Main St",
        hospitalDistance: null,
      });
      expect(insurance.hasHospitalInfo()).toBe(true);
    });

    it("returns true when hospitalDistance is set", async () => {
      const insurance = await createTestInsurance({
        hospitalName: null,
        hospitalAddress: null,
        hospitalDistance: "2.5 km",
      });
      expect(insurance.hasHospitalInfo()).toBe(true);
    });

    it("returns true when all hospital fields are set", async () => {
      const insurance = await createTestInsurance({
        hospitalName: "Hospital",
        hospitalAddress: "123 Main St",
        hospitalDistance: "2.5 km",
      });
      expect(insurance.hasHospitalInfo()).toBe(true);
    });
  });

  describe("getEmergencyContact()", () => {
    it("returns formatted emergency contact string", async () => {
      const insurance = await createTestInsurance({
        label: "Travel Insurance",
        phoneDisplay: "1-800-HELP",
        providerName: "Global Insurance",
      });

      expect(insurance.getEmergencyContact()).toBe(
        "Travel Insurance: 1-800-HELP (Global Insurance)",
      );
    });

    it("formats correctly with different values", async () => {
      const insurance = await createTestInsurance({
        label: "Emergency Assistance",
        phoneDisplay: "+44-20-1234-5678",
        providerName: "UK Travel Cover",
      });

      expect(insurance.getEmergencyContact()).toBe(
        "Emergency Assistance: +44-20-1234-5678 (UK Travel Cover)",
      );
    });
  });
});

// ============================================================================
// Test Helpers
// ============================================================================
async function createTestInsurance(
  overrides: {
    id?: string;
    tripId?: string;
    label?: string;
    phoneNumber?: string;
    phoneDisplay?: string;
    policyNumber?: string;
    contractNumber?: string;
    providerName?: string;
    hospitalName?: string | null;
    hospitalAddress?: string | null;
    hospitalDistance?: string | null;
    steps?: InsuranceStep[];
    createdAt?: Date;
    updatedAt?: Date;
  } = {},
): Promise<TripInsurance> {
  const effect = TripInsurance.create({
    id: overrides.id ?? "insurance-test-id",
    tripId: overrides.tripId ?? "trip-test-id",
    label: overrides.label ?? "Test Insurance",
    phoneNumber: overrides.phoneNumber ?? "+1-800-TEST",
    phoneDisplay: overrides.phoneDisplay ?? "1-800-TEST",
    policyNumber: overrides.policyNumber ?? "POLICY123",
    contractNumber: overrides.contractNumber ?? "CONTRACT456",
    providerName: overrides.providerName ?? "Test Provider",
    hospitalName: overrides.hospitalName ?? null,
    hospitalAddress: overrides.hospitalAddress ?? null,
    hospitalDistance: overrides.hospitalDistance ?? null,
    steps: overrides.steps ?? [],
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
  });

  return await Effect.runPromise(effect);
}
