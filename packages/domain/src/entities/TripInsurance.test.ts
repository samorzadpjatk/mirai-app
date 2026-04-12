import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { TripInsurance } from "./TripInsurance";
import { ValidationError } from "../errors/effect-errors";

describe("[UNIT] TripInsurance Entity", () => {
  describe("TripInsurance.create", () => {
    it("should create trip insurance with valid data", () => {
      const effect = TripInsurance.create({
        tripId: "trip-123",
        label: "Travel Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123456",
        contractNumber: "CTR-789012",
        providerName: "SafeTravel Inc",
      });

      const entity = Effect.runSync(effect);
      expect(entity.id).toBeDefined();
      expect(entity.tripId).toBe("trip-123");
      expect(entity.label).toBe("Travel Insurance");
      expect(entity.phoneNumber).toBe("+1234567890");
      expect(entity.policyNumber).toBe("POL-123456");
      expect(entity.providerName).toBe("SafeTravel Inc");
      expect(entity.hasHospitalInfo()).toBe(false);
    });

    it("should create trip insurance with hospital info", () => {
      const effect = TripInsurance.create({
        tripId: "trip-123",
        label: "Travel Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123456",
        contractNumber: "CTR-789012",
        providerName: "SafeTravel Inc",
        hospitalName: "St. Mary's Hospital",
        hospitalAddress: "123 Main St, City",
        hospitalDistance: "2.5 km",
      });

      const entity = Effect.runSync(effect);
      expect(entity.hospitalName).toBe("St. Mary's Hospital");
      expect(entity.hasHospitalInfo()).toBe(true);
    });

    it("should reject empty tripId", () => {
      const effect = TripInsurance.create({
        tripId: "",
        label: "Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123",
        contractNumber: "CTR-456",
        providerName: "Provider",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("tripId");
      }
    });

    it("should reject empty label", () => {
      const effect = TripInsurance.create({
        tripId: "trip-123",
        label: "",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123",
        contractNumber: "CTR-456",
        providerName: "Provider",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("label");
      }
    });

    it("should reject empty phoneNumber", () => {
      const effect = TripInsurance.create({
        tripId: "trip-123",
        label: "Insurance",
        phoneNumber: "",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123",
        contractNumber: "CTR-456",
        providerName: "Provider",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("phoneNumber");
      }
    });

    it("should reject empty policyNumber", () => {
      const effect = TripInsurance.create({
        tripId: "trip-123",
        label: "Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "",
        contractNumber: "CTR-456",
        providerName: "Provider",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("policyNumber");
      }
    });

    it("should reject empty providerName", () => {
      const effect = TripInsurance.create({
        tripId: "trip-123",
        label: "Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123",
        contractNumber: "CTR-456",
        providerName: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("providerName");
      }
    });
  });

  describe("TripInsurance.updateDetails", () => {
    it("should update insurance details", () => {
      const insurance = Effect.runSync(
        TripInsurance.create({
          tripId: "trip-123",
          label: "Insurance",
          phoneNumber: "+1234567890",
          phoneDisplay: "+1 (234) 567-890",
          policyNumber: "POL-123",
          contractNumber: "CTR-456",
          providerName: "Provider",
        }),
      );

      const updated = Effect.runSync(
        insurance.updateDetails({
          label: "Updated Insurance",
          phoneNumber: "+9876543210",
        }),
      );

      expect(updated.label).toBe("Updated Insurance");
      expect(updated.phoneNumber).toBe("+9876543210");
      expect(updated.id).toBe(insurance.id);
    });

    it("should reject invalid updates", () => {
      const insurance = Effect.runSync(
        TripInsurance.create({
          tripId: "trip-123",
          label: "Insurance",
          phoneNumber: "+1234567890",
          phoneDisplay: "+1 (234) 567-890",
          policyNumber: "POL-123",
          contractNumber: "CTR-456",
          providerName: "Provider",
        }),
      );

      const effect = insurance.updateDetails({ label: "" });
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("label");
      }
    });
  });

  describe("TripInsurance.updateHospitalInfo", () => {
    it("should update hospital information", () => {
      const insurance = Effect.runSync(
        TripInsurance.create({
          tripId: "trip-123",
          label: "Insurance",
          phoneNumber: "+1234567890",
          phoneDisplay: "+1 (234) 567-890",
          policyNumber: "POL-123",
          contractNumber: "CTR-456",
          providerName: "Provider",
        }),
      );

      const updated = Effect.runSync(
        insurance.updateHospitalInfo({
          hospitalName: "New Hospital",
          hospitalAddress: "456 Oak St",
        }),
      );

      expect(updated.hospitalName).toBe("New Hospital");
      expect(updated.hospitalAddress).toBe("456 Oak St");
      expect(updated.hasHospitalInfo()).toBe(true);
    });

    it("should clear hospital information", () => {
      const insurance = Effect.runSync(
        TripInsurance.create({
          tripId: "trip-123",
          label: "Insurance",
          phoneNumber: "+1234567890",
          phoneDisplay: "+1 (234) 567-890",
          policyNumber: "POL-123",
          contractNumber: "CTR-456",
          providerName: "Provider",
          hospitalName: "Hospital",
        }),
      );

      const updated = Effect.runSync(
        insurance.updateHospitalInfo({
          hospitalName: null,
          hospitalAddress: null,
        }),
      );

      expect(updated.hospitalName).toBeNull();
      expect(updated.hasHospitalInfo()).toBe(false);
    });
  });

  describe("TripInsurance.getEmergencyContact", () => {
    it("should format emergency contact info", () => {
      const entity = Effect.runSync(
        TripInsurance.create({
          tripId: "trip-123",
          label: "Travel Insurance",
          phoneNumber: "+1234567890",
          phoneDisplay: "+1 (234) 567-890",
          policyNumber: "POL-123",
          contractNumber: "CTR-456",
          providerName: "SafeTravel",
        }),
      );

      expect(entity.getEmergencyContact()).toBe(
        "Travel Insurance: +1 (234) 567-890 (SafeTravel)",
      );
    });
  });
});
