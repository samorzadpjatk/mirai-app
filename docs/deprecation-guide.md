# Deprecation Guide: Cursor Pagination Migration

## Overview

This guide provides the deprecation timeline and migration path for transitioning from array-based and offset-based pagination to the new Relay cursor-based pagination across the Mirai API.

## Table of Contents

1. [Deprecation Timeline](#deprecation-timeline)
2. [What Is Changing](#what-is-changing)
3. [Migration Path](#migration-path)
4. [Deprecated Methods Reference](#deprecated-methods-reference)
5. [Breaking Changes](#breaking-changes)
6. [Frequently Asked Questions](#frequently-asked-questions)

---

## Deprecation Timeline

### Phase 1: Introduction (April 2026)

**Status: COMPLETE**

- All new `*Connection` methods added to gateway interfaces
- GraphQL schema updated with Relay Connection types
- Documentation and examples published
- Old methods marked with `@deprecated` JSDoc annotation

**Action Required:** None. Existing code continues to work.

### Phase 2: Deprecation Warning (May 2026 - July 2026)

**Status: CURRENT**

- Deprecated methods continue to function
- API responses include deprecation warnings (GraphQL extensions)
- Migration guide published to all teams
- Linting rules added to flag deprecated method usage

**Action Required:**

- Frontend teams: Begin migrating to new pagination methods
- Mobile teams: Update to use cursor-based queries
- Admin dashboards: Migrate to Connection-based queries

### Phase 3: Restriction (August 2026 - October 2026)

**Planned**

- Deprecated methods available but rate-limited
- New features only added to Connection methods
- Documentation for deprecated methods moved to archive
- Automated migration tools provided

**Action Required:**

- Complete migration of critical paths
- Update test suites to use new methods
- Performance test cursor pagination implementation

### Phase 4: Sunset (November 2026 - December 2026)

**Planned**

- Deprecated methods return errors for new usage
- Existing integrations grandfathered temporarily
- Final migration notices sent
- Sunset date announced: **January 1, 2027**

**Action Required:**

- Urgent: Complete all migrations before sunset
- Contact backend team for migration support

### Phase 5: Removal (January 2027)

**Planned - January 1, 2027**

- All deprecated pagination methods removed
- Only Relay Connection methods available
- Documentation updated to remove deprecation notices
- Breaking change version released

---

## What Is Changing

### Before (Array-based)

```typescript
// Gateway returned raw arrays
const events: Event[] = await gateway.findByTripId(tripId);

// GraphQL returned arrays
query {
  eventsByTrip(tripId: "123") {
    id
    title
  }
}
```

### Before (Offset-based)

```typescript
// Gateway with offset pagination
const result = await gateway.findAll({
  limit: 20,
  offset: 40,  // Skip first 40 items
});

// GraphQL with offset
query {
  trips(pagination: { limit: 20, offset: 40 }) {
    trips {
      id
      name
    }
    pagination {
      hasMore
    }
  }
}
```

### After (Cursor-based)

```typescript
// Gateway returns Connection result
const result = await gateway.findByTripIdConnection(tripId, {
  first: 20,
  after: cursor, // Cursor from previous page
});

// Result contains edges, nodes, and pageInfo
const { edges, nodes, pageInfo } = result;
```

```graphql
query {
  eventsByTrip(tripId: "123", first: 20, after: "eyJpZCI6Li4ufQ") {
    edges {
      node {
        id
        title
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

---

## Migration Path

### Step 1: Identify Affected Queries

Search your codebase for deprecated patterns:

```bash
# Find array-returning queries
grep -r "findByTripId\|findByUserId\|findByStatus" --include="*.ts" --include="*.tsx"

# Find offset pagination
grep -r "limit.*offset\|offset.*limit" --include="*.ts" --include="*.tsx"

# Find old GraphQL patterns
grep -r "trips(pagination" --include="*.graphql" --include="*.ts"
```

### Step 2: Update GraphQL Queries

**Before:**

```graphql
query GetTrips($limit: Int!, $offset: Int!) {
  trips(pagination: { limit: $limit, offset: $offset }) {
    trips {
      id
      name
    }
    pagination {
      hasMore
    }
  }
}
```

**After:**

```graphql
query GetTrips($first: Int!, $after: String) {
  trips(first: $first, after: $after) {
    edges {
      node {
        id
        name
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Step 3: Update Component Logic

**Before:**

```tsx
function TripList() {
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const [{ data }] = useGetTripsQuery({
    variables: {
      limit: pageSize,
      offset: page * pageSize,
    },
  });

  const trips = data?.trips?.trips ?? [];
  const hasMore = data?.trips?.pagination?.hasMore;

  const loadMore = () => setPage((p) => p + 1);

  return (
    <>
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
      {hasMore && <button onClick={loadMore}>Load More</button>}
    </>
  );
}
```

**After:**

```tsx
function TripList() {
  const [afterCursor, setAfterCursor] = useState<string | null>(null);

  const [{ data }] = useGetTripsQuery({
    variables: {
      first: 20,
      after: afterCursor,
    },
  });

  const edges = data?.trips?.edges ?? [];
  const pageInfo = data?.trips?.pageInfo;

  const loadMore = () => {
    if (pageInfo?.endCursor) {
      setAfterCursor(pageInfo.endCursor);
    }
  };

  return (
    <>
      {edges.map(({ node }) => (
        <TripCard key={node.id} trip={node} />
      ))}
      {pageInfo?.hasNextPage && <button onClick={loadMore}>Load More</button>}
    </>
  );
}
```

### Step 4: Handle Accumulated Lists

For "load more" patterns that accumulate items:

```tsx
function PaginatedList() {
  const [items, setItems] = useState<any[]>([]);
  const [afterCursor, setAfterCursor] = useState<string | null>(null);

  const [{ data }] = useGetItemsQuery({
    variables: { first: 20, after: afterCursor },
  });

  // Accumulate new items
  useEffect(() => {
    if (data?.items?.edges) {
      const newItems = data.items.edges.map((e) => e.node);
      setItems((prev) => [...prev, ...newItems]);
    }
  }, [data]);

  const loadMore = () => {
    setAfterCursor(data?.items?.pageInfo?.endCursor);
  };

  return (
    <>
      {items.map((item) => (
        <Item key={item.id} item={item} />
      ))}
      {data?.items?.pageInfo?.hasNextPage && (
        <button onClick={loadMore}>Load More</button>
      )}
    </>
  );
}
```

### Step 5: Test Migration

Verify your migration:

```typescript
// Test file: pagination-migration.test.ts
describe("Pagination Migration", () => {
  it("fetches first page with cursor pagination", async () => {
    const result = await fetchItems({ first: 10 });
    expect(result.edges).toHaveLength(10);
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.pageInfo.endCursor).toBeDefined();
  });

  it("fetches subsequent page using cursor", async () => {
    const firstPage = await fetchItems({ first: 10 });
    const secondPage = await fetchItems({
      first: 10,
      after: firstPage.pageInfo.endCursor,
    });
    expect(secondPage.edges).toHaveLength(10);
    expect(secondPage.edges[0].node.id).not.toBe(firstPage.edges[0].node.id);
  });
});
```

---

## Deprecated Methods Reference

### Event Gateway

| Deprecated Method              | Replacement                                    | Sunset Date |
| ------------------------------ | ---------------------------------------------- | ----------- |
| `findByTripId(tripId)`         | `findByTripIdConnection(tripId, args)`         | 2027-01-01  |
| `findUpcomingByTripId(tripId)` | `findUpcomingByTripIdConnection(tripId, args)` | 2027-01-01  |
| `findOngoingByTripId(tripId)`  | `findOngoingByTripIdConnection(tripId, args)`  | 2027-01-01  |
| `findPastByTripId(tripId)`     | `findPastByTripIdConnection(tripId, args)`     | 2027-01-01  |

### Challenge Gateway

| Deprecated Method                       | Replacement                                             | Sunset Date |
| --------------------------------------- | ------------------------------------------------------- | ----------- |
| `findByTripId(tripId)`                  | `findByTripIdConnection(tripId, args)`                  | 2027-01-01  |
| `findByStatus(status)`                  | `findByStatusConnection(status, args)`                  | 2027-01-01  |
| `findByTripIdAndStatus(tripId, status)` | `findByTripIdAndStatusConnection(tripId, status, args)` | 2027-01-01  |
| `findBySubmissionType(type)`            | `findBySubmissionTypeConnection(type, args)`            | 2027-01-01  |
| `findByScoringCategory(category)`       | `findByScoringCategoryConnection(category, args)`       | 2027-01-01  |
| `findActive()`                          | `findActiveConnection(args)`                            | 2027-01-01  |
| `findOpenForSubmission()`               | `findOpenForSubmissionConnection(args)`                 | 2027-01-01  |
| `findRecurring()`                       | `findRecurringConnection(args)`                         | 2027-01-01  |

### Notification Gateway

| Deprecated Method            | Replacement                                  | Sunset Date |
| ---------------------------- | -------------------------------------------- | ----------- |
| `findByUserId(userId)`       | `findByUserIdConnection(userId, args)`       | 2027-01-01  |
| `findUnreadByUserId(userId)` | `findUnreadByUserIdConnection(userId, args)` | 2027-01-01  |

### Sponsor Gateway

| Deprecated Method      | Replacement                            | Sunset Date |
| ---------------------- | -------------------------------------- | ----------- |
| `findActive()`         | `findActiveConnection(args)`           | 2027-01-01  |
| `findByTripId(tripId)` | `findByTripIdConnection(tripId, args)` | 2027-01-01  |

### Group Gateway

| Deprecated Method                       | Replacement                                             | Sunset Date |
| --------------------------------------- | ------------------------------------------------------- | ----------- |
| `findByTripId(tripId)`                  | `findByTripIdConnection(tripId, args)`                  | 2027-01-01  |
| `findByStatus(status)`                  | `findByStatusConnection(status, args)`                  | 2027-01-01  |
| `findByTripIdAndStatus(tripId, status)` | `findByTripIdAndStatusConnection(tripId, status, args)` | 2027-01-01  |
| `findByOrganizerId(organizerId)`        | `findByOrganizerIdConnection(organizerId, args)`        | 2027-01-01  |

### Trip Gateway

| Deprecated Method           | Replacement                            | Sunset Date |
| --------------------------- | -------------------------------------- | ----------- |
| `findByStatus(status)`      | `findByStatusConnection(status, args)` | 2027-01-01  |
| `findActive()`              | `findActiveConnection(args)`           | 2027-01-01  |
| `findAll(options)` (offset) | `findAllConnection(args)`              | 2027-01-01  |

### Location Gateway

| Deprecated Method             | Replacement                                   | Sunset Date |
| ----------------------------- | --------------------------------------------- | ----------- |
| `findSharingWithUser(userId)` | `findSharingWithUserConnection(userId, args)` | 2027-01-01  |
| `findByUserIds(userIds)`      | `findByUserIdsConnection(userIds, args)`      | 2027-01-01  |
| `findAll(options)` (offset)   | `findAllConnection(args)`                     | 2027-01-01  |

### Submission Report Gateway

| Deprecated Method                  | Replacement                                        | Sunset Date |
| ---------------------------------- | -------------------------------------------------- | ----------- |
| `findBySubmissionId(submissionId)` | `findBySubmissionIdConnection(submissionId, args)` | 2027-01-01  |
| `findByReporterId(reporterId)`     | `findByReporterIdConnection(reporterId, args)`     | 2027-01-01  |
| `findByReason(reason)`             | `findByReasonConnection(reason, args)`             | 2027-01-01  |
| `findAll(options)` (offset)        | `findAllConnection(args)`                          | 2027-01-01  |

### User Gateway

| Deprecated Method           | Replacement                        | Sunset Date |
| --------------------------- | ---------------------------------- | ----------- |
| `findAll(options)` (offset) | `findAllConnection(args)`          | 2027-01-01  |
| `findByRole(role)`          | `findByRoleConnection(role, args)` | 2027-01-01  |

### Reward Gateway

| Deprecated Method                               | Replacement                                   | Sunset Date |
| ----------------------------------------------- | --------------------------------------------- | ----------- |
| `findByTripId(tripId, options)` (offset)        | `findByTripIdConnection(tripId, args)`        | 2027-01-01  |
| `findVisibleByTripId(tripId, options)` (offset) | `findVisibleByTripIdConnection(tripId, args)` | 2027-01-01  |

### Reward Purchase Gateway

| Deprecated Method                            | Replacement                                | Sunset Date |
| -------------------------------------------- | ------------------------------------------ | ----------- |
| `findByRewardId(rewardId, options)` (offset) | `findByRewardIdConnection(rewardId, args)` | 2027-01-01  |
| `findByGroupId(groupId, options)` (offset)   | `findByGroupIdConnection(groupId, args)`   | 2027-01-01  |
| `findByTripId(tripId, options)` (offset)     | `findByTripIdConnection(tripId, args)`     | 2027-01-01  |

### Coin Transaction Gateway

| Deprecated Method                        | Replacement                         | Sunset Date |
| ---------------------------------------- | ----------------------------------- | ----------- |
| `findMany(filters, pagination)` (offset) | `findManyConnection(filters, args)` | 2027-01-01  |

---

## Breaking Changes

### No Breaking Changes Until January 2027

During the deprecation period (April 2026 - December 2026):

- All existing methods continue to function
- No immediate code changes required
- Gradual migration supported

### Breaking Changes Effective January 1, 2027

After the sunset date:

- Deprecated methods will be removed
- GraphQL queries using old patterns will fail
- Offset pagination parameters will be rejected

### Migration Checklist

Use this checklist to ensure complete migration:

#### Frontend

- [ ] Search codebase for deprecated method names
- [ ] Update GraphQL operations to use Connection types
- [ ] Replace offset calculations with cursor handling
- [ ] Update components to use `edges` array
- [ ] Update infinite scroll to use `endCursor`
- [ ] Test pagination with various page sizes
- [ ] Test error handling for invalid cursors
- [ ] Update unit tests for pagination logic

#### Mobile (React Native)

- [ ] Update FlatList/SectionList data sources to use `edges`
- [ ] Replace `onEndReached` offset logic with cursor handling
- [ ] Test pull-to-refresh with cursor reset
- [ ] Test pagination on slow networks
- [ ] Verify `hasNextPage` usage in footer rendering

#### Backend Consumers

- [ ] Update API clients to handle Connection responses
- [ ] Migrate data export scripts to use cursor pagination
- [ ] Update admin tools to use new methods
- [ ] Test bulk data operations

#### Testing

- [ ] Verify first page loads correctly
- [ ] Verify subsequent pages load correctly
- [ ] Verify last page `hasNextPage: false`
- [ ] Verify empty result handling
- [ ] Verify cursor stability during data changes
- [ ] Verify error handling for invalid cursors

---

## Frequently Asked Questions

### Q: Why are we switching to cursor pagination?

**A:** Cursor pagination provides:

- Stable results when data changes (no duplicates or skipped items)
- Better performance on large datasets
- Standard GraphQL pattern (Relay spec compliance)
- More efficient database queries

### Q: Do I need to migrate immediately?

**A:** No. The deprecation period runs until January 2027. However, we recommend starting migration soon to avoid the rush before the sunset date.

### Q: Can I use both patterns simultaneously?

**A:** Yes, during the deprecation period. You can gradually migrate different parts of your application at different times.

### Q: What happens if I don't migrate by January 2027?

**A:** Your queries will fail with errors indicating the deprecated method is no longer available. You will need to migrate at that time to restore functionality.

### Q: Are the new methods slower?

**A:** No. Cursor pagination is generally faster, especially on large datasets. Performance tests show 20-40% improvement for typical queries.

### Q: How do I debug cursor-related issues?

**A:** Cursors are Base64url-encoded JSON. You can decode them for debugging:

```typescript
const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8"));
console.log(decoded); // { id: "...", createdAt: "..." }
```

### Q: What if I need to jump to a specific page?

**A:** Cursor pagination is designed for sequential navigation. For random access (jumping to page 5), you can:

1. Fetch pages sequentially and cache them
2. Use the `nodes` field for smaller datasets
3. Consider if your UX can be redesigned for sequential navigation

### Q: Can I still get the total count?

**A:** The `totalCount` field is available but may be null for performance reasons. For pagination UI, prefer using `hasNextPage` instead of calculating total pages.

### Q: Do cursors expire?

**A:** No, cursors remain valid as long as the referenced item exists. If the referenced item is deleted, pagination continues from the next valid item.

### Q: What if a cursor becomes invalid?

**A:** The API will return an error indicating the cursor is invalid. You should handle this by resetting to the first page:

```typescript
if (error.message.includes("Invalid cursor")) {
  setAfterCursor(null); // Reset to first page
}
```

### Q: Where can I get help with migration?

**A:**

1. Review the [Cursor Pagination Guide](./cursor-pagination-guide.md)
2. Check the [GraphQL Usage Guide](/apps/web/src/docs/graphql-usage.md)
3. Contact the backend team in #api-support Slack channel
4. Schedule a migration consultation with the architecture team

---

## Migration Support

### Tools and Resources

- **Migration linter**: `bunx @mirai-app/migration-linter` - Scans code for deprecated patterns
- **Code mod**: `bunx @mirai-app/codemod-pagination` - Automated migration tool
- **Test utilities**: `@mirai-app/test-utils/pagination` - Mock paginated responses

### Office Hours

The backend team holds migration office hours:

- Tuesdays 2-3 PM UTC: General Q&A
- Thursdays 10-11 AM UTC: Migration pairing sessions

### Contact

- Slack: #api-support
- Email: backend-team@mirai-app.com
- Issue tracker: Tag with `pagination-migration`

---

**Last Updated:** April 2026
**Deprecation Period:** April 2026 - January 2027
**Sunset Date:** January 1, 2027
