import { describe, it, expect } from "bun:test";
import { TripResource } from "./TripResource";

describe("[UNIT] TripResource Entity", () => {
  describe("TripResource.create", () => {
    it("should create trip resource with valid data", () => {
      const result = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "Hotel Booking",
        url: "https://hotel.com/booking",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.type).toBe("link");
        expect(result.value.label).toBe("Hotel Booking");
        expect(result.value.url).toBe("https://hotel.com/booking");
        expect(result.value.sortOrder).toBe(0);
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should create trip resource with storage path", () => {
      const result = TripResource.create({
        tripId: "trip-123",
        type: "document",
        label: "Trip Guide PDF",
        storagePath: "/documents/guide.pdf",
        fileName: "guide.pdf",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.storagePath).toBe("/documents/guide.pdf");
        expect(result.value.fileName).toBe("guide.pdf");
        expect(result.value.hasFile()).toBe(true);
      }
    });

    it("should reject empty tripId", () => {
      const result = TripResource.create({
        tripId: "",
        type: "link",
        label: "Hotel",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("tripId");
      }
    });

    it("should reject empty type", () => {
      const result = TripResource.create({
        tripId: "trip-123",
        type: "",
        label: "Hotel",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("type");
      }
    });

    it("should reject empty label", () => {
      const result = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("label");
      }
    });

    it("should reject negative sortOrder", () => {
      const result = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "Hotel",
        sortOrder: -1,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("sortOrder");
      }
    });

    it("should reject label exceeding max length", () => {
      const result = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "a".repeat(101),
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("TripResource.updateDetails", () => {
    it("should update label", () => {
      const resourceResult = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "Hotel",
      });

      expect(resourceResult.kind).toBe("ok");
      if (resourceResult.kind !== "ok") return;

      const resource = resourceResult.value;
      const updated = resource.updateDetails({ label: "Updated Hotel" });

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.label).toBe("Updated Hotel");
        expect(updated.value.id).toBe(resource.id);
      }
    });

    it("should reject empty label update", () => {
      const resourceResult = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "Hotel",
      });

      expect(resourceResult.kind).toBe("ok");
      if (resourceResult.kind !== "ok") return;

      const resource = resourceResult.value;
      const updated = resource.updateDetails({ label: "" });

      expect(updated.kind).toBe("err");
    });
  });

  describe("TripResource.updateSortOrder", () => {
    it("should update sort order", () => {
      const resourceResult = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "Hotel",
        sortOrder: 0,
      });

      expect(resourceResult.kind).toBe("ok");
      if (resourceResult.kind !== "ok") return;

      const resource = resourceResult.value;
      const updated = resource.updateSortOrder(5);

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.sortOrder).toBe(5);
      }
    });

    it("should reject negative sort order", () => {
      const resourceResult = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "Hotel",
      });

      expect(resourceResult.kind).toBe("ok");
      if (resourceResult.kind !== "ok") return;

      const resource = resourceResult.value;
      const updated = resource.updateSortOrder(-1);

      expect(updated.kind).toBe("err");
    });
  });

  describe("TripResource type checking", () => {
    it("should identify link type", () => {
      const result = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "Hotel",
        url: "https://hotel.com",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isLink()).toBe(true);
        expect(result.value.isDocument()).toBe(false);
        expect(result.value.hasUrl()).toBe(true);
      }
    });

    it("should identify document type", () => {
      const result = TripResource.create({
        tripId: "trip-123",
        type: "document",
        label: "Guide",
        storagePath: "/docs/guide.pdf",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isDocument()).toBe(true);
        expect(result.value.isLink()).toBe(false);
        expect(result.value.hasFile()).toBe(true);
      }
    });

    it("should identify contact type", () => {
      const result = TripResource.create({
        tripId: "trip-123",
        type: "contact",
        label: "Emergency Contact",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isContact()).toBe(true);
        expect(result.value.isLink()).toBe(false);
      }
    });

    it("should return access URL", () => {
      const result = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "Hotel",
        url: "https://hotel.com",
        publicUrl: "https://public.hotel.com",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getAccessUrl()).toBe("https://public.hotel.com");
      }
    });
  });
});
