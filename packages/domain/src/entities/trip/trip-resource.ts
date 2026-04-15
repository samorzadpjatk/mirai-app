import { Effect } from "effect";
import { ValidationError } from "../../errors";

/**
 * Validation rules for TripResource data
 */
const VALIDATION_RULES = {
  label: {
    minLength: 1,
    maxLength: 100,
  },
  type: {
    minLength: 1,
    maxLength: 50,
  },
};

/**
 * TripResource entity - represents resources attached to a trip
 * (links, documents, contacts, etc.)
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class TripResource {
  private constructor(
    public readonly id: string,
    public readonly tripId: string,
    public readonly type: string,
    public readonly label: string,
    public readonly description: string | null,
    public readonly url: string | null,
    public readonly storagePath: string | null,
    public readonly fileName: string | null,
    public readonly publicUrl: string | null,
    public readonly iconName: string | null,
    public readonly value: string | null,
    public readonly sortOrder: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new TripResource
   * Validates all input data
   */
  static create(props: {
    id?: string;
    tripId: string;
    type: string;
    label: string;
    description?: string | null;
    url?: string | null;
    storagePath?: string | null;
    fileName?: string | null;
    publicUrl?: string | null;
    iconName?: string | null;
    value?: string | null;
    sortOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<TripResource, ValidationError, never> {
    // Validate tripId
    if (!props.tripId || props.tripId.trim() === "") {
      return Effect.fail(
        new ValidationError({
          message: "tripId is required",
          field: "general",
        }),
      );
    }

    // Validate type
    if (!props.type || props.type.trim() === "") {
      return Effect.fail(
        new ValidationError({
          message: "type is required",
          field: "general",
        }),
      );
    }
    if (props.type.length > VALIDATION_RULES.type.maxLength) {
      return Effect.fail(
        new ValidationError({
          message: `type must be at most ${VALIDATION_RULES.type.maxLength} characters`,
          field: "type",
        }),
      );
    }

    // Validate label
    if (!props.label || props.label.trim() === "") {
      return Effect.fail(
        new ValidationError({
          message: "label is required",
          field: "general",
        }),
      );
    }
    if (props.label.length > VALIDATION_RULES.label.maxLength) {
      return Effect.fail(
        new ValidationError({
          message: `label must be at most ${VALIDATION_RULES.label.maxLength} characters`,
          field: "label",
        }),
      );
    }

    // Validate sortOrder
    const sortOrder = props.sortOrder ?? 0;
    if (sortOrder < 0) {
      return Effect.fail(
        new ValidationError({
          message: "sortOrder must be non-negative",
          field: "general",
        }),
      );
    }

    // Validate that at least one of url or storagePath is provided for valid resources
    const url = props.url ?? null;
    const storagePath = props.storagePath ?? null;

    const now = new Date();

    return Effect.succeed(
      new TripResource(
        props.id ?? crypto.randomUUID(),
        props.tripId.trim(),
        props.type.trim(),
        props.label.trim(),
        props.description ?? null,
        url,
        storagePath,
        props.fileName ?? null,
        props.publicUrl ?? null,
        props.iconName ?? null,
        props.value ?? null,
        sortOrder,
        props.createdAt ?? now,
        props.updatedAt ?? now,
      ),
    );
  }

  /**
   * Update resource details
   * Returns a new TripResource instance (immutable)
   */
  updateDetails(props: {
    label?: string;
    description?: string | null;
  }): Effect.Effect<TripResource, ValidationError, never> {
    // Validate label if provided
    if (props.label !== undefined) {
      if (props.label.trim() === "") {
        return Effect.fail(
          new ValidationError({
            message: "label is required",
            field: "general",
          }),
        );
      }
      if (props.label.length > VALIDATION_RULES.label.maxLength) {
        return Effect.fail(
          new ValidationError({
            message: `label must be at most ${VALIDATION_RULES.label.maxLength} characters`,
            field: "label",
          }),
        );
      }
    }

    return Effect.succeed(
      new TripResource(
        this.id,
        this.tripId,
        this.type,
        props.label ?? this.label,
        props.description !== undefined ? props.description : this.description,
        this.url,
        this.storagePath,
        this.fileName,
        this.publicUrl,
        this.iconName,
        this.value,
        this.sortOrder,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Update resource content (URL or storage path)
   * Returns a new TripResource instance (immutable)
   */
  updateContent(props: {
    url?: string | null;
    storagePath?: string | null;
    publicUrl?: string | null;
    fileName?: string | null;
  }): TripResource {
    return new TripResource(
      this.id,
      this.tripId,
      this.type,
      this.label,
      this.description,
      props.url !== undefined ? props.url : this.url,
      props.storagePath !== undefined ? props.storagePath : this.storagePath,
      props.fileName !== undefined ? props.fileName : this.fileName,
      props.publicUrl !== undefined ? props.publicUrl : this.publicUrl,
      this.iconName,
      this.value,
      this.sortOrder,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Update sort order
   * Returns a new TripResource instance (immutable)
   */
  updateSortOrder(
    newSortOrder: number,
  ): Effect.Effect<TripResource, ValidationError, never> {
    if (newSortOrder < 0) {
      return Effect.fail(
        new ValidationError({
          message: "sortOrder must be non-negative",
          field: "general",
        }),
      );
    }

    return Effect.succeed(
      new TripResource(
        this.id,
        this.tripId,
        this.type,
        this.label,
        this.description,
        this.url,
        this.storagePath,
        this.fileName,
        this.publicUrl,
        this.iconName,
        this.value,
        newSortOrder,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Check if resource has an external URL
   */
  hasUrl(): boolean {
    return this.url !== null && this.url.length > 0;
  }

  /**
   * Check if resource has a stored file
   */
  hasFile(): boolean {
    return this.storagePath !== null && this.storagePath.length > 0;
  }

  /**
   * Check if resource has a public URL for display
   */
  hasPublicUrl(): boolean {
    return this.publicUrl !== null && this.publicUrl.length > 0;
  }

  /**
   * Get the effective URL for accessing this resource
   */
  getAccessUrl(): string | null {
    return this.publicUrl ?? this.url;
  }

  /**
   * Check if resource is a link type
   */
  isLink(): boolean {
    return this.type.toLowerCase() === "link";
  }

  /**
   * Check if resource is a document type
   */
  isDocument(): boolean {
    return this.type.toLowerCase() === "document";
  }

  /**
   * Check if resource is a contact type
   */
  isContact(): boolean {
    return this.type.toLowerCase() === "contact";
  }
}
