/**
 * System Context Tags
 *
 * This module provides Effect Context.Tags for system-wide services.
 * These tags enable dependency injection of infrastructure services
 * like realtime communication, pub/sub, and storage.
 *
 * @module system/context
 */

export {
  RealtimePortTag,
  type RealtimePort,
  type RealtimeSubscription,
  type ChannelConfig,
  type PresenceState,
  type ConnectionState,
  type RealtimeError,
  type ConnectionError,
  type SubscriptionError,
} from "../shared/realtime/port";

export {
  PubSubServiceTag,
  type PubSubService,
  type SubscriptionHandle,
  type PubSubError,
  type SubscriptionFailedError,
  type PublishFailedError,
} from "../shared/pubsub/service";

export {
  StoragePortTag,
  type StoragePort,
  type FileMetadata,
  type UploadOptions,
  type SignedUrlInfo,
  type StorageError,
  type FileNotFoundError,
  type UploadError,
  type BucketNotFoundError,
} from "../shared/storage/port";
