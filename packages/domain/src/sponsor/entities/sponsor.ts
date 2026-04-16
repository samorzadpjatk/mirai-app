import { Effect } from "effect";
import { ValidationError } from "../../system/errors";
import { validate } from "../../system/utils/entity-validation";
import { timestamps, updateEntity } from "../../system/utils/immutable";

/**
 * Sponsor entity - represents a sponsor in the system
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class Sponsor {
  private constructor(
    public readonly id: string,
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
    id?: string;
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
        minLength: 1,
        maxLength: 255,
      });

      // Validate description
      const description = yield* validate.string(
        props.description,
        "description",
        {
          required: true,
          minLength: 1,
          maxLength: 2000,
        },
      );

      // Validate logo path
      const logoPath = yield* validate.string(props.logoPath, "logoPath", {
        required: true,
        minLength: 1,
        maxLength: 1000,
      });

      // Validate height if provided
      let height: number | null = null;
      if (props.height !== undefined && props.height !== null) {
        if (props.height <= 0) {
          return yield* Effect.fail(
            new ValidationError({
              message: "height must be positive",
              field: "height",
            }),
          );
        }
        height = props.height;
      }

      // Validate offsetX if provided
      let offsetX: number | null = null;
      if (props.offsetX !== undefined && props.offsetX !== null) {
        offsetX = props.offsetX;
      }

      // Validate offsetY if provided
      let offsetY: number | null = null;
      if (props.offsetY !== undefined && props.offsetY !== null) {
        offsetY = props.offsetY;
      }

      const ts = timestamps(props);

      return new Sponsor(
        props.id ?? crypto.randomUUID(),
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
   * Update sponsor details
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
    const self = this;
    return Effect.gen(function* () {
      // Validate name if provided
      let name = self.name;
      if (props.name !== undefined) {
        name = yield* validate.string(props.name, "name", {
          required: true,
          minLength: 1,
          maxLength: 255,
        });
      }

      // Validate description if provided
      let description = self.description;
      if (props.description !== undefined) {
        description = yield* validate.string(props.description, "description", {
          required: true,
          minLength: 1,
          maxLength: 2000,
        });
      }

      // Validate logo path if provided
      let logoPath = self.logoPath;
      if (props.logoPath !== undefined) {
        logoPath = yield* validate.string(props.logoPath, "logoPath", {
          required: true,
          minLength: 1,
          maxLength: 1000,
        });
      }

      // Validate height if provided
      let height = self.height;
      if (props.height !== undefined) {
        if (props.height !== null && props.height <= 0) {
          return yield* Effect.fail(
            new ValidationError({
              message: "height must be positive",
              field: "height",
            }),
          );
        }
        height = props.height;
      }

      // Validate offsetX if provided
      let offsetX = self.offsetX;
      if (props.offsetX !== undefined) {
        offsetX = props.offsetX;
      }

      // Validate offsetY if provided
      let offsetY = self.offsetY;
      if (props.offsetY !== undefined) {
        offsetY = props.offsetY;
      }

      // Handle isActive if provided
      let isActive = self.isActive;
      if (props.isActive !== undefined) {
        isActive = props.isActive;
      }

      return updateEntity(
        self,
        {
          name,
          description,
          logoPath,
          height,
          offsetX,
          offsetY,
          isActive,
        },
        Sponsor,
      );
    });
  }

  /**
   * Activate the sponsor
   */
  activate(): Sponsor {
    return updateEntity(
      this,
      {
        isActive: true,
      },
      Sponsor,
    );
  }

  /**
   * Deactivate the sponsor
   */
  deactivate(): Sponsor {
    return updateEntity(
      this,
      {
        isActive: false,
      },
      Sponsor,
    );
  }

  /**
   * Check if sponsor is active
   */
  isActiveSponsor(): boolean {
    return this.isActive;
  }

  /**
   * Check if sponsor has logo adjustments (height, offsetX, or offsetY)
   */
  hasLogoAdjustments(): boolean {
    return (
      this.height !== null || this.offsetX !== null || this.offsetY !== null
    );
  }

  /**
   * Check if sponsor has custom dimensions
   */
  hasCustomDimensions(): boolean {
    return this.height !== null;
  }

  /**
   * Check if sponsor has custom positioning
   */
  hasCustomPositioning(): boolean {
    return this.offsetX !== null || this.offsetY !== null;
  }

  /**
   * Get display dimensions
   */
  getDimensions(): {
    height: number | null;
    offsetX: number | null;
    offsetY: number | null;
  } {
    return {
      height: this.height,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
    };
  }

  /**
   * Update logo path
   */
  updateLogo(logoPath: string): Effect.Effect<Sponsor, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      const validatedLogoPath = yield* validate.string(logoPath, "logoPath", {
        required: true,
        minLength: 1,
        maxLength: 1000,
      });

      return updateEntity(
        self,
        {
          logoPath: validatedLogoPath,
        },
        Sponsor,
      );
    });
  }
}
