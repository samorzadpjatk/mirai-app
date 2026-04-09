import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * Validation rules for UserPost data
 */
const VALIDATION_RULES = {
  additionalImages: {
    maxItems: 10,
    maxUrlLength: 500,
  },
};

/**
 * UserPost entity - represents a user-generated post in activity feed
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class UserPost {
  private constructor(
    public readonly activityId: string,
    public readonly authorId: string,
    public readonly additionalImages: readonly string[],
  ) {}

  /**
   * Factory method to create a new UserPost
   * Validates all input data
   */
  static create(props: {
    activityId: string;
    authorId: string;
    additionalImages?: string[];
  }): Result<UserPost, string> {
    // Validate activityId
    if (!props.activityId || props.activityId.trim() === "") {
      return err("activityId is required");
    }

    // Validate authorId
    if (!props.authorId || props.authorId.trim() === "") {
      return err("authorId is required");
    }

    // Validate additionalImages
    const additionalImages = props.additionalImages ?? [];
    if (additionalImages.length > VALIDATION_RULES.additionalImages.maxItems) {
      return err(
        `additionalImages can have at most ${VALIDATION_RULES.additionalImages.maxItems} items`,
      );
    }
    for (const image of additionalImages) {
      if (image.length > VALIDATION_RULES.additionalImages.maxUrlLength) {
        return err("Image URL exceeds maximum length");
      }
    }

    return ok(
      new UserPost(
        props.activityId.trim(),
        props.authorId.trim(),
        Object.freeze([...additionalImages]),
      ),
    );
  }

  /**
   * Add an image
   * Returns a new UserPost instance (immutable)
   */
  addImage(imageUrl: string): Result<UserPost, string> {
    if (!imageUrl || imageUrl.trim() === "") {
      return err("imageUrl cannot be empty");
    }

    if (imageUrl.length > VALIDATION_RULES.additionalImages.maxUrlLength) {
      return err("Image URL exceeds maximum length");
    }

    if (
      this.additionalImages.length >= VALIDATION_RULES.additionalImages.maxItems
    ) {
      return err(
        `Maximum ${VALIDATION_RULES.additionalImages.maxItems} images allowed`,
      );
    }

    return ok(
      new UserPost(
        this.activityId,
        this.authorId,
        Object.freeze([...this.additionalImages, imageUrl.trim()]),
      ),
    );
  }

  /**
   * Remove an image
   * Returns a new UserPost instance (immutable)
   */
  removeImage(imageUrl: string): UserPost {
    return new UserPost(
      this.activityId,
      this.authorId,
      Object.freeze(this.additionalImages.filter((img) => img !== imageUrl)),
    );
  }

  /**
   * Check if post has any additional images
   */
  hasImages(): boolean {
    return this.additionalImages.length > 0;
  }

  /**
   * Get image count
   */
  getImageCount(): number {
    return this.additionalImages.length;
  }

  /**
   * Check if has maximum number of images
   */
  hasMaxImages(): boolean {
    return (
      this.additionalImages.length >= VALIDATION_RULES.additionalImages.maxItems
    );
  }
}
