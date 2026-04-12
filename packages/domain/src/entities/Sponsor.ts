import { Effect } from "effect";
import type { Result } from "../utils/result";
import { ok, err, isError } from "../utils/result";
import type { SponsorId } from "../value-objects/SponsorId";
import { validate } from "../utils/entity-validation";
import { timestamps, updateEntity } from "../utils/immutable";
import { ValidationError } from "../errors/effect-errors";

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
   *
   * Returns Effect<Sponsor, ValidationError, never>
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
  }): Effect.Effect<Sponsor, ValidationError, never> {
    // Validate name
    const nameResult = validate.string(props.name, "name", {
      required: true,
      maxLength: 200,
      trim: true,
    });
    if (isError(nameResult)) {
      return Effect.fail(
        new ValidationError({
          message: nameResult.error.message,
          field: "name",
        }),
      );
    }

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
    if (isError(descriptionResult)) {
      return Effect.fail(
        new ValidationError({
          message: descriptionResult.error.message,
          field: "description",
        }),
      );
    }

    // Validate logoPath
    const logoPathResult = validate.string(props.logoPath, "logoPath", {
      required: true,
      trim: true,
    });
    if (isError(logoPathResult)) {
      return Effect.fail(
        new ValidationError({
          message: logoPathResult.error.message,
          field: "logoPath",
        }),
      );
    }

    // Validate height (only if provided and not null)
    let height: number | null = null;
    if (props.height !== undefined && props.height !== null) {
      const heightResult = validate.number(props.height, "height", {
        min: 0,
      });
      if (isError(heightResult)) {
        return Effect.fail(
          new ValidationError({
            message: heightResult.error.message,
            field: "height",
          }),
        );
      }
      height = heightResult.value;
    }

    // Validate offsetX (only if provided and not null)
    let offsetX: number | null = null;
    if (props.offsetX !== undefined && props.offsetX !== null) {
      const offsetXResult = validate.number(props.offsetX, "offsetX", {
        min: 0,
      });
      if (isError(offsetXResult)) {
        return Effect.fail(
          new ValidationError({
            message: offsetXResult.error.message,
            field: "offsetX",
          }),
        );
      }
      offsetX = offsetXResult.value;
    }

    // Validate offsetY (only if provided and not null)
    let offsetY: number | null = null;
    if (props.offsetY !== undefined && props.offsetY !== null) {
      const offsetYResult = validate.number(props.offsetY, "offsetY", {
        min: 0,
      });
      if (isError(offsetYResult)) {
        return Effect.fail(
          new ValidationError({
            message: offsetYResult.error.message,
            field: "offsetY",
          }),
        );
      }
      offsetY = offsetYResult.value;
    }

    // Generate ID if not provided
    const id: SponsorId = props.id ?? (crypto.randomUUID() as SponsorId);

    const ts = timestamps(props);

    return Effect.succeed(
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
   *
   * Returns Effect<Sponsor, ValidationError, never>
   */
  update(props: {
    name?: string;
    description?: string;
    logoPath?: string;
    height?: number | null;
    offsetX?: number | null;
    offsetY?: number | null;
    isActive?: boolean;
  }): Effect.Effect<Sponsor, ValidationError, never> {
    const updates: Partial<Sponsor> = {};

    // Validate name if provided
    if (props.name !== undefined) {
      const validated = validate.string(props.name, "name", {
        required: true,
        maxLength: 200,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "name",
          }),
        );
      }
      updates.name = validated.value;
    }

    // Validate description if provided
    if (props.description !== undefined) {
      const validated = validate.string(props.description, "description", {
        required: true,
        maxLength: 2000,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "description",
          }),
        );
      }
      updates.description = validated.value;
    }

    // Validate logoPath if provided
    if (props.logoPath !== undefined) {
      const validated = validate.string(props.logoPath, "logoPath", {
        required: true,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "logoPath",
          }),
        );
      }
      updates.logoPath = validated.value;
    }

    // Validate height if provided
    if (props.height !== undefined) {
      if (props.height !== null) {
        const validated = validate.number(props.height, "height", {
          min: 0,
        });
        if (isError(validated)) {
          return Effect.fail(
            new ValidationError({
              message: validated.error.message,
              field: "height",
            }),
          );
        }
      }
      updates.height = props.height;
    }

    // Validate offsetX if provided
    if (props.offsetX !== undefined) {
      if (props.offsetX !== null) {
        const validated = validate.number(props.offsetX, "offsetX", {
          min: 0,
        });
        if (isError(validated)) {
          return Effect.fail(
            new ValidationError({
              message: validated.error.message,
              field: "offsetX",
            }),
          );
        }
      }
      updates.offsetX = props.offsetX;
    }

    // Validate offsetY if provided
    if (props.offsetY !== undefined) {
      if (props.offsetY !== null) {
        const validated = validate.number(props.offsetY, "offsetY", {
          min: 0,
        });
        if (isError(validated)) {
          return Effect.fail(
            new ValidationError({
              message: validated.error.message,
              field: "offsetY",
            }),
          );
        }
      }
      updates.offsetY = props.offsetY;
    }

    if (props.isActive !== undefined) {
      updates.isActive = props.isActive;
    }

    return Effect.succeed(updateEntity(this, updates, Sponsor));
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

// Backward compatibility: Keep synchronous Result-based methods for transition
export namespace SponsorCompat {
  /**
   * @deprecated Use Sponsor.create instead (returns Effect)
   * Synchronous Result-based version for backward compatibility during migration
   */
  export function createSync(
    props: Parameters<typeof Sponsor.create>[0],
  ): Result<Sponsor, ValidationError> {
    const effect = Sponsor.create(props);
    try {
      const sponsor = Effect.runSync(effect);
      return ok(sponsor);
    } catch (e) {
      return err(e as ValidationError);
    }
  }
}
