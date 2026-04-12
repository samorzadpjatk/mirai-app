import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { Sponsor } from "./Sponsor";
import { SponsorId } from "../value-objects/SponsorId";
import { ValidationError } from "../errors/effect-errors";

describe("[UNIT] Sponsor entity", () => {
  describe("create", () => {
    it("should create a sponsor with valid data", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test Sponsor",
          description: "A test sponsor description",
          logoPath: "/logos/test.png",
        }),
      );

      expect(sponsor.name).toBe("Test Sponsor");
      expect(sponsor.description).toBe("A test sponsor description");
      expect(sponsor.logoPath).toBe("/logos/test.png");
      expect(sponsor.isActive).toBe(true);
      expect(sponsor.height).toBeNull();
      expect(sponsor.offsetX).toBeNull();
      expect(sponsor.offsetY).toBeNull();
      expect(sponsor.id).toBeDefined();
    });

    it("should trim whitespace from name and description", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "  Test Sponsor  ",
          description: "  Description here  ",
          logoPath: "  /logos/test.png  ",
        }),
      );

      expect(sponsor.name).toBe("Test Sponsor");
      expect(sponsor.description).toBe("Description here");
      expect(sponsor.logoPath).toBe("/logos/test.png");
    });

    it("should accept optional height, offsetX, offsetY", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test Sponsor",
          description: "Description",
          logoPath: "/logos/test.png",
          height: 100,
          offsetX: 10,
          offsetY: 20,
        }),
      );

      expect(sponsor.height).toBe(100);
      expect(sponsor.offsetX).toBe(10);
      expect(sponsor.offsetY).toBe(20);
    });

    it("should accept null for optional numeric fields", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test Sponsor",
          description: "Description",
          logoPath: "/logos/test.png",
          height: null,
          offsetX: null,
          offsetY: null,
        }),
      );

      expect(sponsor.height).toBeNull();
      expect(sponsor.offsetX).toBeNull();
      expect(sponsor.offsetY).toBeNull();
    });

    it("should accept explicit isActive flag", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test Sponsor",
          description: "Description",
          logoPath: "/logos/test.png",
          isActive: false,
        }),
      );

      expect(sponsor.isActive).toBe(false);
    });

    it("should accept pre-generated ID", () => {
      const id = SponsorId.generate();
      const sponsor = Effect.runSync(
        Sponsor.create({
          id,
          name: "Test Sponsor",
          description: "Description",
          logoPath: "/logos/test.png",
        }),
      );

      expect(sponsor.id).toBe(id);
    });

    it("should fail for empty name", () => {
      const effect = Sponsor.create({
        name: "",
        description: "Description",
        logoPath: "/logos/test.png",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("name");
      }
    });

    it("should fail for empty description", () => {
      const effect = Sponsor.create({
        name: "Test",
        description: "",
        logoPath: "/logos/test.png",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("description");
      }
    });

    it("should fail for empty logoPath", () => {
      const effect = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("logoPath");
      }
    });

    it("should fail for name exceeding 200 characters", () => {
      const effect = Sponsor.create({
        name: "a".repeat(201),
        description: "Description",
        logoPath: "/logos/test.png",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("name");
      }
    });

    it("should fail for description exceeding 2000 characters", () => {
      const effect = Sponsor.create({
        name: "Test",
        description: "a".repeat(2001),
        logoPath: "/logos/test.png",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("description");
      }
    });

    it("should fail for negative height", () => {
      const effect = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        height: -1,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("height");
      }
    });

    it("should fail for negative offsetX", () => {
      const effect = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        offsetX: -1,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("offsetX");
      }
    });

    it("should fail for negative offsetY", () => {
      const effect = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        offsetY: -1,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("offsetY");
      }
    });
  });

  describe("update", () => {
    it("should update sponsor name", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Original",
          description: "Description",
          logoPath: "/logos/test.png",
        }),
      );

      const updated = Effect.runSync(sponsor.update({ name: "Updated" }));

      expect(updated.name).toBe("Updated");
      expect(updated.description).toBe(sponsor.description);
      expect(updated.id).toBe(sponsor.id);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        sponsor.updatedAt.getTime(),
      );
    });

    it("should update sponsor description", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Original",
          logoPath: "/logos/test.png",
        }),
      );

      const updated = Effect.runSync(
        sponsor.update({ description: "Updated" }),
      );

      expect(updated.description).toBe("Updated");
    });

    it("should update sponsor logo path", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/old.png",
        }),
      );

      const updated = Effect.runSync(
        sponsor.update({ logoPath: "/logos/new.png" }),
      );

      expect(updated.logoPath).toBe("/logos/new.png");
    });

    it("should update numeric fields", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/test.png",
        }),
      );

      const updated = Effect.runSync(
        sponsor.update({
          height: 100,
          offsetX: 10,
          offsetY: 20,
        }),
      );

      expect(updated.height).toBe(100);
      expect(updated.offsetX).toBe(10);
      expect(updated.offsetY).toBe(20);
    });

    it("should update isActive flag", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/test.png",
          isActive: true,
        }),
      );

      const updated = Effect.runSync(sponsor.update({ isActive: false }));

      expect(updated.isActive).toBe(false);
    });

    it("should fail for empty name in update", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/test.png",
        }),
      );

      const effect = sponsor.update({ name: "" });
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("name");
      }
    });

    it("should fail for negative height in update", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/test.png",
        }),
      );

      const effect = sponsor.update({ height: -1 });
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("height");
      }
    });

    it("should preserve unmodified fields", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/test.png",
          height: 100,
        }),
      );

      const updated = Effect.runSync(sponsor.update({ name: "Updated" }));

      expect(updated.description).toBe(sponsor.description);
      expect(updated.logoPath).toBe(sponsor.logoPath);
      expect(updated.height).toBe(sponsor.height);
      expect(updated.createdAt).toBe(sponsor.createdAt);
    });
  });

  describe("deactivate", () => {
    it("should deactivate an active sponsor", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/test.png",
          isActive: true,
        }),
      );

      const deactivated = sponsor.deactivate();
      expect(deactivated.isActive).toBe(false);
      expect(deactivated.id).toBe(sponsor.id);
    });
  });

  describe("activate", () => {
    it("should activate an inactive sponsor", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/test.png",
          isActive: false,
        }),
      );

      const activated = sponsor.activate();
      expect(activated.isActive).toBe(true);
      expect(activated.id).toBe(sponsor.id);
    });
  });

  describe("hasLogoAdjustments", () => {
    it("should return true when height is set", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/test.png",
          height: 100,
        }),
      );

      expect(sponsor.hasLogoAdjustments()).toBe(true);
    });

    it("should return true when offsetX is set", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/test.png",
          offsetX: 10,
        }),
      );

      expect(sponsor.hasLogoAdjustments()).toBe(true);
    });

    it("should return true when offsetY is set", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/test.png",
          offsetY: 10,
        }),
      );

      expect(sponsor.hasLogoAdjustments()).toBe(true);
    });

    it("should return false when no adjustments are set", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/test.png",
        }),
      );

      expect(sponsor.hasLogoAdjustments()).toBe(false);
    });
  });

  describe("getDisplayName", () => {
    it("should return name for active sponsor", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test Sponsor",
          description: "Description",
          logoPath: "/logos/test.png",
          isActive: true,
        }),
      );

      expect(sponsor.getDisplayName()).toBe("Test Sponsor");
    });

    it("should return name with (Inactive) for inactive sponsor", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test Sponsor",
          description: "Description",
          logoPath: "/logos/test.png",
          isActive: false,
        }),
      );

      expect(sponsor.getDisplayName()).toBe("Test Sponsor (Inactive)");
    });
  });

  describe("isCurrentlyActive", () => {
    it("should return true for active sponsor", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/test.png",
          isActive: true,
        }),
      );

      expect(sponsor.isCurrentlyActive()).toBe(true);
    });

    it("should return false for inactive sponsor", () => {
      const sponsor = Effect.runSync(
        Sponsor.create({
          name: "Test",
          description: "Description",
          logoPath: "/logos/test.png",
          isActive: false,
        }),
      );

      expect(sponsor.isCurrentlyActive()).toBe(false);
    });
  });
});
