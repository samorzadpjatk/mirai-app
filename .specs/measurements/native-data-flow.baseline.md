# Native Data-Flow Baseline

## Measurement Date

<!-- YYYY-MM-DD -->

## Dev Stack

- Docker Compose: `environment/docker-compose.dev.yml`
- Backend server: `backend-server` container (`localhost:2022`)
- Native app: iOS Simulator via `cd apps/native && bun run ios`
- Commit under test: `__FILL_IN_SHA__`

## Simulator Walkthrough

1. Cold start app (logged in).
2. Wait for home screen fully loaded.
3. Tap into trip list.
4. Tap into trip details.
5. Navigate back to trip list.
6. Repeat trip details → back ×2.
7. Tap community tab.
8. Tap admin tab.
9. Return to home.

## Backend Request Summary

```json
{
  "totalOrpcCalls": "__FILL_IN__",
  "batchedCalls": "__FILL_IN__",
  "unbatchedCalls": "__FILL_IN__",
  "rateLimitHits": "__FILL_IN__",
  "procedureCounts": {
    "__procedure__": "__count__"
  }
}
```

## Image Refetch Observations

- Number of image requests on first home load: `__FILL_IN__`
- Number of image requests on second home load (after navigation): `__FILL_IN__`
- Flickering observed: yes / no

## 429 / Rate Limiting

- Total 429s during walkthrough: `__FILL_IN__`
- Steps that triggered 429s: `__FILL_IN__`

## Per-Screen Request Breakdown

| Screen | oRPC Calls | Image Fetches | Notes |
|---|---|---|---|
| Cold-start Home | | | |
| Trip List | | | |
| Trip Details (first) | | | |
| Trip Details (return) | | | |
| Community | | | |
| Admin | | | |

## Notes

<!-- Any anomalies, cached vs. network behavior, or follow-up questions. -->
