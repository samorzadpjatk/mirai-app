# tusd Webhooks API Documentation

This document describes the tusd webhook endpoints used for authentication and upload lifecycle management.

## Overview

The tusd server communicates with the backend via HTTP webhooks during the upload lifecycle. These webhooks enable:

- **Authentication**: Validate upload tokens before file creation
- **Authorization**: Ensure users can only upload to their designated buckets
- **Lifecycle Tracking**: Record upload completion and cleanup

## Architecture

```
┌──────────────┐     ┌───────────┐     ┌──────────────┐     ┌───────────┐
│  Mobile App  │────►│   tusd    │────►│   Backend    │────►│   Redis   │
│ tus-js-client│     │  (1080)   │     │TusHookController    │  (6379)   │
└──────────────┘     └─────┬─────┘     └──────────────┘     └───────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  SeaweedFS   │
                    │   (8333)     │
                    └──────────────┘
```

## Endpoint

### POST /tus-hooks

Receives all tusd webhook events. The `Type` field in the payload determines the hook type.

**URL**: `http://backend:2022/tus-hooks`

**Method**: `POST`

**Content-Type**: `application/json`

**Authentication**: Internal network only (tusd calls backend within Docker network)

---

## Hook Types

### 1. pre-create

Triggered before a new upload is created. Used to validate the upload token and authorize the upload.

**When**: User initiates upload to tusd endpoint

**Purpose**: Validate upload ticket, reject unauthorized uploads

**Request Payload**:

```json
{
  "Type": "pre-create",
  "Event": {
    "Upload": {
      "ID": "upload-uuid",
      "Size": 10485760,
      "MetaData": {
        "filename": "profile-photo.jpg",
        "userId": "user-uuid",
        "token": "upload-ticket-token"
      }
    },
    "HTTPRequest": {
      "Header": {
        "Content-Type": ["application/offset+octet-stream"],
        "Upload-Length": ["10485760"]
      }
    }
  }
}
```

**Success Response** (200 OK):

```json
{
  "ChangeFileInfo": {
    "ID": "custom-id-optional",
    "MetaData": {
      "validated": "true"
    }
  }
}
```

**Rejection Response** (401 Unauthorized):

```json
{
  "HTTPResponse": {
    "StatusCode": 401,
    "Body": "Invalid or expired upload token"
  },
  "RejectUpload": true
}
```

**Validation Logic**:

1. Extract `token` from `Event.Upload.MetaData.token`
2. Query Redis for ticket by token
3. Verify ticket exists and is not expired
4. Verify ticket has not been used (single-use)
5. Verify userId matches the authenticated user
6. Verify bucket matches allowed buckets for user

**Error Scenarios**:

| Error | Response | Reason |
|-------|----------|--------|
| Token missing | 401 | No token in metadata |
| Token not found | 401 | Ticket doesn't exist in Redis |
| Token expired | 401 | TTL has passed |
| Token used | 401 | Single-use ticket already consumed |
| User mismatch | 401 | Token userId doesn't match request |
| Redis unavailable | 500 | Service temporarily unavailable |

---

### 2. post-finish

Triggered when an upload completes successfully. Used to mark the ticket as used and record upload metadata.

**When**: File upload completes (all chunks received)

**Purpose**: Mark ticket as consumed, record completion

**Request Payload**:

```json
{
  "Type": "post-finish",
  "Event": {
    "Upload": {
      "ID": "upload-uuid",
      "Size": 10485760,
      "MetaData": {
        "filename": "profile-photo.jpg",
        "userId": "user-uuid",
        "token": "upload-ticket-token",
        "bucket": "avatars",
        "path": "users/user-uuid/profile-photo.jpg"
      },
      "Storage": {
        "Bucket": "avatars",
        "Key": "users/user-uuid/profile-photo.jpg"
      }
    },
    "HTTPRequest": {
      "Header": {
        "Content-Type": ["application/offset+octet-stream"]
      }
    }
  }
}
```

**Success Response** (200 OK):

```json
{
  "HTTPResponse": {
    "StatusCode": 200
  }
}
```

**Actions Performed**:

1. Mark ticket as used in Redis (atomic operation)
2. Record upload completion in application database (optional)
3. Log upload metrics for observability

**Idempotency**: post-finish may be called multiple times in edge cases. The ticket marking operation is idempotent (setting `used=true` multiple times has same effect).

---

### 3. post-terminate

Triggered when an upload is terminated (cancelled or expired). Used to clean up resources.

**When**: Upload is cancelled by client or expires

**Purpose**: Cleanup unused tickets, release resources

**Request Payload**:

```json
{
  "Type": "post-terminate",
  "Event": {
    "Upload": {
      "ID": "upload-uuid",
      "Size": 5242880,
      "MetaData": {
        "filename": "partial-upload.jpg",
        "userId": "user-uuid",
        "token": "upload-ticket-token"
      }
    },
    "HTTPRequest": {
      "Header": {}
    }
  }
}
```

**Success Response** (200 OK):

```json
{
  "HTTPResponse": {
    "StatusCode": 200
  }
}
```

**Actions Performed**:

1. Mark ticket as used (prevents reuse even if upload failed)
2. Log termination reason for debugging
3. Clean up any partial state if needed

---

## Authentication Flow

```
┌─────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  Client │───►│   GraphQL    │───►│   Backend   │───►│    Redis     │
│         │    │ createUpload │    │             │    │  (Ticket)    │
└────┬────┘    └──────────────┘    └─────────────┘    └──────────────┘
     │                                                      │
     │ 2. Return: {tusdUrl, token}                         │
     │◄─────────────────────────────────────────────────────┘
     │
     │ 3. POST tusdUrl (with token in metadata)
     ├─────────────────────────────────────────────────────────────►
     │                                    ┌───────────┐
     │                                    │   tusd    │
     │                                    └─────┬─────┘
     │                                          │
     │ 4. POST /tus-hooks (pre-create)          │
     │◄─────────────────────────────────────────┘
     │                                          │
     │ 5. Validate token with Redis             │
     ├─────────────────────────────────────────────────────────────►
     │◄─────────────────────────────────────────────────────────────┘
     │                                          │
     │ 6. Upload authorized                     │
     │◄─────────────────────────────────────────┘
     │                                          │
     │ 7. Stream file to SeaweedFS              │
     ├─────────────────────────────────────────────────────────────►
     │                                          │
     │ 8. POST /tus-hooks (post-finish)         │
     │◄─────────────────────────────────────────┘
     │                                          │
     │ 9. Mark ticket used                      │
     ├─────────────────────────────────────────────────────────────►
     │                                          │
     │ 10. Upload complete                      │
     │◄─────────────────────────────────────────┘
```

## Request/Response Payload Formats

### TusHookPayload Schema

```typescript
interface TusHookPayload {
  // Hook type discriminator
  Type: 'pre-create' | 'post-finish' | 'post-terminate';

  Event: {
    Upload: {
      // Unique upload identifier (UUID)
      ID: string;

      // Total upload size in bytes
      Size: number;

      // Client-provided metadata
      MetaData: {
        filename: string;      // Original filename
        userId: string;        // Authenticated user ID
        token: string;         // Upload ticket token
        bucket?: string;       // Target bucket (optional)
        path?: string;         // Object path (optional)
        [key: string]: string; // Additional custom metadata
      };

      // Storage information (post-finish only)
      Storage?: {
        Bucket: string;        // SeaweedFS bucket
        Key: string;           // Object key
      };
    };

    HTTPRequest: {
      Header: Record<string, string[]>;  // Request headers
    };
  };
}
```

### TusHookResponse Schema

```typescript
// Success - allow upload with modifications
type AllowResponse = {
  ChangeFileInfo?: {
    ID?: string;              // Optional: Change upload ID
    MetaData?: {               // Optional: Add/modify metadata
      [key: string]: string;
    };
  };
};

// Rejection - deny upload
type RejectResponse = {
  HTTPResponse: {
    StatusCode: number;       // HTTP status (typically 401)
    Body?: string;            // Optional: Error message
  };
  RejectUpload: true;         // Required: Must be true
};

type TusHookResponse = AllowResponse | RejectResponse;
```

## Error Handling

### Backend Error Responses

| Status Code | Meaning | Action by tusd |
|-------------|---------|----------------|
| 200 | Success | Continue upload |
| 401 | Unauthorized | Reject upload, return 401 to client |
| 500 | Server Error | Retry with exponential backoff (3 attempts) |
| 503 | Service Unavailable | Retry with exponential backoff |

### tusd Retry Configuration

```yaml
# docker-compose.storage.yml
services:
  tusd:
    image: tusproject/tusd:v2
    environment:
      - TUSD_HOOKS_RETRY=3
      - TUSD_HOOKS_BACKOFF=1s
      - TUSD_HOOKS_TIMEOUT=30s
```

## Security Considerations

### 1. Network Isolation

The `/tus-hooks` endpoint should only be accessible from within the Docker network:

```yaml
# docker-compose.yml
services:
  backend:
    networks:
      - internal
      - public
    # tus-hooks only accessible on internal network

  tusd:
    networks:
      - internal  # Only internal network, no public access
```

### 2. Token Validation

Tokens are validated against Redis with the following checks:

- **Existence**: Token must exist in Redis
- **Expiration**: Token must not be expired (Redis TTL)
- **Single-use**: Token must not have been used before
- **Scope**: User and bucket must match ticket

### 3. Metadata Tampering

The `userId` in metadata is set by the backend when creating the upload URL, not by the client. This prevents users from uploading to other users' directories.

## Monitoring and Observability

### Logs

All webhook calls are logged with:

- Hook type (pre-create, post-finish, post-terminate)
- Upload ID
- User ID (from metadata)
- Token (redacted, first 8 chars only)
- Response status
- Processing time

Example log entry:

```
[2024-01-15T10:30:00Z] INFO: TusHook pre-create received
  uploadId: upload-abc-123
  userId: user-def-456
  token: a1b2c3d4... (redacted)
  result: ALLOWED
  duration: 12ms
```

### Metrics

Prometheus metrics exposed:

```
# HELP tusd_hooks_total Total number of tusd hook calls
# TYPE tusd_hooks_total counter
tusd_hooks_total{hook_type="pre-create", result="allowed"} 1234
tusd_hooks_total{hook_type="pre-create", result="rejected"} 56
tusd_hooks_total{hook_type="post-finish", result="success"} 1230

# HELP tusd_hook_duration_seconds Hook processing duration
# TYPE tusd_hook_duration_seconds histogram
tusd_hook_duration_seconds_bucket{hook_type="pre-create",le="0.01"} 1200
```

## Testing Webhooks

### Manual Testing with curl

```bash
# Test pre-create hook
curl -X POST http://localhost:2022/tus-hooks \
  -H "Content-Type: application/json" \
  -d '{
    "Type": "pre-create",
    "Event": {
      "Upload": {
        "ID": "test-upload-123",
        "Size": 1024,
        "MetaData": {
          "filename": "test.txt",
          "userId": "test-user-456",
          "token": "valid-token-from-redis"
        }
      },
      "HTTPRequest": {
        "Header": {}
      }
    }
  }'
```

### Integration Test

```bash
# Run storage integration tests
bun run test:integration --testNamePattern="tusd"
```

## References

- [tusd Documentation](https://github.com/tus/tusd/blob/main/docs/hooks.md)
- [tus Protocol Specification](https://tus.io/protocols/resumable-upload.html)
- [SeaweedFS S3 API](https://github.com/seaweedfs/seaweedfs/wiki/Amazon-S3-API)
