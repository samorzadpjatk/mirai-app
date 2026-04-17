import type { NotificationId } from "../value-objects/NotificationId";
import type { TripId } from "../../trip/value-objects/TripId";
import type { UserId } from "../../user/value-objects/UserId";
import { ValidationError } from "../../shared/errors/domain-errors";
import { Effect } from "effect";

/**
 * Notification Domain Entity
 *
 * Represents a notification sent to users.
 */
export class Notification {
  private constructor(
    readonly id: NotificationId,
    readonly tripId: TripId | null,
    readonly title: string,
    readonly body: string,
    readonly url: string,
    readonly createdById: UserId,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a Notification entity
   */
  static create(props: {
    id: NotificationId;
    tripId?: TripId | null;
    title: string;
    body: string;
    url: string;
    createdById: UserId;
    createdAt: Date;
    updatedAt: Date;
  }): Effect.Effect<Notification, ValidationError, never> {
    const trimmedTitle = props.title.trim();

    if (trimmedTitle.length === 0) {
      return Effect.fail(
        new ValidationError({
          field: "title",
          message: "Notification title is required",
          value: props.title,
        }),
      );
    }

    if (trimmedTitle.length > 200) {
      return Effect.fail(
        new ValidationError({
          field: "title",
          message: "Title must be at most 200 characters",
          value: props.title,
        }),
      );
    }

    const trimmedBody = props.body.trim();
    if (trimmedBody.length === 0) {
      return Effect.fail(
        new ValidationError({
          field: "body",
          message: "Notification body is required",
          value: props.body,
        }),
      );
    }

    const trimmedUrl = props.url.trim();
    if (trimmedUrl.length === 0) {
      return Effect.fail(
        new ValidationError({
          field: "url",
          message: "URL is required",
          value: props.url,
        }),
      );
    }

    return Effect.succeed(
      new Notification(
        props.id,
        props.tripId ?? null,
        trimmedTitle,
        trimmedBody,
        trimmedUrl,
        props.createdById,
        props.createdAt,
        props.updatedAt,
      ),
    );
  }
}
