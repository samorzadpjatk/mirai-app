import { Effect } from "effect";
import { ValidationError } from "../../system/errors";
import { validate } from "../../system/utils/entity-validation";
import { timestamps, updateEntity } from "../../system/utils/immutable";

/**
 * Event entity - represents an event in the system
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
    files?: readonly string[];
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<Event, ValidationError, never> {
    return Effect.gen(function* () {
      // Validate creatorId
      const creatorId = yield* validate.id(props.creatorId, "creatorId");

      // Validate title
      const title = yield* validate.string(props.title, "title", {
        required: true,
        minLength: 1,
        maxLength: 255,
      });

      // Validate time range
      const startTime = props.startTime;
      const endTime = props.endTime;

      if (endTime <= startTime) {
        return yield* Effect.fail(
          new ValidationError({
            message: "endTime must be after startTime",
            field: "endTime",
          }),
        );
      }

      // Validate location
      const location = yield* validate.string(props.location, "location", {
        required: true,
        minLength: 1,
        maxLength: 500,
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

      // Validate files array
      const files = props.files ?? [];
      for (const file of files) {
        if (file.length > 1000) {
          return yield* Effect.fail(
            new ValidationError({
              message: "file path must be at most 1000 characters",
              field: "files",
            }),
          );
        }
      }

      // Validate organizerGroupId if provided
      let organizerGroupId: string | null = null;
      if (props.organizerGroupId) {
        organizerGroupId = yield* validate.id(
          props.organizerGroupId,
          "organizerGroupId",
        );
      }

      const ts = timestamps(props);

      return new Event(
        props.id ?? crypto.randomUUID(),
        creatorId,
        organizerGroupId,
        title,
        startTime,
        endTime,
        location,
        description,
        files,
        ts.createdAt,
        ts.updatedAt,
      );
    });
  }

  /**
   * Update event details
   */
  update(props: {
    title?: string;
    startTime?: Date;
    endTime?: Date;
    location?: string;
    description?: string;
    files?: readonly string[];
  }): Effect.Effect<Event, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      // Validate title if provided
      let title = self.title;
      if (props.title !== undefined) {
        title = yield* validate.string(props.title, "title", {
          required: true,
          minLength: 1,
          maxLength: 255,
        });
      }

      // Validate time range
      const startTime = props.startTime ?? self.startTime;
      const endTime = props.endTime ?? self.endTime;

      if (endTime <= startTime) {
        return yield* Effect.fail(
          new ValidationError({
            message: "endTime must be after startTime",
            field: "endTime",
          }),
        );
      }

      // Validate location if provided
      let location = self.location;
      if (props.location !== undefined) {
        location = yield* validate.string(props.location, "location", {
          required: true,
          minLength: 1,
          maxLength: 500,
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

      // Validate files if provided
      let files = self.files;
      if (props.files !== undefined) {
        for (const file of props.files) {
          if (file.length > 1000) {
            return yield* Effect.fail(
              new ValidationError({
                message: "file path must be at most 1000 characters",
                field: "files",
              }),
            );
          }
        }
        files = props.files;
      }

      return updateEntity(
        self,
        {
          title,
          startTime,
          endTime,
          location,
          description,
          files,
        },
        Event,
      );
    });
  }

  /**
   * Add a file to the event
   */
  addFile(filePath: string): Effect.Effect<Event, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      if (filePath.length > 1000) {
        return yield* Effect.fail(
          new ValidationError({
            message: "file path must be at most 1000 characters",
            field: "file",
          }),
        );
      }

      return updateEntity(
        self,
        {
          files: [...self.files, filePath],
        },
        Event,
      );
    });
  }

  /**
   * Remove a file from the event
   */
  removeFile(filePath: string): Event {
    return updateEntity(
      this,
      {
        files: this.files.filter((f) => f !== filePath),
      },
      Event,
    );
  }

  /**
   * Check if event is in the future
   */
  isFuture(now: Date = new Date()): boolean {
    return this.startTime > now;
  }

  /**
   * Check if event is currently ongoing
   */
  isOngoing(now: Date = new Date()): boolean {
    return now >= this.startTime && now <= this.endTime;
  }

  /**
   * Check if event has ended
   */
  isPast(now: Date = new Date()): boolean {
    return this.endTime < now;
  }

  /**
   * Check if event has an organizer group
   */
  hasOrganizerGroup(): boolean {
    return this.organizerGroupId !== null;
  }

  /**
   * Check if user is the creator
   */
  isCreator(userId: string): boolean {
    return this.creatorId === userId;
  }

  /**
   * Get duration in minutes
   */
  getDurationInMinutes(): number {
    return Math.ceil(
      (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60),
    );
  }

  /**
   * Check if event conflicts with another time range
   */
  conflictsWith(otherStartTime: Date, otherEndTime: Date): boolean {
    return (
      (this.startTime < otherEndTime && this.endTime > otherStartTime) ||
      (otherStartTime < this.endTime && otherEndTime > this.startTime)
    );
  }
}
