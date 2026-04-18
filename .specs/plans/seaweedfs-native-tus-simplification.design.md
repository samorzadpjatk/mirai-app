# Design: Simplify Storage - SeaweedFS Native TUS

## Overview

This design simplifies the storage architecture by using **SeaweedFS Filer's native TUS support** instead of a separate tusd server. This eliminates the need for:
- Separate tusd server deployment
- Redis ticket storage for upload authentication
- TUS webhook handlers
- Complex ticket lifecycle management

## Architecture Goals

1. **Single Storage Service**: SeaweedFS handles both S3-compatible storage AND resumable uploads
2. **Remove Tusd Dependency**: No separate server to deploy and manage
3. **Simplify Authentication**: Use pre-signed URLs or auth tokens directly with SeaweedFS Filer
4. **Reduce Code Complexity**: Remove ticket service, webhook handlers, and related infrastructure

## Current State (with Tusd)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Current Complex Architecture                                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Client → tusd Server → SeaweedFS S3                                     │
│            │           (final storage)                                   │
│            │                                                               │
│            ▼                                                               │
│     Webhook Callbacks → Backend Server                                   │
│     (pre-create,        (Ticket validation)                             │
│      post-finish)                                                          │
│            │                                                               │
│            ▼                                                               │
│     Redis Ticket Storage                                                 │
│     (temporary auth tokens)                                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Target State (SeaweedFS Native TUS)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Simplified Architecture                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Client → SeaweedFS Filer TUS Endpoint                                   │
│            │                                                             │
│            ├── TUS Protocol (resumable uploads)                          │
│            └── S3 API (final storage)                                  │
│                                                                          │
│  Backend Server:                                                          │
│   - Create upload URL (pre-signed or with auth header)                  │
│   - No webhook handlers needed                                           │
│   - No ticket service needed                                             │
│   - No Redis for upload tickets                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## SeaweedFS Filer TUS

### What is SeaweedFS Filer TUS?

SeaweedFS Filer provides a **built-in TUS server** that handles resumable uploads directly:

- **TUS Protocol**: Supports POST, PATCH, HEAD, DELETE for upload lifecycle
- **Direct Storage**: Files stored in SeaweedFS volume servers
- **No Middleware**: No tusd, no webhooks, no ticket complexity
- **Auth Options**: 
  - JWT tokens in headers
  - Pre-signed URLs with expiration
  - Custom auth via Filer hooks (if needed)

### Configuration

```toml
# filer.toml
[tus]
enabled = true
# Chunk size for resumable uploads
chunk_size = 2097152  # 2MB chunks
```

### TUS Endpoints

```
POST   /tus/<bucket>/<path>   # Create upload
PATCH  /tus/<bucket>/<path>   # Upload chunk
HEAD   /tus/<bucket>/<path>   # Get upload status
DELETE /tus/<bucket>/<path>   # Cancel upload
```

## Architecture Changes

### 1. Remove Tusd-Related Components

**Files to Delete:**
- `packages/adapters/src/storage/gateways/seaweedfs/hooks/TusHookHandler.ts`
- `packages/adapters/src/storage/gateways/seaweedfs/hooks/TicketService.ts`
- `packages/adapters/src/storage/gateways/seaweedfs/hooks/index.ts` (or simplify)
- `packages/adapters/src/system/controllers/TusWebhookController.ts`

**Types to Remove:**
- `TusdConfig` interface
- `TusWebhookPort` interface and tag
- `TicketConfig` interface
- Upload ticket types

### 2. Simplified SeaweedFSStorageGateway

**Before (with tusd):**
```typescript
export class SeaweedFSStorageGateway implements IStoragePort {
  constructor(
    private readonly seaweedfs: SeaweedFSConfig,
    private readonly tusd: TusdConfig,        // REMOVE
    private readonly redis: RedisConfig,       // REMOVE (tickets)
    private readonly ticket: TicketConfig,    // REMOVE
  ) {}
  
  async createSignedUploadUrl(input) {
    // Create Redis ticket
    // Return tusd URL with ticket
  }
}
```

**After (native TUS):**
```typescript
export interface StorageConfig {
  seaweedfs: {
    endpoint: string;      // S3 endpoint
    tusEndpoint: string;   // Filer TUS endpoint
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export class SeaweedFSStorageGateway implements IStoragePort {
  constructor(private readonly config: StorageConfig) {}
  
  async createResumableUploadUrl(input: CreateUploadInput) {
    // Create pre-signed TUS URL or auth-enabled URL
    // No tickets, no webhooks
    return {
      uploadUrl: `${this.config.seaweedfs.tusEndpoint}/${input.bucket}/${input.path}`,
      headers: {
        'Authorization': `Bearer ${await this.getUploadToken(input)}`
      }
    };
  }
}
```

### 3. Simplified Service Layer

**Before:**
```typescript
export interface ServiceLayerConfig {
  supabase: SupabaseClient;        // REMOVE
  db: DrizzleDb;
  seaweedfsConfig?: SeaweedFSStorageConfig;  // Complex nested config
}

// Creates: BetterAuth + Storage + EventBus + TusWebhook
```

**After:**
```typescript
export interface ServiceLayerConfig {
  db: DrizzleDb;
  authConfig?: BetterAuthConfig;
  storageConfig?: StorageConfig;   // Simplified flat config
  eventBusConfig?: RedisEventBusConfig;
}

// Creates: BetterAuth + Storage + EventBus (no TusWebhook)
```

### 4. Simplified Environment Variables

**Before:**
```bash
# SeaweedFS S3
SEAWEEDFS_ENDPOINT=http://localhost:8333
SEAWEEDFS_ACCESS_KEY=xxx
SEAWEEDFS_SECRET_KEY=yyy

# tusd Server (REMOVE)
TUSD_ENDPOINT=http://localhost:1080
TUSD_HOOKS_ENDPOINT=http://backend:3000/tus-hooks
TUSD_MAX_UPLOAD_SIZE=104857600

# Redis for Tickets (REMOVE)
REDIS_HOST=localhost
REDIS_PORT=6380

# Ticket Config (REMOVE)
UPLOAD_TICKET_TTL=3600
```

**After:**
```bash
# SeaweedFS S3 API
SEAWEEDFS_ENDPOINT=http://localhost:8333
SEAWEEDFS_ACCESS_KEY=xxx
SEAWEEDFS_SECRET_KEY=yyy

# SeaweedFS Filer TUS (NEW)
SEAWEEDFS_TUS_ENDPOINT=http://localhost:7333/tus

# Redis for Event Bus only
REDIS_EVENTBUS_HOST=localhost
REDIS_EVENTBUS_PORT=6380
```

## API Changes

### Storage Port Interface

**Current (with tusd tickets):**
```typescript
export interface IStoragePort {
  createSignedUploadUrl(input: CreateSignedUploadUrlInput): 
    Effect.Effect<CreateSignedUploadUrlResult, IPortError, never>;
  // ... other methods
}

interface CreateSignedUploadUrlResult {
  uploadUrl: string;      // tusd URL
  uploadToken: string;   // Redis ticket token
  expiresAt: Date;
}
```

**New (native TUS):**
```typescript
export interface IStoragePort {
  createResumableUploadUrl(input: CreateUploadInput): 
    Effect.Effect<CreateUploadResult, IPortError, never>;
  // ... other methods unchanged
}

interface CreateUploadResult {
  uploadUrl: string;           // SeaweedFS Filer TUS URL
  headers: Record<string, string>;  // Auth headers
  maxChunkSize: number;
  maxFileSize: number;
}
```

### Upload Flow

**Before:**
```
1. Client requests upload → Backend creates Redis ticket
2. Backend returns: { tusdUrl, uploadToken }
3. Client POST to tusd with uploadToken header
4. tusd validates token via webhook to backend
5. Backend checks Redis, returns 200 if valid
6. tusd accepts upload, streams to SeaweedFS
7. tusd calls post-finish webhook
8. Backend marks ticket as used
```

**After:**
```
1. Client requests upload → Backend creates pre-signed TUS URL
2. Backend returns: { uploadUrl, authHeaders }
3. Client POST/PATCH to SeaweedFS Filer TUS endpoint
4. SeaweedFS Filer validates auth, handles upload
5. Upload complete - no webhooks needed
```

## Authentication Options

### Option 1: Pre-signed URLs (Recommended)

```typescript
// Backend generates time-limited signature
const uploadUrl = `${tusEndpoint}/${bucket}/${path}?` + new URLSearchParams({
  expires: Date.now() + 3600000,
  signature: generateSignature(bucket, path, expires),
});
```

### Option 2: JWT Bearer Token

```typescript
// Client includes JWT in Authorization header
const headers = {
  'Authorization': `Bearer ${uploadJwt}`,
  'Upload-Metadata': `bucket ${btoa(bucket)},path ${btoa(path)}`,
};
```

### Option 3: Filer Hook (Advanced)

If custom auth needed, configure SeaweedFS Filer with webhook:

```toml
[filer.tus]
enabled = true
auth_hook = "http://backend:3000/tus-auth"
```

## Testing

### Unit Tests

```typescript
describe("SeaweedFSStorageGateway (Native TUS)", () => {
  it("should create resumable upload URL", async () => {
    const result = await Effect.runPromise(
      gateway.createResumableUploadUrl({
        bucket: "uploads",
        path: "user-123/file.jpg",
        contentType: "image/jpeg",
      })
    );
    
    expect(result.uploadUrl).toMatch(/\/tus\/uploads\/user-123\/file.jpg/);
    expect(result.headers.Authorization).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// Test actual upload flow against SeaweedFS Filer
describe("TUS Upload Integration", () => {
  it("should upload file via TUS protocol", async () => {
    const { uploadUrl, headers } = await createUploadUrl();
    
    // Use tus-js-client or manual TUS protocol
    const upload = new tus.Upload(file, {
      endpoint: uploadUrl,
      headers,
      onSuccess: () => {
        expect(upload.url).toBeDefined();
      },
    });
    
    upload.start();
  });
});
```

## Migration Checklist

### Phase 1: Remove Tusd Components
- [ ] Delete `TusHookHandler.ts`
- [ ] Delete `TicketService.ts`
- [ ] Delete `TusWebhookController.ts`
- [ ] Remove `TusWebhookPort` from use-cases
- [ ] Remove `TusWebhookPortTag` from frameworks DI

### Phase 2: Simplify SeaweedFSStorageGateway
- [ ] Remove tusd and ticket config from constructor
- [ ] Rename `createSignedUploadUrl` → `createResumableUploadUrl`
- [ ] Implement native TUS URL generation
- [ ] Update return types (remove uploadToken)
- [ ] Update tests

### Phase 3: Update Configuration
- [ ] Simplify `SeaweedFSStorageConfig` interface
- [ ] Remove `TusdConfig` type
- [ ] Remove `TicketConfig` type
- [ ] Remove Redis config for tickets (keep for event bus)
- [ ] Update `loadConfigFromEnv` to remove tusd/ticket loading

### Phase 4: Update Service Layer
- [ ] Remove `TusWebhookPortTag` from service layer
- [ ] Simplify `makeServiceLayer` (no tus webhook layer)
- [ ] Update `ServiceLayerConfig` interface
- [ ] Remove `createTusWebhookLayer` function

### Phase 5: Update Documentation
- [ ] Remove tusd from README setup instructions
- [ ] Remove ticket-related env vars from docs
- [ ] Update architecture diagrams
- [ ] Update AGENTS.md

### Phase 6: Verify
- [ ] File upload via TUS works end-to-end
- [ ] Resumable uploads work (pause/resume)
- [ ] Large file uploads work
- [ ] Auth works (can't upload without valid token)
- [ ] All storage tests pass

## Dependencies Removed

| Component | Purpose | Replacement |
|-----------|---------|-------------|
| tusd server | TUS protocol handling | SeaweedFS Filer native TUS |
| Redis (tickets) | Upload token storage | Pre-signed URLs or JWT |
| TicketService | Ticket lifecycle | Removed |
| TusHookHandler | Webhook processing | Removed |
| TusWebhookController | HTTP webhook handler | Removed |

## Files Modified

| File | Action |
|------|--------|
| `packages/adapters/src/storage/gateways/seaweedfs/SeaweedFSStorageGateway.ts` | Simplify - remove tusd/ticket logic |
| `packages/adapters/src/storage/gateways/seaweedfs/SeaweedFSConfig.ts` | Remove TusdConfig, TicketConfig |
| `packages/adapters/src/storage/gateways/seaweedfs/hooks/*` | Delete entire directory |
| `packages/adapters/src/system/controllers/TusWebhookController.ts` | Delete |
| `packages/use-cases/src/storage/ports/StoragePort.ts` | Remove TusWebhookPortTag |
| `packages/frameworks/src/di/layer/service.ts` | Remove tus webhook layer |
| `packages/frameworks/src/di/layer/service-tags.ts` | Remove TusWebhookPortTag |

## Success Criteria

1. [ ] `tusd` server no longer needed in deployment
2. [ ] No Redis usage for upload tickets
3. [ ] No webhook endpoints for TUS
4. [ ] File uploads work via SeaweedFS Filer TUS
5. [ ] Resumable uploads work (pause/resume)
6. [ ] Authentication still works (no unauthorized uploads)
7. [ ] All storage tests pass
8. [ ] Deployment simplified (fewer services)

## Notes

- **SeaweedFS Version**: Requires SeaweedFS 3.0+ with Filer TUS enabled
- **TUS Client**: Frontend can use `tus-js-client` or manual TUS protocol
- **Chunk Size**: Configured in `filer.toml` (default 2MB)
- **Max File Size**: Configure in SeaweedFS Filer or validate in backend
- **Backward Compatibility**: Breaking change - frontend must update to new upload flow
