---
title: Create all Use Case Interactors for Group domain
---

## Initial User Prompt

Create all Use Case Interactors for the Group domain in the pjapp project.

## Context

You are working in the `/Users/rafalopilowski/Projekty/migration/pjapp` directory (new_tech_stack branch).

The pjapp-main worktree at `/Users/rafalopilowski/Projekty/migration/pjapp-main` contains the tRPC routers.

Read the group router at `/Users/rafalopilowski/Projekty/migration/pjapp-main/packages/trpc/src/api/routers/group.ts` to understand all the procedures.

## Group Router Procedures to Implement

1. getAllNames - Get all group names for a trip
2. getMy - Get current user's group
3. getAll - Get all groups with pagination
4. getGroupList - Get group list for moderators
5. getById - Get group by ID
6. getByIdWithOrganizer - Get group with organizer
7. create - Create new group
8. update - Update group
9. delete - Delete group (admin)
10. deleteMyGroup - Delete my group
11. join - Join a group (admin)
12. requestToJoin - Request to join a group
13. getMyJoinRequestForGroup - Get pending join request
14. cancelMyJoinRequest - Cancel join request
15. getPendingJoinRequests - Get pending requests for organizer
16. respondToJoinRequest - Accept/reject join request
17. assignUserToGroup - Assign user to group
18. bulkAssignUsersToGroup - Bulk assign users
19. removeUserFromGroup - Remove user from group
20. leaveMyGroup - Leave current group
21. addCoins - Add coins to group
22. ranking - Get group rankings

## Architecture Requirements

Follow CEK Five Pillars architecture:

1. Create domain entities in `packages/domain/src/group/entities/` (Group, GroupCode, etc.)
2. Create value objects in `packages/domain/src/group/value-objects/` (GroupId, GroupCode, etc.)
3. Create ports in `packages/domain/src/group/ports/` (GroupRepository, etc.)
4. Create use case interactors in `packages/use-cases/src/group/interactors/`
5. Create DTOs in `packages/use-cases/src/group/dto/`
6. Create errors in `packages/use-cases/src/group/errors/`

## Key Patterns

- Use `Effect<T,E,never>` for domain
- Use `Effect.gen` + `Context.Tag` for use cases
- Use `Data.TaggedError` for errors
- Use branded IDs

## Description

// Will be filled in future stages by business analyst
