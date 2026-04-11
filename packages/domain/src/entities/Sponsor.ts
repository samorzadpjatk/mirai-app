import type { Result } from "../utils/result";
import { ok, err, isError } from "../utils/result";
import type { SponsorId } from "../value-objects/SponsorId";
import { validate } from "../utils/entity-validation";
import { timestamps, updateEntity } from "../utils/immutable";
import { ValidationError } from "../errors/domain-errors";

/**
 * Sponsor entity - represents a sponsor with logo and contact information
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class Sponsor {
  private constructor(
    public readonly id: SponsorId,
    public name: string,
    public description: string,
    public logoPath: string,
    public height: number | null,
    public offsetX: number | null,
    public offsetY: number | null,
    public isActive: boolean,
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
  }): Result<Sponsor, ValidationError> {
    // Validate name
    const nameResult = validate.string(props.name, "name", {
      required: true,
      maxLength: 200,
      trim: true,
    });
    if (isError(nameResult)) return err(nameResult.error);

    // Validate description
    const descriptionResult = validate.string(
      props.description,
      "description",
      {
        required: true,
        maxLength: 2000,
        trim: true,
      },
    );
    if (isError(descriptionResult)) return err(descriptionResult.error);

    // Validate logoPath
    const logoPathResult = validate.string(props.logoPath, "logoPath", {
      required: true,
      trim: true,
    });
    if (isError(logoPathResult)) return err(logoPathResult.error);

    // Validate height (only if provided and not null)
    let height: number | null = null;
    if (props.height !== undefined && props.height !== null) {
      const heightResult = validate.number(props.height, "height", {
        min: 0,
      });
      if (isError(heightResult)) return err(heightResult.error);
      height = heightResult.value;
    }

    // Validate offsetX (only if provided and not null)
    let offsetX: number | null = null;
    if (props.offsetX !== undefined && props.offsetX !== null) {
      const offsetXResult = validate.number(props.offsetX, "offsetX", {
        min: 0,
      });
      if (isError(offsetXResult)) return err(offsetXResult.error);
      offsetX = offsetXResult.value;
    }

    // Validate offsetY (only if provided and not null)
    let offsetY: number | null = null;
    if (props.offsetY !== undefined && props.offsetY !== null) {
      const offsetYResult = validate.number(props.offsetY, "offsetY", {
        min: 0,
      });
      if (isError(offsetYResult)) return err(offsetYResult.error);
      offsetY = offsetYResult.value;
    }

    // Generate ID if not provided
    const id: SponsorId = props.id ?? (crypto.randomUUID() as SponsorId);

    const ts = timestamps(props);

    return ok(
      new Sponsor(
        id,
        nameResult.value,
        descriptionResult.value,
        logoPathResult.value,
        height,
        offsetX,
        offsetY,
        props.isActive ?? true,
        ts.createdAt,
        ts.updatedAt,
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
  }): Result<Sponsor, ValidationError> {
    const updates: Partial<Sponsor> = {};

    // Validate name if provided
    if (props.name !== undefined) {
      const validated = validate.string(props.name, "name", {
        required: true,
        maxLength: 200,
        trim: true,
      });
      if (isError(validated)) return err(validated.error);
      updates.name = validated.value;
    }

    // Validate description if provided
    if (props.description !== undefined) {
      const validated = validate.string(props.description, "description", {
        required: true,
        maxLength: 2000,
        trim: true,
      });
      if (isError(validated)) return err(validated.error);
      updates.description = validated.value;
    }

    // Validate logoPath if provided
    if (props.logoPath !== undefined) {
      const validated = validate.string(props.logoPath, "logoPath", {
        required: true,
        trim: true,
      });
      if (isError(validated)) return err(validated.error);
      updates.logoPath = validated.value;
    }

    // Validate height if provided
    if (props.height !== undefined) {
      if (props.height !== null) {
        const validated = validate.number(props.height, "height", {
          min: 0,
        });
        if (isError(validated)) return err(validated.error);
      }
      updates.height = props.height;
    }

    // Validate offsetX if provided
    if (props.offsetX !== undefined) {
      if (props.offsetX !== null) {
        const validated = validate.number(props.offsetX, "offsetX", {
          min: 0,
        });
        if (isError(validated)) return err(validated.error);
      }
      updates.offsetX = props.offsetX;
    }

    // Validate offsetY if provided
    if (props.offsetY !== undefined) {
      if (props.offsetY !== null) {
        const validated = validate.number(props.offsetY, "offsetY", {
          min: 0,
        });
        if (isError(validated)) return err(validated.error);
      }
      updates.offsetY = props.offsetY;
    }

    if (props.isActive !== undefined) {
      updates.isActive = props.isActive;
    }

    return ok(updateEntity(this, updates, Sponsor));
  }

  /**
   * Deactivate this sponsor
   */
  deactivate(): Sponsor {
    return updateEntity(this, { isActive: false }, Sponsor);
  }

  /**
   * Activate this sponsor
   */
  activate(): Sponsor {
    return updateEntity(this, { isActive: true }, Sponsor);
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
