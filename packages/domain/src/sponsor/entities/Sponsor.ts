import type { SponsorId } from "../value-objects/SponsorId";
import { ValidationError } from "../../shared/errors/domain-errors";
import { Effect } from "effect";

/**
 * Sponsor Domain Entity
 *
 * Represents a sponsor with logo and display settings.
 */
export class Sponsor {
  private constructor(
    readonly id: SponsorId,
    readonly name: string,
    readonly description: string,
    readonly logoPath: string,
    readonly height: number | null,
    readonly offsetX: number | null,
    readonly offsetY: number | null,
    readonly isActive: boolean,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a Sponsor entity
   */
  static create(props: {
    id: SponsorId;
    name: string;
    description: string;
    logoPath: string;
    height?: number | null;
    offsetX?: number | null;
    offsetY?: number | null;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Effect.Effect<Sponsor, ValidationError, never> {
    const trimmedName = props.name.trim();

    if (trimmedName.length === 0) {
      return Effect.fail(
        new ValidationError({
          field: "name",
          message: "Sponsor name is required",
          value: props.name,
        }),
      );
    }

    if (trimmedName.length > 200) {
      return Effect.fail(
        new ValidationError({
          field: "name",
          message: "Sponsor name must be at most 200 characters",
          value: props.name,
        }),
      );
    }

    const trimmedLogoPath = props.logoPath.trim();
    if (trimmedLogoPath.length === 0) {
      return Effect.fail(
        new ValidationError({
          field: "logoPath",
          message: "Logo path is required",
          value: props.logoPath,
        }),
      );
    }

    return Effect.succeed(
      new Sponsor(
        props.id,
        trimmedName,
        props.description,
        trimmedLogoPath,
        props.height ?? null,
        props.offsetX ?? null,
        props.offsetY ?? null,
        props.isActive ?? true,
        props.createdAt,
        props.updatedAt,
      ),
    );
  }

  /**
   * Activate the sponsor
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
   * Deactivate the sponsor
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
   * Update display settings
   */
  withDisplaySettings(props: {
    height?: number | null;
    offsetX?: number | null;
    offsetY?: number | null;
  }): Sponsor {
    return new Sponsor(
      this.id,
      this.name,
      this.description,
      this.logoPath,
      props.height !== undefined ? props.height : this.height,
      props.offsetX !== undefined ? props.offsetX : this.offsetX,
      props.offsetY !== undefined ? props.offsetY : this.offsetY,
      this.isActive,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update sponsor details
   */
  withDetails(props: {
    name?: string;
    description?: string;
  }): Effect.Effect<Sponsor, ValidationError, never> {
    return Sponsor.create({
      id: this.id,
      name: props.name ?? this.name,
      description: props.description ?? this.description,
      logoPath: this.logoPath,
      height: this.height,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
