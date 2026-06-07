# Conflict Resolution Analysis for MIRAI Challenge Submission Types

> **Source**: Analysis of awesome-local-first patterns applied to MIRAI's challenge system
> **Scope**: Challenge submissions (`challengeSubmissions` table, 7 submission types)
> **Constraint**: Unique index on `(challengeId, groupId)` — only one submission per group per challenge

## 1. The Core Conflict Problem

MIRAI's challenge system has a **hard constraint**: each group can submit **exactly once** per challenge (unique index `challenge_submissions_challenge_id_group_id_unique`).

When two group members submit offline:
- **Member A** submits photo at 14:00 (offline)
- **Member B** submits photo at 14:05 (offline)
- Both come online at 14:30
- **Conflict**: Which submission wins? The server accepts one, rejects the other.

This is not a merge conflict (like text editing). It's a **replacement conflict** — only one submission can exist.

## 2. Conflict Resolution Patterns from Local-First Ecosystem

### 2.1 Pattern Catalog

| Pattern | Source | Best For | Complexity |
|---------|--------|----------|------------|
| **Last-Write-Wins (LWW)** | Replicache, Linear | Single-value replacements, simple state | Low |
| **Multi-Value Register (MV-R)** | CRDT theory | Keep all values, let UI choose | Medium |
| **Operational Transform (OT)** | Google Docs, Figma | Collaborative text editing | High |
| **Delta-State CRDTs** | Yjs, Automerge | Complex nested objects, real-time collab | High |
| **Server-Authority Queue** | Superhuman, Trello | Mutation queue with server reconciliation | Low |
| **Timestamp-Based Priority** | General | Time-sensitive competitions (speed challenges) | Low |
| **User-Initiated Merge** | Git, Obsidian | Explicit conflict resolution UI | Medium |

### 2.2 Pattern Analysis for MIRAI

**LWW (Last-Write-Wins)**
- Pros: Simple, deterministic, no UI needed
- Cons: Silent data loss — first submitter's work disappears without warning
- Verdict: **Too risky for group submissions** — members lose work silently

**Server-Authority Queue**
- Pros: Matches current architecture (oRPC), predictable, easy to implement
- Cons: First submitter wins, second gets error
- Verdict: **Good baseline** — but needs explicit conflict handling

**Timestamp-Based Priority**
- Pros: Fair for speed challenges, objective criteria
- Cons: Clock skew issues, doesn't work for non-speed challenges
- Verdict: **Good for SPEED category only**

**User-Initiated Merge**
- Pros: No silent data loss, user controls outcome
- Cons: Complex UI, interrupts flow, may not resolve before deadline
- Verdict: **Overkill for event app** — too much friction

**Multi-Value Register (Keep Both)**
- Pros: No data loss, server stores both, admin can adjudicate
- Cons: Breaks schema constraint (unique index), needs UI changes
- Verdict: **Best for MIRAI** — relax constraint, let admin decide

## 3. Submission Type-Specific Conflict Resolution

### 3.1 Type Matrix

| Submission Type | Data Structure | Conflict Nature | Recommended Strategy |
|-----------------|----------------|-----------------|---------------------|
| **IMAGE** | Single image file | Replacement | Server-Authority + Keep Both option |
| **MULTI_IMAGE** | Array of image files | Append/Replace | Timestamp priority + Merge arrays |
| **VIDEO** | Single video file | Replacement | Server-Authority + Keep Both option |
| **TEXT** | Text string | Mergeable | LWW or Text concatenation |
| **IMAGE_LOCATION** | Image + GPS coords | Hybrid | Server-Authority with location validation |
| **LOCATION** | GPS coordinates only | Replacement | LWW (latest check-in wins) |
| **QR_CODE** | Scanned string | Replacement | LWW (first valid scan wins) |

### 3.2 Detailed Analysis per Type

#### IMAGE (Single Image)

**Conflict scenario**: Two group members take different photos for the same challenge.

**Current behavior**: `imageIds: text[].array().default([])` — actually supports array, but UI treats as single.

**Resolution strategy**: **Server-Authority + Admin Override**
```
1. First submission arrives → accepted, status=PENDING
2. Second submission arrives → conflict detected
3. Options:
   a) Reject second (current behavior)
   b) Accept second, mark first as SUPERSEDED (new)
   c) Keep both, let admin choose (recommended)
```

**Implementation**: Add `supersededById` column to `challengeSubmissions`. When conflict detected, mark old submission as superseded, new one as PENDING. Admin sees both in review UI.

#### MULTI_IMAGE (Multiple Images)

**Conflict scenario**: Two members submit different sets of photos.

**Resolution strategy**: **Merge Arrays (Timestamp Priority)**
```
1. Both submissions accepted (relax unique constraint for this type)
2. Merge imageIds arrays: `[...A.imageIds, ...B.imageIds]`
3. Deduplicate by file hash
4. Admin reviews all images together
```

**Implementation**: Remove unique constraint for `MULTI_IMAGE` type. Store all submissions, merge for display.

#### VIDEO (Single Video)

**Conflict scenario**: Two group members record different videos.

**Resolution strategy**: **Same as IMAGE** — Server-Authority + Admin Override

**Special consideration**: Videos are large. Upload bandwidth is precious. Should queue only one video per group at a time to avoid saturating the upload queue.

#### TEXT (Text Submission)

**Conflict scenario**: Two members write different text answers.

**Resolution strategy**: **Text Concatenation with Attribution**
```
1. Both submissions accepted
2. Concatenate: "Member A wrote: [text A]\n\nMember B wrote: [text B]"
3. Or use simple LWW if challenge expects single answer
```

**Implementation**: For `TEXT` type, relax unique constraint. Store all submissions, display concatenated or with tabs.

#### IMAGE_LOCATION (Image + GPS)

**Conflict scenario**: Two members submit photos from different locations.

**Resolution strategy**: **Location Validation + Timestamp**
```
1. Check if locations are within challenge radius
2. If both valid: keep both (array of submissions)
3. If one invalid: reject invalid, keep valid
4. If challenge requires specific location: use closest match
```

**Implementation**: Add `locationValidation` to challenge config. Store all submissions, filter by proximity.

#### LOCATION (GPS Check-in)

**Conflict scenario**: Two members check in from different spots.

**Resolution strategy**: **LWW (Latest Check-in Wins)**
```
1. Simple replacement: latest GPS coordinates win
2. No conflict needed — location is inherently temporal
3. Store history if needed, but display latest
```

**Implementation**: Keep unique constraint. Simple update-in-place.

#### QR_CODE (QR Scan)

**Conflict scenario**: Two members scan different QR codes (or same one twice).

**Resolution strategy**: **First Valid Wins**
```
1. If QR codes match: deduplicate, no conflict
2. If QR codes differ: first valid scan wins
3. "Valid" determined by challenge config (which QR codes are accepted)
```

**Implementation**: Add `qrCodeValue` to challenge config. Check against allowed values. Store first valid.

## 4. Scoring Category Implications

| Scoring Category | Conflict Sensitivity | Recommended Strategy |
|-----------------|---------------------|---------------------|
| **SPEED** | High (first submission = more points) | Timestamp priority, strict unique constraint |
| **UNLIMITED** | Low (many submissions allowed) | Remove unique constraint, accept all |
| **JUDGED_STAFF** | Medium (admin picks best) | Keep all, admin selects winner |
| **PEER_VOTING** | Medium (voters pick best) | Keep all, display for voting |

### 4.1 SPEED Challenges

For speed challenges, **time is the conflict resolver**:
```
1. Submission includes `createdAt` timestamp
2. Earlier timestamp = higher priority
3. If offline: queue timestamp is device time (risk of clock skew)
4. Mitigation: use server time when received, but award based on queue order
```

**Special rule**: If two submissions arrive simultaneously (within 5s), both are accepted and marked as TIE. Admin resolves tie.

### 4.2 UNLIMITED Challenges

No conflict! Remove unique constraint entirely:
```
1. Any number of submissions per group
2. All submissions counted independently
3. Points accumulated across all submissions
```

### 4.3 JUDGED_STAFF Challenges

**Keep all submissions, let staff pick**:
```
1. Remove unique constraint
2. All submissions shown in admin review panel
3. Staff selects "best" submission
4. Winner gets points, others get 0
```

### 4.4 PEER_VOTING Challenges

**Keep all submissions, let peers vote**:
```
1. Remove unique constraint
2. All submissions displayed in voting UI
3. Votes tallied per submission
4. Winner determined by vote count
```

## 5. Schema Changes Required

### 5.1 Option A: Add `supersededById` (Minimal Change)

```sql
-- Add column to challengeSubmissions
ALTER TABLE challenge_submissions 
ADD COLUMN superseded_by_id VARCHAR(36) REFERENCES challenge_submissions(id);

-- Add index for querying
CREATE INDEX idx_challenge_submissions_superseded ON challenge_submissions(superseded_by_id);
```

**Behavior**: When conflict detected, mark old submission as superseded. New submission is primary. Admin can see both.

### 5.2 Option B: Remove Unique Constraint (Per Type)

```sql
-- Drop existing unique constraint
DROP INDEX challenge_submissions_challenge_id_group_id_unique;

-- Add partial unique constraint for types that need it
CREATE UNIQUE INDEX challenge_submissions_unique_speed 
ON challenge_submissions(challenge_id, group_id) 
WHERE challenge_type IN ('SPEED', 'LOCATION', 'QR_CODE');
```

**Behavior**: Some types allow multiple submissions, others don't. More flexible but complex.

### 5.3 Option C: Add `submissionAttempts` Table (Recommended)

```sql
-- New table for all attempts
CREATE TABLE challenge_submission_attempts (
    id VARCHAR(36) PRIMARY KEY,
    submission_id VARCHAR(36) REFERENCES challenge_submissions(id),
    group_id VARCHAR(36) NOT NULL,
    challenge_id VARCHAR(36) NOT NULL,
    image_ids TEXT[] DEFAULT '{}',
    video_id TEXT,
    text_content TEXT,
    latitude REAL,
    longitude REAL,
    status VARCHAR(20) DEFAULT 'PENDING',
    attempted_at TIMESTAMP DEFAULT NOW(),
    attempted_by VARCHAR(36) REFERENCES users(id)
);

-- Keep challenge_submissions as the "selected" submission
-- Keep unique constraint on (challenge_id, group_id)
```

**Behavior**: All attempts stored. One "selected" submission per group. Admin or system picks winner from attempts.

## 6. Implementation Recommendations

### 6.1 Phase 1: Server-Authority Queue (Immediate)

```typescript
// hooks/challenges/useOfflineSubmission.ts
interface QueuedSubmission {
  id: string;
  challengeId: string;
  groupId: string;
  type: SubmissionType;
  payload: SubmissionPayload;
  deviceTimestamp: number;
  status: 'pending' | 'conflict' | 'accepted' | 'rejected';
  conflictResolution?: 'first-wins' | 'last-wins' | 'admin-decides';
}
```

**Queue processor**:
```typescript
async function processSubmissionQueue() {
  const pending = await getPendingSubmissions();
  
  for (const submission of pending) {
    try {
      const result = await submitToServer(submission);
      
      if (result.status === 'CONFLICT') {
        // Handle based on type
        await handleConflict(submission, result.existingSubmission);
      } else {
        markAsSynced(submission.id);
      }
    } catch (error) {
      markForRetry(submission.id);
    }
  }
}
```

### 6.2 Phase 2: Type-Aware Conflict Resolution

```typescript
const conflictStrategies: Record<SubmissionType, ConflictStrategy> = {
  IMAGE: { type: 'server-authority', fallback: 'admin-override' },
  MULTI_IMAGE: { type: 'merge-arrays', deduplicate: true },
  VIDEO: { type: 'server-authority', fallback: 'admin-override' },
  TEXT: { type: 'concatenate', separator: '\n\n' },
  IMAGE_LOCATION: { type: 'location-validation', radius: 100 },
  LOCATION: { type: 'lww', field: 'coordinates' },
  QR_CODE: { type: 'first-valid', allowedValues: [] },
};
```

### 6.3 Phase 3: Admin Conflict Resolution UI

```
Admin Panel > Challenges > Review Submissions

[Submission A] [Submission B] [Submission C]
  Photo 1      Photo 2      Photo 3
  
[Select as Winner] [Mark as Superseded] [Reject]
```

## 7. Testing Strategy

| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| Offline parallel submit | Two members submit same challenge offline | Both queued, first processed wins, second marked conflict |
| Online conflict | Two members submit simultaneously online | Server rejects second, returns conflict error |
| Type-specific merge | MULTI_IMAGE from two members | Both accepted, images merged |
| Speed challenge | Two submissions with different timestamps | Earlier timestamp wins |
| Unlimited challenge | Multiple submissions | All accepted, points accumulated |
| Admin override | Staff selects different winner than system | Staff choice wins, points recalculated |

## 8. References

- [Replicache Conflict Resolution](https://replicache.dev) — Client-side sync with server authority
- [Superhuman Offline Architecture](https://blog.superhuman.com/architecting-a-web-app-to-just-work-offline-part-1/) — Queue-based offline handling
- [Trello Offline Sync](https://www.atlassian.com/blog/atlassian-engineering/sync-architecture) — Offline-first patterns
- [Linear Sync Engine](https://linear.app/now/scaling-the-linear-sync-engine) — Delta sync with conflict resolution
- [CRDT Primer](https://jakelazaroff.com/words/an-interactive-intro-to-crdts/) — CRDT basics for collaborative data
- [Ink & Switch: Peritext](https://www.inkandswitch.com/peritext/) — Rich text CRDT (for TEXT submissions)
