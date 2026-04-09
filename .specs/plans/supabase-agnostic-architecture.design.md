# Supabase-Agnostic Architecture Design

## Overview

This design enables the Mirai App platform to swap authentication, realtime, and storage providers without changing domain logic. The approach uses the Port/Adapter Pattern within our existing Clean Architecture.

## Goals

- Replace Supabase Auth with Firebase, Auth0, or custom JWT providers
- Replace Supabase Realtime with Pusher, Ably, or Socket.io
- Replace Supabase Storage with S3, GCS, or Azure Blob Storage
- Maintain PostgreSQL database (removes Supabase layer but keeps Postgres)

## Non-Goals

- Event bus architecture (RabbitMQ, Redis Pub/Sub) — WebSocket chosen for true <100ms latency
- Provider-specific optimizations — abstracted capabilities only
- Migration from PostgreSQL — database stays

## Architecture

### Three-Layer Abstraction

```
┌─────────────────────────────────────────────────────────────────┐
│  USE CASES LAYER (packages/use-cases/)                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Ports: AuthPort, RealtimePort, StoragePort            │  │
│  │  - Pure TypeScript interfaces                          │  │
│  │  - Zero external dependencies                          │  │
│  └─────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ADAPTERS LAYER (packages/adapters/)                           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Gateways:                                             │  │
│  │    - SupabaseAuthAdapter                               │  │
│  │    - SupabaseRealtimeAdapter                           │  │
│  │    - SupabaseStorageAdapter                            │  │
│  │    - (Future: FirebaseAuthAdapter, S3StorageAdapter)     │  │
│  └─────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  FRAMEWORKS LAYER (packages/frameworks/)                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Provider Clients:                                     │  │
│  │    - Supabase client configuration                     │  │
│  │    - Future provider SDKs                              │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Port Interfaces

All ports return `Promise<Result<T, E>>`. Errors are domain-specific, not provider-specific.

#### AuthPort

```typescript
// packages/use-cases/src/ports/AuthPort.ts
export interface AuthPort {
  getUserByToken(token: string): Promise<Result<AuthUser, AuthError>>;
  getUserById(userId: string): Promise<Result<AuthUser, AuthError>>;
  getSession(token: string): Promise<Result<AuthSession, AuthError>>;
  refreshSession(refreshToken: string): Promise<Result<AuthSession, AuthError>>;
  signInWithPassword(
    email: string,
    password: string,
  ): Promise<Result<AuthSession, AuthError>>;
  signUp(
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ): Promise<Result<AuthUser, AuthError>>;
  signOut(token: string): Promise<Result<void, AuthError>>;
  resetPassword(email: string): Promise<Result<void, AuthError>>;
  updateUserRole(
    userId: string,
    role: string,
  ): Promise<Result<void, AuthError>>;
  deleteUser(userId: string): Promise<Result<void, AuthError>>;
}
```

#### RealtimePort

```typescript
// packages/use-cases/src/ports/RealtimePort.ts
export interface RealtimePort {
  subscribe(
    channel: string,
    config: ChannelConfig,
  ): Result<RealtimeSubscription, RealtimeError>;
  unsubscribe(subscriptionId: string): Result<void, RealtimeError>;
  broadcast(
    channel: string,
    event: string,
    payload: unknown,
  ): Promise<Result<void, RealtimeError>>;
  trackPresence(
    channel: string,
    state: PresenceState,
  ): Promise<Result<void, RealtimeError>>;
  untrackPresence(channel: string): Promise<Result<void, RealtimeError>>;
  getPresenceState(
    channel: string,
  ): Promise<Result<PresenceState[], RealtimeError>>;
  getConnectionState(): ConnectionState;
  onConnectionChange(callback: (state: ConnectionState) => void): void;
  getCapabilities(): RealtimeCapabilities;
  disconnect(): Result<void, RealtimeError>;
}

export interface RealtimeSubscription {
  id: string;
  channel: string;
  onMessage(callback: (payload: unknown) => void): void;
  onPresence(callback: (state: PresenceState) => void): void;
  unsubscribe(): Result<void, RealtimeError>;
}
```

#### StoragePort

```typescript
// packages/use-cases/src/ports/StoragePort.ts
export interface StoragePort {
  upload(
    bucket: string,
    path: string,
    file: Buffer | Blob | ReadableStream,
    options?: UploadOptions,
  ): Promise<Result<FileMetadata, StorageError>>;
  download(
    bucket: string,
    path: string,
  ): Promise<Result<Buffer | Blob, StorageError>>;
  delete(bucket: string, paths: string[]): Promise<Result<void, StorageError>>;
  list(
    bucket: string,
    prefix?: string,
  ): Promise<Result<FileMetadata[], StorageError>>;
  createSignedUploadUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
  ): Promise<Result<string, StorageError>>;
  createSignedDownloadUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
  ): Promise<Result<string, StorageError>>;
  getMetadata(
    bucket: string,
    path: string,
  ): Promise<Result<FileMetadata, StorageError>>;
  updateMetadata(
    bucket: string,
    path: string,
    metadata: Partial<FileMetadata>,
  ): Promise<Result<FileMetadata, StorageError>>;
}
```

### DTOs

```typescript
// packages/use-cases/src/dto/auth.ts
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  metadata: Record<string, unknown>;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// packages/use-cases/src/dto/realtime.ts
export type ConnectionState =
  | { status: "connecting" }
  | { status: "connected"; latencyMs: number }
  | { status: "reconnecting"; attempt: number; delayMs: number }
  | { status: "disconnected"; reason: string };

export interface PresenceState {
  userId: string;
  status: "online" | "away" | "busy";
  lastSeenAt: Date;
  customData?: Record<string, unknown>;
}

export interface RealtimeCapabilities {
  presence: boolean;
  history: boolean;
  messageOrdering: "guaranteed" | "best-effort";
  maxPayloadBytes: number;
}

export interface ChannelConfig {
  name: string;
  broadcast?: boolean;
  presence?: boolean;
  private?: boolean;
  metadata?: Record<string, unknown>;
}

// packages/use-cases/src/dto/storage.ts
export interface FileMetadata {
  path: string;
  size: number;
  contentType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadOptions {
  contentType?: string;
  upsert?: boolean;
  cacheControl?: string;
}
```

### Error Types

```typescript
// packages/domain/src/errors/auth.ts
export class InvalidCredentialsError extends Error {
  readonly _tag = "InvalidCredentialsError";
}
export class TokenExpiredError extends Error {
  readonly _tag = "TokenExpiredError";
}
export class UserNotFoundError extends Error {
  readonly _tag = "UserNotFoundError";
}

// packages/domain/src/errors/storage.ts
export class FileNotFoundError extends Error {
  readonly _tag = "FileNotFoundError";
}
export class QuotaExceededError extends Error {
  readonly _tag = "QuotaExceededError";
}
export class UploadFailedError extends Error {
  readonly _tag = "UploadFailedError";
}

// packages/domain/src/errors/realtime.ts
export class ConnectionError extends Error {
  readonly _tag = "ConnectionError";
}
export class ChannelError extends Error {
  readonly _tag = "ChannelError";
}
```

## Adapter Implementations

### File Structure

```
packages/adapters/src/gateways/
├── auth/
│   ├── SupabaseAuthAdapter.ts
│   ├── InMemoryAuthAdapter.ts
│   └── index.ts
├── realtime/
│   ├── SupabaseRealtimeAdapter.ts
│   ├── InMemoryRealtimeAdapter.ts
│   └── index.ts
├── storage/
│   ├── SupabaseStorageAdapter.ts
│   ├── InMemoryStorageAdapter.ts
│   └── index.ts
├── __tests__/
│   ├── auth.contract.test.ts
│   ├── realtime.contract.test.ts
│   └── storage.contract.test.ts
└── index.ts
```

### SupabaseAuthAdapter (Refactored)

The existing `SupabaseAuthAdapter` requires minimal changes to implement `AuthPort`:

```typescript
// packages/adapters/src/gateways/auth/SupabaseAuthAdapter.ts
export class SupabaseAuthAdapter implements AuthPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async getUserByToken(token: string): Promise<Result<AuthUser, AuthError>> {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error) return err(this.mapError(error));
    return ok(mapSupabaseUserToAuthUser(data.user));
  }

  private mapError(error: SupabaseError): AuthError {
    switch (error.message) {
      case "Invalid JWT":
        return new TokenExpiredError();
      case "User not found":
        return new UserNotFoundError();
      default:
        return new AuthError(error.message);
    }
  }
}
```

### SupabaseRealtimeAdapter

```typescript
export class SupabaseRealtimeAdapter implements RealtimePort {
  private subscriptions = new Map<string, RealtimeChannel>();
  private connectionState: ConnectionState = {
    status: "disconnected",
    reason: "initial",
  };

  constructor(private readonly supabase: SupabaseClient) {}

  subscribe(
    channel: string,
    config: ChannelConfig,
  ): Result<RealtimeSubscription, RealtimeError> {
    const supabaseChannel = this.supabase.channel(channel);

    if (config.broadcast) {
      supabaseChannel.on("broadcast", { event: "*" }, (payload) => {
        // Handle broadcast
      });
    }

    if (config.presence) {
      supabaseChannel.on("presence", { event: "sync" }, () => {
        // Handle presence sync
      });
    }

    const subscription = new SupabaseRealtimeSubscription(
      crypto.randomUUID(),
      channel,
      supabaseChannel,
    );

    this.subscriptions.set(subscription.id, supabaseChannel);
    supabaseChannel.subscribe();

    return ok(subscription);
  }

  getCapabilities(): RealtimeCapabilities {
    return {
      presence: true,
      history: false,
      messageOrdering: "best-effort",
      maxPayloadBytes: 1024 * 1024, // 1MB
    };
  }
}
```

### SupabaseStorageAdapter

```typescript
export class SupabaseStorageAdapter implements StoragePort {
  constructor(private readonly supabase: SupabaseClient) {}

  async upload(
    bucket: string,
    path: string,
    file: Buffer | Blob,
    options?: UploadOptions,
  ): Promise<Result<FileMetadata, StorageError>> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType,
        upsert: options?.upsert ?? false,
        cacheControl: options?.cacheControl,
      });

    if (error) return err(this.mapStorageError(error));
    return ok(this.mapMetadata(data));
  }

  private mapStorageError(error: SupabaseStorageError): StorageError {
    if (error.message.includes("not found")) return new FileNotFoundError();
    if (error.message.includes("quota")) return new QuotaExceededError();
    return new UploadFailedError(error.message);
  }
}
```

## Dependency Injection

### Module Configuration

```typescript
// packages/adapters/src/modules/AuthModule.ts
export const AuthModule = createStaticModule({
  name: "AuthModule",
  providers: {
    authPort: {
      factory: (cradle) => {
        const provider = process.env.AUTH_PROVIDER ?? "supabase";
        switch (provider) {
          case "supabase":
            return new SupabaseAuthAdapter(cradle.supabaseClient);
          case "firebase":
            return new FirebaseAuthAdapter(cradle.firebaseAuth);
          default:
            throw new Error(`Unknown auth provider: ${provider}`);
        }
      },
      lifetime: Lifetime.SCOPED,
    },
  },
  exports: ["authPort"],
});
```

Similarly for Realtime and Storage modules.

### Environment Configuration

```typescript
// packages/frameworks/src/config/provider-config.ts
import { z } from "zod";

export const ProviderConfigSchema = z.object({
  auth: z.enum(["supabase", "firebase", "auth0", "custom"]).default("supabase"),
  realtime: z
    .enum(["supabase", "pusher", "ably", "socketio"])
    .default("supabase"),
  storage: z
    .enum(["supabase", "s3", "minio", "gcs", "azure"])
    .default("supabase"),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
```

## Migration Strategy

### Phase 1: Dual Access (Backward Compatible)

```typescript
// In tRPC context
type Context = {
  container: AwilixContainer;
  supabase: SupabaseClient; // Legacy — deprecate
  authPort: AuthPort; // New — use this
  realtimePort: RealtimePort; // New — use this
  storagePort: StoragePort; // New — use this
};
```

### Phase 2: Refactor Controllers

Update controllers to use ports instead of direct Supabase access.

### Phase 3: Remove Legacy

Remove `supabase` from context once all controllers migrate.

## Testing Strategy

### Test Pyramid

| Level       | Purpose              | Provider          |
| ----------- | -------------------- | ----------------- |
| Unit        | Business logic       | InMemory adapters |
| Contract    | Interface compliance | All providers     |
| Integration | Real behavior        | Supabase staging  |

### Contract Tests

```typescript
// packages/adapters/src/gateways/__tests__/auth.contract.test.ts
const adapters = [
  { name: "InMemory", factory: () => new InMemoryAuthAdapter() },
  { name: "Supabase", factory: () => new SupabaseAuthAdapter(mockClient) },
];

for (const { name, factory } of adapters) {
  describe(`[CONTRACT] AuthPort - ${name}`, () => {
    let adapter: AuthPort;

    beforeEach(() => {
      adapter = factory();
    });

    it("returns user for valid token", async () => {
      // Setup test data
      const result = await adapter.getUserByToken(validToken);
      expect(result.kind).toBe("ok");
    });

    it("returns error for invalid token", async () => {
      const result = await adapter.getUserByToken("invalid");
      expect(result.kind).toBe("err");
      expect(result.error).toBeInstanceOf(TokenExpiredError);
    });
  });
}
```

### Migration Comparison Tests

```typescript
// Temporary: ensure port and legacy produce same results
it("[MIGRATION] port matches legacy supabase behavior", async () => {
  const portResult = await ctx.authPort.getUserByToken(token);
  const legacyResult = await ctx.supabase.auth.getUser(token);

  expect(portResult._tag).toBe("ok");
  expect(portResult.value.id).toBe(legacyResult.data.user.id);
});
```

## Realtime Edge Cases

### Provider Behavior Matrix

| Feature          | Supabase    | Pusher       | Ably       |
| ---------------- | ----------- | ------------ | ---------- |
| Auto-reconnect   | Built-in    | Built-in     | Built-in   |
| Presence         | Native      | Via channels | Native     |
| History          | Limited     | Configurable | Yes        |
| Message ordering | Best-effort | Guaranteed   | Guaranteed |

### Feature Detection

```typescript
// In use case: check capabilities before using features
async function trackPresence(useCase, realtimePort) {
  const caps = realtimePort.getCapabilities();

  if (!caps.presence) {
    // Fallback: poll database
    return await useCase.fallbackPresenceCheck();
  }

  return await realtimePort.trackPresence(channel, state);
}
```

### Connection State Handling

```typescript
// Adapter responsibility: normalize provider-specific states
export class SupabaseRealtimeAdapter implements RealtimePort {
  private updateConnectionState(supabaseState: string): void {
    switch (supabaseState) {
      case "CLOSED":
        this.connectionState = { status: "disconnected", reason: "closed" };
        break;
      case "CONNECTING":
        this.connectionState = { status: "connecting" };
        break;
      case "OPEN":
        this.connectionState = { status: "connected", latencyMs: 0 };
        break;
    }
  }
}
```

## Future Providers

### Planned Support

**Auth:**

- Firebase Auth (Google)
- Auth0
- Keycloak
- Custom JWT

**Realtime:**

- Pusher
- Ably
- Socket.io

**Storage:**

- AWS S3 (using `@aws-sdk/client-s3`)
- **MinIO** (S3-compatible, self-hosted)
- Google Cloud Storage
- Azure Blob Storage

### MinIO + tusd Configuration

For self-hosted storage with resumable uploads:

```typescript
// Storage adapter selection
storage: z.enum(["supabase", "s3", "minio", "gcs", "azure"]).default(
  "supabase",
);

// MinIO uses S3-compatible SDK
const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT, // e.g., "http://localhost:9000"
  region: process.env.MINIO_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});
```

### tusd Resumable Upload Flow

tusd enables resumable uploads (pause/resume, unreliable networks). Two deployment patterns:

**Option A: Client → tusd → MinIO (Direct)**

```
Client      tusd        MinIO
  │    POST   │          │
  │──────────>│          │
  │  Upload   │          │
  │──────────>│─────────>│
  │  201 OK   │          │
  │<──────────│          │
```

- Pros: Backend not involved, scales horizontally
- Cons: tusd needs auth validation hook

**Option B: Client → Backend → tusd → MinIO**

```
Client      Backend    tusd        MinIO
  │   POST    │          │          │
  │──────────>│─────────>│          │
  │  201 OK   │          │          │
  │<──────────│          │          │
  │  Upload   │          │          │
  │──────────>│          │          │
  │           │          │─────────>│
```

- Pros: Full auth control in backend
- Cons: Backend becomes bottleneck, more complex

**Recommendation:** Option A with tusd hooks for auth validation.

### TusdStorageAdapter (Extension)

```typescript
// packages/adapters/src/gateways/storage/TusdStorageAdapter.ts
export class TusdStorageAdapter implements StoragePort {
  constructor(
    private readonly s3Client: S3Client, // MinIO-compatible
    private readonly tusdEndpoint: string,
  ) {}

  async createSignedUploadUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
  ): Promise<Result<string, StorageError>> {
    // Return tusd endpoint + upload metadata
    // tusd generates its own S3-signed URL internally
    const uploadUrl = `${this.tusdEndpoint}/files/`;
    return ok(uploadUrl);
  }

  async upload(): Promise<never> {
    // Upload happens directly to tusd, not through this adapter
    throw new Error("Use createSignedUploadUrl for tusd uploads");
  }

  // download(), delete(), list(), getMetadata() use S3Client normally
}
```

### Adding a New Provider

1. Create adapter in `packages/adapters/src/gateways/<service>/`
2. Implement port interface
3. Add error mapping
4. Register in DI module
5. Add contract tests
6. Update environment schema

## Acceptance Criteria

- [ ] `AuthPort`, `RealtimePort`, `StoragePort` interfaces defined
- [ ] Supabase adapters implement all ports
- [ ] InMemory adapters exist for unit testing
- [ ] Contract tests pass for all adapter combinations
- [ ] Environment variables control provider selection
- [ ] Backward compatibility maintained during migration
- [ ] All existing tests pass
- [ ] Documentation updated

## References

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Ports and Adapters Pattern](https://alistair.cockburn.us/hexagonal-architecture/)
- [AGENTS.md](/AGENTS.md) — Project conventions
- [CLAUDE.md](/CLAUDE.md) — CEK Five Pillars
