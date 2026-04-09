import { describe, it, expect } from "bun:test";
import { TripInsurance } from "./TripInsurance";

describe("[UNIT] TripInsurance Entity", () => {
  describe("TripInsurance.create", () => {
    it("should create trip insurance with valid data", () => {
      const result = TripInsurance.create({
        tripId: "trip-123",
        label: "Travel Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123456",
        contractNumber: "CTR-789012",
        providerName: "SafeTravel Inc",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.label).toBe("Travel Insurance");
        expect(result.value.phoneNumber).toBe("+1234567890");
        expect(result.value.policyNumber).toBe("POL-123456");
        expect(result.value.providerName).toBe("SafeTravel Inc");
        expect(result.value.hasHospitalInfo()).toBe(false);
      }
    });

    it("should create trip insurance with hospital info", () => {
      const result = TripInsurance.create({
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

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.hospitalName).toBe("St. Mary's Hospital");
        expect(result.value.hasHospitalInfo()).toBe(true);
      }
    });

    it("should reject empty tripId", () => {
      const result = TripInsurance.create({
        tripId: "",
        label: "Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123",
        contractNumber: "CTR-456",
        providerName: "Provider",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("tripId");
      }
    });

    it("should reject empty label", () => {
      const result = TripInsurance.create({
        tripId: "trip-123",
        label: "",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123",
        contractNumber: "CTR-456",
        providerName: "Provider",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("label");
      }
    });

    it("should reject empty phoneNumber", () => {
      const result = TripInsurance.create({
        tripId: "trip-123",
        label: "Insurance",
        phoneNumber: "",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123",
        contractNumber: "CTR-456",
        providerName: "Provider",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("phoneNumber");
      }
    });

    it("should reject empty policyNumber", () => {
      const result = TripInsurance.create({
        tripId: "trip-123",
        label: "Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "",
        contractNumber: "CTR-456",
        providerName: "Provider",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty providerName", () => {
      const result = TripInsurance.create({
        tripId: "trip-123",
        label: "Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123",
        contractNumber: "CTR-456",
        providerName: "",
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("TripInsurance.updateDetails", () => {
    it("should update insurance details", () => {
      const insuranceResult = TripInsurance.create({
        tripId: "trip-123",
        label: "Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123",
        contractNumber: "CTR-456",
        providerName: "Provider",
      });

      expect(insuranceResult.kind).toBe("ok");
      if (insuranceResult.kind !== "ok") return;

      const insurance = insuranceResult.value;
      const updated = insurance.updateDetails({
        label: "Updated Insurance",
        phoneNumber: "+9876543210",
      });

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.label).toBe("Updated Insurance");
        expect(updated.value.phoneNumber).toBe("+9876543210");
        expect(updated.value.id).toBe(insurance.id);
      }
    });

    it("should reject invalid updates", () => {
      const insuranceResult = TripInsurance.create({
        tripId: "trip-123",
        label: "Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123",
        contractNumber: "CTR-456",
        providerName: "Provider",
      });

      expect(insuranceResult.kind).toBe("ok");
      if (insuranceResult.kind !== "ok") return;

      const insurance = insuranceResult.value;
      const updated = insurance.updateDetails({ label: "" });

      expect(updated.kind).toBe("err");
    });
  });

  describe("TripInsurance.updateHospitalInfo", () => {
    it("should update hospital information", () => {
      const insuranceResult = TripInsurance.create({
        tripId: "trip-123",
        label: "Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123",
        contractNumber: "CTR-456",
        providerName: "Provider",
      });

      expect(insuranceResult.kind).toBe("ok");
      if (insuranceResult.kind !== "ok") return;

      const insurance = insuranceResult.value;
      const updated = insurance.updateHospitalInfo({
        hospitalName: "New Hospital",
        hospitalAddress: "456 Oak St",
      });

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.hospitalName).toBe("New Hospital");
        expect(updated.value.hospitalAddress).toBe("456 Oak St");
        expect(updated.value.hasHospitalInfo()).toBe(true);
      }
    });

    it("should clear hospital information", () => {
      const insuranceResult = TripInsurance.create({
        tripId: "trip-123",
        label: "Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123",
        contractNumber: "CTR-456",
        providerName: "Provider",
        hospitalName: "Hospital",
      });

      expect(insuranceResult.kind).toBe("ok");
      if (insuranceResult.kind !== "ok") return;

      const insurance = insuranceResult.value;
      const updated = insurance.updateHospitalInfo({
        hospitalName: null,
        hospitalAddress: null,
      });

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.hospitalName).toBeNull();
        expect(updated.value.hasHospitalInfo()).toBe(false);
      }
    });
  });

  describe("TripInsurance.getEmergencyContact", () => {
    it("should format emergency contact info", () => {
      const result = TripInsurance.create({
        tripId: "trip-123",
        label: "Travel Insurance",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 (234) 567-890",
        policyNumber: "POL-123",
        contractNumber: "CTR-456",
        providerName: "SafeTravel",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getEmergencyContact()).toBe(
          "Travel Insurance: +1 (234) 567-890 (SafeTravel)",
        );
      }
    });
  });
});
