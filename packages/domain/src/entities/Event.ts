import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * Validation rules for Event data
 */
const VALIDATION_RULES = {
  title: {
    minLength: 1,
    maxLength: 200,
  },
  location: {
    minLength: 1,
    maxLength: 300,
  },
  description: {
    minLength: 1,
    maxLength: 2000,
  },
  files: {
    maxItems: 10,
  },
};

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
  }): Result<Event, string> {
    // Validate creatorId
    if (!props.creatorId || props.creatorId.trim() === "") {
      return err("creatorId is required");
    }

    // Validate title
    if (!props.title || props.title.trim() === "") {
      return err("title is required");
    }
    if (props.title.length > VALIDATION_RULES.title.maxLength) {
      return err(
        `title must be at most ${VALIDATION_RULES.title.maxLength} characters`,
      );
    }

    // Validate location
    if (!props.location || props.location.trim() === "") {
      return err("location is required");
    }
    if (props.location.length > VALIDATION_RULES.location.maxLength) {
      return err(
        `location must be at most ${VALIDATION_RULES.location.maxLength} characters`,
      );
    }

    // Validate description
    if (!props.description || props.description.trim() === "") {
      return err("description is required");
    }
    if (props.description.length > VALIDATION_RULES.description.maxLength) {
      return err(
        `description must be at most ${VALIDATION_RULES.description.maxLength} characters`,
      );
    }

    // Validate time range
    if (props.endTime.getTime() < props.startTime.getTime()) {
      return err("endTime must be after startTime");
    }

    // Validate files array
    const files = props.files ?? [];
    if (files.length > VALIDATION_RULES.files.maxItems) {
      return err(
        `files can have at most ${VALIDATION_RULES.files.maxItems} items`,
      );
    }

    const now = new Date();

    return ok(
      new Event(
        props.id ?? crypto.randomUUID(),
        props.creatorId.trim(),
        props.organizerGroupId ?? null,
        props.title.trim(),
        props.startTime,
        props.endTime,
        props.location.trim(),
        props.description.trim(),
        Object.freeze([...files]),
        props.createdAt ?? now,
        props.updatedAt ?? now,
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
  }): Result<Event, string> {
    // Validate title if provided
    if (props.title !== undefined) {
      if (props.title.trim() === "") {
        return err("title is required");
      }
      if (props.title.length > VALIDATION_RULES.title.maxLength) {
        return err(
          `title must be at most ${VALIDATION_RULES.title.maxLength} characters`,
        );
      }
    }

    // Validate location if provided
    if (props.location !== undefined) {
      if (props.location.trim() === "") {
        return err("location is required");
      }
      if (props.location.length > VALIDATION_RULES.location.maxLength) {
        return err(
          `location must be at most ${VALIDATION_RULES.location.maxLength} characters`,
        );
      }
    }

    // Validate description if provided
    if (props.description !== undefined) {
      if (props.description.trim() === "") {
        return err("description is required");
      }
      if (props.description.length > VALIDATION_RULES.description.maxLength) {
        return err(
          `description must be at most ${VALIDATION_RULES.description.maxLength} characters`,
        );
      }
    }

    return ok(
      new Event(
        this.id,
        this.creatorId,
        this.organizerGroupId,
        props.title ?? this.title,
        this.startTime,
        this.endTime,
        props.location ?? this.location,
        props.description ?? this.description,
        this.files,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Update event times
   * Returns a new Event instance (immutable)
   */
  updateTimes(props: {
    startTime?: Date;
    endTime?: Date;
  }): Result<Event, string> {
    const newStartTime = props.startTime ?? this.startTime;
    const newEndTime = props.endTime ?? this.endTime;

    if (newEndTime.getTime() < newStartTime.getTime()) {
      return err("endTime must be after startTime");
    }

    return ok(
      new Event(
        this.id,
        this.creatorId,
        this.organizerGroupId,
        this.title,
        newStartTime,
        newEndTime,
        this.location,
        this.description,
        this.files,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Assign to organizing group
   * Returns a new Event instance (immutable)
   */
  assignToGroup(groupId: string): Result<Event, string> {
    if (!groupId || groupId.trim() === "") {
      return err("groupId cannot be empty");
    }

    return ok(
      new Event(
        this.id,
        this.creatorId,
        groupId.trim(),
        this.title,
        this.startTime,
        this.endTime,
        this.location,
        this.description,
        this.files,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Remove from organizing group
   * Returns a new Event instance (immutable)
   */
  removeFromGroup(): Event {
    return new Event(
      this.id,
      this.creatorId,
      null,
      this.title,
      this.startTime,
      this.endTime,
      this.location,
      this.description,
      this.files,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Add a file
   * Returns a new Event instance (immutable)
   */
  addFile(filePath: string): Result<Event, string> {
    if (!filePath || filePath.trim() === "") {
      return err("filePath cannot be empty");
    }

    if (this.files.length >= VALIDATION_RULES.files.maxItems) {
      return err(`Maximum ${VALIDATION_RULES.files.maxItems} files allowed`);
    }

    return ok(
      new Event(
        this.id,
        this.creatorId,
        this.organizerGroupId,
        this.title,
        this.startTime,
        this.endTime,
        this.location,
        this.description,
        Object.freeze([...this.files, filePath.trim()]),
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Remove a file
   * Returns a new Event instance (immutable)
   */
  removeFile(filePath: string): Event {
    return new Event(
      this.id,
      this.creatorId,
      this.organizerGroupId,
      this.title,
      this.startTime,
      this.endTime,
      this.location,
      this.description,
      Object.freeze(this.files.filter((f) => f !== filePath)),
      this.createdAt,
      new Date(), // updatedAt
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
