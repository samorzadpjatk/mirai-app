# MinIO + tusd Storage Gateway

**Purpose:** Replace Supabase Storage with self-hosted resumable upload solution

**Status:** MinIO is ARCHIVED - use SeaweedFS instead

---

## Quick Decision Matrix

| Storage Option | License | Maintenance | Self-Host | S3-Compatible | Recommendation |
|---------------|---------|-------------|-----------|---------------|----------------|
| **SeaweedFS** | Apache 2.0 | Active | Yes | Yes | **Primary** |
| Cloudflare R2 | Proprietary | Managed | No | Yes | Alternative |
| AWS S3 | Proprietary | Managed | No | Native | Alternative |
| Ceph | LGPL | Active | Yes | Yes | Complex |
| MinIO | AGPL | **ARCHIVED** | Yes | Yes | **Avoid** |

---

## Recommended Architecture

```
┌─────────────────────────────────────────────┐
│                 Client                      │
│         (tus-js-client library)               │
└──────────────┬──────────────────────────────┘
               │ HTTP (tus protocol)
               ▼
┌─────────────────────────────────────────────┐
│                 tusd Server                 │
│  - Handles resumable upload protocol          │
│  - Streams directly to S3 storage             │
│  - Calls hooks for auth/processing            │
└──────────────┬──────────────────────────────┘
               │ S3 API
               ▼
┌─────────────────────────────────────────────┐
│              SeaweedFS                      │
│  - S3-compatible object storage               │
│  - O(1) disk access                           │
│  - Horizontally scalable                      │
└─────────────────────────────────────────────┘
```

---

## Setup Guide

### 1. Deploy SeaweedFS

**Docker:**
```bash
docker run -d \
  --name seaweedfs \
  -p 9333:9333 \
  -p 8333:8333 \
  -v seaweed-data:/data \
  chrislusf/seaweedfs:latest \
  server -s3 -dir=/data
```

**S3 credentials:**
- Access Key: `admin`
- Secret Key: `admin` (configurable)
- S3 Endpoint: `http://localhost:8333`

### 2. Deploy tusd

**Docker:**
```bash
docker run -d \
  --name tusd \
  -p 8080:8080 \
  -e AWS_ACCESS_KEY_ID=admin \
  -e AWS_SECRET_ACCESS_KEY=admin \
  tusproject/tusd:latest \
  -s3-bucket=uploads \
  -s3-endpoint=http://seaweedfs:8333 \
  -hooks-http=http://your-app:3000/tus-hooks
```

### 3. Implement Hook Handler

**TypeScript/Express example:**
```typescript
import express from 'express';

const app = express();
app.use(express.json());

app.post('/tus-hooks', async (req, res) => {
  const { Type, Event } = req.body;

  switch (Type) {
    case 'pre-create':
      // Authenticate user
      const user = await authenticate(Event.HTTPRequest.Header);
      if (!user) {
        return res.json({
          HTTPResponse: { StatusCode: 401 },
          RejectUpload: true,
        });
      }
      // Set custom upload ID
      return res.json({
        ChangeFileInfo: {
          ID: `${user.id}/${Date.now()}-${Event.Upload.MetaData.filename}`,
          MetaData: { userId: user.id },
        },
      });

    case 'post-finish':
      // Save file record to database
      await db.files.create({
        id: Event.Upload.ID,
        bucket: Event.Upload.Storage.Bucket,
        size: Event.Upload.Size,
        userId: Event.Upload.MetaData.userId,
      });
      return res.json({});

    default:
      return res.json({});
  }
});
```

### 4. Client Integration

**Install:**
```bash
npm install tus-js-client
```

**Upload component:**
```typescript
import * as tus from 'tus-js-client';

function uploadFile(file: File, endpoint: string) {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: file.name,
        filetype: file.type,
      },
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      onError: reject,
      onSuccess: () => resolve(upload.url),
      onProgress: (bytesUploaded, bytesTotal) => {
        const percent = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        console.log(`${percent}% uploaded`);
      },
    });

    // Resume previous upload if exists
    upload.findPreviousUploads().then((previous) => {
      if (previous.length > 0) {
        upload.resumeFromPreviousUpload(previous[0]);
      }
      upload.start();
    });
  });
}
```

---

## Key Configuration

### tusd Environment Variables
| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | S3 secret key |
| `AWS_REGION` | S3 region (default: us-east-1) |

### tusd Command Flags
| Flag | Description |
|------|-------------|
| `-s3-bucket` | Target S3 bucket name |
| `-s3-endpoint` | Custom S3 endpoint URL |
| `-s3-object-prefix` | Prefix for all objects |
| `-hooks-http` | HTTP endpoint for hooks |
| `-hooks-http-forward-headers` | Headers to forward to hooks |
| `-hooks-enabled-events` | Which hooks to enable |

### CORS Configuration
Enable CORS for browser uploads:
```bash
tusd -s3-bucket=mybucket -cors-origin="https://myapp.com"
```

---

## Migration from Supabase Storage

### 1. Data Migration
```typescript
// Copy files from Supabase to SeaweedFS
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: 'http://seaweedfs:8333',
  credentials: { accessKeyId: 'admin', secretAccessKey: 'admin' },
  region: 'us-east-1',
  forcePathStyle: true,
});

async function migrateFile(supabaseUrl: string, newKey: string) {
  const response = await fetch(supabaseUrl);
  const blob = await response.blob();
  
  await s3Client.send(new PutObjectCommand({
    Bucket: 'uploads',
    Key: newKey,
    Body: blob,
  }));
}
```

### 2. URL Migration
Update database records with new storage URLs:
```typescript
// Old: https://xxxx.supabase.co/storage/v1/object/public/bucket/file.jpg
// New: https://your-cdn.com/uploads/user-id/timestamp-file.jpg
```

### 3. Client Migration
Replace Supabase client with tus-js-client:
```typescript
// Before (Supabase)
const { data, error } = await supabase.storage
  .from('bucket')
  .upload('file.jpg', file);

// After (tus)
await uploadFile(file, 'https://tusd.example.com/files/');
```

---

## Available Hooks

| Hook | Blocking | Triggered | Use For |
|------|----------|-----------|---------|
| `pre-create` | Yes | Before upload creation | Auth, validation, custom ID |
| `post-create` | No | After upload created | Logging, registration |
| `post-receive` | No | During data transfer | Progress tracking |
| `pre-finish` | Yes | Before completion response | Modify response |
| `post-finish` | No | After upload complete | Post-processing, DB sync |
| `pre-terminate` | Yes | Before deletion | Permission check |
| `post-terminate` | No | After deletion | Cleanup |

---

## Comparison: Supabase vs tusd+SeaweedFS

| Feature | Supabase Storage | tusd + SeaweedFS |
|---------|------------------|------------------|
| Resumable uploads | Limited | Full protocol support |
| Self-hosted | No | Yes |
| S3-compatible | Yes | Yes |
| Built-in auth | RLS | Custom via hooks |
| Image transforms | Yes | No (use Sharp/ImageMagick) |
| CDN | Built-in | Configure separately |
| Cost | Usage-based | Infrastructure cost |
| Maintenance | Managed | Self-managed |

---

## References

- **tus Protocol:** https://tus.io/protocols/resumable-upload.html
- **tusd Docs:** https://tus.github.io/tusd/
- **tus-js-client:** https://github.com/tus/tus-js-client
- **SeaweedFS:** https://github.com/seaweedfs/seaweedfs
- **AWS SDK v3:** https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/
