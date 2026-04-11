import { describe, it, expect } from "bun:test";
import { Sponsor } from "./Sponsor";
import { SponsorId } from "../value-objects/SponsorId";
import { ValidationError } from "../errors/domain-errors";

describe("[UNIT] Sponsor entity", () => {
  describe("create", () => {
    it("should create a sponsor with valid data", () => {
      const result = Sponsor.create({
        name: "Test Sponsor",
        description: "A test sponsor description",
        logoPath: "/logos/test.png",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.name).toBe("Test Sponsor");
        expect(result.value.description).toBe("A test sponsor description");
        expect(result.value.logoPath).toBe("/logos/test.png");
        expect(result.value.isActive).toBe(true);
        expect(result.value.height).toBeNull();
        expect(result.value.offsetX).toBeNull();
        expect(result.value.offsetY).toBeNull();
        expect(result.value.id).toBeDefined();
      }
    });

    it("should trim whitespace from name and description", () => {
      const result = Sponsor.create({
        name: "  Test Sponsor  ",
        description: "  Description here  ",
        logoPath: "  /logos/test.png  ",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.name).toBe("Test Sponsor");
        expect(result.value.description).toBe("Description here");
        expect(result.value.logoPath).toBe("/logos/test.png");
      }
    });

    it("should accept optional height, offsetX, offsetY", () => {
      const result = Sponsor.create({
        name: "Test Sponsor",
        description: "Description",
        logoPath: "/logos/test.png",
        height: 100,
        offsetX: 10,
        offsetY: 20,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.height).toBe(100);
        expect(result.value.offsetX).toBe(10);
        expect(result.value.offsetY).toBe(20);
      }
    });

    it("should accept null for optional numeric fields", () => {
      const result = Sponsor.create({
        name: "Test Sponsor",
        description: "Description",
        logoPath: "/logos/test.png",
        height: null,
        offsetX: null,
        offsetY: null,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.height).toBeNull();
        expect(result.value.offsetX).toBeNull();
        expect(result.value.offsetY).toBeNull();
      }
    });

    it("should accept explicit isActive flag", () => {
      const result = Sponsor.create({
        name: "Test Sponsor",
        description: "Description",
        logoPath: "/logos/test.png",
        isActive: false,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isActive).toBe(false);
      }
    });

    it("should accept pre-generated ID", () => {
      const id = SponsorId.generate();
      const result = Sponsor.create({
        id,
        name: "Test Sponsor",
        description: "Description",
        logoPath: "/logos/test.png",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe(id);
      }
    });

    it("should return error for empty name", () => {
      const result = Sponsor.create({
        name: "",
        description: "Description",
        logoPath: "/logos/test.png",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("name");
      }
    });

    it("should return error for empty description", () => {
      const result = Sponsor.create({
        name: "Test",
        description: "",
        logoPath: "/logos/test.png",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("description");
      }
    });

    it("should return error for empty logoPath", () => {
      const result = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("logoPath");
      }
    });

    it("should return error for name exceeding 200 characters", () => {
      const result = Sponsor.create({
        name: "a".repeat(201),
        description: "Description",
        logoPath: "/logos/test.png",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("name");
      }
    });

    it("should return error for description exceeding 2000 characters", () => {
      const result = Sponsor.create({
        name: "Test",
        description: "a".repeat(2001),
        logoPath: "/logos/test.png",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("description");
      }
    });

    it("should return error for negative height", () => {
      const result = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        height: -1,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("height");
      }
    });

    it("should return error for negative offsetX", () => {
      const result = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        offsetX: -1,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("offsetX");
      }
    });

    it("should return error for negative offsetY", () => {
      const result = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        offsetY: -1,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("offsetY");
      }
    });
  });

  describe("update", () => {
    it("should update sponsor name", () => {
      const createResult = Sponsor.create({
        name: "Original",
        description: "Description",
        logoPath: "/logos/test.png",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        const sponsor = createResult.value;
        const updateResult = sponsor.update({ name: "Updated" });

        expect(updateResult.kind).toBe("ok");
        if (updateResult.kind === "ok") {
          expect(updateResult.value.name).toBe("Updated");
          expect(updateResult.value.description).toBe(sponsor.description);
          expect(updateResult.value.id).toBe(sponsor.id);
          expect(updateResult.value.updatedAt.getTime()).toBeGreaterThanOrEqual(
            sponsor.updatedAt.getTime(),
          );
        }
      }
    });

    it("should update sponsor description", () => {
      const createResult = Sponsor.create({
        name: "Test",
        description: "Original",
        logoPath: "/logos/test.png",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        const sponsor = createResult.value;
        const updateResult = sponsor.update({ description: "Updated" });

        expect(updateResult.kind).toBe("ok");
        if (updateResult.kind === "ok") {
          expect(updateResult.value.description).toBe("Updated");
        }
      }
    });

    it("should update sponsor logo path", () => {
      const createResult = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/old.png",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        const sponsor = createResult.value;
        const updateResult = sponsor.update({ logoPath: "/logos/new.png" });

        expect(updateResult.kind).toBe("ok");
        if (updateResult.kind === "ok") {
          expect(updateResult.value.logoPath).toBe("/logos/new.png");
        }
      }
    });

    it("should update numeric fields", () => {
      const createResult = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        const sponsor = createResult.value;
        const updateResult = sponsor.update({
          height: 100,
          offsetX: 10,
          offsetY: 20,
        });

        expect(updateResult.kind).toBe("ok");
        if (updateResult.kind === "ok") {
          expect(updateResult.value.height).toBe(100);
          expect(updateResult.value.offsetX).toBe(10);
          expect(updateResult.value.offsetY).toBe(20);
        }
      }
    });

    it("should update isActive flag", () => {
      const createResult = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        isActive: true,
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        const sponsor = createResult.value;
        const updateResult = sponsor.update({ isActive: false });

        expect(updateResult.kind).toBe("ok");
        if (updateResult.kind === "ok") {
          expect(updateResult.value.isActive).toBe(false);
        }
      }
    });

    it("should return error for empty name in update", () => {
      const createResult = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        const updateResult = createResult.value.update({ name: "" });
        expect(updateResult.kind).toBe("err");
        if (updateResult.kind === "err") {
          expect(updateResult.error).toBeInstanceOf(ValidationError);
          expect(updateResult.error.field).toBe("name");
        }
      }
    });

    it("should return error for negative height in update", () => {
      const createResult = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        const updateResult = createResult.value.update({ height: -1 });
        expect(updateResult.kind).toBe("err");
        if (updateResult.kind === "err") {
          expect(updateResult.error).toBeInstanceOf(ValidationError);
          expect(updateResult.error.field).toBe("height");
        }
      }
    });

    it("should preserve unmodified fields", () => {
      const createResult = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        height: 100,
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        const sponsor = createResult.value;
        const updateResult = sponsor.update({ name: "Updated" });

        expect(updateResult.kind).toBe("ok");
        if (updateResult.kind === "ok") {
          expect(updateResult.value.description).toBe(sponsor.description);
          expect(updateResult.value.logoPath).toBe(sponsor.logoPath);
          expect(updateResult.value.height).toBe(sponsor.height);
          expect(updateResult.value.createdAt).toBe(sponsor.createdAt);
        }
      }
    });
  });

  describe("deactivate", () => {
    it("should deactivate an active sponsor", () => {
      const createResult = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        isActive: true,
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        const deactivated = createResult.value.deactivate();
        expect(deactivated.isActive).toBe(false);
        expect(deactivated.id).toBe(createResult.value.id);
      }
    });
  });

  describe("activate", () => {
    it("should activate an inactive sponsor", () => {
      const createResult = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        isActive: false,
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        const activated = createResult.value.activate();
        expect(activated.isActive).toBe(true);
        expect(activated.id).toBe(createResult.value.id);
      }
    });
  });

  describe("hasLogoAdjustments", () => {
    it("should return true when height is set", () => {
      const result = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        height: 100,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.hasLogoAdjustments()).toBe(true);
      }
    });

    it("should return true when offsetX is set", () => {
      const result = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        offsetX: 10,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.hasLogoAdjustments()).toBe(true);
      }
    });

    it("should return true when offsetY is set", () => {
      const result = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        offsetY: 10,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.hasLogoAdjustments()).toBe(true);
      }
    });

    it("should return false when no adjustments are set", () => {
      const result = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.hasLogoAdjustments()).toBe(false);
      }
    });
  });

  describe("getDisplayName", () => {
    it("should return name for active sponsor", () => {
      const result = Sponsor.create({
        name: "Test Sponsor",
        description: "Description",
        logoPath: "/logos/test.png",
        isActive: true,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getDisplayName()).toBe("Test Sponsor");
      }
    });

    it("should return name with (Inactive) for inactive sponsor", () => {
      const result = Sponsor.create({
        name: "Test Sponsor",
        description: "Description",
        logoPath: "/logos/test.png",
        isActive: false,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getDisplayName()).toBe("Test Sponsor (Inactive)");
      }
    });
  });

  describe("isCurrentlyActive", () => {
    it("should return true for active sponsor", () => {
      const result = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        isActive: true,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isCurrentlyActive()).toBe(true);
      }
    });

    it("should return false for inactive sponsor", () => {
      const result = Sponsor.create({
        name: "Test",
        description: "Description",
        logoPath: "/logos/test.png",
        isActive: false,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isCurrentlyActive()).toBe(false);
      }
    });
  });
});
