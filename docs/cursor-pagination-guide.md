# Cursor Pagination Guide

## Overview

This guide explains the Relay Cursor Connections Specification implementation across the Mirai API. All list-returning GraphQL queries now support cursor-based pagination, providing stable and performant pagination for large datasets.

## Table of Contents

1. [Relay Connection Specification](#relay-connection-specification)
2. [GraphQL Query Examples](#graphql-query-examples)
3. [Consuming Paginated Endpoints](#consuming-paginated-endpoints)
4. [Cursor Encoding](#cursor-encoding)
5. [Best Practices](#best-practices)

---

## Relay Connection Specification

The Mirai API follows the [GraphQL Cursor Connections Specification](https://relay.dev/graphql/connections.htm) defined by the Relay project. This specification provides a standardized approach to pagination that:

- Ensures stable results when data changes during navigation
- Supports efficient forward and backward pagination
- Works seamlessly with real-time data updates

### Connection Structure

Every paginated query returns a `Connection` object with the following structure:

```graphql
type ConnectionName {
  # Array of edges containing nodes and cursors
  edges: [EdgeName!]!

  # Convenience field: direct access to all nodes
  nodes: [NodeType!]!

  # Pagination information
  pageInfo: PageInfo!

  # Total count of all matching items (optional, may be null for performance)
  totalCount: Int
}

type EdgeName {
  # The actual entity
  node: NodeType!

  # Opaque cursor string for this position
  cursor: String!
}

type PageInfo {
  # Whether more items exist after the current page
  hasNextPage: Boolean!

  # Whether more items exist before the current page
  hasPreviousPage: Boolean!

  # Cursor of the first edge in the current page
  startCursor: String

  # Cursor of the last edge in the current page
  endCursor: String
}
```

### Pagination Arguments

Paginated queries accept standard Relay pagination arguments:

| Argument | Type     | Description                                                          |
| -------- | -------- | -------------------------------------------------------------------- |
| `first`  | `Int`    | Number of items to fetch after the cursor (default: 20, max: 100)    |
| `after`  | `String` | Cursor to fetch items after (for forward pagination)                 |
| `last`   | `Int`    | Number of items to fetch before the cursor (for backward pagination) |
| `before` | `String` | Cursor to fetch items before (for backward pagination)               |

### Sort Stability

All paginated queries use composite sort keys to ensure stable ordering:

- **Primary sort**: `createdAt` (or domain-specific field like `startTime` for events)
- **Tiebreaker**: `id` (unique identifier guarantees consistent ordering)

This prevents items from shifting between pages when timestamps collide or data changes.

---

## GraphQL Query Examples

### Basic Forward Pagination

Fetch the first 20 events for a trip:

```graphql
query GetEvents($tripId: ID!, $first: Int!) {
  eventsByTrip(tripId: $tripId, first: $first) {
    edges {
      node {
        id
        title
        description
        startTime
        endTime
        location {
          name
        }
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

**Variables:**

```json
{
  "tripId": "trip_abc123",
  "first": 20
}
```

### Subsequent Pages

Use the `endCursor` from the previous page to fetch the next page:

```graphql
query GetEventsNextPage($tripId: ID!, $first: Int!, $after: String!) {
  eventsByTrip(tripId: $tripId, first: $first, after: $after) {
    edges {
      node {
        id
        title
        startTime
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

**Variables:**

```json
{
  "tripId": "trip_abc123",
  "first": 20,
  "after": "eyJpZCI6ImV2dF94eXo3ODkiLCJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1VDEwOjAwOjAwWiJ9"
}
```

### Using the Nodes Shortcut

For simple cases where you only need the entities:

```graphql
query GetEventsSimple($tripId: ID!, $first: Int!) {
  eventsByTrip(tripId: $tripId, first: $first) {
    nodes {
      id
      title
      startTime
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Pagination with Filtering

Combine pagination with filter arguments:

```graphql
query GetUnreadNotifications($userId: ID!, $first: Int!, $after: String) {
  unreadNotificationsByUser(userId: $userId, first: $first, after: $after) {
    edges {
      node {
        id
        type
        message
        createdAt
        readAt
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

### Complete Page Information

Request full pagination metadata:

```graphql
query GetChallengesFull($tripId: ID!, $first: Int!) {
  challengesByTrip(tripId: $tripId, first: $first) {
    edges {
      node {
        id
        title
        description
        status
        coinsReward
      }
      cursor
    }
    nodes {
      id
      title
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

### Backward Pagination

Fetch previous items (for "load earlier" functionality):

```graphql
query GetPreviousEvents($tripId: ID!, $last: Int!, $before: String!) {
  eventsByTrip(tripId: $tripId, last: $last, before: $before) {
    edges {
      node {
        id
        title
        startTime
      }
      cursor
    }
    pageInfo {
      hasPreviousPage
      startCursor
    }
  }
}
```

---

## Consuming Paginated Endpoints

### React Component with urql

```tsx
import { useState } from "react";
import { useGetEventsByTripQuery } from "@mirai-app/graphql-client/urql";

interface EventListProps {
  tripId: string;
}

export function EventList({ tripId }: EventListProps) {
  const [pageSize] = useState(20);
  const [afterCursor, setAfterCursor] = useState<string | null>(null);

  const [{ data, fetching, error }] = useGetEventsByTripQuery({
    variables: {
      tripId,
      first: pageSize,
      after: afterCursor,
    },
  });

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const events = data?.eventsByTrip?.edges ?? [];
  const pageInfo = data?.eventsByTrip?.pageInfo;

  const loadMore = () => {
    if (pageInfo?.hasNextPage && pageInfo?.endCursor) {
      setAfterCursor(pageInfo.endCursor);
    }
  };

  return (
    <div>
      <ul>
        {events.map(({ node, cursor }) => (
          <li key={cursor}>
            <h3>{node.title}</h3>
            <p>{node.description}</p>
            <time>{new Date(node.startTime).toLocaleString()}</time>
          </li>
        ))}
      </ul>

      {fetching && <p>Loading...</p>}

      {pageInfo?.hasNextPage && (
        <button onClick={loadMore} disabled={fetching}>
          Load More
        </button>
      )}
    </div>
  );
}
```

### Infinite Scroll Pattern

```tsx
import { useEffect, useRef, useState } from "react";
import { useGetNotificationsByUserQuery } from "@mirai-app/graphql-client/urql";

interface NotificationFeedProps {
  userId: string;
}

export function NotificationFeed({ userId }: NotificationFeedProps) {
  const [allNotifications, setAllNotifications] = useState<any[]>([]);
  const [afterCursor, setAfterCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const [{ data, fetching }] = useGetNotificationsByUserQuery({
    variables: {
      userId,
      first: 30,
      after: afterCursor,
    },
    pause: !hasMore,
  });

  // Accumulate results
  useEffect(() => {
    if (data?.notificationsByUser?.edges) {
      const newEdges = data.notificationsByUser.edges;
      setAllNotifications((prev) => [...prev, ...newEdges.map((e) => e.node)]);
      setHasMore(data.notificationsByUser.pageInfo.hasNextPage);
    }
  }, [data]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !fetching) {
          const nextCursor = data?.notificationsByUser?.pageInfo?.endCursor;
          if (nextCursor) {
            setAfterCursor(nextCursor);
          }
        }
      },
      { threshold: 0.1 },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, fetching, data]);

  return (
    <div>
      {allNotifications.map((notification) => (
        <div key={notification.id}>{notification.message}</div>
      ))}
      <div ref={loaderRef}>
        {fetching && <p>Loading more...</p>}
        {!hasMore && <p>No more notifications</p>}
      </div>
    </div>
  );
}
```

### Server-Side Data Fetching

```typescript
import { urqlClient } from "@/lib/urql-client";

async function fetchPaginatedEvents(
  tripId: string,
  first: number,
  after?: string,
) {
  const result = await urqlClient
    .query(
      `
      query GetEvents($tripId: ID!, $first: Int!, $after: String) {
        eventsByTrip(tripId: $tripId, first: $first, after: $after) {
          edges {
            node {
              id
              title
              startTime
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
      { tripId, first, after },
    )
    .toPromise();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return {
    events: result.data?.eventsByTrip?.edges.map((e: any) => e.node) ?? [],
    hasMore: result.data?.eventsByTrip?.pageInfo?.hasNextPage ?? false,
    nextCursor: result.data?.eventsByTrip?.pageInfo?.endCursor,
  };
}

// Usage
async function loadAllEvents(tripId: string) {
  const allEvents: any[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const result = await fetchPaginatedEvents(tripId, 100, cursor);
    allEvents.push(...result.events);
    hasMore = result.hasMore;
    cursor = result.nextCursor;
  }

  return allEvents;
}
```

### React Native Implementation

```tsx
import React, { useState, useCallback } from "react";
import {
  FlatList,
  ActivityIndicator,
  View,
  Text,
  RefreshControl,
} from "react-native";
import { useGetGroupsByTripQuery } from "@mirai-app/graphql-client/urql";

interface GroupListProps {
  tripId: string;
}

export function GroupList({ tripId }: GroupListProps) {
  const [afterCursor, setAfterCursor] = useState<string | null>(null);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [{ data, fetching }] = useGetGroupsByTripQuery({
    variables: {
      tripId,
      first: 20,
      after: afterCursor,
    },
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setAfterCursor(null);
    setAllGroups([]);
    setRefreshing(false);
  }, []);

  const loadMore = useCallback(() => {
    if (!fetching && data?.groupsByTrip?.pageInfo?.hasNextPage) {
      const nextCursor = data.groupsByTrip.pageInfo.endCursor;
      if (nextCursor) {
        setAfterCursor(nextCursor);
        setAllGroups((prev) => [
          ...prev,
          ...data.groupsByTrip.edges.map((e) => e.node),
        ]);
      }
    }
  }, [fetching, data]);

  const renderFooter = () => {
    if (!fetching) return null;
    return (
      <View style={{ padding: 16 }}>
        <ActivityIndicator />
      </View>
    );
  };

  return (
    <FlatList
      data={allGroups}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
          <Text>{item.description}</Text>
        </View>
      )}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}
```

---

## Cursor Encoding

### Cursor Format

Cursors are Base64url-encoded JSON strings containing:

```json
{
  "id": "entity_id_here",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### Decoding Cursors (for debugging)

```typescript
function decodeCursor(cursor: string): { id: string; createdAt: string } {
  const jsonString = Buffer.from(cursor, "base64url").toString("utf-8");
  return JSON.parse(jsonString);
}

// Example
const cursor =
  "eyJpZCI6ImV2dF94eXo3ODkiLCJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1VDEwOjAwOjAwWiJ9";
const decoded = decodeCursor(cursor);
// { id: "evt_xyz789", createdAt: "2024-01-15T10:00:00Z" }
```

### Important Notes

- Cursors are **opaque** - do not construct them manually
- Always use the `cursor` field from the GraphQL response
- Cursors are stable across data changes (items added/removed)
- Invalid cursors will return an appropriate error response

---

## Best Practices

### 1. Page Size Selection

| Use Case        | Recommended Page Size |
| --------------- | --------------------- |
| Mobile lists    | 20-30 items           |
| Desktop lists   | 50 items              |
| Data export     | 100 items (max)       |
| Real-time feeds | 10-20 items           |

### 2. Error Handling

```tsx
const [{ data, fetching, error }] = useGetEventsByTripQuery({
  variables: { tripId, first: 20 },
});

if (error) {
  // Handle specific error types
  if (error.message.includes("Invalid cursor")) {
    // Reset pagination and retry
    setAfterCursor(null);
  } else {
    // Display general error
    showToast("Failed to load events");
  }
}
```

### 3. Cache Management

```typescript
import { useClient } from "urql";

function EventManager() {
  const client = useClient();

  const refreshEvents = () => {
    // Invalidate paginated queries
    client.invalidate("GetEventsByTrip");
  };

  return <button onClick={refreshEvents}>Refresh</button>;
}
```

### 4. Combining with Filters

When combining pagination with filters, always apply filters consistently:

```graphql
query GetFilteredEvents(
  $tripId: ID!
  $status: EventStatus
  $first: Int!
  $after: String
) {
  eventsByTrip(
    tripId: $tripId
    status: $status # Filter applied
    first: $first
    after: $after
  ) {
    edges {
      node {
        id
        title
        status
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

### 5. Migration from Offset Pagination

If you're currently using offset-based pagination, migrate to cursor pagination by:

1. Replacing `limit`/`offset` with `first`/`after`
2. Using `endCursor` instead of calculating offsets
3. Checking `hasNextPage` instead of comparing current page to total pages

---

## Available Paginated Queries

All gateway queries now support cursor pagination. Here is a complete list:

### Event Queries

- `eventsByTrip(tripId, first, after)` - Events for a trip
- `upcomingEventsByTrip(tripId, first, after)` - Upcoming events
- `ongoingEventsByTrip(tripId, first, after)` - Ongoing events
- `pastEventsByTrip(tripId, first, after)` - Past events

### Challenge Queries

- `challengesByTrip(tripId, first, after)` - Challenges for a trip
- `challengesByStatus(status, first, after)` - Challenges by status
- `activeChallenges(first, after)` - Active challenges
- `openChallenges(first, after)` - Challenges open for submission
- `recurringChallenges(first, after)` - Recurring challenges

### Notification Queries

- `notificationsByUser(userId, first, after)` - User notifications
- `unreadNotificationsByUser(userId, first, after)` - Unread notifications

### Group Queries

- `groupsByTrip(tripId, first, after)` - Groups in a trip
- `groupsByStatus(status, first, after)` - Groups by status
- `groupsByOrganizer(organizerId, first, after)` - Groups by organizer

### Sponsor Queries

- `sponsorsByTrip(tripId, first, after)` - Trip sponsors
- `activeSponsors(first, after)` - Active sponsors

### Trip Queries

- `tripsByStatus(status, first, after)` - Trips by status
- `activeTrips(first, after)` - Active trips

### User Queries (Admin)

- `users(first, after)` - All users
- `usersByRole(role, first, after)` - Users by role

### Location Queries

- `locationsSharingWithUser(userId, first, after)` - Shared locations
- `locationsByUserIds(userIds, first, after)` - Locations by users

### Report Queries

- `reportsBySubmission(submissionId, first, after)` - Submission reports
- `reportsByReporter(reporterId, first, after)` - Reports by reporter
- `reportsByReason(reason, first, after)` - Reports by reason

### Challenge Submission Queries

- `submissionsByChallenge(challengeId, first, after)` - Challenge submissions
- `submissionsByUser(userId, first, after)` - User submissions

### Challenge Vote Queries

- `votesBySubmission(submissionId, first, after)` - Votes on submission

### Reward Queries

- `rewardsByTrip(tripId, first, after)` - Trip rewards
- `visibleRewardsByTrip(tripId, first, after)` - Visible rewards

### Reward Purchase Queries

- `purchasesByReward(rewardId, first, after)` - Purchases by reward
- `purchasesByGroup(groupId, first, after)` - Purchases by group
- `purchasesByTrip(tripId, first, after)` - Purchases by trip

### Coin Transaction Queries

- `coinTransactions(filters, first, after)` - Coin transactions

---

## Support

For questions or issues with cursor pagination:

1. Review the [Relay Cursor Connections Specification](https://relay.dev/graphql/connections.htm)
2. Check the [Deprecation Guide](./deprecation-guide.md) for migration help
3. Contact the backend team for API-specific questions
