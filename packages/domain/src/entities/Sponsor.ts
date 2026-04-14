import { Effect } from "effect";
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
    return Effect.gen(function* () {
      // Validate name
      const name = yield* validate.string(props.name, "name", {
        required: true,
        maxLength: 200,
        trim: true,
      });

      // Validate description
      const description = yield* validate.string(
        props.description,
        "description",
        {
          required: true,
          maxLength: 2000,
          trim: true,
        },
      );

      // Validate logoPath
      const logoPath = yield* validate.string(props.logoPath, "logoPath", {
        required: true,
        trim: true,
      });

      // Validate height (only if provided and not null)
      let height: number | null = null;
      if (props.height !== undefined && props.height !== null) {
        height = yield* validate.number(props.height, "height", {
          min: 0,
        });
      }

      // Validate offsetX (only if provided and not null)
      let offsetX: number | null = null;
      if (props.offsetX !== undefined && props.offsetX !== null) {
        offsetX = yield* validate.number(props.offsetX, "offsetX", {
          min: 0,
        });
      }

      // Validate offsetY (only if provided and not null)
      let offsetY: number | null = null;
      if (props.offsetY !== undefined && props.offsetY !== null) {
        offsetY = yield* validate.number(props.offsetY, "offsetY", {
          min: 0,
        });
      }

      // Generate ID if not provided
      const id: SponsorId = props.id ?? (crypto.randomUUID() as SponsorId);

      const ts = timestamps(props);

      return new Sponsor(
        id,
        name,
        description,
        logoPath,
        height,
        offsetX,
        offsetY,
        props.isActive ?? true,
        ts.createdAt,
        ts.updatedAt,
      );
    });
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const updates: Partial<Sponsor> = {};

      // Validate name if provided
      if (props.name !== undefined) {
        updates.name = yield* validate.string(props.name, "name", {
          required: true,
          maxLength: 200,
          trim: true,
        });
      }

      // Validate description if provided
      if (props.description !== undefined) {
        updates.description = yield* validate.string(
          props.description,
          "description",
          {
            required: true,
            maxLength: 2000,
            trim: true,
          },
        );
      }

      // Validate logoPath if provided
      if (props.logoPath !== undefined) {
        updates.logoPath = yield* validate.string(props.logoPath, "logoPath", {
          required: true,
          trim: true,
        });
      }

      // Validate height if provided
      if (props.height !== undefined) {
        if (props.height !== null) {
          yield* validate.number(props.height, "height", {
            min: 0,
          });
        }
        updates.height = props.height;
      }

      // Validate offsetX if provided
      if (props.offsetX !== undefined) {
        if (props.offsetX !== null) {
          yield* validate.number(props.offsetX, "offsetX", {
            min: 0,
          });
        }
        updates.offsetX = props.offsetX;
      }

      // Validate offsetY if provided
      if (props.offsetY !== undefined) {
        if (props.offsetY !== null) {
          yield* validate.number(props.offsetY, "offsetY", {
            min: 0,
          });
        }
        updates.offsetY = props.offsetY;
      }

      if (props.isActive !== undefined) {
        updates.isActive = props.isActive;
      }

      return updateEntity(self, updates, Sponsor);
    });
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
