import { describe, it, expect } from "bun:test";
import { UserPost } from "./UserPost";

describe("[UNIT] UserPost Entity", () => {
  describe("UserPost.create", () => {
    it("should create with valid data", () => {
      const result = UserPost.create({
        activityId: "activity-123",
        authorId: "author-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.activityId).toBe("activity-123");
        expect(result.value.authorId).toBe("author-456");
        expect(result.value.additionalImages).toHaveLength(0);
        expect(result.value.hasImages()).toBe(false);
      }
    });

    it("should create with images", () => {
      const result = UserPost.create({
        activityId: "activity-123",
        authorId: "author-456",
        additionalImages: ["image1.jpg", "image2.jpg"],
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.additionalImages).toHaveLength(2);
        expect(result.value.hasImages()).toBe(true);
        expect(result.value.getImageCount()).toBe(2);
      }
    });

    it("should reject empty activityId", () => {
      const result = UserPost.create({
        activityId: "",
        authorId: "author-456",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty authorId", () => {
      const result = UserPost.create({
        activityId: "activity-123",
        authorId: "",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject too many images", () => {
      const result = UserPost.create({
        activityId: "activity-123",
        authorId: "author-456",
        additionalImages: Array(11).fill("image.jpg"),
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("UserPost.addImage", () => {
    it("should add image", () => {
      const postResult = UserPost.create({
        activityId: "activity-123",
        authorId: "author-456",
      });

      expect(postResult.kind).toBe("ok");
      if (postResult.kind !== "ok") return;

      const updated = postResult.value.addImage("new-image.jpg");

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.additionalImages).toContain("new-image.jpg");
        expect(updated.value.getImageCount()).toBe(1);
      }
    });

    it("should reject empty image URL", () => {
      const postResult = UserPost.create({
        activityId: "activity-123",
        authorId: "author-456",
      });

      expect(postResult.kind).toBe("ok");
      if (postResult.kind !== "ok") return;

      const updated = postResult.value.addImage("");
      expect(updated.kind).toBe("err");
    });

    it("should reject when max images reached", () => {
      const postResult = UserPost.create({
        activityId: "activity-123",
        authorId: "author-456",
        additionalImages: Array(10).fill("image.jpg"),
      });

      expect(postResult.kind).toBe("ok");
      if (postResult.kind !== "ok") return;

      expect(postResult.value.hasMaxImages()).toBe(true);

      const updated = postResult.value.addImage("one-more.jpg");
      expect(updated.kind).toBe("err");
    });
  });

  describe("UserPost.removeImage", () => {
    it("should remove image", () => {
      const postResult = UserPost.create({
        activityId: "activity-123",
        authorId: "author-456",
        additionalImages: ["image1.jpg", "image2.jpg", "image3.jpg"],
      });

      expect(postResult.kind).toBe("ok");
      if (postResult.kind !== "ok") return;

      const updated = postResult.value.removeImage("image2.jpg");

      expect(updated.additionalImages).not.toContain("image2.jpg");
      expect(updated.additionalImages).toContain("image1.jpg");
      expect(updated.additionalImages).toContain("image3.jpg");
      expect(updated.getImageCount()).toBe(2);
    });
  });
});
