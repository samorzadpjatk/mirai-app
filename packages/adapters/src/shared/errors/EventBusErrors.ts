import { Data } from "effect";
import type { IPortError } from "@mirai-app/domain";

export class RedisConnectionError
  extends Data.TaggedError("RedisConnectionError")<{
    operation: string;
    cause: unknown;
  }>
  implements IPortError
{
  override readonly message = "Redis connection failed";
}

export class RedisPublishError
  extends Data.TaggedError("RedisPublishError")<{
    eventTag: string;
    cause: unknown;
  }>
  implements IPortError
{
  override readonly message = "Failed to publish event to Redis stream";
}

export class RedisSubscribeError
  extends Data.TaggedError("RedisSubscribeError")<{
    eventTag: string;
    cause: unknown;
  }>
  implements IPortError
{
  override readonly message = "Failed to subscribe to Redis stream";
}

export class RedisConsumerGroupError
  extends Data.TaggedError("RedisConsumerGroupError")<{
    operation: string;
    eventTag: string;
    cause: unknown;
  }>
  implements IPortError
{
  override readonly message = "Redis consumer group operation failed";
}

export class HandlerExecutionError
  extends Data.TaggedError("HandlerExecutionError")<{
    eventTag: string;
    cause: unknown;
  }>
  implements IPortError
{
  override readonly message = "Handler execution failed";
}

export class RedisParseError
  extends Data.TaggedError("RedisParseError")<{
    messageId: string;
    cause: unknown;
  }>
  implements IPortError
{
  override readonly message = "Failed to parse event from Redis message";
}

export class ConfigurationError
  extends Data.TaggedError("ConfigurationError")<{
    field: string;
    message: string;
  }>
  implements IPortError
{
  override readonly message: string;

  constructor(props: { field: string; message: string }) {
    super(props);
    this.message = `Configuration error for '${props.field}': ${props.message}`;
  }
}
