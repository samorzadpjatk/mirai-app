# MinIO + tusd Storage Gateway Design

> **Replace SupabaseStorageGateway with MinIO and tusd for vendor independence and performance**
> **Created:** 2026-04-18
> **Status:** Design Complete, Ready for Implementation

---

## Overview

This design replaces the `SupabaseStorageGateway` with a self-hosted solution using **MinIO** (S3-compatible object storage) and **tusd** (resumable upload server). The architecture supports both Docker Compose (development) and Kubernetes (production) deployments.

### Goals
- **Performance**: Direct control over storage infrastructure
- **Vendor Independence**: No reliance on Supabase for file operations
- **Security**: Ticket-based upload authorization via tusd hooks
- **Compatibility**: Maintain existing `IStoragePort` interface

---

## Architecture

### System Components

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client App    │────▶│   Backend    │────▶│    Redis    │
│  (tus-js-client)│     │   (GraphQL)    │     │   (Tickets) │
└─────────────────┘     └──────────────┘     └─────────────┘
         │                       │
         │                       │ Create Ticket
         │                       ▼
         │              ┌────────────────┐
         │              │   tusd Server  │
         │              │  (Port 1080)   │
         └─────────────▶│                │
           Upload File  │ pre-create hook│──▶ Verify Ticket
                        │ post-finish    │──▶ Record Upload
                        └────────────────┘
                               │
                               ▼
                        ┌────────────────┐
                        │     MinIO      │
                        │  (S3-Compatible)│
                        └────────────────┘
```

### Deployment Modes

**Docker Compose (Development/Simple):**
```yaml
services:
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    volumes:
      - minio-data:/data
  
  redis:
    image: redis:7-alpine
  
  tusd:
    image: tusproject/tusd:latest
    command: -hooks-http http://backend:3000/tusd-hooks
    environment:
      - AWS_ACCESS_KEY_ID=minioadmin
      - AWS_SECRET_ACCESS_KEY=minioadmin
      - AWS_REGION=us-east-1
      - AWS_S3_ENDPOINT=http://minio:9000
```

**Kubernetes (Production):**
- MinIO Operator for distributed mode with erasure coding
- tusd Deployment with HPA for scaling
- Redis Cluster for ticket storage

---

## Security Model

### Ticket-Based Authorization

1. **Upload Request**: Client requests upload → Backend validates user, creates UploadTicket
2. **Ticket Properties**:
   - UUID (one-time use)
   - User ID, allowed bucket/path
   - Maximum file size
   - 15-minute expiration
3. **Pre-Create Hook**: tusd verifies ticket with backend before accepting upload
4. **Post-Finish Hook**: tusd notifies backend of successful upload

### Ticket Storage
```typescript
interface UploadTicket {
  id: string;           // UUID
  userId: string;       // Owner
  bucket: string;       // Allowed bucket
  path: string;         // Allowed path
  maxSize: number;      // Size limit in bytes
  createdAt: Date;
  expiresAt: Date;      // 15 minutes TTL
  used: boolean;        // One-time use flag
}
```

---

## Data Flow

### Upload Lifecycle

1. **Client Request Upload**
   ```graphql
   mutation {
     createUploadUrl(storagePath: "avatars/user-123.jpg") {
       tusEndpoint
       ticket
       maxSize
     }
   }
   ```

2. **Backend Creates Ticket**
   - Validate user, path permissions
   - Store ticket in Redis with 15min TTL
   - Return tus endpoint + ticket

3. **Client Uploads via tus-js-client**
   ```javascript
   const upload = new tus.Upload(file, {
     endpoint: tusEndpoint,
     metadata: { ticket, filename: "user-123.jpg" },
     onSuccess: () => console.log("Upload complete")
   });
   upload.start();
   ```

4. **tusd Pre-Create Hook**
   - POST to backend `/tusd-hooks/pre-create`
   - Backend verifies ticket exists, not expired, not used
   - Returns 200 OK or 403 Forbidden

5. **tusd Post-Finish Hook**
   - POST to backend `/tusd-hooks/post-finish`
   - Backend records: uploadId, bucket, path, size, userId
   - Marks file as available in database

### Download Flow

- Public files: CDN/MinIO public URL directly
- Private files: Backend generates MinIO presigned URL (15min validity)

---

## Implementation Structure

### New Files

```
packages/adapters/src/storage/gateways/minio/
├── MinIOStorageGateway.ts              # Main gateway
├── MinIOStorageGateway.test.ts         # Unit tests
├── MinIOConfig.ts                      # Configuration types
├── types.ts                            # UploadTicket, TusHookPayload
└── index.ts                            # Barrel export

packages/adapters/src/storage/gateways/minio/hooks/
├── TusHookHandler.ts                   # Webhook business logic
└── TicketService.ts                    # Redis ticket operations

apps/backend-server/src/controllers/
└── TusHookController.ts                # Fastify/Hono routes

packages/use-cases/src/storage/interactors/
├── CreateUploadUrl.ts (MODIFY)        # Switch to ticket-based
└── CreateDownloadUrl.ts (NO CHANGE)   # Already generic
```

### Modified Interfaces

**packages/domain/src/shared/services/index.ts:**
```typescript
export interface IStoragePort {
  // NEW: Ticket-based upload
  createTusUploadTicket(
    input: CreateSignedUploadUrlInput
  ): Effect<{
    tusEndpoint: string;
    ticket: string;
    maxSize: number;
  }, IPortError, never>;
  
  // DEPRECATED: Keep for backward compat
  createSignedUploadUrl(
    input: CreateSignedUploadUrlInput
  ): Effect<{ token: string }, IPortError, never>;
  
  // ... other methods unchanged
}
```

### Dependencies

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.x",
    "@aws-sdk/s3-request-presigner": "^3.x",
    "ioredis": "^5.x"
  }
}
```

---

## Error Handling

### Error Mapping

| Source Error | Domain Error | HTTP Status |
|--------------|--------------|-------------|
| MinIO NoSuchKey | StorageObjectNotFoundError | 404 |
| MinIO Timeout | StorageUnavailableError | 503 |
| Redis ticket missing | InvalidUploadTicketError | 403 |
| tusd hook reject | UploadRejectedError | 403 |
| File size exceeded | FileSizeExceededError | 413 |

### Error Classes

```typescript
export class InvalidUploadTicketError extends Data.TaggedError(
  "InvalidUploadTicketError"
)<{ ticketId: string; reason: string }>() {}

export class UploadRejectedError extends Data.TaggedError(
  "UploadRejectedError"
)<{ ticketId: string; reason: string }>() {}

export class FileSizeExceededError extends Data.TaggedError(
  "FileSizeExceededError"
)<{ maxSize: number; actualSize: number }>() {}
```

---

## Testing

### In-Memory Storage Gateway (Updated)

```typescript
export class InMemoryStorageGateway implements IStoragePort {
  private storage = new Map<string, Blob>();
  private tickets = new Map<string, UploadTicket>();
  private ticketCounter = 0;

  createTusUploadTicket(input) {
    return Effect.sync(() => {
      this.ticketCounter++;
      const ticket = {
        id: `test-ticket-${this.ticketCounter}`,
        bucket: input.bucket,
        path: input.path,
        maxSize: 10 * 1024 * 1024,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
      };
      this.tickets.set(ticket.id, ticket);
      return {
        tusEndpoint: "http://localhost:1080/files/",
        ticket: ticket.id,
        maxSize: ticket.maxSize,
      };
    });
  }

  // Simulate tusd upload for testing
  simulateTusUpload(ticketId: string, blob: Blob) {
    return Effect.gen(function* () {
      const ticket = this.tickets.get(ticketId);
      if (!ticket || ticket.used || ticket.expiresAt < new Date()) {
        return yield* Effect.fail(new InvalidUploadTicketError({ ticketId }));
      }
      ticket.used = true;
      this.storage.set(`${ticket.bucket}/${ticket.path}`, blob);
      return { uploadId: `upload-${Date.now()}` };
    });
  }
}
```

### Test Strategy

1. **Unit Tests**: Mock S3 and Redis, test error mapping
2. **Integration Tests**: Docker Compose with real MinIO/tusd/Redis
3. **Contract Tests**: Verify all IStoragePort implementations pass same test suite

---

## Migration Plan

### Phase 1: Dual Gateway Support
- Add `STORAGE_TYPE` environment variable
- Support both `minio` and `supabase` (existing)
- No breaking changes

### Phase 2: Gradual Cutover
- New uploads use MinIO by default
- Existing Supabase files remain accessible
- Background job: copy old files (optional)

### Phase 3: Cleanup
- Remove SupabaseStorageGateway
- Delete Supabase storage buckets
- Update documentation

### Rollback
- Set `STORAGE_TYPE=supabase` to revert
- MinIO files preserved until manual cleanup

---

## Environment Configuration

### Required Variables

```bash
# Storage Type
STORAGE_TYPE=minio  # or 'supabase' for fallback

# MinIO Configuration
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_REGION=us-east-1

# tusd Configuration
TUSD_ENDPOINT=http://tusd:1080          # Internal
TUSD_PUBLIC_URL=https://tusd.example.com/files/  # External

# Redis (for tickets)
REDIS_URL=redis://redis:6379
REDIS_KEY_PREFIX=upload:ticket:
```

---

## Validation Checklist

- [ ] `MinIOStorageGateway` implements all `IStoragePort` methods
- [ ] `createTusUploadTicket` creates tickets with 15min TTL
- [ ] `InMemoryStorageGateway` supports ticket flow for testing
- [ ] tusd pre-create hook validates tickets with backend
- [ ] tusd post-finish hook records uploads in database
- [ ] Error mapping covers all failure modes
- [ ] Docker Compose starts all services
- [ ] Mobile app uploads work with new endpoint
- [ ] Download URLs use MinIO presigned URLs
- [ ] Migration preserves existing Supabase files

---

## References

- [MinIO Documentation](https://min.io/docs/minio/kubernetes/upstream/)
- [tusd Documentation](https://tus.io/protocols/resumable-upload)
- [tus-js-client](https://github.com/tus/tus-js-client)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/)

---

**Next Step:** Execute `sdd:add-task` and `sdd:plan` to begin implementation.
