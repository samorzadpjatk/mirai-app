import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { TripResource } from "./trip-resource";
import { ValidationError } from "../../system/errors";

describe("[UNIT] TripResource Entity", () => {
  // ============================================================================
  // Factory Method - create()
  // ============================================================================
  describe("create()", () => {
    it("creates a valid resource with all properties", async () => {
      const createdAt = new Date("2024-01-01");
      const updatedAt = new Date("2024-01-02");

      const effect = TripResource.create({
        id: "resource-123",
        tripId: "trip-456",
        type: "document",
        label: "Hotel Reservation",
        description: "Booking confirmation for the hotel",
        url: "https://example.com/hotel",
        storagePath: "/trips/trip-456/docs/hotel.pdf",
        fileName: "hotel.pdf",
        publicUrl: "https://cdn.example.com/hotel.pdf",
        iconName: "file-pdf",
        value: "booking-ref-123",
        sortOrder: 1,
        createdAt,
        updatedAt,
      });

      const resource = await Effect.runPromise(effect);

      expect(resource.id).toBe("resource-123");
      expect(resource.tripId).toBe("trip-456");
      expect(resource.type).toBe("document");
      expect(resource.label).toBe("Hotel Reservation");
      expect(resource.description).toBe("Booking confirmation for the hotel");
      expect(resource.url).toBe("https://example.com/hotel");
      expect(resource.storagePath).toBe("/trips/trip-456/docs/hotel.pdf");
      expect(resource.fileName).toBe("hotel.pdf");
      expect(resource.publicUrl).toBe("https://cdn.example.com/hotel.pdf");
      expect(resource.iconName).toBe("file-pdf");
      expect(resource.value).toBe("booking-ref-123");
      expect(resource.sortOrder).toBe(1);
      expect(resource.createdAt).toEqual(createdAt);
      expect(resource.updatedAt).toEqual(updatedAt);
    });

    it("creates a resource with minimal required properties", async () => {
      const effect = TripResource.create({
        tripId: "trip-456",
        type: "link",
        label: "Hotel Website",
      });

      const resource = await Effect.runPromise(effect);

      expect(resource.tripId).toBe("trip-456");
      expect(resource.type).toBe("link");
      expect(resource.label).toBe("Hotel Website");
      expect(resource.description).toBeNull();
      expect(resource.url).toBeNull();
      expect(resource.storagePath).toBeNull();
      expect(resource.fileName).toBeNull();
      expect(resource.publicUrl).toBeNull();
      expect(resource.iconName).toBeNull();
      expect(resource.value).toBeNull();
      expect(resource.sortOrder).toBe(0);
      expect(resource.id).toBeDefined();
      expect(resource.createdAt).toBeInstanceOf(Date);
      expect(resource.updatedAt).toBeInstanceOf(Date);
    });

    it("generates UUID when id is not provided", async () => {
      const effect = TripResource.create({
        tripId: "trip-456",
        type: "link",
        label: "Hotel Website",
      });

      const resource = await Effect.runPromise(effect);

      expect(resource.id).toBeDefined();
      expect(resource.id.length).toBeGreaterThan(0);
      expect(resource.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("trims whitespace from tripId, type, and label", async () => {
      const effect = TripResource.create({
        tripId: "  trip-456  ",
        type: "  document  ",
        label: "  Hotel Reservation  ",
      });

      const resource = await Effect.runPromise(effect);

      expect(resource.tripId).toBe("trip-456");
      expect(resource.type).toBe("document");
      expect(resource.label).toBe("Hotel Reservation");
    });

    it("fails when tripId is empty", async () => {
      const effect = TripResource.create({
        tripId: "",
        type: "link",
        label: "Hotel Website",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left._tag).toBe("ValidationError");
        expect(result.left.message).toBe("tripId is required");
        expect(result.left.field).toBe("general");
      }
    });

    it("fails when tripId is whitespace only", async () => {
      const effect = TripResource.create({
        tripId: "   ",
        type: "link",
        label: "Hotel Website",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe("tripId is required");
      }
    });

    it("fails when type is empty", async () => {
      const effect = TripResource.create({
        tripId: "trip-456",
        type: "",
        label: "Hotel Website",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe("type is required");
        expect(result.left.field).toBe("general");
      }
    });

    it("fails when type exceeds max length", async () => {
      const longType = "a".repeat(51);

      const effect = TripResource.create({
        tripId: "trip-456",
        type: longType,
        label: "Hotel Website",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("type");
        expect(result.left.message).toContain("50");
      }
    });

    it("fails when label is empty", async () => {
      const effect = TripResource.create({
        tripId: "trip-456",
        type: "link",
        label: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe("label is required");
        expect(result.left.field).toBe("general");
      }
    });

    it("fails when label exceeds max length", async () => {
      const longLabel = "a".repeat(101);

      const effect = TripResource.create({
        tripId: "trip-456",
        type: "link",
        label: longLabel,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("label");
        expect(result.left.message).toContain("100");
      }
    });

    it("fails when sortOrder is negative", async () => {
      const effect = TripResource.create({
        tripId: "trip-456",
        type: "link",
        label: "Hotel Website",
        sortOrder: -1,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe("sortOrder must be non-negative");
        expect(result.left.field).toBe("general");
      }
    });

    it("allows sortOrder of zero", async () => {
      const effect = TripResource.create({
        tripId: "trip-456",
        type: "link",
        label: "Hotel Website",
        sortOrder: 0,
      });

      const resource = await Effect.runPromise(effect);
      expect(resource.sortOrder).toBe(0);
    });
  });

  // ============================================================================
  // Update Details Method
  // ============================================================================
  describe("updateDetails()", () => {
    it("updates label", async () => {
      const resource = await createTestResource({ label: "Old Label" });

      const effect = resource.updateDetails({ label: "New Label" });
      const updated = await Effect.runPromise(effect);

      expect(updated.label).toBe("New Label");
    });

    it("updates description", async () => {
      const resource = await createTestResource({ description: "Old desc" });

      const effect = resource.updateDetails({ description: "New desc" });
      const updated = await Effect.runPromise(effect);

      expect(updated.description).toBe("New desc");
    });

    it("sets description to null", async () => {
      const resource = await createTestResource({ description: "Some desc" });

      const effect = resource.updateDetails({ description: null });
      const updated = await Effect.runPromise(effect);

      expect(updated.description).toBeNull();
    });

    it("updates both label and description", async () => {
      const resource = await createTestResource({
        label: "Old Label",
        description: "Old desc",
      });

      const effect = resource.updateDetails({
        label: "New Label",
        description: "New desc",
      });
      const updated = await Effect.runPromise(effect);

      expect(updated.label).toBe("New Label");
      expect(updated.description).toBe("New desc");
    });

    it("fails when label is empty", async () => {
      const resource = await createTestResource({ label: "Valid Label" });

      const effect = resource.updateDetails({ label: "" });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe("label is required");
        expect(result.left.field).toBe("general");
      }
    });

    it("fails when label exceeds max length", async () => {
      const resource = await createTestResource({ label: "Valid Label" });
      const longLabel = "a".repeat(101);

      const effect = resource.updateDetails({ label: longLabel });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("label");
        expect(result.left.message).toContain("100");
      }
    });

    it("maintains immutability - original unchanged", async () => {
      const resource = await createTestResource({
        label: "Original Label",
        description: "Original desc",
      });

      const updated = await Effect.runPromise(
        resource.updateDetails({ label: "Updated Label" }),
      );

      expect(resource.label).toBe("Original Label");
      expect(updated.label).toBe("Updated Label");
      expect(resource.description).toBe(updated.description);
    });

    it("preserves all other fields", async () => {
      const resource = await createTestResource({
        type: "document",
        url: "https://example.com",
        storagePath: "/path/to/file",
        sortOrder: 5,
      });

      const updated = await Effect.runPromise(
        resource.updateDetails({ label: "Updated" }),
      );

      expect(updated.id).toBe(resource.id);
      expect(updated.tripId).toBe(resource.tripId);
      expect(updated.type).toBe("document");
      expect(updated.url).toBe("https://example.com");
      expect(updated.storagePath).toBe("/path/to/file");
      expect(updated.sortOrder).toBe(5);
      expect(updated.createdAt).toEqual(resource.createdAt);
    });

    it("refreshes updatedAt timestamp", async () => {
      const originalUpdatedAt = new Date("2024-01-01");
      const resource = await createTestResource({
        updatedAt: originalUpdatedAt,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await Effect.runPromise(
        resource.updateDetails({ label: "Updated" }),
      );

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });

  // ============================================================================
  // Update Content Method
  // ============================================================================
  describe("updateContent()", () => {
    it("updates url", async () => {
      const resource = await createTestResource({ url: "https://old.com" });

      const updated = resource.updateContent({ url: "https://new.com" });

      expect(updated.url).toBe("https://new.com");
    });

    it("updates storagePath", async () => {
      const resource = await createTestResource({
        storagePath: "/old/path",
      });

      const updated = resource.updateContent({ storagePath: "/new/path" });

      expect(updated.storagePath).toBe("/new/path");
    });

    it("updates publicUrl", async () => {
      const resource = await createTestResource({
        publicUrl: "https://old-cdn.com",
      });

      const updated = resource.updateContent({
        publicUrl: "https://new-cdn.com",
      });

      expect(updated.publicUrl).toBe("https://new-cdn.com");
    });

    it("updates fileName", async () => {
      const resource = await createTestResource({ fileName: "old.pdf" });

      const updated = resource.updateContent({ fileName: "new.pdf" });

      expect(updated.fileName).toBe("new.pdf");
    });

    it("updates multiple content fields", async () => {
      const resource = await createTestResource({
        url: "https://old.com",
        storagePath: "/old/path",
      });

      const updated = resource.updateContent({
        url: "https://new.com",
        storagePath: "/new/path",
        publicUrl: "https://cdn.com",
        fileName: "doc.pdf",
      });

      expect(updated.url).toBe("https://new.com");
      expect(updated.storagePath).toBe("/new/path");
      expect(updated.publicUrl).toBe("https://cdn.com");
      expect(updated.fileName).toBe("doc.pdf");
    });

    it("sets url to null", async () => {
      const resource = await createTestResource({ url: "https://example.com" });

      const updated = resource.updateContent({ url: null });

      expect(updated.url).toBeNull();
    });

    it("sets storagePath to null", async () => {
      const resource = await createTestResource({ storagePath: "/path" });

      const updated = resource.updateContent({ storagePath: null });

      expect(updated.storagePath).toBeNull();
    });

    it("maintains immutability - original unchanged", async () => {
      const resource = await createTestResource({
        url: "https://original.com",
        storagePath: "/original/path",
      });

      const updated = resource.updateContent({ url: "https://updated.com" });

      expect(resource.url).toBe("https://original.com");
      expect(updated.url).toBe("https://updated.com");
      expect(resource.storagePath).toBe(updated.storagePath);
    });

    it("refreshes updatedAt timestamp", async () => {
      const originalUpdatedAt = new Date("2024-01-01");
      const resource = await createTestResource({
        updatedAt: originalUpdatedAt,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = resource.updateContent({ url: "https://new.com" });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("preserves all non-content fields", async () => {
      const resource = await createTestResource({
        type: "document",
        label: "My Document",
        description: "A document",
        sortOrder: 3,
      });

      const updated = resource.updateContent({ url: "https://new.com" });

      expect(updated.id).toBe(resource.id);
      expect(updated.tripId).toBe(resource.tripId);
      expect(updated.type).toBe("document");
      expect(updated.label).toBe("My Document");
      expect(updated.description).toBe("A document");
      expect(updated.sortOrder).toBe(3);
      expect(updated.createdAt).toEqual(resource.createdAt);
    });
  });

  // ============================================================================
  // Update Sort Order Method
  // ============================================================================
  describe("updateSortOrder()", () => {
    it("updates sort order to new value", async () => {
      const resource = await createTestResource({ sortOrder: 0 });

      const effect = resource.updateSortOrder(5);
      const updated = await Effect.runPromise(effect);

      expect(updated.sortOrder).toBe(5);
    });

    it("allows setting sortOrder to zero", async () => {
      const resource = await createTestResource({ sortOrder: 5 });

      const effect = resource.updateSortOrder(0);
      const updated = await Effect.runPromise(effect);

      expect(updated.sortOrder).toBe(0);
    });

    it("fails when sortOrder is negative", async () => {
      const resource = await createTestResource({ sortOrder: 0 });

      const effect = resource.updateSortOrder(-1);
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe("sortOrder must be non-negative");
        expect(result.left.field).toBe("general");
      }
    });

    it("maintains immutability - original unchanged", async () => {
      const resource = await createTestResource({ sortOrder: 1 });

      const updated = await Effect.runPromise(resource.updateSortOrder(2));

      expect(resource.sortOrder).toBe(1);
      expect(updated.sortOrder).toBe(2);
    });

    it("refreshes updatedAt timestamp", async () => {
      const originalUpdatedAt = new Date("2024-01-01");
      const resource = await createTestResource({
        updatedAt: originalUpdatedAt,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await Effect.runPromise(resource.updateSortOrder(5));

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });

  // ============================================================================
  // Query Methods - URL/Storage
  // ============================================================================
  describe("query methods - URL/Storage", () => {
    describe("hasUrl()", () => {
      it("returns true when url is present", async () => {
        const resource = await createTestResource({
          url: "https://example.com",
        });
        expect(resource.hasUrl()).toBe(true);
      });

      it("returns false when url is null", async () => {
        const resource = await createTestResource({ url: null });
        expect(resource.hasUrl()).toBe(false);
      });

      it("returns false when url is empty string", async () => {
        const resource = await createTestResource({ url: "" });
        expect(resource.hasUrl()).toBe(false);
      });
    });

    describe("hasFile()", () => {
      it("returns true when storagePath is present", async () => {
        const resource = await createTestResource({
          storagePath: "/path/to/file",
        });
        expect(resource.hasFile()).toBe(true);
      });

      it("returns false when storagePath is null", async () => {
        const resource = await createTestResource({ storagePath: null });
        expect(resource.hasFile()).toBe(false);
      });

      it("returns false when storagePath is empty string", async () => {
        const resource = await createTestResource({ storagePath: "" });
        expect(resource.hasFile()).toBe(false);
      });
    });

    describe("hasPublicUrl()", () => {
      it("returns true when publicUrl is present", async () => {
        const resource = await createTestResource({
          publicUrl: "https://cdn.example.com",
        });
        expect(resource.hasPublicUrl()).toBe(true);
      });

      it("returns false when publicUrl is null", async () => {
        const resource = await createTestResource({ publicUrl: null });
        expect(resource.hasPublicUrl()).toBe(false);
      });

      it("returns false when publicUrl is empty string", async () => {
        const resource = await createTestResource({ publicUrl: "" });
        expect(resource.hasPublicUrl()).toBe(false);
      });
    });

    describe("getAccessUrl()", () => {
      it("returns publicUrl when available", async () => {
        const resource = await createTestResource({
          publicUrl: "https://cdn.example.com",
          url: "https://example.com",
        });
        expect(resource.getAccessUrl()).toBe("https://cdn.example.com");
      });

      it("returns url when publicUrl is null", async () => {
        const resource = await createTestResource({
          publicUrl: null,
          url: "https://example.com",
        });
        expect(resource.getAccessUrl()).toBe("https://example.com");
      });

      it("returns null when both are null", async () => {
        const resource = await createTestResource({
          publicUrl: null,
          url: null,
        });
        expect(resource.getAccessUrl()).toBeNull();
      });

      it("prefers publicUrl over url when both available", async () => {
        const resource = await createTestResource({
          publicUrl: "https://cdn.example.com",
          url: "https://original.example.com",
        });
        expect(resource.getAccessUrl()).toBe("https://cdn.example.com");
      });
    });
  });

  // ============================================================================
  // Query Methods - Type
  // ============================================================================
  describe("query methods - Type", () => {
    describe("isLink()", () => {
      it("returns true for 'link' type (lowercase)", async () => {
        const resource = await createTestResource({ type: "link" });
        expect(resource.isLink()).toBe(true);
      });

      it("returns true for 'LINK' type (uppercase)", async () => {
        const resource = await createTestResource({ type: "LINK" });
        expect(resource.isLink()).toBe(true);
      });

      it("returns true for 'Link' type (mixed case)", async () => {
        const resource = await createTestResource({ type: "Link" });
        expect(resource.isLink()).toBe(true);
      });

      it("returns false for other types", async () => {
        const document = await createTestResource({ type: "document" });
        const contact = await createTestResource({ type: "contact" });
        const other = await createTestResource({ type: "other" });

        expect(document.isLink()).toBe(false);
        expect(contact.isLink()).toBe(false);
        expect(other.isLink()).toBe(false);
      });
    });

    describe("isDocument()", () => {
      it("returns true for 'document' type (lowercase)", async () => {
        const resource = await createTestResource({ type: "document" });
        expect(resource.isDocument()).toBe(true);
      });

      it("returns true for 'DOCUMENT' type (uppercase)", async () => {
        const resource = await createTestResource({ type: "DOCUMENT" });
        expect(resource.isDocument()).toBe(true);
      });

      it("returns true for 'Document' type (mixed case)", async () => {
        const resource = await createTestResource({ type: "Document" });
        expect(resource.isDocument()).toBe(true);
      });

      it("returns false for other types", async () => {
        const link = await createTestResource({ type: "link" });
        const contact = await createTestResource({ type: "contact" });
        const other = await createTestResource({ type: "other" });

        expect(link.isDocument()).toBe(false);
        expect(contact.isDocument()).toBe(false);
        expect(other.isDocument()).toBe(false);
      });
    });

    describe("isContact()", () => {
      it("returns true for 'contact' type (lowercase)", async () => {
        const resource = await createTestResource({ type: "contact" });
        expect(resource.isContact()).toBe(true);
      });

      it("returns true for 'CONTACT' type (uppercase)", async () => {
        const resource = await createTestResource({ type: "CONTACT" });
        expect(resource.isContact()).toBe(true);
      });

      it("returns true for 'Contact' type (mixed case)", async () => {
        const resource = await createTestResource({ type: "Contact" });
        expect(resource.isContact()).toBe(true);
      });

      it("returns false for other types", async () => {
        const link = await createTestResource({ type: "link" });
        const document = await createTestResource({ type: "document" });
        const other = await createTestResource({ type: "other" });

        expect(link.isContact()).toBe(false);
        expect(document.isContact()).toBe(false);
        expect(other.isContact()).toBe(false);
      });
    });
  });

  // ============================================================================
  // Trip Association
  // ============================================================================
  describe("trip association", () => {
    it("maintains correct tripId reference", async () => {
      const resource = await createTestResource({ tripId: "trip-123" });
      expect(resource.tripId).toBe("trip-123");
    });

    it("tripId is immutable across updates", async () => {
      const resource = await createTestResource({ tripId: "trip-123" });

      const updated1 = await Effect.runPromise(
        resource.updateDetails({ label: "Updated" }),
      );
      const updated2 = resource.updateContent({ url: "https://new.com" });
      const updated3 = await Effect.runPromise(resource.updateSortOrder(5));

      expect(updated1.tripId).toBe("trip-123");
      expect(updated2.tripId).toBe("trip-123");
      expect(updated3.tripId).toBe("trip-123");
    });
  });

  // ============================================================================
  // Immutability
  // ============================================================================
  describe("immutability", () => {
    it("create() returns new instances", async () => {
      const props = {
        tripId: "trip-456",
        type: "link",
        label: "Test",
      };

      const resource1 = await Effect.runPromise(TripResource.create(props));
      const resource2 = await Effect.runPromise(TripResource.create(props));

      expect(resource1).not.toBe(resource2);
      expect(resource1.id).not.toBe(resource2.id);
    });

    it("updateDetails() returns new instance", async () => {
      const resource = await createTestResource();
      const updated = await Effect.runPromise(resource.updateDetails({}));

      expect(updated).not.toBe(resource);
    });

    it("updateContent() returns new instance", async () => {
      const resource = await createTestResource();
      const updated = resource.updateContent({});

      expect(updated).not.toBe(resource);
    });

    it("updateSortOrder() returns new instance", async () => {
      const resource = await createTestResource();
      const updated = await Effect.runPromise(resource.updateSortOrder(1));

      expect(updated).not.toBe(resource);
    });
  });
});

// ============================================================================
// Test Helpers
// ============================================================================
async function createTestResource(
  overrides: {
    id?: string;
    tripId?: string;
    type?: string;
    label?: string;
    description?: string | null;
    url?: string | null;
    storagePath?: string | null;
    fileName?: string | null;
    publicUrl?: string | null;
    iconName?: string | null;
    value?: string | null;
    sortOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  } = {},
): Promise<TripResource> {
  const effect = TripResource.create({
    id: overrides.id ?? "resource-test-id",
    tripId: overrides.tripId ?? "trip-test-id",
    type: overrides.type ?? "document",
    label: overrides.label ?? "Test Resource",
    description: overrides.description ?? null,
    url: overrides.url ?? null,
    storagePath: overrides.storagePath ?? null,
    fileName: overrides.fileName ?? null,
    publicUrl: overrides.publicUrl ?? null,
    iconName: overrides.iconName ?? null,
    value: overrides.value ?? null,
    sortOrder: overrides.sortOrder ?? 0,
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
  });

  return await Effect.runPromise(effect);
}
