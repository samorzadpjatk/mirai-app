import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";
import type { SponsorId } from "../value-objects/SponsorId";

/**
 * Sponsor entity - represents a sponsor with logo and contact information
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class Sponsor {
  private constructor(
    public readonly id: SponsorId,
    public readonly name: string,
    public readonly description: string,
    public readonly logoPath: string,
    public readonly height: number | null,
    public readonly offsetX: number | null,
    public readonly offsetY: number | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new Sponsor
   * Validates all input data
   */
  static create(props: {
    id?: SponsorId;
    name: string;
    description: string;
    logoPath: string;
    height?: number | null;
    offsetX?: number | null;
    offsetY?: number | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<Sponsor, string> {
    // Validate name
    if (!props.name || props.name.trim() === "") {
      return err("Sponsor name is required");
    }
    if (props.name.length > 200) {
      return err("Sponsor name must be at most 200 characters");
    }

    // Validate description
    if (!props.description || props.description.trim() === "") {
      return err("Sponsor description is required");
    }
    if (props.description.length > 2000) {
      return err("Sponsor description must be at most 2000 characters");
    }

    // Validate logoPath
    if (!props.logoPath || props.logoPath.trim() === "") {
      return err("Sponsor logo path is required");
    }

    // Validate height (must be non-negative if provided)
    if (
      props.height !== null &&
      props.height !== undefined &&
      props.height < 0
    ) {
      return err("Height must be non-negative");
    }

    // Validate offsetX
    if (
      props.offsetX !== null &&
      props.offsetX !== undefined &&
      props.offsetX < 0
    ) {
      return err("Offset X must be non-negative");
    }

    // Validate offsetY
    if (
      props.offsetY !== null &&
      props.offsetY !== undefined &&
      props.offsetY < 0
    ) {
      return err("Offset Y must be non-negative");
    }

    // Generate ID if not provided
    const id: SponsorId = props.id ?? (crypto.randomUUID() as SponsorId);

    return ok(
      new Sponsor(
        id,
        props.name.trim(),
        props.description.trim(),
        props.logoPath.trim(),
        props.height ?? null,
        props.offsetX ?? null,
        props.offsetY ?? null,
        props.isActive ?? true,
        props.createdAt ?? new Date(),
        props.updatedAt ?? new Date(),
      ),
    );
  }

  /**
   * Update sponsor properties
   * Returns a new Sponsor instance (immutable)
   */
  update(props: {
    name?: string;
    description?: string;
    logoPath?: string;
    height?: number | null;
    offsetX?: number | null;
    offsetY?: number | null;
    isActive?: boolean;
  }): Result<Sponsor, string> {
    // Validate name if provided
    if (props.name !== undefined) {
      if (props.name.trim() === "") {
        return err("Sponsor name cannot be empty");
      }
      if (props.name.length > 200) {
        return err("Sponsor name must be at most 200 characters");
      }
    }

    // Validate description if provided
    if (props.description !== undefined) {
      if (props.description.trim() === "") {
        return err("Sponsor description cannot be empty");
      }
      if (props.description.length > 2000) {
        return err("Sponsor description must be at most 2000 characters");
      }
    }

    // Validate logoPath if provided
    if (props.logoPath !== undefined) {
      if (props.logoPath.trim() === "") {
        return err("Sponsor logo path cannot be empty");
      }
    }

    // Validate height if provided
    if (
      props.height !== undefined &&
      props.height !== null &&
      props.height < 0
    ) {
      return err("Height must be non-negative");
    }

    // Validate offsetX if provided
    if (
      props.offsetX !== undefined &&
      props.offsetX !== null &&
      props.offsetX < 0
    ) {
      return err("Offset X must be non-negative");
    }

    // Validate offsetY if provided
    if (
      props.offsetY !== undefined &&
      props.offsetY !== null &&
      props.offsetY < 0
    ) {
      return err("Offset Y must be non-negative");
    }

    return ok(
      new Sponsor(
        this.id,
        props.name !== undefined ? props.name.trim() : this.name,
        props.description !== undefined
          ? props.description.trim()
          : this.description,
        props.logoPath !== undefined ? props.logoPath.trim() : this.logoPath,
        props.height !== undefined ? props.height : this.height,
        props.offsetX !== undefined ? props.offsetX : this.offsetX,
        props.offsetY !== undefined ? props.offsetY : this.offsetY,
        props.isActive !== undefined ? props.isActive : this.isActive,
        this.createdAt,
        new Date(),
      ),
    );
  }

  /**
   * Deactivate this sponsor
   */
  deactivate(): Sponsor {
    return new Sponsor(
      this.id,
      this.name,
      this.description,
      this.logoPath,
      this.height,
      this.offsetX,
      this.offsetY,
      false,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Activate this sponsor
   */
  activate(): Sponsor {
    return new Sponsor(
      this.id,
      this.name,
      this.description,
      this.logoPath,
      this.height,
      this.offsetX,
      this.offsetY,
      true,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Check if sponsor has logo adjustments
   */
  hasLogoAdjustments(): boolean {
    return (
      this.height !== null || this.offsetX !== null || this.offsetY !== null
    );
  }

  /**
   * Get display name with activity status
   */
  getDisplayName(): string {
    return this.isActive ? this.name : `${this.name} (Inactive)`;
  }

  /**
   * Check if sponsor is currently active
   */
  isCurrentlyActive(): boolean {
    return this.isActive;
  }
}
