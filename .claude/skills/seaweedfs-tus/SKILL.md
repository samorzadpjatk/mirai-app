# SeaweedFS Native TUS Support

## Overview

SeaweedFS Filer provides **built-in TUS protocol support** for resumable uploads, eliminating the need for a separate tusd server. This simplifies the storage architecture significantly.

## What is TUS?

TUS is an open protocol for resumable file uploads over HTTP. It enables:
- Resumable uploads (continue after interruption)
- Chunked uploads (break large files into parts)
- Reliable file transfer over unreliable networks

## SeaweedFS Filer TUS Support

### Endpoint

SeaweedFS Filer exposes TUS endpoints at:
```
POST /tus/{bucket}/{path}  - Create upload
PATCH /tus/{bucket}/{path}/{uploadId} - Upload chunks
HEAD /tus/{bucket}/{path}/{uploadId} - Get upload status
```

### Configuration

Enable TUS in Filer configuration (`filer.toml`):
```toml
[tus]
enabled = true
# Optional: custom settings
chunk_size = 5242880  # 5MB chunks
```

### Authentication

SeaweedFS Filer TUS supports multiple authentication methods:

1. **Query Parameter Auth**: Pass token in URL
   ```
   POST /tus/bucket/file.jpg?auth=token
   ```

2. **Header Auth**: Pass token in headers
   ```
   Authorization: Bearer <token>
   X-Upload-Token: <token>
   ```

3. **Webhook Validation** (if needed): Configure Filer to call webhook for auth

### Benefits Over tusd

| Aspect | tusd + Redis | SeaweedFS Native |
|--------|--------------|------------------|
| Components | 3 services | 1 service |
| Complexity | High (tickets, webhooks) | Low (direct upload) |
| Latency | Higher (webhook roundtrip) | Lower (direct) |
| Operations | More moving parts | Simpler |

## Migration Path

### Current Architecture (tusd)
```
Client → tusd Server → SeaweedFS S3
       ↓
   Webhook → Backend (ticket validation)
       ↓
     Redis (ticket storage)
```

### Target Architecture (Native TUS)
```
Client → SeaweedFS Filer TUS Endpoint
```

### Key Changes

1. **Remove Components**:
   - tusd server
   - Redis ticket storage
   - TicketService
   - TusHookHandler
   - TusWebhookController

2. **Simplify Gateway**:
   - Remove tusd/ticket dependencies
   - Use direct SeaweedFS TUS URLs
   - Simpler configuration

3. **Update Flow**:
   - Backend generates presigned TUS URL (or auth token)
   - Client uploads directly to SeaweedFS
   - No webhook callbacks needed

## Implementation Notes

### Backend Changes

```typescript
// Simplified createSignedUploadUrl
async createSignedUploadUrl(input) {
  // Generate auth token for upload
  const token = generateUploadToken(input);

  // Return SeaweedFS Filer TUS URL with token
  return {
    token: token,
    uploadUrl: `${seaweedfsEndpoint}/tus/${input.bucket}/${input.path}?auth=${token}`,
    expiresIn: 3600,
  };
}
```

### Client Changes

Minimal changes needed - just update the upload endpoint:

```typescript
// Before: tusd endpoint
const upload = new tus.Upload(file, {
  endpoint: tusdUrl,
  metadata: { token, filename: file.name },
});

// After: SeaweedFS Filer TUS endpoint
const upload = new tus.Upload(file, {
  endpoint: seaweedfsTusUrl,
  headers: { 'X-Upload-Token': token },
});
```

## References

- [SeaweedFS Documentation](https://github.com/seaweedfs/seaweedfs/wiki)
- [TUS Protocol Specification](https://tus.io/protocols/resumable-upload.html)
- SeaweedFS Filer TUS: Enabled via filer.toml configuration
