import { Effect } from "effect";
import { validate } from "../utils/entity-validation";
import { timestamps, updateEntity } from "../utils/immutable";
import { ValidationError } from "../errors";

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
   *
   * Returns Effect<Event, ValidationError, never>
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
  }): Effect.Effect<Event, ValidationError, never> {
    return Effect.gen(function* () {
      // Validate creatorId
      const creatorId = yield* validate.id(props.creatorId, "creatorId");

      // Validate title
      const title = yield* validate.string(props.title, "title", {
        required: true,
        maxLength: 200,
        trim: true,
      });

      // Validate location
      const location = yield* validate.string(props.location, "location", {
        required: true,
        maxLength: 300,
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

      // Validate time range
      yield* validate.dateRange(props.startTime, props.endTime);

      // Validate files array
      const files = yield* validate.array(props.files ?? [], "files", {
        maxItems: 10,
      });

      const ts = timestamps(props);

      return new Event(
        props.id ?? crypto.randomUUID(),
        creatorId,
        props.organizerGroupId ?? null,
        title,
        props.startTime,
        props.endTime,
        location,
        description,
        Object.freeze([...files]),
        ts.createdAt,
        ts.updatedAt,
      );
    });
  }

  /**
   * Update event details
   * Returns a new Event instance (immutable)
   *
   * Returns Effect<Event, ValidationError, never>
   */
  updateDetails(props: {
    title?: string;
    location?: string;
    description?: string;
  }): Effect.Effect<Event, ValidationError, never> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      // Validate title if provided
      let title = self.title;
      if (props.title !== undefined) {
        title = yield* validate.string(props.title, "title", {
          required: true,
          maxLength: 200,
          trim: true,
        });
      }

      // Validate location if provided
      let location = self.location;
      if (props.location !== undefined) {
        location = yield* validate.string(props.location, "location", {
          required: true,
          maxLength: 300,
          trim: true,
        });
      }

      // Validate description if provided
      let description = self.description;
      if (props.description !== undefined) {
        description = yield* validate.string(props.description, "description", {
          required: true,
          maxLength: 2000,
          trim: true,
        });
      }

      return updateEntity(self, { title, location, description }, Event);
    });
  }

  /**
   * Update event times
   * Returns a new Event instance (immutable)
   *
   * Returns Effect<Event, ValidationError, never>
   */
  updateTimes(props: {
    startTime?: Date;
    endTime?: Date;
  }): Effect.Effect<Event, ValidationError, never> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const newStartTime = props.startTime ?? self.startTime;
      const newEndTime = props.endTime ?? self.endTime;

      yield* validate.dateRange(newStartTime, newEndTime);

      return updateEntity(
        self,
        { startTime: newStartTime, endTime: newEndTime },
        Event,
      );
    });
  }

  /**
   * Assign to organizing group
   * Returns a new Event instance (immutable)
   *
   * Returns Effect<Event, ValidationError, never>
   */
  assignToGroup(groupId: string): Effect.Effect<Event, ValidationError, never> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const validatedGroupId = yield* validate.id(groupId, "groupId");

      return updateEntity(self, { organizerGroupId: validatedGroupId }, Event);
    });
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
   *
   * Returns Effect<Event, ValidationError, never>
   */
  addFile(filePath: string): Effect.Effect<Event, ValidationError, never> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const validatedFilePath = yield* validate.string(filePath, "filePath", {
        required: true,
        trim: true,
      });

      const newFiles = [...self.files, validatedFilePath];
      const files = yield* validate.array(newFiles, "files", { maxItems: 10 });

      return updateEntity(self, { files: Object.freeze([...files]) }, Event);
    });
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
