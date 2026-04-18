---
title: Use-Cases Must Return Fully-Populated DTOs
paths:
  - "packages/use-cases/src/**/*.ts"
impact: HIGH
tags:
  - clean-architecture
  - use-cases
  - dto
---

# Use-Cases Must Return Fully-Populated DTOs

Use-cases layer must fetch all required data from adapters and return fully-populated DTOs. Never return incomplete DTOs with nulls/empty values expecting the adapter layer to "hydrate" them later. This violates Clean Architecture - use-cases orchestrate business logic and must have all data before returning.

## Incorrect

Returning incomplete DTOs with placeholder values and relying on adapter layer to fill them in later. This creates hidden dependencies, makes testing difficult, and breaks layer boundaries.

```typescript
// packages/use-cases/src/group/interactors/GetGroupById.ts
export class GetGroupByIdUseCase {
  execute(input: GetGroupByIdInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const group = yield* groupPort.findById(groupId);

      return {
        id: group.id,
        name: group.name,
        organizer: null, // Will be hydrated by adapter - WRONG!
        participants: participants.map(p => ({
          id: p.id,
          user: {
            id: p.userId,
            firstName: "", // Will be hydrated by adapter - WRONG!
            lastName: "",  // Will be hydrated by adapter - WRONG!
          },
        })),
        trip: {
          id: group.tripId,
          name: "", // Will be hydrated by adapter - WRONG!
        },
      };
    });
  }
}
```

## Correct

Fetch all required data from adapters within the use-case, then return a fully-populated DTO. The use-case orchestrates all data fetching - adapters only provide raw data access.

```typescript
// packages/use-cases/src/group/interactors/GetGroupById.ts
export class GetGroupByIdUseCase {
  execute(input: GetGroupByIdInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const userPort = yield* UserPortTag;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPortTag;

      const groupId = GroupId.unsafeCreate(input.groupId);
      const group = yield* groupPort.findById(groupId);

      if (!group || group.isDeleted) {
        return yield* Effect.fail(new GroupNotFoundError({ groupId: input.groupId }));
      }

      // Fetch all related data within the use-case
      const [organizer, trip, participants] = yield* Effect.all([
        userPort.findById(group.organizerId),
        tripPort.findById(group.tripId),
        participantPort.findByGroupId(groupId),
      ]);

      if (!organizer || !trip) {
        return yield* Effect.fail(new GroupDataIncompleteError({ groupId: input.groupId }));
      }

      // Fetch user details for all participants
      const participantUsers = yield* Effect.all(
        participants.map(p => userPort.findById(p.userId))
      );

      // Return fully-populated DTO - no nulls for required data
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        organizer: {
          id: organizer.id,
          firstName: organizer.firstName,
          lastName: organizer.lastName,
          email: organizer.email,
        },
        participants: participants.map((p, index) => {
          const user = participantUsers[index];
          if (!user) {
            throw new Error(`User not found for participant ${p.id}`);
          }
          return {
            id: p.id,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            },
            joinedAt: p.createdAt,
          };
        }),
        trip: {
          id: trip.id,
          name: trip.name,
          startDate: trip.startDate,
          endDate: trip.endDate,
        },
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      };
    });
  }
}
```

## Reference

- Clean Architecture: Use-cases orchestrate domain operations and must have all data before returning
- Layer Dependencies: Use-cases depend on domain ports; adapters depend on use-cases (not the reverse)
- Testing: Fully-populated DTOs can be tested in isolation without adapter mocks
- AGENTS.md Rule: Port naming convention (IUserPort in domain, UserPortTag in use-cases)
