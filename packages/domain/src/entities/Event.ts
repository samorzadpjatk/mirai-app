import type { Result } from "../utils/result";
import { ok, err, isError } from "../utils/result";
import { validate } from "../utils/entity-validation";
import { timestamps, updateEntity } from "../utils/immutable";
import { ValidationError } from "../errors/domain-errors";

/**
 * Event entity - represents a trip-level event
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class Event {
  private constructor(
    public readonly id: string,
    public readonly creatorId: string,
    public readonly organizerGroupId: string | null,
    public readonly title: string,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly location: string,
    public readonly description: string,
    public readonly files: readonly string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new Event
   * Validates all input data
   */
  static create(props: {
    id?: string;
    creatorId: string;
    organizerGroupId?: string | null;
    title: string;
    startTime: Date;
    endTime: Date;
    location: string;
    description: string;
    files?: string[];
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<Event, ValidationError> {
    // Validate creatorId
    const creatorId = validate.id(props.creatorId, "creatorId");
    if (isError(creatorId)) return err(creatorId.error);

    // Validate title
    const title = validate.string(props.title, "title", {
      required: true,
      maxLength: 200,
      trim: true,
    });
    if (isError(title)) return err(title.error);

    // Validate location
    const location = validate.string(props.location, "location", {
      required: true,
      maxLength: 300,
      trim: true,
    });
    if (isError(location)) return err(location.error);

    // Validate description
    const description = validate.string(props.description, "description", {
      required: true,
      maxLength: 2000,
      trim: true,
    });
    if (isError(description)) return err(description.error);

    // Validate time range
    const timeRange = validate.dateRange(props.startTime, props.endTime);
    if (isError(timeRange)) return err(timeRange.error);

    // Validate files array
    const files = validate.array(props.files ?? [], "files", { maxItems: 10 });
    if (isError(files)) return err(files.error);

    const ts = timestamps(props);

    return ok(
      new Event(
        props.id ?? crypto.randomUUID(),
        creatorId.value,
        props.organizerGroupId ?? null,
        title.value,
        props.startTime,
        props.endTime,
        location.value,
        description.value,
        Object.freeze([...files.value]),
        ts.createdAt,
        ts.updatedAt,
      ),
    );
  }

  /**
   * Update event details
   * Returns a new Event instance (immutable)
   */
  updateDetails(props: {
    title?: string;
    location?: string;
    description?: string;
  }): Result<Event, ValidationError> {
    // Validate title if provided
    let title = this.title;
    if (props.title !== undefined) {
      const titleValidated = validate.string(props.title, "title", {
        required: true,
        maxLength: 200,
        trim: true,
      });
      if (isError(titleValidated)) return err(titleValidated.error);
      title = titleValidated.value;
    }

    // Validate location if provided
    let location = this.location;
    if (props.location !== undefined) {
      const locationValidated = validate.string(props.location, "location", {
        required: true,
        maxLength: 300,
        trim: true,
      });
      if (isError(locationValidated)) return err(locationValidated.error);
      location = locationValidated.value;
    }

    // Validate description if provided
    let description = this.description;
    if (props.description !== undefined) {
      const descriptionValidated = validate.string(
        props.description,
        "description",
        {
          required: true,
          maxLength: 2000,
          trim: true,
        },
      );
      if (isError(descriptionValidated)) return err(descriptionValidated.error);
      description = descriptionValidated.value;
    }

    return ok(updateEntity(this, { title, location, description }, Event));
  }

  /**
   * Update event times
   * Returns a new Event instance (immutable)
   */
  updateTimes(props: {
    startTime?: Date;
    endTime?: Date;
  }): Result<Event, ValidationError> {
    const newStartTime = props.startTime ?? this.startTime;
    const newEndTime = props.endTime ?? this.endTime;

    const timeRange = validate.dateRange(newStartTime, newEndTime);
    if (isError(timeRange)) return err(timeRange.error);

    return ok(
      updateEntity(
        this,
        { startTime: newStartTime, endTime: newEndTime },
        Event,
      ),
    );
  }

  /**
   * Assign to organizing group
   * Returns a new Event instance (immutable)
   */
  assignToGroup(groupId: string): Result<Event, ValidationError> {
    const validatedGroupId = validate.id(groupId, "groupId");
    if (isError(validatedGroupId)) return err(validatedGroupId.error);

    return ok(
      updateEntity(this, { organizerGroupId: validatedGroupId.value }, Event),
    );
  }

  /**
   * Remove from organizing group
   * Returns a new Event instance (immutable)
   */
  removeFromGroup(): Event {
    return updateEntity(this, { organizerGroupId: null }, Event);
  }

  /**
   * Add a file
   * Returns a new Event instance (immutable)
   */
  addFile(filePath: string): Result<Event, ValidationError> {
    const validatedFilePath = validate.string(filePath, "filePath", {
      required: true,
      trim: true,
    });
    if (isError(validatedFilePath)) return err(validatedFilePath.error);

    const newFiles = [...this.files, validatedFilePath.value];
    const files = validate.array(newFiles, "files", { maxItems: 10 });
    if (isError(files)) return err(files.error);

    return ok(
      updateEntity(this, { files: Object.freeze([...files.value]) }, Event),
    );
  }

  /**
   * Remove a file
   * Returns a new Event instance (immutable)
   */
  removeFile(filePath: string): Event {
    return updateEntity(
      this,
      { files: Object.freeze(this.files.filter((f) => f !== filePath)) },
      Event,
    );
  }

  /**
   * Check if event is organized by a group
   */
  isOrganizedByGroup(): boolean {
    return this.organizerGroupId !== null;
  }

  /**
   * Check if event has already started
   */
  hasStarted(): boolean {
    return new Date() >= this.startTime;
  }

  /**
   * Check if event has ended
   */
  hasEnded(): boolean {
    return new Date() > this.endTime;
  }

  /**
   * Check if event is currently ongoing
   */
  isOngoing(): boolean {
    const now = new Date();
    return now >= this.startTime && now <= this.endTime;
  }

  /**
   * Get duration in minutes
   */
  getDurationMinutes(): number {
    return Math.round(
      (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60),
    );
  }

  /**
   * Get summary for display
   */
  getSummary(): string {
    const startStr = this.startTime.toLocaleString();
    return `${this.title} @ ${this.location} (${startStr})`;
  }
}
