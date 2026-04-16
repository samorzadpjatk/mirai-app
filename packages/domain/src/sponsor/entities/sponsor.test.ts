import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { Sponsor } from "./sponsor";
import { ValidationError } from "../../system/errors";

describe("[UNIT] Sponsor", () => {
  describe("create", () => {
    it("creates sponsor with valid data", async () => {
      const effect = Sponsor.create({
        name: "Test Sponsor",
        description: "A test sponsor",
        logoPath: "/images/logo.png",
      });

      const sponsor = await Effect.runPromise(effect);
      expect(sponsor.name).toBe("Test Sponsor");
      expect(sponsor.description).toBe("A test sponsor");
      expect(sponsor.logoPath).toBe("/images/logo.png");
      expect(sponsor.isActive).toBe(true);
      expect(sponsor.height).toBeNull();
      expect(sponsor.offsetX).toBeNull();
      expect(sponsor.offsetY).toBeNull();
      expect(sponsor.id).toBeDefined();
      expect(sponsor.createdAt).toBeInstanceOf(Date);
      expect(sponsor.updatedAt).toBeInstanceOf(Date);
    });

    it("creates sponsor with all optional fields", async () => {
      const effect = Sponsor.create({
        id: "sponsor-123",
        name: "Full Sponsor",
        description: "Complete sponsor data",
        logoPath: "/images/full.png",
        height: 100,
        offsetX: 10,
        offsetY: 20,
        isActive: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      });

      const sponsor = await Effect.runPromise(effect);
      expect(sponsor.id).toBe("sponsor-123");
      expect(sponsor.name).toBe("Full Sponsor");
      expect(sponsor.height).toBe(100);
      expect(sponsor.offsetX).toBe(10);
      expect(sponsor.offsetY).toBe(20);
      expect(sponsor.isActive).toBe(false);
      expect(sponsor.createdAt).toEqual(new Date("2024-01-01"));
      expect(sponsor.updatedAt).toEqual(new Date("2024-01-02"));
    });

    it("fails for empty name", async () => {
      const effect = Sponsor.create({
        name: "",
        description: "Description",
        logoPath: "/logo.png",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
      }
    });

    it("fails for name exceeding max length", async () => {
      const effect = Sponsor.create({
        name: "a".repeat(256),
        description: "Description",
        logoPath: "/logo.png",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
      }
    });

    it("fails for empty description", async () => {
      const effect = Sponsor.create({
        name: "Name",
        description: "",
        logoPath: "/logo.png",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("description");
      }
    });

    it("fails for description exceeding max length", async () => {
      const effect = Sponsor.create({
        name: "Name",
        description: "a".repeat(2001),
        logoPath: "/logo.png",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("description");
      }
    });

    it("fails for empty logoPath", async () => {
      const effect = Sponsor.create({
        name: "Name",
        description: "Description",
        logoPath: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("logoPath");
      }
    });

    it("fails for logoPath exceeding max length", async () => {
      const effect = Sponsor.create({
        name: "Name",
        description: "Description",
        logoPath: "/" + "a".repeat(1000),
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("logoPath");
      }
    });

    it("fails for zero height", async () => {
      const effect = Sponsor.create({
        name: "Name",
        description: "Description",
        logoPath: "/logo.png",
        height: 0,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("height");
        expect(result.left.message).toBe("height must be positive");
      }
    });

    it("fails for negative height", async () => {
      const effect = Sponsor.create({
        name: "Name",
        description: "Description",
        logoPath: "/logo.png",
        height: -50,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("height");
        expect(result.left.message).toBe("height must be positive");
      }
    });

    it("accepts positive height", async () => {
      const effect = Sponsor.create({
        name: "Name",
        description: "Description",
        logoPath: "/logo.png",
        height: 150,
      });

      const sponsor = await Effect.runPromise(effect);
      expect(sponsor.height).toBe(150);
    });

    it("accepts null height", async () => {
      const effect = Sponsor.create({
        name: "Name",
        description: "Description",
        logoPath: "/logo.png",
        height: null,
      });

      const sponsor = await Effect.runPromise(effect);
      expect(sponsor.height).toBeNull();
    });
  });

  describe("update", () => {
    it("updates name", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Original",
          description: "Description",
          logoPath: "/logo.png",
        }),
      );

      const updated = await Effect.runPromise(
        sponsor.update({ name: "Updated" }),
      );

      expect(updated.name).toBe("Updated");
      expect(updated.description).toBe("Description");
      expect(updated.id).toBe(sponsor.id);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        sponsor.updatedAt.getTime(),
      );
    });

    it("updates description", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Original",
          logoPath: "/logo.png",
        }),
      );

      const updated = await Effect.runPromise(
        sponsor.update({ description: "Updated" }),
      );

      expect(updated.description).toBe("Updated");
      expect(updated.name).toBe("Name");
    });

    it("updates logoPath", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/old.png",
        }),
      );

      const updated = await Effect.runPromise(
        sponsor.update({ logoPath: "/new.png" }),
      );

      expect(updated.logoPath).toBe("/new.png");
    });

    it("updates height to positive value", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
        }),
      );

      const updated = await Effect.runPromise(sponsor.update({ height: 200 }));

      expect(updated.height).toBe(200);
    });

    it("updates height to null", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
          height: 100,
        }),
      );

      const updated = await Effect.runPromise(sponsor.update({ height: null }));

      expect(updated.height).toBeNull();
    });

    it("fails update with zero height", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
        }),
      );

      const result = await Effect.runPromise(
        Effect.either(sponsor.update({ height: 0 })),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("height");
      }
    });

    it("updates offsetX", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
        }),
      );

      const updated = await Effect.runPromise(sponsor.update({ offsetX: 50 }));

      expect(updated.offsetX).toBe(50);
    });

    it("updates offsetY", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
        }),
      );

      const updated = await Effect.runPromise(sponsor.update({ offsetY: 75 }));

      expect(updated.offsetY).toBe(75);
    });

    it("updates multiple fields at once", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Original",
          description: "Original Desc",
          logoPath: "/old.png",
        }),
      );

      const updated = await Effect.runPromise(
        sponsor.update({
          name: "New",
          description: "New Desc",
          logoPath: "/new.png",
          height: 150,
          offsetX: 10,
          offsetY: 20,
        }),
      );

      expect(updated.name).toBe("New");
      expect(updated.description).toBe("New Desc");
      expect(updated.logoPath).toBe("/new.png");
      expect(updated.height).toBe(150);
      expect(updated.offsetX).toBe(10);
      expect(updated.offsetY).toBe(20);
    });

    it("fails update with empty name", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
        }),
      );

      const result = await Effect.runPromise(
        Effect.either(sponsor.update({ name: "" })),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
      }
    });
  });

  describe("activate", () => {
    it("activates inactive sponsor", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
          isActive: false,
        }),
      );

      const activated = sponsor.activate();

      expect(activated.isActive).toBe(true);
      expect(activated.isActiveSponsor()).toBe(true);
    });

    it("activate returns new instance", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
        }),
      );

      const activated = sponsor.activate();

      expect(activated).not.toBe(sponsor);
      expect(sponsor.isActive).toBe(true);
    });
  });

  describe("deactivate", () => {
    it("deactivates active sponsor", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
          isActive: true,
        }),
      );

      const deactivated = sponsor.deactivate();

      expect(deactivated.isActive).toBe(false);
      expect(deactivated.isActiveSponsor()).toBe(false);
    });

    it("deactivate returns new instance", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
        }),
      );

      const deactivated = sponsor.deactivate();

      expect(deactivated).not.toBe(sponsor);
      expect(sponsor.isActive).toBe(true);
    });
  });

  describe("isActiveSponsor", () => {
    it("returns true for active sponsor", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
          isActive: true,
        }),
      );

      expect(sponsor.isActiveSponsor()).toBe(true);
    });

    it("returns false for inactive sponsor", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
          isActive: false,
        }),
      );

      expect(sponsor.isActiveSponsor()).toBe(false);
    });
  });

  describe("hasCustomDimensions", () => {
    it("returns true when height is set", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
          height: 100,
        }),
      );

      expect(sponsor.hasCustomDimensions()).toBe(true);
    });

    it("returns false when height is null", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
          height: null,
        }),
      );

      expect(sponsor.hasCustomDimensions()).toBe(false);
    });

    it("returns false when height not provided", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
        }),
      );

      expect(sponsor.hasCustomDimensions()).toBe(false);
    });
  });

  describe("hasCustomPositioning", () => {
    it("returns true when offsetX is set", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
          offsetX: 10,
        }),
      );

      expect(sponsor.hasCustomPositioning()).toBe(true);
    });

    it("returns true when offsetY is set", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
          offsetY: 20,
        }),
      );

      expect(sponsor.hasCustomPositioning()).toBe(true);
    });

    it("returns true when both offsets are set", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
          offsetX: 10,
          offsetY: 20,
        }),
      );

      expect(sponsor.hasCustomPositioning()).toBe(true);
    });

    it("returns false when no offsets are set", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
        }),
      );

      expect(sponsor.hasCustomPositioning()).toBe(false);
    });

    it("returns false when offsets are null", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
          offsetX: null,
          offsetY: null,
        }),
      );

      expect(sponsor.hasCustomPositioning()).toBe(false);
    });
  });

  describe("getDimensions", () => {
    it("returns all dimensions", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
          height: 150,
          offsetX: 25,
          offsetY: 35,
        }),
      );

      const dims = sponsor.getDimensions();
      expect(dims.height).toBe(150);
      expect(dims.offsetX).toBe(25);
      expect(dims.offsetY).toBe(35);
    });

    it("returns null for unset dimensions", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
        }),
      );

      const dims = sponsor.getDimensions();
      expect(dims.height).toBeNull();
      expect(dims.offsetX).toBeNull();
      expect(dims.offsetY).toBeNull();
    });
  });

  describe("updateLogo", () => {
    it("updates logo path", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/old.png",
        }),
      );

      const updated = await Effect.runPromise(sponsor.updateLogo("/new.png"));

      expect(updated.logoPath).toBe("/new.png");
    });

    it("fails for empty logo path", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/logo.png",
        }),
      );

      const result = await Effect.runPromise(
        Effect.either(sponsor.updateLogo("")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("logoPath");
      }
    });

    it("returns new instance", async () => {
      const sponsor = await Effect.runPromise(
        Sponsor.create({
          name: "Name",
          description: "Description",
          logoPath: "/old.png",
        }),
      );

      const updated = await Effect.runPromise(sponsor.updateLogo("/new.png"));

      expect(updated).not.toBe(sponsor);
      expect(sponsor.logoPath).toBe("/old.png");
    });
  });
});
